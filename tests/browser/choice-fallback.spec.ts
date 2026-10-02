import { test, expect } from "@playwright/test";
import { createGame } from "../../src/game/simulation";
import { encodeSave } from "../../src/save";
import { burger } from "../../../BurgerRush/src/definition";
import { pizza } from "../../../PizzaPiazza/src/definition";
import {
  createGame as gasGame,
  encode,
} from "../../../GasStation/src/simulation";
for (const [d, port] of [
  [burger, 4173],
  [pizza, 4174],
] as const)
  test(`${d.id}: final expansion offers a paid skill alternative`, async ({
    page,
  }) => {
    const s = createGame(d);
    s.level = 17;
    s.money = 1000;
    await page.goto(`http://localhost:${port}`);
    await page.locator('.top-actions [data-action="settings"]').click();
    await page
      .locator("#import-file")
      .setInputFiles({
        name: "skill.json",
        mimeType: "application/json",
        buffer: Buffer.from(encodeSave(s, Date.now())),
      });
    const alternative = page.locator(
      '#second-expansion [data-upgrade="speed"]',
    );
    await expect(alternative).toBeVisible();
    await expect(alternative).toContainText("50");
    await alternative.click();
    await expect(page.locator(".alternate-upgrade")).toContainText("1 → 2");
    const state = await page.evaluate(
      (id) => JSON.parse(localStorage.getItem(`restaurant.${id}.v1`)!).state,
      d.id,
    );
    expect(state.level).toBe(17);
    expect(state.upgrades.speed).toBe(1);
    expect(state.money).toBeLessThanOrEqual(950);
  });
test("gas: final expansion offers a paid skill alternative", async ({
  page,
}) => {
  const s = gasGame();
  s.level = 11;
  s.money = 1000;
  s.open = false;
  await page.addInitScript(
    (raw) => localStorage.setItem("next-stop:save:v1", raw),
    encode(s),
  );
  await page.goto("http://localhost:4175");
  const alternative = page.locator('.upgrade-choice [data-action="upgrade"]');
  await expect(alternative).toBeVisible();
  await expect(alternative).toContainText("80");
  await alternative.click();
  await expect(page.locator(".upgrade-choice")).toContainText("1 → 2");
  const state = await page.evaluate(
    () => JSON.parse(localStorage.getItem("next-stop:save:v1")!).state,
  );
  expect(state.level).toBe(11);
  expect(state.upgrades[0]).toBe(1);
  expect(state.money).toBe(920);
});
