import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "demo-*.spec.ts",
  fullyParallel: true,
  reporter: "list",
});
