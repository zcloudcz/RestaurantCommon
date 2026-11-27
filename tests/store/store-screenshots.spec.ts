// Store screenshots for Google Play and the App Store, rendered from seeded
// saves so every image shows a real, reproducible game state.
// Run: npx playwright test -c tests/store/playwright.config.ts
// Output: ../<Game>/store/screenshots/<platform>/<locale>/NN-<scene>.png
import { test, expect, type Page } from "@playwright/test";
import { createGame } from "../../src/game/simulation";
import { encodeSave } from "../../src/save";
import { burger } from "../../../BurgerRush/src/definition";
import { pizza } from "../../../PizzaPiazza/src/definition";

const games = [
  [burger, 4183, "BurgerRush"],
  [pizza, 4184, "PizzaPiazza"],
] as const;

// Play rejects images longer than 2:1; Apple wants the 6.9" iPhone size.
const platforms = [
  { name: "play", width: 405, height: 720, scale: 8 / 3 },
  { name: "ios-6.9", width: 430, height: 932, scale: 3 },
] as const;

const locales = ["en-US", "cs-CZ"] as const;

type Game = ReturnType<typeof createGame>;
const scenes: { name: string; seed: (s: Game) => void; overview?: boolean }[] = [
  { name: "start", seed: (s) => { s.money = 40; } },
  { name: "growing", seed: (s) => { s.level = 6; s.money = 900; s.recipe = 1; } },
  { name: "full-house", seed: (s) => { s.level = 12; s.money = 6000; s.recipe = 2; } },
  { name: "overview", seed: (s) => { s.level = 12; s.money = 6000; s.recipe = 2; }, overview: true },
];

async function load(page: Page, port: number, raw: string) {
  await page.goto(`http://localhost:${port}/`);
  await page.locator('.top-actions [data-action="settings"]').click();
  await page.locator("#import-file").setInputFiles({
    name: "store.json",
    mimeType: "application/json",
    buffer: Buffer.from(raw),
  });
  // Import may open a welcome-back or offer dialog; the store shot wants the world.
  for (const close of await page.locator('dialog[open] .dialog-head [data-action="close"]').all())
    if (await close.isVisible()) await close.click();
}

for (const [d, port, folder] of games)
  for (const p of platforms)
    for (const locale of locales)
      test.describe(`${d.id} ${p.name} ${locale}`, () => {
        test.use({
          locale,
          viewport: { width: p.width, height: p.height },
          deviceScaleFactor: p.scale,
          isMobile: true,
          hasTouch: true,
        });
        scenes.forEach((scene, i) =>
          test(scene.name, async ({ page }) => {
            const s = createGame(d);
            scene.seed(s);
            await load(page, port, encodeSave(s, Date.now()));
            if (scene.overview) {
              await page.locator('[data-action="overview"]').click();
              await expect(page.locator('[data-action="overview"]')).toHaveAttribute("aria-pressed", "true");
            }
            // Let customers walk in and the kitchen produce something visible.
            await page.waitForTimeout(6000);
            await page.screenshot({
              path: `../${folder}/store/screenshots/${p.name}/${locale}/${String(i + 1).padStart(2, "0")}-${scene.name}.png`,
            });
          }),
        );
      });
