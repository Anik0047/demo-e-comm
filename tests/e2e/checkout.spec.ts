import { expect, test } from "@playwright/test";

async function addPanjabi(page: import("@playwright/test").Page) {
  await page.goto("/products/cotton-panjabi");
  await expect(page.getByRole("link", { name: /My account: Demo Customer/ })).toBeVisible();
  await page.getByLabel("Size").selectOption("M");
  await page.getByRole("button", { name: "Add to cart" }).click();
}

async function fillAddress(page: import("@playwright/test").Page, label = "Home", area = "Dhanmondi") {
  await page.getByLabel("Address label").selectOption(label);
  await page.getByLabel("Recipient name").fill("Samira Khan");
  await page.getByLabel("Mobile number").fill("01712345678");
  await page.getByLabel("Division").fill("Dhaka");
  await page.getByLabel("District / city").fill("Dhaka");
  await page.getByLabel("Area / upazila").fill(area);
  await page.getByLabel("House, road, and street address").fill("House 12, Road 5");
}

test("cart opens checkout with the selected variant, quantity, effective prices, and subtotal", async ({ page }) => {
  await addPanjabi(page);
  await page.goto("/cart");
  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  const items = page.getByRole("list", { name: "Checkout items" });
  await expect(items.getByText("Cotton Panjabi", { exact: true })).toBeVisible();
  await expect(items.getByText("Size: M", { exact: true })).toBeVisible();
  await expect(items.getByText("Quantity: 1", { exact: true })).toBeVisible();
  await expect(items.getByText("৳1,200 each", { exact: true })).toBeVisible();
  await expect(items.getByText("৳1,200", { exact: true })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Order summary" }).getByText("৳1,200", { exact: true })).toBeVisible();
});

test("empty and invalid carts show safe checkout guidance", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
  await addPanjabi(page);
  await page.goto("/cart");
  await page.evaluate(() => {
    const raw = localStorage.getItem("kenakata:demo-state");
    if (!raw) throw new Error("Demo state was not persisted");
    const snapshot = JSON.parse(raw) as { data: { carts: Array<{ customerId: string; items: Array<{ variantId: string | null }> }> } };
    const cart = snapshot.data.carts.find(({ customerId }) => customerId === "customer-demo");
    if (!cart?.items[0]) throw new Error("Customer cart is empty");
    cart.items[0].variantId = "missing-variant";
    localStorage.setItem("kenakata:demo-state", JSON.stringify(snapshot));
  });
  await page.reload();
  await page.getByRole("link", { name: "Review checkout issues" }).click();
  await expect(page.getByRole("heading", { name: "Update your cart to continue" })).toBeVisible();
  await expect(page.getByRole("main").getByText("This option is no longer available.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Review your cart" })).toBeVisible();
});

test("non-customer accounts cannot see checkout cart contents", async ({ page }) => {
  await addPanjabi(page);
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Admin Admin demo account" }).click();
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Checkout is for customers" })).toBeVisible();
  await expect(page.getByText("Cotton Panjabi", { exact: true })).toHaveCount(0);
});

test("checkout fits desktop and mobile viewports without horizontal overflow", async ({ page }) => {
  await addPanjabi(page);
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
  await expect(page.getByRole("list", { name: "Checkout items" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Order summary" })).toBeVisible();
});

test("unknown order confirmation IDs never expose order details", async ({ page }) => {
  await page.goto("/order-confirmation/not-a-saved-order");
  await expect(page.getByRole("heading", { name: "Order not available" })).toBeVisible();
  await expect(page.getByText("Cotton Panjabi", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Samira Khan", { exact: true })).toHaveCount(0);
});

test("customer can add and edit an address from checkout and return to the same checkout", async ({ page }) => {
  await addPanjabi(page);
  await page.goto("/checkout");
  await page.getByRole("link", { name: "Add shipping address" }).click();
  await expect(page).toHaveURL(/\/account\/addresses\?returnTo=%2Fcheckout$/);
  await page.getByRole("button", { name: "Add an address" }).click();
  await fillAddress(page);
  await page.getByRole("button", { name: "Add address", exact: true }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole("radio", { name: "Deliver to Home, default address" })).toBeChecked();
  await expect(page.getByText("House 12, Road 5, Dhanmondi, Dhaka, Dhaka")).toBeVisible();

  await page.getByRole("link", { name: "Manage addresses" }).click();
  await page.getByRole("button", { name: "Edit Home address" }).click();
  await page.getByLabel("Area / upazila").fill("Gulshan");
  await page.getByRole("button", { name: "Save address" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByText("House 12, Road 5, Gulshan, Dhaka, Dhaka")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Deliver to Home, default address" })).toBeChecked();
  await expect(page.getByText("Demo delivery")).toBeVisible();
  await expect(page.getByText(/No courier, delivery date, or shipping fee is assigned/)).toBeVisible();
});

test("default address selection persists, stays customer-scoped, and falls back after deletion", async ({ page }) => {
  await addPanjabi(page);
  await page.goto("/checkout");
  await page.evaluate(() => {
    const raw = localStorage.getItem("kenakata:demo-state");
    if (!raw) throw new Error("Demo state was not persisted");
    const snapshot = JSON.parse(raw) as { data: { customers: Array<{ id: string; addresses: Array<{ id: string; label: string; recipientName: string; phone: string; division: string; district: string; area: string; streetAddress: string; postalCode: string | null; isDefault: boolean }> }> } };
    const customer = snapshot.data.customers.find(({ id }) => id === "customer-demo");
    if (!customer) throw new Error("Demo customer is missing");
    customer.addresses = [
      { id: "checkout-home", label: "Home", recipientName: "Samira Khan", phone: "01712345678", division: "Dhaka", district: "Dhaka", area: "Dhanmondi", streetAddress: "House 1, Road 2", postalCode: "1205", isDefault: true },
      { id: "checkout-work", label: "Work", recipientName: "Samira Khan", phone: "01712345678", division: "Dhaka", district: "Dhaka", area: "Motijheel", streetAddress: "House 5, Road 2", postalCode: null, isDefault: false },
    ];
    localStorage.setItem("kenakata:demo-state", JSON.stringify(snapshot));
  });
  await page.reload();
  const home = page.getByRole("radio", { name: "Deliver to Home, default address" });
  const work = page.getByRole("radio", { name: "Deliver to Work" });
  await expect(home).toBeChecked();
  await work.check();
  await page.goto("/cart");
  await page.getByRole("group", { name: "Quantity for Cotton Panjabi" }).getByRole("button", { name: "Increase quantity" }).click();
  await page.goto("/checkout");
  await expect(page.getByRole("radio", { name: "Deliver to Work" })).toBeChecked();
  await page.reload();
  await expect(page.getByRole("radio", { name: "Deliver to Work" })).toBeChecked();

  await page.evaluate(() => {
    const raw = localStorage.getItem("kenakata:demo-state");
    if (!raw) throw new Error("Demo state was not persisted");
    const snapshot = JSON.parse(raw) as { data: { customers: Array<{ id: string; addresses: Array<{ id: string }> }> } };
    const customer = snapshot.data.customers.find(({ id }) => id === "customer-demo");
    if (!customer) throw new Error("Demo customer is missing");
    customer.addresses = customer.addresses.filter(({ id }) => id !== "checkout-work");
    localStorage.setItem("kenakata:demo-state", JSON.stringify(snapshot));
  });
  await page.reload();
  await expect(page.getByRole("radio", { name: "Deliver to Home, default address" })).toBeChecked();

  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Admin Admin demo account" }).click();
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Checkout is for customers" })).toBeVisible();
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Customer Customer demo account" }).click();
  await page.goto("/checkout");
  await expect(page.getByRole("radio", { name: "Deliver to Home, default address" })).toBeChecked();
});

test("COD placement groups vendors, clears the purchased cart atomically, and resists a double click", async ({ page }) => {
  await addPanjabi(page);
  await page.goto("/products/wireless-earbuds-pro");
  await expect(page.getByRole("link", { name: /My account: Demo Customer/ })).toBeVisible();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/checkout");
  await page.getByRole("link", { name: "Add shipping address" }).click();
  await page.getByRole("button", { name: "Add an address" }).click();
  await fillAddress(page);
  await page.getByRole("button", { name: "Add address", exact: true }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole("radio", { name: "Cash on delivery" })).toBeChecked();
  await expect(page.getByText("No real payment or shipment is processed.")).toBeVisible();

  await page.getByRole("button", { name: "Place demo order" }).dblclick();
  await expect(page).toHaveURL(/\/order-confirmation\//);
  await expect(page.getByRole("heading", { name: "Demo order placed" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Demo order placed" }).getByText("Cash on delivery", { exact: true })).toBeVisible();
  await expect(page.getByText("This order is saved in this browser only. No real payment, courier booking, or shipment is processed.")).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null") as {
    data: {
      orders: Array<{ id: string; customerId: string; paymentMethod: string; grandTotal: number }>;
      fulfillmentGroups: Array<{ id: string; orderId: string; vendorId: string }>;
      orderItems: Array<{ fulfillmentGroupId: string; vendorId: string }>;
      carts: Array<{ customerId: string; items: unknown[] }>;
    };
  });
  expect(saved.data.orders).toHaveLength(1);
  expect(saved.data.orders[0]).toMatchObject({ customerId: "customer-demo", paymentMethod: "cash_on_delivery", grandTotal: 3650 });
  const orderId = saved.data.orders[0]?.id;
  const groups = saved.data.fulfillmentGroups.filter(({ orderId: groupOrderId }) => groupOrderId === orderId);
  const items = saved.data.orderItems.filter(({ fulfillmentGroupId }) => groups.some(({ id }) => id === fulfillmentGroupId));
  expect(groups).toHaveLength(2);
  expect(items).toHaveLength(2);
  expect(items.every((item) => groups.some((group) => group.id === item.fulfillmentGroupId && group.vendorId === item.vendorId))).toBe(true);
  expect(saved.data.carts.find(({ customerId }) => customerId === "customer-demo")?.items).toEqual([]);

  expect(orderId).toBeTruthy();
  await expect(page.getByText("Placed on", { exact: true })).toBeVisible();
  await expect(page.getByText(orderId ?? "", { exact: true })).toBeVisible();
  await expect(page.getByText("Items subtotal").locator("..")).toContainText("৳3,650");
  await expect(page.getByText("Order total").locator("..")).toContainText("৳3,650");
  await expect(page.getByRole("region", { name: /Items from/ })).toHaveCount(2);
  await expect(page.getByText("Cotton Panjabi", { exact: true })).toBeVisible();
  await expect(page.getByText("Wireless Earbuds Pro", { exact: true })).toBeVisible();
  await expect(page.getByText("Size: M", { exact: true })).toBeVisible();
  await expect(page.getByText("Quantity: 1 · ৳1,200 each", { exact: true })).toBeVisible();
  await expect(page.getByText("Quantity: 1 · ৳2,450 each", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Delivery address" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Delivery address" }).getByText("Samira Khan", { exact: true })).toBeVisible();
  await expect(page.getByText("Placed on", { exact: true })).toBeVisible();

  const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
  await page.reload();
  await expect(page.getByText(orderId ?? "", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Continue shopping" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/products$/);
  await page.goBack();
  await expect(page.getByText(orderId ?? "", { exact: true })).toBeVisible();

  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Admin Admin demo account" }).click();
  await page.goto(`/order-confirmation/${encodeURIComponent(orderId ?? "")}`);
  await expect(page.getByRole("heading", { name: "Order not available" })).toBeVisible();
  await expect(page.getByText("Cotton Panjabi", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Samira Khan", { exact: true })).toHaveCount(0);

  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Customer Customer demo account" }).click();
  await page.evaluate((savedOrderId) => {
    const raw = localStorage.getItem("kenakata:demo-state");
    if (!raw) throw new Error("Demo state was not persisted");
    const snapshot = JSON.parse(raw) as { data: { orders: Array<{ id: string }>; fulfillmentGroups: Array<{ id: string; orderId: string }>; orderItems: Array<{ fulfillmentGroupId: string }> } };
    const removedGroups = new Set(snapshot.data.fulfillmentGroups.filter(({ orderId: id }) => id === savedOrderId).map(({ id }) => id));
    snapshot.data.orders = snapshot.data.orders.filter(({ id }) => id !== savedOrderId);
    snapshot.data.fulfillmentGroups = snapshot.data.fulfillmentGroups.filter(({ orderId: id }) => id !== savedOrderId);
    snapshot.data.orderItems = snapshot.data.orderItems.filter(({ fulfillmentGroupId }) => !removedGroups.has(fulfillmentGroupId));
    localStorage.setItem("kenakata:demo-state", JSON.stringify(snapshot));
  }, orderId ?? "");
  await page.reload();
  await page.goto(`/order-confirmation/${encodeURIComponent(orderId ?? "deleted-order")}`);
  await expect(page.getByRole("heading", { name: "Order not available" })).toBeVisible();
  await expect(page.getByText("Cotton Panjabi", { exact: true })).toHaveCount(0);
});
