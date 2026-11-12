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
  await expect(page.getByRole("link", { name: "View comparison with 3 products" })).toBeVisible();
  const [fourthSlug, fourthName] = products[3];
  await page.goto(`/products/${fourthSlug}`);
  await page.getByRole("button", { name: `Compare ${fourthName}` }).click();
  await expect(page.getByRole("status").getByText("You can compare up to three products. Remove one to add another.")).toBeVisible();

  await page.goto("/products/wireless-earbuds-pro");
  await page.reload();
  await page.getByRole("link", { name: "View comparison with 3 products" }).click();
  await expect(page).toHaveURL(/\/compare$/);
  const comparison = page.getByRole("region", { name: "Product comparison table" });
  for (const [, name] of products.slice(0, 3)) await expect(comparison.getByRole("link", { name })).toBeVisible();
  await comparison.getByRole("button", { name: "Remove Wireless Earbuds Pro from comparison" }).click();
  await expect(page.getByRole("status").getByText("2 of 3 products selected.")).toBeVisible();
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page.getByRole("heading", { name: "Start comparing products" })).toBeVisible();
});

for (const count of [1, 2, 3]) {
  test(`immediately opens comparison with ${count} selected product${count === 1 ? "" : "s"}`, async ({ page }) => {
    const products = [
      ["wireless-earbuds-pro", "Wireless Earbuds Pro"],
      ["smart-watch-series-5", "Smart Watch Series 5"],
      ["cotton-panjabi", "Cotton Panjabi"],
    ] as const;
    for (const [slug, name] of products.slice(0, count)) {
      await compareFromDetails(page, slug, name);
    }

    await expect(page.getByRole("link", { name: `View comparison with ${count} ${count === 1 ? "product" : "products"}` })).toBeVisible();
    await page.getByRole("link", { name: `View comparison with ${count} ${count === 1 ? "product" : "products"}` }).click();
    await expect(page).toHaveURL(/\/compare$/);
    const table = page.getByRole("region", { name: "Product comparison table" });
    for (const [, name] of products.slice(0, count)) {
      await expect(table.getByRole("link", { name, exact: true })).toBeVisible();
    }
    await expect(table.getByRole("link")).toHaveCount(count);
  });
}

test("PDP renders one canonical breadcrumb and compact accessible actions on desktop and mobile", async ({ page }) => {
  for (const width of [1280, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/products/wireless-earbuds-pro");

    const breadcrumbs = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumbs).toHaveCount(1);
    await expect(breadcrumbs.getByRole("link", { name: "Home", exact: true })).toHaveAttribute("href", "/");
    await expect(breadcrumbs.getByRole("link", { name: "Electronics", exact: true })).toHaveAttribute("href", "/category/electronics");
    await expect(breadcrumbs.getByRole("link", { name: "Mobile accessories", exact: true })).toHaveAttribute("href", "/category/electronics/mobile-accessories");

    const wishlist = page.getByRole("button", { name: "Add Wireless Earbuds Pro to wishlist" });
    const compare = page.getByRole("button", { name: "Compare Wireless Earbuds Pro" });
    await expect(wishlist).toHaveAttribute("title", "Add to wishlist");
    await expect(compare).toHaveAttribute("title", "Add to comparison");
    const title = page.getByRole("heading", { level: 1, name: "Wireless Earbuds Pro" });
    const titleBox = await title.boundingBox();
    const wishlistBox = await wishlist.boundingBox();
    const compareBox = await compare.boundingBox();
    const infoBox = await title.locator("xpath=ancestor::section[1]").boundingBox();
    if (!titleBox || !wishlistBox || !compareBox || !infoBox) throw new Error("PDP title or action control is missing from the layout.");
    expect(titleBox.width).toBeGreaterThan(infoBox.width * 0.9);
    expect(wishlistBox.y).toBeGreaterThan(titleBox.y + titleBox.height - 1);
    expect(compareBox.y).toBe(wishlistBox.y);
    await expect(page.getByRole("button", { name: "Add to cart" })).toBeVisible();
  }
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

test("comparison remains available when session storage fails and survives browser Back and Forward", async ({ page }) => {
  await page.addInitScript(() => {
    const getItem = Storage.prototype.getItem;
    const setItem = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key: string) {
      if (key === "kenakata-product-comparison-v1") throw new DOMException("Storage unavailable");
      return getItem.call(this, key);
    };
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "kenakata-product-comparison-v1") throw new DOMException("Storage unavailable");
      setItem.call(this, key, value);
    };
  });
  await compareFromDetails(page, "wireless-earbuds-pro", "Wireless Earbuds Pro");
  await page.getByRole("link", { name: "View comparison with 1 product" }).click();
  const table = page.getByRole("region", { name: "Product comparison table" });
  await expect(table.getByRole("link", { name: "Wireless Earbuds Pro", exact: true })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/products\/wireless-earbuds-pro$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/compare$/);
  await expect(page.getByRole("region", { name: "Product comparison table" }).getByRole("link", { name: "Wireless Earbuds Pro", exact: true })).toBeVisible();
});
