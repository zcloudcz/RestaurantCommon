import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
const games = [
  ["BurgerRush", "Burger Rush", "Grill. Serve. Grow.", "#8dc9c4", "#204b50"],
  ["PizzaPiazza", "Pizza Piazza", "Bake. Serve. Grow.", "#bdcfa7", "#315c43"],
];
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--enable-webgl", "--ignore-gpu-blocklist"] });
for (const [dir, name, tag, bg, fg] of games) {
  const root = `/home/zahy/src/games/${dir}`;
  const svg = await readFile(`${root}/public/icon.svg`, "utf8");
  const shot = (await readFile(`${root}/store/screenshots/play/en-US/03-full-house.png`)).toString("base64");
  const page = await browser.newPage({ viewport: { width: 1024, height: 500 } });
  await page.setContent(`<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap');
  html,body{margin:0;width:1024px;height:500px;overflow:hidden;background:${bg};font-family:'Space Grotesk',sans-serif}
  .shot{position:absolute;right:-110px;top:-200px;width:560px;transform:rotate(-6deg);border-radius:28px;box-shadow:0 20px 60px rgba(0,0,0,.25)}
  .txt{position:absolute;left:64px;top:110px;color:${fg}}
  .txt svg{width:150px;height:150px;display:block;margin-bottom:18px}
  h1{margin:0;font-size:64px;line-height:1}
  p{margin:14px 0 0;font-size:34px;opacity:.85}
  </style><img class="shot" src="data:image/png;base64,${shot}"><div class="txt">${svg}<h1>${name}</h1><p>${tag}</p></div>`);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${root}/store/feature-graphic.png` });
  await page.close();
}
await browser.close();
