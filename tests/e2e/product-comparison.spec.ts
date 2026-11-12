import { expect, test } from "@playwright/test";

async function compareFromDetails(page: import("@playwright/test").Page, slug: string, name: string) {
  await page.goto(`/products/${slug}`);
  await page.getByRole("button", { name: `Compare ${name}` }).click();
}

async function expectProductsInOrder(table: import("@playwright/test").Locator, products: readonly (readonly [string, string, string])[]) {
  for (const [, name] of products) await expect(table.getByRole("link", { name, exact: true })).toBeVisible();
  const productHeaders = table.locator("thead th[data-product-id]");
  await expect(productHeaders).toHaveCount(products.length);
  expect(await productHeaders.evaluateAll((headers) => headers.map((header) => header.getAttribute("data-product-id")))).toEqual(products.map(([, , id]) => id));
}

async function expectStoredComparisonIds(page: import("@playwright/test").Page, products: readonly (readonly [string, string, string])[]) {
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("kenakata-product-comparison-v1") ?? "[]"))).toEqual(products.map(([, , id]) => id));
}

async function expectInMemoryComparisonIds(page: import("@playwright/test").Page, products: readonly (readonly [string, string, string])[]) {
  await expect(page.locator("section[aria-labelledby='compare-title']")).toHaveAttribute("data-selected-product-ids", products.map(([, , id]) => id).join(","));
}

test("keeps the speaker, earbuds, and panjabi selections through PDP navigation and refresh", async ({ page }) => {
  const products = [
    ["bluetooth-speaker", "Bluetooth Speaker", "prod-bluetooth-speaker"],
    ["wireless-earbuds-pro", "Wireless Earbuds Pro", "prod-wireless-earbuds-pro"],
    ["cotton-panjabi", "Cotton Panjabi", "prod-cotton-panjabi"],
  ] as const;

  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];
    if (!product) throw new Error(`Missing comparison fixture at index ${index}.`);
    await page.goto(`/products/${product[0]}`);
    await page.getByRole("button", { name: `Compare ${product[1]}` }).click();

    const expected = products.slice(0, index + 1);
    await expect(page.getByRole("link", {
      name: `View comparison with ${expected.length} ${expected.length === 1 ? "product" : "products"}`,
    })).toBeVisible();
    await expectStoredComparisonIds(page, expected);

    await page.goto("/compare");
    await expectStoredComparisonIds(page, expected);
    await expectInMemoryComparisonIds(page, expected);
    const table = page.getByRole("region", { name: "Product comparison table" });
    await expectProductsInOrder(table, expected);
    await expectStoredComparisonIds(page, expected);
  }

  const expected = products;
  await page.reload();
  await expectInMemoryComparisonIds(page, expected);
  await expectProductsInOrder(page.getByRole("region", { name: "Product comparison table" }), expected);
  await expectStoredComparisonIds(page, expected);

  await page.goto("/products/running-shoes");
  await page.goto("/compare");
  await expectProductsInOrder(page.getByRole("region", { name: "Product comparison table" }), expected);
  await expectStoredComparisonIds(page, expected);

  await page.goto("/products/smart-watch-series-5");
  await page.getByRole("button", { name: "Compare Smart Watch Series 5" }).click();
  await expect(page.getByRole("status").getByText("You can compare up to three products. Remove one to add another.")).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("kenakata-product-comparison-v1") ?? "[]"))).toEqual(expected.map(([, , id]) => id));
  await page.goto("/compare");
  await expectProductsInOrder(page.getByRole("region", { name: "Product comparison table" }), expected);
});

test("comparison atomically keeps canonical products through navigation, limit, removal, and refresh", async ({ page }) => {
  const products = [
    ["wireless-earbuds-pro", "Wireless Earbuds Pro", "prod-wireless-earbuds-pro"],
    ["cotton-panjabi", "Cotton Panjabi", "prod-cotton-panjabi"],
    ["smart-watch-series-5", "Smart Watch Series 5", "prod-smart-watch-series-5"],
    ["bluetooth-speaker", "Bluetooth Speaker", "prod-bluetooth-speaker"],
  ] as const;
  await page.goto("/products/wireless-earbuds-pro");
  await expect(page.getByRole("button", { name: "Compare Wireless Earbuds Pro" })).toBeVisible();
  await page.getByRole("button", { name: "Compare Wireless Earbuds Pro" }).click();
  await expectStoredComparisonIds(page, [products[0]]);
  await page.getByRole("link", { name: "View comparison with 1 product" }).click();
  let table = page.getByRole("region", { name: "Product comparison table" });
  await expect(table.locator("thead th[data-product-id]")).toHaveAttribute("data-product-id", products[0][2]);

  await page.goto(`/products/${products[1][0]}`);
  await page.getByRole("button", { name: `Compare ${products[1][1]}` }).click();
  await expectStoredComparisonIds(page, products.slice(0, 2));
  await page.goto("/compare");
  await expectInMemoryComparisonIds(page, products.slice(0, 2));
  table = page.getByRole("region", { name: "Product comparison table" });
  await expectProductsInOrder(table, products.slice(0, 2));

  await page.goto(`/products/${products[2][0]}`);
  await page.getByRole("button", { name: `Compare ${products[2][1]}` }).click();
  await expect(page.getByRole("link", { name: "View comparison with 3 products" })).toBeVisible();
  await expectStoredComparisonIds(page, products.slice(0, 3));
  await page.goto("/compare");
  await expectInMemoryComparisonIds(page, products.slice(0, 3));
  table = page.getByRole("region", { name: "Product comparison table" });
  await expectProductsInOrder(table, products.slice(0, 3));

  await page.goto(`/products/${products[3][0]}`);
  await page.getByRole("button", { name: `Compare ${products[3][1]}` }).click();
  await expect(page.getByRole("status").getByText("You can compare up to three products. Remove one to add another.")).toBeVisible();
  await expectStoredComparisonIds(page, products.slice(0, 3));
  await page.goto("/compare");
  await expectInMemoryComparisonIds(page, products.slice(0, 3));
  table = page.getByRole("region", { name: "Product comparison table" });
  await expectProductsInOrder(table, products.slice(0, 3));

  await table.getByRole("button", { name: "Remove Cotton Panjabi from comparison" }).click();
  await expectStoredComparisonIds(page, [products[0], products[2]]);
  await expectInMemoryComparisonIds(page, [products[0], products[2]]);
  await page.goto(`/products/${products[3][0]}`);
  await page.getByRole("button", { name: `Compare ${products[3][1]}` }).click();
  await expectStoredComparisonIds(page, [products[0], products[2], products[3]]);
  await page.goto("/compare");
  await expectInMemoryComparisonIds(page, [products[0], products[2], products[3]]);
  table = page.getByRole("region", { name: "Product comparison table" });
  await expectProductsInOrder(table, [products[0], products[2], products[3]]);

  await page.reload();
  await expectStoredComparisonIds(page, [products[0], products[2], products[3]]);
  table = page.getByRole("region", { name: "Product comparison table" });
  await expectProductsInOrder(table, [products[0], products[2], products[3]]);
  await page.goto(`/products/${products[0][0]}`);
  await expect(page.getByRole("link", { name: "View comparison with 3 products" })).toHaveAttribute("title", "In comparison (3)");
  await page.getByRole("link", { name: "View comparison with 3 products" }).click();
  await expectStoredComparisonIds(page, [products[0], products[2], products[3]]);
  await expect(page).toHaveURL(/\/compare$/);
  table = page.getByRole("region", { name: "Product comparison table" });
  await table.getByRole("button", { name: "Remove Wireless Earbuds Pro from comparison" }).click();
  await expect(page.getByRole("status").getByText("2 of 3 products selected.")).toBeVisible();
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page.getByRole("heading", { name: "Start comparing products" })).toBeVisible();
});

test("direct compare navigation and a fresh tab stay isolated", async ({ page, context }) => {
  await page.goto("/products/wireless-earbuds-pro");
  await page.getByRole("button", { name: "Compare Wireless Earbuds Pro" }).click();
  await page.goto("/compare");
  await expect(page.getByRole("region", { name: "Product comparison table" }).locator('thead th[data-product-id="prod-wireless-earbuds-pro"]')).toBeVisible();

  const freshTab = await context.newPage();
  await freshTab.goto("/compare");
  await expect(freshTab.getByRole("heading", { name: "Start comparing products" })).toBeVisible();
  await freshTab.close();
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
    await expect(breadcrumbs.getByRole("link", { name: "Audio & headphones", exact: true })).toHaveAttribute("href", "/category/electronics/audio-headphones");
    await expect(breadcrumbs.getByRole("link", { name: "Wireless earbuds", exact: true })).toHaveAttribute("href", "/category/electronics/audio-headphones/wireless-earbuds");

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
  await expect(table.locator('thead th[data-product-id="prod-wireless-earbuds-pro"]')).toBeVisible();
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
  await expect(table.locator('thead th[data-product-id="prod-wireless-earbuds-pro"]')).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/products\/wireless-earbuds-pro$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/compare$/);
  await expect(page.getByRole("region", { name: "Product comparison table" }).getByRole("link", { name: "Wireless Earbuds Pro", exact: true })).toBeVisible();
});
