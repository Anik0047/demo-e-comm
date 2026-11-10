import { expect, test } from "@playwright/test";

async function expectPromotionListing(page: import("@playwright/test").Page, path: string, heading: string) {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const response = await page.goto(path);

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: heading, exact: true })).toBeVisible();
  const earbuds = page.locator("article").filter({ has: page.getByRole("link", { name: "View Wireless Earbuds Pro" }) });
  await expect(earbuds.getByText("৳2,450", { exact: true })).toBeVisible();
  expect(pageErrors.filter((message) => message.includes("unstable value `Date.now()`"))).toEqual([]);
}

test("products listing evaluates promotion pricing without a prerender error", async ({ page }) => {
  await expectPromotionListing(page, "/products", "All products");
});

test("category listing navigation evaluates promotion pricing without a prerender error", async ({ page }) => {
  await expectPromotionListing(page, "/category/electronics/audio-headphones/wireless-earbuds", "Wireless earbuds");
});

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

test("desktop gallery image controls select images and open the viewer by keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/products/bluetooth-speaker");

  const gallery = page.getByRole("region", { name: "Bluetooth Speaker images" });
  const secondImage = gallery.getByRole("button", { name: /^View image 2 of 4/ });
  await secondImage.focus();
  await page.keyboard.press("Enter");
  await expect(secondImage).toHaveAttribute("aria-pressed", "true");

  await gallery.getByRole("button", { name: /^Enlarge image 2 of 4/ }).click();
  await expect(page.getByRole("dialog", { name: "Bluetooth Speaker — image viewer" })).toBeVisible();
  await page.keyboard.press("Escape");
});

test("mobile gallery can advance images with its keyboard-accessible controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/products/bluetooth-speaker");

  const gallery = page.getByRole("region", { name: "Bluetooth Speaker images" });
  await expect(gallery.getByText("Image 1 of 4")).toBeVisible();
  await gallery.getByRole("button", { name: "Next image" }).focus();
  await page.keyboard.press("Enter");
  await expect(gallery.getByText("Image 2 of 4")).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(gallery.getByText("Image 1 of 4")).toBeVisible();
});

test("products without catalog images show the intentional gallery fallback", async ({ page }) => {
  await page.goto("/products/wireless-earbuds-pro");

  const gallery = page.getByRole("region", { name: "Wireless Earbuds Pro images" });
  await expect(gallery.getByText("No product images yet")).toBeVisible();
  await expect(gallery.getByRole("img")).toHaveCount(0);
});

test("Cotton Panjabi size selection updates variant price, stock, and quantity limits", async ({ page }) => {
  await page.goto("/products/cotton-panjabi");
  await expect(page.getByRole("link", { name: /Account: Demo Customer/ })).toBeVisible();

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
    await expect(product.getByText("Price: ৳1,200", { exact: true })).toBeVisible();
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
