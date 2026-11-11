import { expect, test } from "@playwright/test";

async function waitForCustomer(page: import("@playwright/test").Page) {
  await expect(page.getByRole("link", { name: /My account: Demo Customer/ })).toBeVisible();
}

async function addPanjabi(page: import("@playwright/test").Page, quantity = 1) {
  await page.goto("/products/cotton-panjabi");
  await waitForCustomer(page);
  await page.getByLabel("Size").selectOption("M");
  const controls = page.getByRole("group", { name: "Quantity" });
  for (let i = 1; i < quantity; i += 1) await controls.getByRole("button", { name: "Increase quantity" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByText("Cotton Panjabi added to your cart.", { exact: true })).toBeVisible();
}

test("cart navigation, quantity, subtotal, persistence, removal, and clear cart", async ({ page }) => {
  await addPanjabi(page, 2);
  await page.getByRole("link", { name: /Cart,/ }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole("heading", { name: "Your cart" })).toBeVisible();
  const cartItems = page.getByRole("list", { name: "Cart items" });
  const orderSummary = page.getByRole("complementary", { name: "Order summary" });
  await expect(cartItems.getByText("Size: M", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cart, 2 items, subtotal ৳2,400" })).toBeVisible();
  await expect(cartItems.getByText("৳2,400", { exact: true })).toBeVisible();
  await expect(orderSummary.getByText("৳2,400", { exact: true })).toBeVisible();

  const quantityGroup = page.getByRole("group", { name: "Quantity for Cotton Panjabi" });
  await quantityGroup.getByRole("button", { name: "Increase quantity" }).click();
  await expect(page.getByRole("link", { name: "Cart, 3 items, subtotal ৳3,600" })).toBeVisible();
  await quantityGroup.getByRole("button", { name: "Increase quantity" }).click();
  await quantityGroup.getByRole("button", { name: "Increase quantity" }).click();
  await expect(page.getByRole("link", { name: "Cart, 5 items, subtotal ৳6,000" })).toBeVisible();
  await expect(quantityGroup.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
  await expect(page.getByText("Maximum available quantity: 5.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(cartItems.getByText("Size: M", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cart, 5 items, subtotal ৳6,000" })).toBeVisible();

  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByRole("heading", { name: "Your cart is empty", exact: true })).toBeVisible();
  await addPanjabi(page);
  await page.goto("/cart");
  await page.getByRole("button", { name: "Clear cart" }).click();
  await expect(page.getByRole("heading", { name: "Your cart is empty", exact: true })).toBeVisible();
});

test("mini-cart View cart opens cart and unavailable variants can be removed", async ({ page }) => {
  await page.goto("/");
  await waitForCustomer(page);
  await page.evaluate(() => {
    const raw = localStorage.getItem("kenakata:demo-state");
    if (!raw) throw new Error("Demo state was not persisted");
    const snapshot = JSON.parse(raw) as { data: { carts: Array<{ customerId: string; items: unknown[] }> } };
    const cart = snapshot.data.carts.find((entry) => entry.customerId === "customer-demo");
    if (!cart) throw new Error("Customer cart was not created");
    cart.items = [{ id: "unavailable", productId: "prod-cotton-panjabi", variantId: "var-panjani-gone", quantity: 2, addedAt: new Date().toISOString() }];
    localStorage.setItem("kenakata:demo-state", JSON.stringify(snapshot));
  });
  await page.reload();
  if (await page.evaluate(() => window.matchMedia("(min-width: 768px)").matches)) {
    await page.getByRole("link", { name: /Cart,/ }).hover();
    await page.getByRole("link", { name: "View cart" }).click();
  } else {
    await page.getByRole("link", { name: /Cart,/ }).tap();
  }
  await expect(page).toHaveURL(/\/cart$/);
  const cartItems = page.getByRole("list", { name: "Cart items" });
  const orderSummary = page.getByRole("complementary", { name: "Order summary" });
  await expect(cartItems.getByText("Unavailable: This option is no longer available.", { exact: true })).toBeVisible();
  await expect(orderSummary.getByText("৳0", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByRole("heading", { name: "Your cart is empty", exact: true })).toBeVisible();
});

test("admin and vendor accounts cannot view or mutate customer cart", async ({ page }) => {
  await addPanjabi(page);
  for (const account of ["Demo Admin Admin demo account", "UrbanFit seller Vendor demo account"]) {
    await page.goto("/login");
    await page.getByRole("button", { name: account }).click();
    await page.goto("/cart");
    await expect(page.getByText("Your cart is private")).toBeVisible();
    await expect(page.getByText("Cotton Panjabi", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Clear cart" })).toHaveCount(0);
    await page.goto("/");
  }
});
