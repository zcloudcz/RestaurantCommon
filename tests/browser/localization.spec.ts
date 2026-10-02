import { test, expect } from "@playwright/test";

test("uses device language, persists a manual choice and returns to automatic", async ({
  browser,
}) => {
  const context = await browser.newContext({ locale: "de-AT" });
  const page = await context.newPage();
  await page.goto("http://localhost:4173");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.locator('[data-station="register"]')).toContainText(
    "Kasse",
  );
  await page.locator('[data-action="settings"]').click();
  await expect(page.locator("#language")).toHaveValue("auto");
  await expect(page.locator("#language option")).toHaveCount(21);
  await page.locator("#language").selectOption("fr");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await page.locator('[data-action="settings"]').click();
  await expect(page.locator("#language")).toHaveValue("fr");
  await page.locator("#language").selectOption("auto");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "languages", {
      value: ["ja-JP"],
      configurable: true,
    });
    window.dispatchEvent(new Event("languagechange"));
  });
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await page.locator("#language").selectOption("fr");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "languages", {
      value: ["de-DE"],
      configurable: true,
    });
    window.dispatchEvent(new Event("languagechange"));
  });
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await context.close();
});

test("Arabic mobile layout localizes the controls without horizontal overflow", async ({
  browser,
}) => {
  const context = await browser.newContext({
    locale: "ar-EG",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("http://localhost:4174");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator('[data-mobile="grow"]')).toHaveText(
    /\p{Script=Arabic}/u,
  );
  await page.locator('[data-action="settings"]').click();
  await expect(page.locator("#language")).toHaveValue("auto");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const box = await page.locator("dialog").boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await context.close();
});
