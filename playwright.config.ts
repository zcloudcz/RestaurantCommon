import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  timeout: 90000,
  expect: { timeout: 10000 },
  workers: 1,
  use: {
    channel: "chrome",
    locale: "cs-CZ",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: { args: ["--enable-webgl", "--ignore-gpu-blocklist"] },
    screenshot: "only-on-failure",
  },
  webServer: process.env.RESTAURANT_SERVERS_RUNNING
    ? undefined
    : [
        {
          command: "node scripts/serve.mjs burger",
          port: 4173,
          reuseExistingServer: true,
        },
        {
          command: "node scripts/serve.mjs pizza",
          port: 4174,
          reuseExistingServer: true,
        },
        {
          command: "node scripts/serve.mjs burger --preview --port 4183",
          port: 4183,
          reuseExistingServer: true,
        },
        {
          command: "node scripts/serve.mjs pizza --preview --port 4184",
          port: 4184,
          reuseExistingServer: true,
        },
        {
          command: "node scripts/serve.mjs gas",
          port: 4175,
          reuseExistingServer: true,
        },
        {
          command: "node scripts/serve.mjs gas --preview --port 4185",
          port: 4185,
          reuseExistingServer: true,
        },
      ],
  reporter: [["list"]],
});
