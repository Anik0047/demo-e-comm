import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

interface StoredCartSnapshot {
  data: {
    carts: Array<{
      customerId: string;
      items: Array<{ id: string; productId: string; variantId: string | null; quantity: number; addedAt: string }>;
    }>;
  };
}

const cartLinkName = /^Cart,/;

async function waitForCustomer(page: Page) {
  await expect(page.getByRole("link", { name: /Account: Demo Customer/ })).toBeVisible();
}

async function showMiniCartOnDesktop(page: Page) {
  const preview = page.getByRole("region", { name: "Mini cart" });
  if (await page.evaluate(() => window.matchMedia("(min-width: 768px)").matches)) {
    await page.getByRole("link", { name: cartLinkName }).hover();
    await expect(preview).toBeVisible();
  } else {
    await expect(preview).toBeHidden();
  }
  return preview;
}

async function addPanjabi(page: Page, size = "M", quantity = 1) {
  await page.goto("/products/cotton-panjabi");
  await waitForCustomer(page);
  await page.getByLabel("Size").selectOption(size);
  const quantityGroup = page.getByRole("group", { name: "Quantity" });
  for (let index = 1; index < quantity; index += 1) {
    await quantityGroup.getByRole("button", { name: "Increase quantity" }).click();
  }
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("region", { name: "Cotton Panjabi" }).getByText("Cotton Panjabi added to your cart.", { exact: true })).toBeVisible();
}

test("navbar cart count updates after PDP additions and mini-cart shows current item details", async ({ page }) => {
  await addPanjabi(page, "M", 2);

  const cart = page.getByRole("link", { name: "Cart, 2 items, subtotal ৳3,200" });
  await expect(cart).toBeVisible();
  const preview = await showMiniCartOnDesktop(page);
  if (await page.evaluate(() => window.matchMedia("(min-width: 768px)").matches)) {
    const line = preview.getByRole("listitem");
    await expect(line.getByText("Cotton Panjabi", { exact: true })).toBeVisible();
    await expect(line.getByText("Size: M", { exact: true })).toBeVisible();
    await expect(line.getByText("Qty 2", { exact: true })).toBeVisible();
    await expect(line.getByText("৳3,200", { exact: true })).toBeVisible();
    await expect(preview.getByText("Subtotal")).toBeVisible();
  }
});

test("mini-cart uses the product image for products with photos", async ({ page }) => {
  await page.goto("/products/bluetooth-speaker");
  await waitForCustomer(page);
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("region", { name: "Bluetooth Speaker" }).getByText("Bluetooth Speaker added to your cart.", { exact: true })).toBeVisible();
  const preview = await showMiniCartOnDesktop(page);
  if (await page.evaluate(() => window.matchMedia("(min-width: 768px)").matches)) {
    const image = preview.getByRole("img", { name: /Blue JBL GO2 Bluetooth speaker/ });
    await expect(image).toHaveAttribute("src", /thumb\.wikimedia\.org/);
    await expect(preview.getByText("Bluetooth Speaker", { exact: true })).toBeVisible();
  }
});

test("navbar cart keeps its count and mini-cart contents after refresh", async ({ page }) => {
  await addPanjabi(page, "XL", 3);
  await page.reload();
  await waitForCustomer(page);
  await expect(page.getByRole("link", { name: "Cart, 3 items, subtotal ৳4,800" })).toBeVisible();
  const preview = await showMiniCartOnDesktop(page);
  if (await page.evaluate(() => window.matchMedia("(min-width: 768px)").matches)) {
    await expect(preview.getByText("Size: XL", { exact: true })).toBeVisible();
    await expect(preview.getByText("Qty 3", { exact: true })).toBeVisible();
  }
});

test("navbar cart is isolated when switching away from the customer account", async ({ page }) => {
  await addPanjabi(page, "L", 2);
  await page.getByRole("link", { name: /Account: Demo Customer/ }).click();
  await page.getByRole("button", { name: "Demo Admin Admin demo account" }).click();
  await expect(page).toHaveURL("/admin/dashboard");
  await expect(page.getByRole("heading", { name: "Admin dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: cartLinkName })).toHaveCount(0);

  const customerCartBeforeAdminInteraction = await page.evaluate(() => {
    const raw = window.localStorage.getItem("kenakata:demo-state");
    if (!raw) throw new Error("Expected hydrated demo state in local storage");
    const snapshot = JSON.parse(raw) as StoredCartSnapshot;
    return JSON.stringify(snapshot.data.carts.find(({ customerId }) => customerId === "customer-demo")?.items ?? null);
  });
  await page.goto("/products/cotton-panjabi");
  const addToCart = page.getByRole("button", { name: "Add to cart" });
  await expect(addToCart).toBeDisabled();
  await expect(page.getByText("Switch to a customer demo account before adding items to your cart.", { exact: true })).toBeVisible();
  const customerCartAfterAdminInteraction = await page.evaluate(() => {
    const raw = window.localStorage.getItem("kenakata:demo-state");
    if (!raw) throw new Error("Expected hydrated demo state in local storage");
    const snapshot = JSON.parse(raw) as StoredCartSnapshot;
    return JSON.stringify(snapshot.data.carts.find(({ customerId }) => customerId === "customer-demo")?.items ?? null);
  });
  expect(customerCartAfterAdminInteraction).toBe(customerCartBeforeAdminInteraction);

  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Customer Customer demo account" }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/");
  await waitForCustomer(page);
  await expect(page.getByRole("link", { name: "Cart, 2 items, subtotal ৳3,200" })).toBeVisible();
});

test("empty customer cart has clear feedback and a products link", async ({ page }) => {
  await page.goto("/");
  await waitForCustomer(page);
  await expect(page.getByRole("link", { name: "Cart, 0 items, subtotal ৳0" })).toBeVisible();
  const preview = await showMiniCartOnDesktop(page);
  if (await page.evaluate(() => window.matchMedia("(min-width: 768px)").matches)) {
    await expect(preview.getByText("Your cart is empty.", { exact: true })).toBeVisible();
    await expect(preview.getByRole("link", { name: "Browse products" })).toHaveAttribute("href", "/products");
    await expect(preview.getByText("Wireless Earbuds Pro", { exact: true })).toHaveCount(0);
  }
});

test("unavailable cart variants stay visible with an explanation and are excluded from subtotal", async ({ page }) => {
  await page.goto("/");
  await waitForCustomer(page);
  await page.evaluate(() => {
    const raw = window.localStorage.getItem("kenakata:demo-state");
    if (!raw) throw new Error("Expected hydrated demo state in local storage");
    const snapshot = JSON.parse(raw) as StoredCartSnapshot;
    const cart = snapshot.data.carts.find(({ customerId }) => customerId === "customer-demo");
    if (!cart) throw new Error("Expected the seeded customer cart");
    cart.items = [{
      id: "cart-line-unavailable-variant",
      productId: "prod-cotton-panjabi",
      variantId: "var-panjabi-removed",
      quantity: 2,
      addedAt: "2026-11-10T00:00:00.000Z",
    }];
    window.localStorage.setItem("kenakata:demo-state", JSON.stringify(snapshot));
  });
  await page.reload();
  await waitForCustomer(page);

  await expect(page.getByRole("link", { name: "Cart, 2 items, subtotal ৳0" })).toBeVisible();
  const preview = await showMiniCartOnDesktop(page);
  if (await page.evaluate(() => window.matchMedia("(min-width: 768px)").matches)) {
    await expect(preview.getByText("Cotton Panjabi", { exact: true })).toBeVisible();
    await expect(preview.getByText("This option is no longer available.", { exact: true })).toBeVisible();
    await expect(preview.getByText("Unavailable", { exact: true })).toBeVisible();
  }
});
