import { fileURLToPath } from "node:url";
import { test, expect, type Page } from "@playwright/test";
import {
  createGame,
  encode,
  servicePoint,
  facilities,
} from "../../../GasStation/src/simulation";
import { solidFootprints } from "../../../GasStation/src/navigation";
async function saved(page: Page) {
  return page.evaluate(() => {
    window.dispatchEvent(new Event("pagehide"));
    return JSON.parse(localStorage.getItem("next-stop:save:v1")!).state;
  });
}
test("gas close-up: mobile overview reaches pump and market, keyboard respects pump island", async ({
  page,
}) => {
  const state = createGame();
  state.open = false;
  state.level = 2;
  state.owned = [1, 2];
  state.player = { ...servicePoint(0), count: 0 };
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(
    (raw) => localStorage.setItem("next-stop:save:v1", raw),
    encode(state),
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:4175");
  const pump = page.locator('[data-station="pump0"]');
  await expect(pump).toBeVisible();
  await page.locator("#game").focus();
  const before = (await saved(page)).player;
  await page.keyboard.down("w");
  const solids = solidFootprints(state);
  let travelled = 0;
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(100);
    const p = (await saved(page)).player;
    travelled = Math.max(travelled, Math.hypot(p.x - before.x, p.z - before.z));
    expect(
      solids.some(
        (b) =>
          Math.abs(p.x - b.x) < b.width / 2 + 0.2 &&
          Math.abs(p.z - b.z) < b.depth / 2 + 0.2,
      ),
    ).toBe(false);
  }
  await page.keyboard.up("w");
  expect(travelled).toBeGreaterThan(0.2);
  await page.locator('[data-action="overview"]').click();
  for (const [id, target] of [
    ["service0", { x: facilities[0].x, z: 5 }],
    ["pump0", servicePoint(0)],
  ] as const) {
    await expect(page.locator(`[data-station="${id}"]`)).toBeVisible();
    await page.locator(`[data-station="${id}"]`).click();
    await expect
      .poll(
        async () => {
          const p = (await saved(page)).player;
          return Math.hypot(p.x - target.x, p.z - target.z);
        },
        { timeout: 20000 },
      )
      .toBeLessThan(1.2);
  }
  await page.locator('[data-action="overview"]').click();
  await page.waitForTimeout(700);
  await expect(pump).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: fileURLToPath(
      new URL(
        "../../../GasStation/docs/screenshots/redesign-navigation-mobile.png",
        import.meta.url,
      ),
    ),
  });
});
