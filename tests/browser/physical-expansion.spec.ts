import { test, expect } from '@playwright/test';
import { createGame } from '../../src/game/simulation';
import { encodeSave } from '../../src/save';
import { burger } from '../../../BurgerRush/src/definition';
import { pizza } from '../../../PizzaPiazza/src/definition';
for (const [d,port,folder] of [[burger,4183,'BurgerRush'],[pizza,4184,'PizzaPiazza']] as const) {
  test(`${d.id}: physical wings, legacy save and annex workstation`,async({page})=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://localhost:${port}/?v=physical-map`);
    const s=createGame(d);s.level=12;s.money=50000;s.recipe=2;
    s.stations=s.stations.filter(st=>!['annex','dispatch'].includes(st.id));s.tables=s.tables.slice(0,4);
    await page.locator('.top-actions [data-action="settings"]').click();
    await page.locator('#import-file').setInputFiles({name:'legacy-complete.json',mimeType:'application/json',buffer:Buffer.from(encodeSave(s,Date.now()))});
    await expect(page.locator('#chapter')).toHaveText('13');
    for(let level=13;level<=18;level++) await page.locator('#unlock-button').click();
    await expect(page.locator('dialog')).toBeVisible();
    await page.locator('.dialog-head [data-action="close"]').click();
    await page.locator('[data-action="overview"]').click();
    await expect(page.locator('[data-action="overview"]')).toHaveAttribute('aria-pressed','true');
    await page.locator('[data-station="annex"]').click();
    await expect.poll(async()=>{
      return page.evaluate(key=>{window.dispatchEvent(new Event('pagehide'));const p=JSON.parse(localStorage.getItem(key)!).state.player;return p.z;},`restaurant.${d.id}.v1`);
    },{timeout:20000}).toBeLessThan(-10);
    await page.locator('[data-station="dispatch"]').click();
    await expect.poll(async()=>page.evaluate(key=>{window.dispatchEvent(new Event('pagehide'));return JSON.parse(localStorage.getItem(key)!).state.player.x;},`restaurant.${d.id}.v1`),{timeout:20000}).toBeGreaterThan(10);
    await page.reload();
    const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).state,`restaurant.${d.id}.v1`);
    expect(saved.level).toBe(18);expect(saved.tables.length).toBe(14);expect(saved.player.x).toBeGreaterThan(10);
    await expect(page.locator('dialog')).toBeVisible();
    await page.locator('.dialog-head [data-action="close"]').click();
    await page.locator('[data-action="overview"]').click();
    await expect(page.locator('[data-action="overview"]')).toHaveAttribute('aria-pressed','true');
    await page.waitForTimeout(500);
    await page.screenshot({path:`../${folder}/docs/screenshots/physical-map.png`});
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);
    await expect(page.locator('[data-station="annex"]')).toBeVisible();
    await expect(page.locator('[data-station="dispatch"]')).toBeVisible();
    const misses=await page.evaluate(()=>Array.from(document.querySelectorAll<HTMLElement>('[data-station]')).filter(el=>{
      const b=el.getBoundingClientRect(); if(el.hidden || !b.width || !b.height) return false;
      const hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest<HTMLElement>('[data-station]');
      return hit?.dataset.station!==el.dataset.station;
    }).map(el=>el.dataset.station));
    expect(misses).toEqual([]);
    await page.screenshot({path:`../${folder}/docs/screenshots/physical-map-mobile.png`});
    await page.locator('[data-station="annex"]').click();
    await expect.poll(async()=>page.evaluate(key=>{window.dispatchEvent(new Event('pagehide'));return JSON.parse(localStorage.getItem(key)!).state.player.z;},`restaurant.${d.id}.v1`),{timeout:20000}).toBeLessThan(-10);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
