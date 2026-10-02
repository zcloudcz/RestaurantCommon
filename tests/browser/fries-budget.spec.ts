import { test, expect } from "@playwright/test";
import { createGame } from "../../src/game/simulation";
import { encodeSave } from "../../src/save";
import { burger } from "../../../BurgerRush/src/definition";
import { pizza } from "../../../PizzaPiazza/src/definition";
import { mkdir } from "node:fs/promises";

test("burger carries mixed fries and burgers through reload and unloading", async ({
  page,
}) => {
  const s = createGame(burger);
  s.level = 3;
  s.player.item = "meal";
  s.player.count = 2;
  await page.goto("http://localhost:4173");
  await page.locator('[data-action="settings"]').click();
  await page
    .locator("#import-file")
    .setInputFiles({
      name: "mixed.json",
      mimeType: "application/json",
      buffer: Buffer.from(encodeSave(s, Date.now())),
    });
  await page.locator('[data-station="fryer"]').click();
  await expect(page.locator("#carry-count")).toHaveText("5 / 5", {
    timeout: 18000,
  });
  await expect(page.locator("#carry-item")).toHaveText(
    "Burgery 2 · Hranolky 3",
  );
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await page.reload();
  await expect(page.locator("#carry-item")).toHaveText(
    "Burgery 2 · Hranolky 3",
  );
  await mkdir("../BurgerRush/docs/screenshots", { recursive: true });
  await page.screenshot({
    path: "../BurgerRush/docs/screenshots/mixed-tray.png",
  });
  await page.locator('[data-station="counter"]').click();
  await expect(page.locator("#carry-count")).toHaveText("0 / 5", {
    timeout: 18000,
  });
});

test("burger fries can be carried, served and sold for extra cash", async ({
  page,
}) => {
  await page.goto("http://localhost:4173");
  const s = createGame(burger);
  s.level = 3;
  s.stations.find((st) => st.id === "counter")!.output = 12;
  await page.locator('[data-action="settings"]').click();
  await page.locator("#import-file").setInputFiles({
    name: "save.json",
    mimeType: "application/json",
    buffer: Buffer.from(encodeSave(s, Date.now())),
  });
  await page.locator('[data-station="fryer"]').click();
  await expect(page.locator("#carry-item")).toHaveText("Hranolky", {
    timeout: 18000,
  });
  await expect(page.locator("#carry-count")).toHaveText("5 / 5", {
    timeout: 15000,
  });
  await page.locator('[data-station="counter"]').click();
  await expect(page.locator("#carry-count")).toHaveText("0 / 5", {
    timeout: 20000,
  });
  await page.locator('[data-station="register"]').click();
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          window.dispatchEvent(new Event("pagehide"));
          const s = JSON.parse(
            localStorage.getItem("restaurant.burger.v1")!,
          ).state;
          return s.earned - s.sold * 10;
        }),
      { timeout: 25000 },
    )
    .toBeGreaterThan(0);
  await expect(page.locator("#budget-label")).toHaveText("Volné peníze");
});
for (const [d, port] of [
  [burger, 4173],
  [pizza, 4174],
] as const) {
  test(`${d.id} shows uninvested money on small mobile screens`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const s = createGame(d);
    s.money = 1234567;
    s.paid = 12;
    await page.addInitScript(
      ({ id, raw }) => localStorage.setItem(`restaurant.${id}.v1`, raw),
      { id: d.id, raw: encodeSave(s, Date.now()) },
    );
    await page.goto(`http://localhost:${port}`);
    await expect(page.locator("#budget-label")).toHaveText("Volné peníze");
    await expect(page.locator("#money")).toHaveText(/1\s234\s567/);
    const box = await page.locator(".wallet").boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(360);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
