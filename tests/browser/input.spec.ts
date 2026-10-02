import { test, expect } from "@playwright/test";
test("mobile drag moves the player and pointer release stops movement", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("http://localhost:4173");
  const cdp = await context.newCDPSession(page);
  const position = async () =>
    page.evaluate(() => {
      window.dispatchEvent(new Event("pagehide"));
      const s = JSON.parse(
        localStorage.getItem("restaurant.burger.v1") ?? "{}",
      );
      return { x: s.state.player.x, z: s.state.player.z };
    });
  const start = await position();
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 195, y: 580, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 250, y: 580, id: 1 }],
  });
  await page.waitForTimeout(600);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  const after = await position();
  expect(Math.hypot(after.x - start.x, after.z - start.z)).toBeGreaterThan(0.5);
  await page.waitForTimeout(400);
  expect(await position()).toEqual(after);
  await context.close();
});
