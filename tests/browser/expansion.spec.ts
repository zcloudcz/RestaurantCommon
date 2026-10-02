import { test, expect } from "@playwright/test";
import { createGame } from "../../src/game/simulation";
import { encodeSave } from "../../src/save";
import { burger } from "../../../BurgerRush/src/definition";
import { pizza } from "../../../PizzaPiazza/src/definition";
for (const [d, port, folder] of [
  [burger, 4183, "BurgerRush"],
  [pizza, 4184, "PizzaPiazza"],
] as const) {
  test(`${d.id}: original completion continues into six new levels and persists`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`http://localhost:${port}/?v=chapter2`);
    const s = createGame(d);
    s.level = 12;
    s.money = 50000;
    s.recipe = 2;
    await page.locator('.top-actions [data-action="settings"]').click();
    await page
      .locator("#import-file")
      .setInputFiles({
        name: "chapter.json",
        mimeType: "application/json",
        buffer: Buffer.from(encodeSave(s, Date.now())),
      });
    await expect(page.locator("#chapter")).toHaveText("13");
    await expect(page.locator(".chapter small")).toHaveText("/ 18");
    for (let level = 13; level <= 15; level++) {
      await page.locator("#unlock-button").click();
      await expect(page.locator("#chapter")).toHaveText(String(level + 1));
    }
    await expect(page.locator("#carry-count")).toHaveText("0 / 10");
    await page.locator('.sidebar [data-action="menu"]').click();
    await expect(page.locator('[data-recipe="3"]')).toBeEnabled();
    await page.locator('[data-recipe="3"]').click();
    await page.locator('.dialog-head [data-action="close"]').click();
    for (let level = 16; level <= 18; level++)
      await page.locator("#unlock-button").click();
    await expect(page.locator("dialog")).toBeVisible();
    await page.locator('.dialog-head [data-action="close"]').click();
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    await page.reload();
    await expect(page.locator("#chapter")).toHaveText("18");
    const raw = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).state,
      `restaurant.${d.id}.v1`,
    );
    expect(raw.level).toBe(18);
    expect(raw.recipe).toBe(3);
    if (await page.locator("dialog").isVisible())
      await page.locator('.dialog-head [data-action="close"]').click();
    await page.screenshot({
      path: `../${folder}/docs/screenshots/chapter-two.png`,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.mobile-nav [data-action="menu"]').click();
    await expect(page.locator('[data-recipe="3"]')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}
