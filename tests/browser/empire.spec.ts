import { test, expect } from "@playwright/test";
import { createGame } from "../../src/game/simulation";
import { encodeSave } from "../../src/save";
import { burger } from "../../../BurgerRush/src/definition";
import { pizza } from "../../../PizzaPiazza/src/definition";
for (const [d, port, folder] of [
  [burger, 4183, "BurgerRush"],
  [pizza, 4184, "PizzaPiazza"],
] as const) {
  test(`${d.id}: empire buys a fresh branch, returns, reloads and fits mobile`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`http://localhost:${port}/?v=empire`);
    const s = createGame(d);
    s.level = 18;
    s.money = 20000;
    s.upgrades.speed = 3;
    await page.locator('.top-actions [data-action="settings"]').click();
    await page
      .locator("#import-file")
      .setInputFiles({
        name: "empire.json",
        mimeType: "application/json",
        buffer: Buffer.from(encodeSave(s, Date.now())),
      });
    await expect(page.locator("dialog")).toBeVisible();
    await page.locator('dialog [data-action="empire"]').click();
    await expect(page.locator('[data-travel="1"]')).toBeEnabled();
    await expect(page.locator('[data-travel="2"]')).toBeDisabled();
    await page.screenshot({ path: `../${folder}/docs/screenshots/empire.png` });
    await page.locator('[data-travel="1"]').click();
    await expect(page.locator("#chapter")).toHaveText("01");
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    let saved = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      `restaurant.${d.id}.v1`,
    );
    expect(saved.career.active).toBe(1);
    expect(saved.state.level).toBe(0);
    expect(saved.state.money).toBeGreaterThan(17000);
    expect(saved.state.money).toBeLessThan(18000);
    expect(saved.state.upgrades.speed).toBe(0);
    await page.reload();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.mobile-nav [data-action="empire"]').click();
    await expect(page.locator('[data-travel="0"]')).toBeEnabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `../${folder}/docs/screenshots/empire-mobile.png`,
    });
    await page.locator('[data-travel="0"]').click();
    await expect(page.locator("#chapter")).toHaveText("18");
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    saved = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      `restaurant.${d.id}.v1`,
    );
    expect(saved.career.active).toBe(0);
    expect(saved.state.upgrades.speed).toBe(3);
    expect(saved.career.branches[1].level).toBe(0);
    expect(saved.career.branches[1].money).toBe(0);
    await expect(page.locator("#staff-count")).toHaveText("10");
    await page.locator('.mobile-nav [data-action="upgrades"]').click();
    await expect(page.locator(".payroll-summary")).toContainText("23");
    expect(errors).toEqual([]);
  });
}
