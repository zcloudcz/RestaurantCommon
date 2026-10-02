import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { createGame, step } from "../../src/game/simulation";
import { encodeSave } from "../../src/save";
import { burger } from "../../../BurgerRush/src/definition";
import { pizza } from "../../../PizzaPiazza/src/definition";

for (const [d, port, folder] of [
  [burger, 4183, "BurgerRush"],
  [pizza, 4184, "PizzaPiazza"],
] as const) {
  test(`${d.id}: replaces a staffed restaurant with a fresh save and remains playable`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`http://localhost:${port}`);
    const late = createGame(d);
    late.level = 11;
    late.recipe = 2;
    for (let i = 0; i < 2400; i++) step(late, d, { x: 0, z: 0 }, 0.1);
    async function restore(state: typeof late) {
      await page.locator('.top-actions [data-action="settings"]').click();
      await page
        .locator("#import-file")
        .setInputFiles({
          name: "save.json",
          mimeType: "application/json",
          buffer: Buffer.from(encodeSave(state, Date.now())),
        });
    }
    await restore(late);
    await expect(page.locator("#staff-count")).toHaveText("4");
    await expect(page.locator("#chapter")).toHaveText("12");
    await page.waitForTimeout(700);
    await mkdir(`../${folder}/docs/screenshots`, { recursive: true });
    await page.screenshot({
      path: `../${folder}/docs/screenshots/desktop.png`,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `../${folder}/docs/screenshots/mobile.png` });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await restore(createGame(d));
    await expect(page.locator("#staff-count")).toHaveText("0");
    await expect(page.locator("#chapter")).toHaveText("01");
    await page.locator('[data-station="source"]').click();
    await expect(page.locator("#carry-count")).toHaveText("5 / 5", {
      timeout: 15000,
    });
    expect(errors).toEqual([]);
  });
}
