import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  globalSetup: "./tests/e2e/global-setup.ts",
  outputDir: "./test-results",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
        storageState: "tests/e2e/.auth/author.json",
      },
    },
    {
      name: "chromium-mobile",
      use: {
        ...devices["Pixel 7"],
        storageState: "tests/e2e/.auth/opposer.json",
      },
    },
  ],
  webServer: {
    command: "pnpm e2e:server",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
