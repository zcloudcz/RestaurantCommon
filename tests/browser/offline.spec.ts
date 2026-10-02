import { test, expect } from "@playwright/test";
import { createGame } from "../../src/game/simulation";
import { encodeSave } from "../../src/save";
import { burger } from "../../../BurgerRush/src/definition";
import { pizza } from "../../../PizzaPiazza/src/definition";
for (const [d, port] of [
  [burger, 4183],
  [pizza, 4184],
] as const) {
  test(`${d.id}: production install cache restores purchases while offline`, async ({
    page,
    context,
  }) => {
    await page.goto(`http://localhost:${port}`);
    await page.evaluate(() => navigator.serviceWorker.ready);
    const s = createGame(d);
    s.money = 100;
    await page.locator('[data-action="settings"]').click();
    await page
      .locator("#import-file")
      .setInputFiles({
        name: `${d.id}.json`,
        mimeType: "application/json",
        buffer: Buffer.from(encodeSave(s, Date.now())),
      });
    await expect(page.locator("#money")).toHaveText("100");
    await page.locator('.sidebar [data-action="upgrades"]').click();
    await page.locator('[data-upgrade="capacity"]').click();
    await page.locator('[data-action="close"]').click();
    await expect(page.locator("#carry-count")).toHaveText("0 / 8");
    await page.reload();
    await expect(page.locator("#carry-count")).toHaveText("0 / 8");
    await expect
      .poll(() =>
        page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
      )
      .toBe(true);
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator("#carry-count")).toHaveText("0 / 8");
    await expect(page.locator("#money")).toHaveText("30");
    await expect(page.locator("#world")).toBeVisible();
  });
}
test("an unreadable save is preserved rather than overwritten", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("restaurant.burger.v1", "future-version-save"),
  );
  await page.goto("http://localhost:4183");
  await expect(page.locator("#save-status")).toContainText("není dostupné");
  expect(
    await page.evaluate(() => localStorage.getItem("restaurant.burger.v1")),
  ).toBe("future-version-save");
});
