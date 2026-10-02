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
] as const) {
  test(`${d.id}: second offer purchases only its actual expansion and persists`, async ({
    page,
  }, info) => {
    const s = createGame(d);
    s.money = 500;
    await page.addInitScript(
      ({ id, raw }) => localStorage.setItem(`restaurant.${id}.save`, raw),
      { id: d.id, raw: encodeSave(s, Date.now()) },
    );
    await page.goto(`http://localhost:${port}`);
    // Import uses the public save flow and retains compatibility with career slots.
    await page.locator('.top-actions [data-action="settings"]').click();
    await page.locator("#import-file").setInputFiles({
      name: "choice.json",
      mimeType: "application/json",
      buffer: Buffer.from(encodeSave(s, Date.now())),
    });
    await expect(page.locator('[data-action="unlock"]')).toHaveCount(2);
    await page.screenshot({ path: info.outputPath(`${d.id}-two-choices.png`) });
    await page.locator('[data-action="unlock"][data-expansion="3"]').click();
    await expect(page.locator("#chapter")).toHaveText("02");
    await expect(page.locator("#unlock-button")).toHaveAttribute(
      "data-expansion",
      "1",
    );
    await expect(page.locator("#second-expansion button")).toHaveAttribute(
      "data-expansion",
      "4",
    );
    await page.reload();
    await expect(page.locator("#chapter")).toHaveText("02");
    await expect(page.locator("#second-expansion button")).toHaveAttribute(
      "data-expansion",
      "4",
    );
  });
}
test("gas: market is a real alternative to a second pump", async ({
  page,
}, info) => {
  const s = gasGame();
  s.money = 100;
  s.open = false;
  await page.addInitScript((raw) => {
    if (!localStorage.getItem("next-stop:save:v1"))
      localStorage.setItem("next-stop:save:v1", raw);
  }, encode(s));
  await page.goto("http://localhost:4175");
  await expect(page.locator('[data-action="expand"]')).toHaveCount(2);
  await page.screenshot({ path: info.outputPath("gas-two-choices.png") });
  await page.locator('[data-action="expand"][data-index="2"]').click();
  await expect(page.locator('[data-station="pump1"]')).toBeHidden();
  await expect(page.locator('[data-station="service0"]')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-station="pump1"]')).toBeHidden();
  await expect(page.locator('[data-station="service0"]')).toBeVisible();
});
