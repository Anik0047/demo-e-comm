import { expect, test } from "@playwright/test";

async function placeSavedOrder(page: import("@playwright/test").Page) {
  await page.goto("/products/cotton-panjabi");
  await page.getByLabel("Size").selectOption("M");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/products/wireless-earbuds-pro");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/checkout");
  await page.getByRole("link", { name: "Add shipping address" }).click();
  await page.getByRole("button", { name: "Add an address" }).click();
  await page.getByLabel("Address label").selectOption("Home");
  await page.getByLabel("Recipient name").fill("Samira Khan");
  await page.getByLabel("Mobile number").fill("01712345678");
  await page.getByLabel("Division").fill("Dhaka");
  await page.getByLabel("District / city").fill("Dhaka");
  await page.getByLabel("Area / upazila").fill("Dhanmondi");
  await page.getByLabel("House, road, and street address").fill("House 12, Road 5");
  await page.getByRole("button", { name: "Add address", exact: true }).click();
  await page.getByRole("button", { name: "Place demo order" }).click();
  await expect(page).toHaveURL(/\/order-confirmation\//);
  return page.getByText(/^order:/).textContent();
}

test("customer order details show the saved multi-vendor snapshots across refresh", async ({ page }) => {
  const orderId = await placeSavedOrder(page);
  expect(orderId).toBeTruthy();

  await page.goto("/account/orders");
  await expect(page.getByRole("heading", { name: "My Orders" })).toBeVisible();
  await expect(page.getByText(orderId ?? "", { exact: true })).toBeVisible();
  await expect(page.getByText("Placed", { exact: true })).toBeVisible();
  await expect(page.getByText("2", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Cash on delivery", { exact: true })).toBeVisible();
  await expect(page.getByText("৳3,650", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "View details" })).toBeVisible();
  await page.getByRole("link", { name: "View details" }).click();
  await expect(page).toHaveURL(`/account/orders/${encodeURIComponent(orderId ?? "")}`);
  await expect(page.getByRole("heading", { name: "Vendor breakdown" })).toBeVisible();
  await expect(page.getByRole("region", { name: "TechHaven order items" })).toBeVisible();
  await expect(page.getByRole("region", { name: "UrbanFit order items" })).toBeVisible();
  await expect(page.getByText("Wireless Earbuds Pro", { exact: true })).toBeVisible();
  await expect(page.getByText("Cotton Panjabi", { exact: true })).toBeVisible();
  await expect(page.getByText("Size: M", { exact: true })).toBeVisible();
  await expect(page.getByText("Captured unit price: ৳1,200", { exact: true })).toBeVisible();
  await expect(page.getByText("Line total ৳2,450", { exact: true })).toBeVisible();
  await expect(page.getByText("Vendor group subtotals match the stored items subtotal.")).toBeVisible();
  await expect(page.getByText("Samira Khan", { exact: true })).toBeVisible();
  await expect(page.getByText(/House 12, Road 5, Dhanmondi, Dhaka, Dhaka/)).toBeVisible();
  const detailDimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(detailDimensions.scrollWidth).toBeLessThanOrEqual(detailDimensions.width);

  await page.reload();
  await expect(page.getByText(`Order ID: ${orderId ?? ""}`, { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Back to My Orders" }).click();
  await expect(page).toHaveURL("/account/orders");
});

test("customer account navigation includes an empty state and isolates saved orders by role", async ({ page }) => {
  await page.goto("/account");
  await page.getByRole("link", { name: "My Orders" }).click();
  await expect(page).toHaveURL("/account/orders");
  await expect(page.getByRole("heading", { name: "Your order history is empty" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse products" })).toHaveAttribute("href", "/products");

  const orderId = await placeSavedOrder(page);
  expect(orderId).toBeTruthy();
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Admin Admin demo account" }).click();
  await page.goto("/account/orders");
  await expect(page.getByRole("heading", { name: "Customer account required" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your order history is empty" })).toHaveCount(0);
  await expect(page.getByText(orderId ?? "", { exact: true })).toHaveCount(0);

  await page.goto("/login");
  await page.getByRole("button", { name: "TechHaven seller Vendor demo account" }).click();
  await page.goto(`/account/orders/${encodeURIComponent(orderId ?? "")}`);
  await expect(page.getByRole("heading", { name: "Customer account required" })).toBeVisible();

  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Customer Customer demo account" }).click();
  await page.goto("/account/orders");
  await expect(page.getByText(orderId ?? "", { exact: true })).toBeVisible();
  await page.goto("/account/orders/order%3Aunknown-order");
  await expect(page.getByRole("heading", { name: "Order unavailable" })).toBeVisible();
  await expect(page.getByText("Samira Khan", { exact: true })).toHaveCount(0);
});

test("order history fits the viewport without horizontal page scrolling", async ({ page }) => {
  await page.goto("/account/orders");
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
  await expect(page.getByRole("heading", { name: "My Orders" })).toBeVisible();
});

test("customer can cancel an eligible demo order and hide its preserved record", async ({ page }) => {
  const orderId = await placeSavedOrder(page);
  expect(orderId).toBeTruthy();
  await page.goto("/account/orders");
  const orderRow = page.locator("li").filter({ hasText: orderId ?? "" });
  await orderRow.getByRole("button", { name: "Cancel order" }).click();
  await expect(orderRow.getByRole("alertdialog")).toBeVisible();
  await orderRow.getByRole("button", { name: "Confirm cancellation" }).click();
  await expect(orderRow.getByText("Cancelled", { exact: true })).toBeVisible();
  await expect(orderRow.getByText(/no payment, refund, email, SMS, or delivery service was contacted/)).toBeVisible();

  const afterCancellation = await page.evaluate(() => JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null") as {
    data: { orders: Array<{ id: string; status: string }>; fulfillmentGroups: Array<{ orderId: string; status: string }>; orderItems: Array<{ id: string }>; notifications: Array<{ recipientAccountId: string; title: string }> };
  });
  const savedOrder = afterCancellation.data.orders.find(({ id }) => id === orderId);
  expect(savedOrder?.status).toBe("cancelled");
  expect(afterCancellation.data.fulfillmentGroups.filter(({ orderId: savedId }) => savedId === orderId)).toHaveLength(2);
  expect(afterCancellation.data.notifications.filter(({ title }) => title === "Demo order cancelled")).toHaveLength(1);
  expect(afterCancellation.data.notifications[0]?.recipientAccountId).toBe("account-customer-demo");

  await orderRow.getByRole("button", { name: "Hide from history" }).click();
  await orderRow.getByRole("button", { name: "Hide order" }).click();
  await expect(page.getByRole("heading", { name: "Your order history is empty" })).toBeVisible();
  const afterHiding = await page.evaluate(() => JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null") as {
    data: { orders: Array<{ id: string }>; customers: Array<{ id: string; hiddenOrderIds: string[] }> };
  });
  expect(afterHiding.data.orders.some(({ id }) => id === orderId)).toBe(true);
  expect(afterHiding.data.customers.find(({ id }) => id === "customer-demo")?.hiddenOrderIds).toContain(orderId);
  await page.goto(`/account/orders/${encodeURIComponent(orderId ?? "")}`);
  await expect(page.getByRole("heading", { name: "Order unavailable" })).toBeVisible();
});

test("confirmation is customer-only, hidden orders stay unavailable, and demo notices persist once", async ({ page }) => {
  const orderId = await placeSavedOrder(page);
  expect(orderId).toBeTruthy();
  await expect(page.getByRole("heading", { name: "Demo order placed" })).toBeVisible();
  await page.reload();
  const notificationCount = await page.evaluate((id) => {
    const snapshot = JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null") as { data: { notifications: Array<{ id: string }> } } | null;
    return snapshot?.data.notifications.filter((notification) => notification.id === `notification:order-placed:${id}`).length ?? 0;
  }, orderId);
  expect(notificationCount).toBe(1);

  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Admin Admin demo account" }).click();
  await page.goto(`/order-confirmation/${encodeURIComponent(orderId ?? "")}`);
  await expect(page.getByRole("heading", { name: "Order not available" })).toBeVisible();
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Customer Customer demo account" }).click();
  await page.goto(`/order-confirmation/${encodeURIComponent(orderId ?? "")}`);
  await expect(page.getByRole("heading", { name: "Demo order placed" })).toBeVisible();

  await page.goto("/account/orders");
  await page.getByRole("link", { name: "View details" }).click();
  await expect(page.getByRole("heading", { name: "Order summary" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL("/account/orders");
  await page.goForward();
  await expect(page.getByRole("heading", { name: "Order summary" })).toBeVisible();
  await page.getByRole("button", { name: "Hide from history" }).click();
  await page.getByRole("button", { name: "Hide order" }).click();
  await expect(page).toHaveURL("/account/orders");
  await page.goto(`/order-confirmation/${encodeURIComponent(orderId ?? "")}`);
  await expect(page.getByRole("heading", { name: "Order not available" })).toBeVisible();
});
