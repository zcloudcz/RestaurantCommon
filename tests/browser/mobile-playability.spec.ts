import { test, expect } from "@playwright/test";

for (const [id, port] of [
  ["burger", 4173],
  ["pizza", 4174],
] as const) {
  test(`${id}: phone keeps the world usable after rotation`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.addInitScript(() => localStorage.clear());
    await page.goto(`http://localhost:${port}`);
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport);
      await expect(page.locator(".mobile-nav")).toBeVisible();
      const world = await page.locator("#world").boundingBox();
      expect(world!.width).toBeGreaterThan(viewport.width * 0.85);
      expect(world!.height).toBeGreaterThan(viewport.height * 0.75);
      // The expansion panel must remain available without permanently taking space.
      await page.locator('.mobile-nav [data-action="sheet"]').click();
      await expect(page.locator("#unlock-button")).toBeInViewport();
      await page.locator(".sheet-close").click();
      await page.locator('[data-action="overview"]').click();
      const source = page.locator('[data-station="source"]');
      await expect(source).toBeInViewport();
      const target = await source.boundingBox();
      expect(target!.height).toBeGreaterThanOrEqual(44);
      await source.tap();
      await expect(page.locator("#carry-count")).toHaveText("5 / 5", {
        timeout: 15000,
      });
      await page.locator('[data-action="overview"]').click();
      await page.screenshot({
        path: `test-results/${id}-${viewport.width}-playable.png`,
      });
      // Start empty so the next orientation must actually pick up food again.
      await page.reload();
      await expect(page.locator("#carry-count")).toHaveText("0 / 5");
    }
    await context.close();
  });
}
