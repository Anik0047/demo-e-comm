import { defineConfig, devices } from "@playwright/test";

const testPort = 3101;
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL ?? `http://127.0.0.1:${testPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  outputDir: "./test-results",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
  webServer: externalBaseURL
    ? undefined
    : {
        command: `pnpm exec next dev --hostname 127.0.0.1 --port ${testPort}`,
        url: baseURL,
        env: { PLAYWRIGHT_TEST: "1" },
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
