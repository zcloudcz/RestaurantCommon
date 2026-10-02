import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { createGame, encode } from "../../../GasStation/src/simulation";
for (const sample of [
  { name: "desktop", width: 1440, height: 1000, language: "en" },
  { name: "mobile", width: 390, height: 844, language: "en" },
  { name: "mobile-rtl", width: 390, height: 844, language: "ar" },
  { name: "landscape", width: 844, height: 390, language: "en" },
]) {
  test(`gas fullscreen UI: ${sample.name}`, async ({ page }, info) => {
    await page.setViewportSize(sample);
    const state = createGame();
    state.level = 8;
    state.open = false;
    state.money = 1240;
    state.fuel = [64, 112];
    await page.addInitScript(
      ({ raw, language }) => {
        localStorage.setItem("next-stop:save:v1", raw);
        localStorage.setItem(
          "next-stop:preferences",
          JSON.stringify({ language }),
        );
      },
      { raw: encode(state), language: sample.language },
    );
    await page.goto("http://localhost:4175");
    await expect(page.locator("#diesel-status")).toBeVisible();
    const header = await page.locator("header").boundingBox();
    const world = await page.locator(".world").boundingBox();
    expect(header!.width).toBeLessThan(sample.width);
    expect(world!.y).toBe(0);
    expect(world!.width).toBe(sample.width);
    expect(world!.height).toBe(sample.height);
    await expect(page.locator("#panel")).toBeHidden();
    await expect(page.locator(".wallet")).toHaveCSS(
      "background-color",
      "rgb(255, 206, 69)",
    );
    await expect(page.locator("#settings-button svg")).toHaveCount(1);
    for (const selector of [
      "#settings-button",
      "#pause-button",
      '[data-tab="services"]',
    ]) {
      const box = await page.locator(selector).boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(sample.width);
    await page.screenshot({ path: info.outputPath(`${sample.name}.png`) });
    await page.locator("#pause-button").click();
    await expect(page.locator("#pause-button")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator("#paused-overlay")).toBeVisible();
    await page.locator("#pause-button").click();
    await expect(page.locator("#pause-button")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await page.locator('[data-tab="services"]').click();
    await expect(page.locator("#panel-content h1")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#panel")).toBeHidden();
    await expect(page.locator('[data-tab="services"]')).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await page.locator('[data-tab="services"]').click();
    await page.locator('[data-action="journey"]').click();
    if (sample.height > 560)
      await expect(page.locator(".chapter-progress")).toBeVisible();
    else
      for (const button of await page
        .locator('.expansion-choice [data-action="expand"]')
        .all())
        await expect(button).toBeInViewport({ ratio: 1 });
    await expect(page.locator(".expansion-choice")).toHaveCount(2);
    await page.screenshot({
      path: `../GasStation/docs/screenshots/ui-overhaul-${sample.name}-choices.png`,
    });
    if (sample.name === "desktop") {
      await page.locator(".milestones summary").click();
      await expect
        .poll(async () => page.locator(".stats").textContent())
        .not.toContain("0:00");
      await page.waitForTimeout(1100);
      await expect(page.locator(".milestones")).toHaveAttribute("open", "");
      await page.locator(".milestones summary").click();
    }
    {
      await page.screenshot({
        path: info.outputPath(`${sample.name}-sheet.png`),
      });
      await page.locator('[data-action="panel-close"]').click();
      await expect(page.locator("#panel")).toBeHidden();
    }
    await expect(page.locator('[data-station="pump0"]')).toBeVisible();
    await page.locator('[data-station="pump0"]').click();
    if (sample.name === "desktop" || sample.name === "mobile") {
      await page.locator("#settings-button").click();
      await page.locator("#language").selectOption("cs");
      await page.locator("#modal > .close").click();
      await expect(page.locator("#fuel-status .reserve-name")).toHaveText(
        "Palivo",
      );
      await mkdir("../GasStation/docs/screenshots", { recursive: true });
      await page.screenshot({
        path: `../GasStation/docs/screenshots/ui-overhaul-${sample.name}-cs.png`,
      });
    }
  });
}
