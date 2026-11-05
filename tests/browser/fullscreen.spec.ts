import { test, expect } from "@playwright/test";

for (const [id, port] of [
  ["burger", 4173],
  ["pizza", 4174],
] as const) {
  test(`${id}: fullscreen toggles, follows browser exit and preserves play`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      locale: "cs-CZ",
    });
    const page = await context.newPage();
    await page.goto(`http://localhost:${port}`);
    const button = page.locator('[data-action="fullscreen"]');
    await expect(button).toBeVisible();
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(button).toHaveAttribute("aria-label", "Celá obrazovka");
    await button.tap();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.fullscreenElement === document.documentElement,
        ),
      )
      .toBe(true);
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(button).toHaveAttribute(
      "aria-label",
      "Ukončit celou obrazovku",
    );
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(button).toBeInViewport();
    await page.locator('[data-action="overview"]').tap();
    await page.locator('[data-station="source"]').tap();
    await expect(page.locator("#carry-count")).toHaveText("5 / 5", {
      timeout: 15000,
    });
    await page.screenshot({ path: `test-results/${id}-fullscreen.png` });
    await page.locator('[data-action="settings"]').click();
    await page.locator("#language").selectOption("en");
    await page.locator('[data-action="close"]').click();
    await expect(button).toHaveAttribute("aria-label", "Exit fullscreen");
    await button.tap();
    await expect
      .poll(() => page.evaluate(() => document.fullscreenElement === null))
      .toBe(true);
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(button).toHaveAttribute("aria-label", "Enter fullscreen");
    await button.tap();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await page.evaluate(() => document.exitFullscreen());
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("#carry-count")).toHaveText("5 / 5");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await context.close();
  });

  for (const unavailable of [true, false]) {
    test(`${id}: fullscreen ${unavailable ? "unsupported" : "rejected"} shows a helpful message`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript((unsupported) => {
        if (unsupported) {
          Object.defineProperty(document, "fullscreenEnabled", {
            get: () => false,
          });
          Object.defineProperty(document, "fullscreenElement", {
            get: () => undefined,
          });
        } else
          Element.prototype.requestFullscreen = () =>
            Promise.reject(new Error("Fullscreen denied"));
      }, unavailable);
      await page.goto(`http://localhost:${port}`);
      await page.locator('[data-action="fullscreen"]').click();
      await expect(page.locator(".toast")).toContainText("domovské obrazovky");
      await expect(page.locator('[data-action="fullscreen"]')).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      expect(errors).toEqual([]);
    });
  }
}
