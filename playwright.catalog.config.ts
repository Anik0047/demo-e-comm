import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/domain",
  testMatch: "*.test.ts",
  reporter: "list",
  workers: 1,
});
