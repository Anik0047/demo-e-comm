import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

interface StoredCartSnapshot {
  data: {
    carts: Array<{
      customerId: string;
      items: Array<{ productId: string; variantId: string | null; quantity: number }>;
    }>;
  };
}

async function readSavedCart(page: Page) {
  const raw = await page.evaluate(() => window.localStorage.getItem("kenakata:demo-state"));
  return JSON.parse(raw ?? "null") as StoredCartSnapshot | null;
}

async function waitForCustomerAccount(page: Page) {
  await expect(page.getByRole("link", { name: /Account: Demo Customer/ })).toBeVisible();
}

test("PDP add to cart saves the selected variant and quantity", async ({ page }) => {
  await page.goto("/products/cotton-panjabi");
  await waitForCustomerAccount(page);
  await page.getByLabel("Size").selectOption("XL");
  const quantity = page.getByRole("group", { name: "Quantity" });
  await quantity.getByRole("button", { name: "Increase quantity" }).click();
  await quantity.getByRole("button", { name: "Increase quantity" }).click();

  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("region", { name: "Cotton Panjabi" }).getByText("Cotton Panjabi added to your cart.", { exact: true })).toBeVisible();
  const snapshot = await readSavedCart(page);
  expect(snapshot?.data.carts.find(({ customerId }) => customerId === "customer-demo")?.items).toContainEqual({
    id: expect.any(String),
    productId: "prod-cotton-panjabi",
    variantId: "var-panjabi-xl",
    quantity: 3,
    addedAt: expect.any(String),
  });
});

test("flash deal effective prices appear on direct PDP navigation and in variant cart totals", async ({ page }) => {
  await page.goto("/products/wireless-earbuds-pro");
  await expect(page.getByRole("heading", { name: "Wireless Earbuds Pro" })).toBeVisible();
  await expect(page.getByRole("article").getByText("Price: ৳2,450", { exact: true })).toBeVisible();
  await page.goto("/products/cotton-panjabi");
  await page.getByLabel("Size").selectOption("M");
  await expect(page.getByRole("article").getByText("Price: ৳1,200", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/cart");
  await expect(page.getByRole("complementary", { name: "Order summary" }).getByText("৳1,200", { exact: true })).toBeVisible();
});

test("repeated PDP additions merge into the existing product and variant line", async ({ page }) => {
  await page.goto("/products/cotton-panjabi");
  await waitForCustomerAccount(page);
  await page.getByLabel("Size").selectOption("M");
  const addToCart = page.getByRole("button", { name: "Add to cart" });
  await addToCart.click();
  await expect(page.getByRole("region", { name: "Cotton Panjabi" }).getByText("Cotton Panjabi added to your cart.", { exact: true })).toBeVisible();
  await addToCart.click();

  const snapshot = await readSavedCart(page);
  const customerCart = snapshot?.data.carts.find(({ customerId }) => customerId === "customer-demo");
  expect(customerCart?.items).toHaveLength(1);
  expect(customerCart?.items[0]).toMatchObject({ productId: "prod-cotton-panjabi", variantId: "var-panjabi-m", quantity: 2 });
});

test("purchase is disabled until a variant is selected and when the product is unavailable", async ({ page }) => {
  await page.goto("/products/cotton-panjabi");
  await waitForCustomerAccount(page);
  const addToCart = page.getByRole("button", { name: "Add to cart" });
  await expect(addToCart).toBeDisabled();
  await page.getByLabel("Size").selectOption("M");
  await expect(addToCart).toBeEnabled();

  await page.goto("/products/double-door-refrigerator");
  await expect(page.getByRole("button", { name: "Add to cart" })).toBeDisabled();
});

test("admin and vendor demo accounts cannot add card products", async ({ page }) => {
  for (const account of ["Demo Admin Admin demo account", "UrbanFit seller Vendor demo account"]) {
    await page.goto("/login");
    await page.getByRole("button", { name: account }).click();
    await page.goto("/products/bluetooth-speaker");
    await expect(page.getByRole("button", { name: "Add to cart" })).toBeDisabled();
  }
});

test("cart additions survive navigation and a page refresh", async ({ page }) => {
  await page.goto("/products/bluetooth-speaker");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("region", { name: "Bluetooth Speaker" }).getByText("Bluetooth Speaker added to your cart.", { exact: true })).toBeVisible();

  await page.goto("/");
  await page.reload();
  const snapshot = await readSavedCart(page);
  expect(snapshot?.data.carts.find(({ customerId }) => customerId === "customer-demo")?.items)
    .toContainEqual(expect.objectContaining({ productId: "prod-bluetooth-speaker", quantity: 1 }));
});
