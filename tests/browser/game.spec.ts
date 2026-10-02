import { test, expect } from "@playwright/test";
for (const [id, port] of [
  ["burger", 4173],
  ["pizza", 4174],
] as const) {
  test(`${id}: renders the world and plays the manual chain`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`http://localhost:${port}`);
    await expect(page.locator("#world")).toBeVisible();
    await page.locator('[data-station="source"]').click();
    await expect(page.locator("#carry-count")).toHaveText("5 / 5", {
      timeout: 15000,
    });
    await page.locator('[data-station="prep"]').click();
    await expect(page.locator("#carry-item")).toHaveText(
      id === "pizza" ? "Připravené pizzy" : "Burgery",
      { timeout: 18000 },
    );
    await expect(page.locator("#carry-count")).toHaveText("5 / 5", {
      timeout: 15000,
    });
    if (id === "pizza") {
      await page.locator('[data-station="oven"]').click();
      await expect(page.locator("#carry-item")).toHaveText("Pizza", {
        timeout: 18000,
      });
      await expect(page.locator("#carry-count")).toHaveText("5 / 5", {
        timeout: 18000,
      });
    }
    await page.locator('[data-station="counter"]').click();
    await expect(page.locator("#carry-count")).toHaveText("0 / 5", {
      timeout: 20000,
    });
    await page.locator('[data-station="register"]').click();
    await expect
      .poll(
        async () =>
          Number((await page.locator("#money").innerText()).replace(/\s/g, "")),
        { timeout: 20000 },
      )
      .toBeGreaterThanOrEqual(30);
    await page.locator("#unlock-button").click();
    await expect(page.locator("#chapter")).toHaveText("02");
    await page.reload();
    await expect(page.locator("#chapter")).toHaveText("02");
    await page.screenshot({ path: `test-results/${id}-desktop.png` });
    expect(errors).toEqual([]);
  });
  test(`${id}: mobile layout and menus`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`http://localhost:${port}`);
    await expect(page.locator(".mobile-nav")).toBeVisible();
    await page.screenshot({ path: `test-results/${id}-mobile.png` });
    await page.locator('.mobile-nav [data-action="menu"]').click();
    await expect(page.locator("dialog")).toBeVisible();
    await expect(page.locator('[data-recipe="1"]')).toBeDisabled();
    await page.locator('[data-action="close"]').click();
    await page.locator('[data-action="settings"]').click();
    await page.locator("#language").selectOption("en");
    await expect(page.locator("#dialog-title")).toHaveText(
      "Make yourself comfortable",
    );
    await page.locator('[data-action="close"]').click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
