import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { rootFor } from "./config.mjs";
const browser = await chromium.launch({ channel: "chrome", headless: true });
for (const id of process.argv[2] ? [process.argv[2]] : ["pizza", "burger"]) {
  const svg = await readFile(join(rootFor(id), "public/icon.svg"), "utf8");
  for (const size of [192, 512]) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      `<style>html,body{margin:0}svg{display:block;width:100vw;height:100vh}</style>${svg}`,
    );
    await page.screenshot({
      path: join(rootFor(id), `public/icon-${size}.png`),
      omitBackground: true,
    });
    await page.close();
  }
  // Store apps: the OS applies its own icon mask, so @capacitor/assets needs
  // the artwork without our rounded background tile (it re-adds the colour).
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
  await page.setContent(
    `<style>html,body{margin:0}svg{display:block;width:100vw;height:100vh}</style>${svg.replace(/<rect width="192" height="192"[^>]*\/>/, "")}`,
  );
  await page.screenshot({
    path: join(rootFor(id), "assets/logo.png"),
    omitBackground: true,
  });
  await page.close();
}
await browser.close();
