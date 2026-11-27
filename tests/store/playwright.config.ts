import { defineConfig } from "@playwright/test";
import base from "../../playwright.config";

export default defineConfig({
  ...base,
  testDir: ".",
  // Servers run from the package root, not from this folder.
  webServer: (base.webServer as { port: number; cwd?: string }[])
    .filter((s) => s.port === 4183 || s.port === 4184)
    .map((s) => ({ ...s, cwd: new URL("../..", import.meta.url).pathname })),
});
