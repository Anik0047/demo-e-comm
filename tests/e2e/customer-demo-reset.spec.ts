import { expect, test } from "@playwright/test";

async function seedOwnedAndOtherCustomerData(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const key = "kenakata:demo-state";
    const snapshot = JSON.parse(localStorage.getItem(key) ?? "null") as {
      savedAt: string;
      data: {
        accounts: Array<Record<string, unknown>>;
        customers: Array<Record<string, unknown>>;
        carts: Array<{ id: string; customerId: string; items: Array<Record<string, unknown>>; updatedAt: string }>;
        wishlists: Array<{ id: string; customerId: string; productIds: string[]; updatedAt: string }>;
        orders: Array<Record<string, unknown>>;
        fulfillmentGroups: Array<Record<string, unknown>>;
        orderItems: Array<Record<string, unknown>>;
        notifications: Array<Record<string, unknown>>;
      };
    };
    const now = snapshot.savedAt;
    const customer = snapshot.data.customers.find((value) => value.id === "customer-demo") as { fullName: string; phone: string; addresses: unknown[]; preferences: Record<string, unknown>; hiddenOrderIds: string[]; recentlyViewedProductIds: string[] };
    customer.fullName = "Edited Demo Name";
    customer.phone = "01712345678";
    customer.addresses.push({ id: "address:e2e", label: "Home", recipientName: "Edited Demo Name", phone: "01712345678", division: "Dhaka", district: "Dhaka", area: "Gulshan", streetAddress: "Road 2", postalCode: null, isDefault: true });
    customer.preferences = { promotionalUpdates: true, productGridDensity: "compact" };
    customer.hiddenOrderIds.push("order:e2e");
    customer.recentlyViewedProductIds.push("prod-wireless-earbuds-pro");
    (snapshot.data.accounts.find((value) => value.id === "account-customer-demo") as { displayName: string }).displayName = "Edited Demo Name";
    snapshot.data.carts[0]?.items.push({ id: "cart-item:e2e", productId: "prod-wireless-earbuds-pro", variantId: null, quantity: 1, addedAt: now });
    snapshot.data.wishlists[0]?.productIds.push("prod-wireless-earbuds-pro");
    snapshot.data.orders.push({ id: "order:e2e", orderNumber: "KN-E2E", customerId: "customer-demo", fulfillmentGroupIds: ["group:e2e"], shippingAddress: { id: "address:e2e", label: "Home", recipientName: "Edited Demo Name", phone: "01712345678", division: "Dhaka", district: "Dhaka", area: "Gulshan", streetAddress: "Road 2", postalCode: null, isDefault: true }, paymentMethod: "cash_on_delivery", paymentStatus: "pending", status: "placed", subtotal: 1200, shippingTotal: 0, discountTotal: 0, grandTotal: 1200, placedAt: now, updatedAt: now });
    snapshot.data.fulfillmentGroups.push({ id: "group:e2e", orderId: "order:e2e", vendorId: "vendor-tech-haven", itemIds: ["item:e2e"], subtotal: 1200, status: "pending", trackingNumber: null, updatedAt: now });
    snapshot.data.orderItems.push({ id: "item:e2e", fulfillmentGroupId: "group:e2e", productId: "prod-wireless-earbuds-pro", vendorId: "vendor-tech-haven", variantId: null, selectedVariant: null, productName: "E2E snapshot", sku: "SKU-E2E", unitPrice: 1200, quantity: 1, lineTotal: 1200 });
    snapshot.data.notifications.push({ id: "notification:e2e", recipientAccountId: "account-customer-demo", kind: "order", title: "Owned notice", message: "Owned", href: null, readAt: null, createdAt: now });
    snapshot.data.accounts.push({ id: "account-customer-second", email: "second@example.test", displayName: "Second Customer", role: "customer", customerId: "customer-second", vendorId: null, createdAt: now });
    snapshot.data.customers.push({ id: "customer-second", accountId: "account-customer-second", fullName: "Second Customer", phone: "00000000001", addresses: [], preferences: { promotionalUpdates: false, productGridDensity: "standard" }, hiddenOrderIds: [], recentlyViewedProductIds: [], createdAt: now, updatedAt: now });
    snapshot.data.carts.push({ id: "cart-second", customerId: "customer-second", items: [{ id: "cart-item:second", productId: "prod-cotton-panjabi", variantId: null, quantity: 1, addedAt: now }], updatedAt: now });
    snapshot.data.wishlists.push({ id: "wishlist-second", customerId: "customer-second", productIds: ["prod-cotton-panjabi"], updatedAt: now });
    snapshot.data.notifications.push({ id: "notification:second", recipientAccountId: "account-customer-second", kind: "system", title: "Other notice", message: "Other", href: null, readAt: null, createdAt: now });
    localStorage.setItem(key, JSON.stringify(snapshot));
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Account preferences" })).toBeVisible();
}

test("customer reset confirmation erases only owned data and persists the reset", async ({ page }) => {
  await page.goto("/account/preferences");
  await seedOwnedAndOtherCustomerData(page);
  await page.getByRole("button", { name: "Reset my demo data" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("Customer demo orders and their vendor fulfillment groups and item snapshots");
  await expect(dialog).toContainText("Recently viewed products");
  await expect(dialog).toContainText("Other customers, the catalog, and vendor/admin demo data are preserved.");
  await dialog.getByRole("button", { name: "Permanently reset my data" }).click();
  await expect(page.getByRole("status")).toHaveText("Your customer demo data has been reset in this browser.");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null") as {
    data: { customers: Array<{ id: string; fullName: string; phone: string; addresses: unknown[]; hiddenOrderIds: string[]; recentlyViewedProductIds: string[] }>; accounts: Array<{ id: string; displayName: string }>; carts: Array<{ customerId: string; items: unknown[] }>; wishlists: Array<{ customerId: string; productIds: string[] }>; orders: Array<{ id: string }>; fulfillmentGroups: Array<{ id: string }>; orderItems: Array<{ id: string }>; notifications: Array<{ id: string }> };
  });
  expect(saved.data.customers.find(({ id }) => id === "customer-demo")).toMatchObject({ fullName: "Demo Customer", phone: "00000000000", addresses: [], hiddenOrderIds: [], recentlyViewedProductIds: [] });
  expect(saved.data.accounts.find(({ id }) => id === "account-customer-demo")?.displayName).toBe("Demo Customer");
  expect(saved.data.carts.find(({ customerId }) => customerId === "customer-demo")?.items).toEqual([]);
  expect(saved.data.wishlists.find(({ customerId }) => customerId === "customer-demo")?.productIds).toEqual([]);
  expect(saved.data.orders).toEqual([]);
  expect(saved.data.fulfillmentGroups).toEqual([]);
  expect(saved.data.orderItems).toEqual([]);
  expect(saved.data.notifications.map(({ id }) => id)).toEqual(["notification:second"]);
  expect(saved.data.carts.find(({ customerId }) => customerId === "customer-second")?.items).toHaveLength(1);
  expect(saved.data.wishlists.find(({ customerId }) => customerId === "customer-second")?.productIds).toEqual(["prod-cotton-panjabi"]);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Account preferences" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Standard grid" })).toBeChecked();
});

test("cancel, Escape, and closing the dialog preserve customer data", async ({ page }) => {
  await page.goto("/account/preferences");
  await seedOwnedAndOtherCustomerData(page);
  const before = await page.evaluate(() => localStorage.getItem("kenakata:demo-state"));
  const resetButton = page.getByRole("button", { name: "Reset my demo data" });
  await resetButton.click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await resetButton.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await resetButton.click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Close reset dialog" }).click();
  expect(await page.evaluate(() => localStorage.getItem("kenakata:demo-state"))).toBe(before);
});

test("mobile reset stays within the viewport and storage failure does not report success", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/account/preferences");
  await seedOwnedAndOtherCustomerData(page);
  const before = await page.evaluate(() => localStorage.getItem("kenakata:demo-state"));
  await page.getByRole("button", { name: "Reset my demo data" }).click();
  const dimensions = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();
  await page.evaluate(() => {
    Object.defineProperty(Storage.prototype, "setItem", { configurable: true, value() { throw new DOMException("Storage is full", "QuotaExceededError"); } });
  });
  await page.getByRole("button", { name: "Reset my demo data" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Permanently reset my data" }).click();
  await expect(page.locator("p[role='alert']")).toContainText("Reset couldn’t be saved because browser storage is unavailable");
  expect(await page.evaluate(() => localStorage.getItem("kenakata:demo-state"))).toBe(before);
});
