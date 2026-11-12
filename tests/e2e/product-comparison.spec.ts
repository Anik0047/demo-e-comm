import { expect, test } from "@playwright/test";

function cardFor(page: import("@playwright/test").Page, name: string) {
  return page.locator("article").filter({ has: page.getByRole("link", { name: `View ${name}` }) }).first();
}

test("comparison keeps three unique products through navigation and refresh, then supports removal and clear", async ({ page }) => {
  await page.goto("/products");
  const names = ["Wireless Earbuds Pro", "Smart Watch Series 5", "Cotton Panjabi", "Non-stick Cookware Set"];
  for (const name of names.slice(0, 3)) await cardFor(page, name).getByRole("button", { name: `Compare ${name}` }).click();
  await expect(page.getByRole("link", { name: "View comparison (3)" }).first()).toBeVisible();
  const fourth = cardFor(page, names[3]);
  await fourth.getByRole("button", { name: `Compare ${names[3]}` }).click();
  await expect(fourth.getByRole("status").getByText("You can compare up to three products. Remove one to add another.")).toBeVisible();

  await page.goto("/");
  await page.reload();
  await page.goto("/products");
  await cardFor(page, names[0]).getByRole("link", { name: "View comparison (3)" }).click();
  await expect(page).toHaveURL(/\/compare$/);
  const comparison = page.getByRole("region", { name: "Product comparison table" });
  for (const name of names.slice(0, 3)) await expect(comparison.getByRole("link", { name })).toBeVisible();
  await comparison.getByRole("button", { name: `Remove ${names[0]} from comparison` }).click();
  await expect(page.getByRole("status").getByText("2 of 3 products selected.")).toBeVisible();
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page.getByRole("heading", { name: "Start comparing products" })).toBeVisible();
});

test("comparison is side by side on desktop and scrolls within its table on mobile", async ({ page }) => {
  await page.goto("/products");
  for (const name of ["Wireless Earbuds Pro", "Smart Watch Series 5"]) {
    await cardFor(page, name).getByRole("button", { name: `Compare ${name}` }).click();
  }
  await page.goto("/compare");

  await page.setViewportSize({ width: 1280, height: 900 });
  const table = page.getByRole("region", { name: "Product comparison table" });
  await expect(table.getByRole("link", { name: "Wireless Earbuds Pro" })).toBeVisible();
  await expect(table.getByRole("link", { name: "Smart Watch Series 5" })).toBeVisible();
  const desktopWidths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(desktopWidths.scroll).toBeLessThanOrEqual(desktopWidths.client);

  await page.setViewportSize({ width: 360, height: 800 });
  await expect(table).toBeVisible();
  const mobileWidths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(mobileWidths.scroll).toBeLessThanOrEqual(mobileWidths.client);
  const tableWidths = await table.evaluate((element) => ({ scroll: element.scrollWidth, client: element.clientWidth }));
  expect(tableWidths.scroll).toBeGreaterThan(tableWidths.client);
  await expect(table.getByText("Starting price", { exact: true })).toBeVisible();
});

test("comparison discards malformed and non-catalog IDs from session storage", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("kenakata-product-comparison-v1", JSON.stringify([
    "unknown-product", "prod-wireless-earbuds-pro", "prod-wireless-earbuds-pro", 42,
  ])));
  await page.goto("/compare");
  const table = page.getByRole("region", { name: "Product comparison table" });
  await expect(table.getByRole("link", { name: "Wireless Earbuds Pro" })).toBeVisible();
  await expect(page.getByRole("status").getByText("1 of 3 products selected.")).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("kenakata-product-comparison-v1"))).toBe('["prod-wireless-earbuds-pro"]');
});
