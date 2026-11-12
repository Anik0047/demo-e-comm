import { expect, test } from "@playwright/test";

async function compareFromDetails(page: import("@playwright/test").Page, slug: string, name: string) {
  await page.goto(`/products/${slug}`);
  await page.getByRole("button", { name: `Compare ${name}` }).click();
}

test("comparison keeps three unique products through navigation and refresh, then supports removal and clear", async ({ page }) => {
  const products = [
    ["wireless-earbuds-pro", "Wireless Earbuds Pro"],
    ["smart-watch-series-5", "Smart Watch Series 5"],
    ["cotton-panjabi", "Cotton Panjabi"],
    ["nonstick-cookware-set", "Non-stick Cookware Set"],
  ] as const;
  for (const [slug, name] of products.slice(0, 3)) await compareFromDetails(page, slug, name);
  await expect(page.getByRole("link", { name: "View comparison (3)" })).toBeVisible();
  const [fourthSlug, fourthName] = products[3];
  await page.goto(`/products/${fourthSlug}`);
  await page.getByRole("button", { name: `Compare ${fourthName}` }).click();
  await expect(page.getByRole("status").getByText("You can compare up to three products. Remove one to add another.")).toBeVisible();

  await page.goto("/products/wireless-earbuds-pro");
  await page.reload();
  await page.getByRole("link", { name: "View comparison (3)" }).click();
  await expect(page).toHaveURL(/\/compare$/);
  const comparison = page.getByRole("region", { name: "Product comparison table" });
  for (const [, name] of products.slice(0, 3)) await expect(comparison.getByRole("link", { name })).toBeVisible();
  await comparison.getByRole("button", { name: "Remove Wireless Earbuds Pro from comparison" }).click();
  await expect(page.getByRole("status").getByText("2 of 3 products selected.")).toBeVisible();
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page.getByRole("heading", { name: "Start comparing products" })).toBeVisible();
});

test("comparison is side by side on desktop and scrolls within its table on mobile", async ({ page }) => {
  await compareFromDetails(page, "wireless-earbuds-pro", "Wireless Earbuds Pro");
  await compareFromDetails(page, "smart-watch-series-5", "Smart Watch Series 5");
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
