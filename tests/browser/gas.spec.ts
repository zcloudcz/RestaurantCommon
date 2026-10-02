import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { createGame, step, encode } from "../../../GasStation/src/simulation";

test("gas: visible tanks show current/max capacity, upgrades and empty reserves", async ({
  page,
}) => {
  const s = createGame();
  s.level = 8;
  s.open = false;
  s.money = 500;
  s.fuel = [40, 80];
  await page.addInitScript(
    (raw) => localStorage.setItem("next-stop:save:v1", raw),
    encode(s),
  );
  await page.goto("http://localhost:4175");
  await expect(page.locator("#fuel-status .reserve-value")).toHaveText(
    "40 / 80",
  );
  await expect(page.locator("#diesel-status .reserve-value")).toHaveText(
    "80 / 160",
  );
  await expect(
    page.locator('[data-station="pump0"] .pump-capacity b'),
  ).toHaveText("40 / 80");
  await expect(
    page.locator('[data-station="pump4"] .pump-capacity b'),
  ).toHaveText("80 / 160");
  await page.locator('[data-tab="upgrades"]').click();
  await page.locator('[data-action="upgrade"][data-index="3"]').click();
  await expect(page.locator("#fuel-status .reserve-value")).toHaveText(
    "40 / 120",
  );
  await expect(page.locator("#diesel-status .reserve-value")).toHaveText(
    "80 / 240",
  );
  await expect(
    page.locator('[data-station="pump1"] .pump-capacity b'),
  ).toHaveText("40 / 120");
  await mkdir("../GasStation/docs/screenshots", { recursive: true });
  await page.screenshot({
    path: "../GasStation/docs/screenshots/desktop-fuel-capacity.png",
  });
  const empty = await saved(page);
  empty.fuel = [0, 0];
  await page.locator("#import-file").setInputFiles({
    name: "empty.json",
    mimeType: "application/json",
    buffer: Buffer.from(encode(empty)),
  });
  await expect(page.locator("#fuel-status progress")).toHaveAttribute(
    "value",
    "0",
  );
  await expect(page.locator("#diesel-status progress")).toHaveAttribute(
    "value",
    "0",
  );
  await expect(page.locator('[data-station="pump0"]')).toHaveClass(/warning/);
  await expect(page.locator('[data-station="pump4"]')).toHaveClass(/warning/);
});

test("gas: mobile localized tank gauges stay visible and fit with diesel unlocked", async ({
  page,
}) => {
  const s = createGame();
  s.level = 8;
  s.open = false;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(
    (raw) => localStorage.setItem("next-stop:save:v1", raw),
    encode(s),
  );
  await page.goto("http://localhost:4175");
  await page.locator('[data-action="settings"]').click();
  await page.locator("#language").selectOption("de");
  await page.locator('[data-action="close"]').click();
  await expect(page.locator("#tank-heading")).toHaveText("Gemeinsame Tanks");
  await expect(page.locator("#fuel-status .reserve-name")).toHaveText(
    "Kraftstoff",
  );
  for (const selector of ["#fuel-status", "#diesel-status"]) {
    const box = await page.locator(selector).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  }
  await mkdir("../GasStation/docs/screenshots", { recursive: true });
  await page.screenshot({
    path: "../GasStation/docs/screenshots/mobile-fuel-capacity.png",
  });
});

async function saved(page: Page) {
  return page.evaluate(() => {
    window.dispatchEvent(new Event("pagehide"));
    return JSON.parse(localStorage.getItem("next-stop:save:v1")!).state;
  });
}
test("gas: pagehide preserves the start of an unclaimed offline interval", async ({
  page,
}) => {
  await page.goto("http://localhost:4175");
  const timestamps = await page.evaluate(() => {
    const original = Date.now;
    const start = original();
    Date.now = () => start;
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    const first = JSON.parse(
      localStorage.getItem("next-stop:save:v1")!,
    ).savedAt;
    Date.now = () => start + 60000;
    window.dispatchEvent(new Event("pagehide"));
    const second = JSON.parse(
      localStorage.getItem("next-stop:save:v1")!,
    ).savedAt;
    Date.now = original;
    return { first, second };
  });
  expect(timestamps.second).toBe(timestamps.first);
});
test("gas: supply quote discloses its cost and charges once across reload", async ({
  page,
}) => {
  const s = createGame();
  s.level = 8;
  s.open = false;
  s.money = 500;
  s.fuel = [70, 150];
  s.goods = 90;
  for (const i of [1, 2]) {
    s.facilities[i].stock = 8;
    s.facilities[i].raw = 8;
  }
  await page.addInitScript((raw) => {
    if (!localStorage.getItem("next-stop:save:v1"))
      localStorage.setItem("next-stop:save:v1", raw);
  }, encode(s));
  await page.goto("http://localhost:4175");
  await page.locator('[data-station="supply"]').click();
  await expect(page.locator("#order-cost")).toHaveText("30 ●");
  await expect(page.locator("#order-balance")).toHaveText("470 ●");
  expect((await saved(page)).money).toBe(500);
  await page.locator('[data-action="supply"]').click();
  await expect.poll(async () => (await saved(page)).money).toBe(470);
  expect((await saved(page)).supplyOrder.cost).toBe(30);
  await page.reload();
  await expect.poll(async () => (await saved(page)).money).toBe(470);
  expect((await saved(page)).supplyOrder.cost).toBe(30);
});
test("gas: emergency fuel clearly discloses repayable credit", async ({
  page,
}) => {
  const s = createGame();
  s.open = false;
  s.fuel[0] = 0;
  await page.addInitScript(
    (raw) => localStorage.setItem("next-stop:save:v1", raw),
    encode(s),
  );
  await page.goto("http://localhost:4175");
  await page.locator('[data-action="goal"]').click();
  await expect(page.locator(".credit-note")).toContainText("Spláceno z tržeb");
  await expect(page.locator("#order-cost")).toHaveText("8 ●");
  await expect(page.locator("#order-balance")).toHaveText("0 ●");
  await page.locator('[data-action="supply"]').click();
  await expect.poll(async () => (await saved(page)).supplyDebt).toBe(8);
  expect((await saved(page)).money).toBe(0);
});
test("gas: manual refueling earns money, funds an expansion and survives reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:4175");
  await expect(page.locator("#game")).toBeVisible();
  await expect(page.locator("#budget-label")).toHaveText("Volné peníze");
  await page.locator('[data-station="pump0"]').click();
  await expect
    .poll(async () => (await saved(page)).money, { timeout: 45000 })
    .toBeGreaterThanOrEqual(24);
  await expect
    .poll(async () =>
      Number(await page.locator("#fuel-status progress").getAttribute("value")),
    )
    .toBeLessThanOrEqual(72);
  await page.locator('[data-tab="journey"]').click();
  await page.locator('[data-action="expand"]').first().click();
  await expect.poll(async () => (await saved(page)).level).toBe(1);
  await page.reload();
  await expect.poll(async () => (await saved(page)).level).toBe(1);
  expect(errors).toEqual([]);
});
test("gas: mobile language, manual movement and blur stop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:4175");
  await page.locator('[data-action="settings"]').click();
  await page.locator("#language").selectOption("ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.locator('[data-action="close"]').click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const before = (await saved(page)).player;
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(500);
  await page.keyboard.up("KeyD");
  const after = (await saved(page)).player;
  expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeGreaterThan(
    0.5,
  );
  await page.locator('[data-station="pump0"]').click();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  const stopped = (await saved(page)).player;
  await page.waitForTimeout(400);
  expect((await saved(page)).player).toEqual(stopped);
});
test("gas: staffed truck stop restores and starts offline", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const s = createGame();
  s.level = 11;
  s.money = 1000;
  s.autoSupply = true;
  for (let i = 0; i < 1200; i++) step(s, 0.1);
  await page.goto("http://localhost:4185");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.locator('[data-action="settings"]').click();
  await page.locator("#import-file").setInputFiles({
    name: "station.json",
    mimeType: "application/json",
    buffer: Buffer.from(encode(s)),
  });
  await expect.poll(async () => (await saved(page)).level).toBe(11);
  await page.waitForTimeout(1000);
  await mkdir("../GasStation/docs/screenshots", { recursive: true });
  await page.screenshot({ path: "../GasStation/docs/screenshots/desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "../GasStation/docs/screenshots/mobile.png" });
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#game")).toBeVisible();
  await expect.poll(async () => (await saved(page)).level).toBe(11);
  expect(errors).toEqual([]);
});
test("gas: preserves unreadable saves", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("next-stop:save:v1", "future-gas-save"),
  );
  await page.goto("http://localhost:4175");
  await expect(page.locator("#game")).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  expect(
    await page.evaluate(() => localStorage.getItem("next-stop:save:v1")),
  ).toBe("future-gas-save");
});

test("gas: opening mobile menus stops automatic walking", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:4175");
  await page.locator('[data-action="goal"]').click();
  await page.locator('[data-tab="upgrades"]').click();
  const a = (await saved(page)).player;
  await page.waitForTimeout(600);
  const b = (await saved(page)).player;
  expect({ x: b.x, z: b.z }).toEqual({ x: a.x, z: a.z });
});

test("gas: supply objective recovers an empty diesel tank", async ({
  page,
}) => {
  const s = createGame();
  s.level = 8;
  s.money = 200;
  s.fuel = [80, 0];
  s.goods = 40;
  await page.addInitScript(
    (raw) => localStorage.setItem("next-stop:save:v1", raw),
    encode(s),
  );
  await page.goto("http://localhost:4175");
  await page.locator('[data-action="goal"]').click();
  expect((await saved(page)).delivery).toBe(0);
  await page.locator('[data-action="supply"]').click();
  await expect
    .poll(
      async () => {
        const s = await saved(page);
        return s.delivery > 0 || s.fuel[1] > 0;
      },
      { timeout: 10000 },
    )
    .toBe(true);
});

test("gas: every mobile station label selects its own target in both map views", async ({
  page,
}) => {
  const s = createGame();
  s.level = 11;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(
    (raw) => localStorage.setItem("next-stop:save:v1", raw),
    encode(s),
  );
  await page.goto("http://localhost:4175");
  await expect(page.locator('[data-station="pump0"]')).toBeVisible();
  for (const overview of [false, true]) {
    if (overview) await page.locator('[data-action="overview"]').click();
    await page.waitForTimeout(700);
    if (overview)
      await expect(page.locator('[data-station="service6"]')).toBeVisible();
    else await expect(page.locator('[data-station="service6"]')).toBeHidden();
    const misses = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-station]"))
        .filter((el) => {
          const b = el.getBoundingClientRect();
          if (
            !b.width ||
            !b.height ||
            getComputedStyle(el).visibility === "hidden"
          )
            return false;
          const hit = document
            .elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)
            ?.closest<HTMLElement>("[data-station]");
          return hit?.dataset.station !== el.dataset.station;
        })
        .map((el) => el.dataset.station),
    );
    expect(misses, `overview=${overview}`).toEqual([]);
  }
});
