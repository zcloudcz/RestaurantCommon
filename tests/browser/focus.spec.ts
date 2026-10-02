import {test,expect} from '@playwright/test';
async function position(page:import('@playwright/test').Page){return page.evaluate(()=>{window.dispatchEvent(new Event('pagehide'));return JSON.parse(localStorage.getItem('restaurant.burger.v1')??'{}').state.player;});}
test('keyboard movement resumes after clicking pause and resume',async({page})=>{
 await page.goto('http://localhost:4173');await page.locator('.top-actions [data-action="pause"]').click();await page.locator('.pause-screen [data-action="pause"]').click();const before=await position(page);await page.keyboard.down('KeyD');await page.waitForTimeout(500);await page.keyboard.up('KeyD');const after=await position(page);expect(Math.hypot(after.x-before.x,after.z-before.z)).toBeGreaterThan(.5);
});
test('window blur cancels automatic walking',async({page})=>{
 await page.goto('http://localhost:4173');await page.locator('[data-station="source"]').click();await page.waitForTimeout(150);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));const before=await position(page);await page.waitForTimeout(500);const after=await position(page);expect(after.x).toBe(before.x);expect(after.z).toBe(before.z);
});
