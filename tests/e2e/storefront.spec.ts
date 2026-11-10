import { expect, test } from "@playwright/test";

test("homepage loads and a product card opens its product page", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("header").getByRole("link", { name: "Kenakata home" })).toBeVisible();
  const productLink = page
    .locator('section[aria-labelledby="fd-title"]')
    .locator('a[aria-label^="View "]')
    .first();
  await expect(productLink).toBeVisible();

  const productPath = await productLink.getAttribute("href");
  expect(productPath).toMatch(/^\/products\/[\w-]+$/);

  await productLink.click();
  await expect(page).toHaveURL(new RegExp(`${productPath}$`));
  await expect(page.locator("h1#product-name")).toBeVisible();
});

test("a valid product route renders its product details", async ({ page }) => {
  const response = await page.goto("/products/bluetooth-speaker");

  expect(response?.status()).toBe(200);
  await expect(page.locator("h1#product-name")).toHaveText("Bluetooth Speaker");
});

test("an unknown product route renders the not-found state", async ({ page }) => {
  const response = await page.goto("/products/this-product-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("link", { name: "Kenakata home" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("heading", { name: "Product not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse products" })).toHaveAttribute("href", "/products");
});

test("internal product not-found route is excluded from search indexing", async ({ page }) => {
  await page.goto("/product-not-found-internal");

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
});

test("client-side navigation to an unknown product renders the not-found state", async ({ page }) => {
  await page.route("**/products/bluetooth-speaker**", (route) =>
    route.continue({ url: route.request().url().replace("bluetooth-speaker", "this-product-does-not-exist") }),
  );
  await page.goto("/");

  const productLink = page.locator('a[href="/products/bluetooth-speaker"]').first();
  await expect(productLink).toBeVisible();
  await productLink.click();

  await expect(page.getByRole("heading", { name: "Product not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse products" })).toHaveAttribute("href", "/products");
});

test("a product page renders its image gallery", async ({ page }) => {
  await page.goto("/products/bluetooth-speaker");

  const gallery = page.getByRole("region", { name: "Bluetooth Speaker images" });
  await expect(gallery).toBeVisible();
  await expect(gallery.getByRole("button", { name: /Enlarge image/ }).first()).toBeAttached();
  await expect(gallery.getByRole("img", { name: /Bluetooth speaker/i }).first()).toBeAttached();
});

test("Cotton Panjabi size selection updates variant price, stock, and quantity limits", async ({ page }) => {
  await page.goto("/products/cotton-panjabi");

  const product = page.getByRole("region", { name: "Cotton Panjabi" });
  const size = page.getByLabel("Size");
  await expect(size.locator("option")).toHaveText([
    "Choose size",
    "M",
    "L",
    "XL",
    "XXL",
  ]);
  for (const { option, stock } of [
    { option: "M", stock: "20 available" },
    { option: "L", stock: "28 available" },
    { option: "XL", stock: "25 available" },
    { option: "XXL", stock: "15 available" },
  ]) {
    await size.selectOption(option);
    await expect(product.getByText("Price: ৳1,600", { exact: true })).toBeVisible();
    await expect(product.getByText(`SKU: SKU-COTTON-PANJABI-${option}`, { exact: true })).toBeVisible();
    await expect(product.getByText(stock, { exact: true })).toBeVisible();
  }

  const quantity = page.getByRole("group", { name: "Quantity" });
  const value = quantity.locator("output");
  const decrease = quantity.getByRole("button", { name: "Decrease quantity" });
  const increase = quantity.getByRole("button", { name: "Increase quantity" });
  await expect(value).toHaveText("1");
  await expect(decrease).toBeDisabled();

  for (const expected of ["2", "3", "4", "5"]) {
    await increase.click();
    await expect(value).toHaveText(expected);
  }
  await expect(increase).toBeDisabled();

  for (const expected of ["4", "3", "2", "1"]) {
    await decrease.click();
    await expect(value).toHaveText(expected);
  }
  await expect(decrease).toBeDisabled();
});

test("Gaming Laptop exposes its real low stock and one-unit order limit", async ({ page }) => {
  await page.goto("/products/gaming-laptop-15");

  await expect(page.getByText("Low stock · 4 units left", { exact: true })).toBeVisible();
  const quantity = page.getByRole("group", { name: "Quantity" });
  await expect(quantity.locator("output")).toHaveText("1");
  await expect(quantity.getByRole("button", { name: "Decrease quantity" })).toBeDisabled();
  await expect(quantity.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
});

test("Refrigerator is out of stock and quantity controls stay disabled", async ({ page }) => {
  await page.goto("/products/double-door-refrigerator");

  await expect(page.getByText("Out of stock", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "This item is currently out of stock." }))
    .toHaveText("This item is currently out of stock.");
  const quantity = page.getByRole("group", { name: "Quantity" });
  await expect(quantity.locator("output")).toHaveText("1");
  await expect(quantity.getByRole("button", { name: "Decrease quantity" })).toBeDisabled();
  await expect(quantity.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
});

test("Bluetooth Speaker has no variants and quantity stays within its stock-independent order cap", async ({ page }) => {
  await page.goto("/products/bluetooth-speaker");

  await expect(page.getByRole("heading", { name: "Bluetooth Speaker" })).toBeVisible();
  await expect(page.getByLabel("Size")).toHaveCount(0);
  await expect(page.getByText("59 available", { exact: true })).toBeVisible();

  const quantity = page.getByRole("group", { name: "Quantity" });
  const value = quantity.locator("output");
  const decrease = quantity.getByRole("button", { name: "Decrease quantity" });
  const increase = quantity.getByRole("button", { name: "Increase quantity" });
  for (const expected of ["2", "3", "4"]) {
    await increase.click();
    await expect(value).toHaveText(expected);
  }
  await expect(increase).toBeDisabled();

  for (const expected of ["3", "2", "1"]) {
    await decrease.click();
    await expect(value).toHaveText(expected);
  }
  await expect(decrease).toBeDisabled();
});
