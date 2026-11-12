import { expect, test } from "@playwright/test";
import { getCustomerOrderHistory, getOrderStatusLabel, getPaymentMethodLabel } from "@/services/customer-order-history";
import { getCustomerOrderDetails } from "@/services/customer-order-details";
import { createDemoSeedSnapshot } from "@/services/demo-state-seed";
import { createDemoStateStore, selectActiveCustomerId } from "@/services/demo-state-store";
import type { DemoOrder } from "@/types/demo-state";

function addOrder(snapshot: ReturnType<typeof createDemoSeedSnapshot>, overrides: Partial<DemoOrder> = {}) {
  const id = overrides.id ?? "order:one";
  const order: DemoOrder = {
    id,
    orderNumber: `KN-${id}`,
    customerId: "customer-demo",
    fulfillmentGroupIds: [`group:${id}`],
    shippingAddress: {
      id: "address:snapshot", label: "Home", recipientName: "Demo Customer", phone: "01712345678",
      division: "Dhaka", district: "Dhaka", area: "Dhanmondi", streetAddress: "Road 1", postalCode: null, isDefault: true,
    },
    paymentMethod: "cash_on_delivery",
    paymentStatus: "pending",
    status: "placed",
    subtotal: 1200,
    shippingTotal: 0,
    discountTotal: 0,
    grandTotal: 1200,
    placedAt: "2026-11-10T12:00:00.000Z",
    updatedAt: "2026-11-10T12:00:00.000Z",
    ...overrides,
  };
  snapshot.data.orders.push(order);
  snapshot.data.fulfillmentGroups.push({
    id: `group:${id}`, orderId: id, vendorId: "vendor-tech-haven", itemIds: [`item:${id}`], subtotal: 1200,
    status: "pending", trackingNumber: null, updatedAt: order.placedAt,
  });
  snapshot.data.orderItems.push({
    id: `item:${id}`, fulfillmentGroupId: `group:${id}`, productId: "wireless-earbuds-pro", vendorId: "vendor-tech-haven",
    variantId: null, selectedVariant: null, productName: "Saved item", sku: "SKU-1", unitPrice: 1200, quantity: 1, lineTotal: 1200,
  });
}

test("history includes only customer-owned orders, reads snapshot counts, and sorts deterministically", () => {
  const snapshot = createDemoSeedSnapshot();
  addOrder(snapshot, { id: "order:older", placedAt: "2026-11-09T12:00:00.000Z", grandTotal: 950 });
  addOrder(snapshot, { id: "order:newer-b", placedAt: "2026-11-10T12:00:00.000Z", grandTotal: 1200 });
  addOrder(snapshot, { id: "order:newer-a", placedAt: "2026-11-10T12:00:00.000Z", grandTotal: 450 });
  addOrder(snapshot, { id: "order:other-customer", customerId: "customer-other" });

  const history = getCustomerOrderHistory(snapshot, "customer-demo");
  expect(history.map(({ order }) => order.id)).toEqual(["order:newer-a", "order:newer-b", "order:older"]);
  expect(history[0]).toMatchObject({ itemCount: 1, vendorCount: 1, order: { grandTotal: 450 } });
  expect(history[1]?.order.grandTotal).toBe(1200);
});

test("malformed order records and disconnected snapshot references are handled safely", () => {
  const snapshot = createDemoSeedSnapshot();
  addOrder(snapshot, { id: "order:valid" });
  snapshot.data.orders.push({ id: "", customerId: "customer-demo", fulfillmentGroupIds: [] } as unknown as DemoOrder);
  snapshot.data.orders.push({ id: "order:malformed", customerId: "customer-demo", fulfillmentGroupIds: null } as unknown as DemoOrder);
  snapshot.data.fulfillmentGroups.push({
    id: "group:unlinked", orderId: "some-other-order", vendorId: "vendor-urban-fit", itemIds: ["item:unlinked"],
    subtotal: 1, status: "pending", trackingNumber: null, updatedAt: "invalid",
  });

  expect(getCustomerOrderHistory(snapshot, "customer-demo")).toMatchObject([
    { order: { id: "order:valid" }, itemCount: 1, vendorCount: 1 },
  ]);
  expect(getOrderStatusLabel("new-status")).toBe("Status unavailable");
  expect(getPaymentMethodLabel("wallet")).toBe("Payment method unavailable");
});

test("order details use canonical vendor groups and report subtotal mismatches without changing saved values", () => {
  const snapshot = createDemoSeedSnapshot();
  addOrder(snapshot, { id: "order:breakdown", subtotal: 3700, grandTotal: 3700 });
  const order = snapshot.data.orders.find(({ id }) => id === "order:breakdown");
  if (!order) throw new Error("Fixture order was not added");
  const secondGroupId = "group:second-vendor";
  order.fulfillmentGroupIds.push(secondGroupId);
  snapshot.data.fulfillmentGroups.push({
    id: secondGroupId, orderId: order.id, vendorId: "vendor-urban-fit", itemIds: ["item:second-vendor"], subtotal: 2400,
    status: "pending", trackingNumber: null, updatedAt: order.placedAt,
  });
  snapshot.data.orderItems.push({
    id: "item:second-vendor", fulfillmentGroupId: secondGroupId, productId: "cotton-panjabi", vendorId: "vendor-urban-fit",
    variantId: "size-m", selectedVariant: { id: "size-m", optionValues: { Size: "M" } }, productName: "Saved Panjabi", sku: "SKU-2", unitPrice: 1200, quantity: 2, lineTotal: 2400,
  });

  const details = getCustomerOrderDetails(snapshot, "customer-demo", order.id);
  expect(details?.groups.map(({ vendorId, vendorName }) => ({ vendorId, vendorName }))).toEqual([
    { vendorId: "vendor-tech-haven", vendorName: "TechHaven" },
    { vendorId: "vendor-urban-fit", vendorName: "UrbanFit" },
  ]);
  expect(details?.subtotalCheck).toEqual({ status: "mismatch", groupSubtotalTotal: 3600, parentItemsSubtotal: 3700 });
  expect(details?.order.subtotal).toBe(3700);
  expect(getCustomerOrderDetails(snapshot, "customer-other", order.id)).toBeNull();
  expect(getCustomerOrderDetails(snapshot, "customer-demo", "order:unknown")).toBeNull();

  const deletedGroupSnapshot = createDemoSeedSnapshot();
  addOrder(deletedGroupSnapshot, { id: "order:deleted-group" });
  deletedGroupSnapshot.data.fulfillmentGroups = deletedGroupSnapshot.data.fulfillmentGroups.filter(({ id }) => id !== "group:order:deleted-group");
  const deletedGroupDetails = getCustomerOrderDetails(deletedGroupSnapshot, "customer-demo", "order:deleted-group");
  expect(deletedGroupDetails?.groups).toEqual([]);
  expect(deletedGroupDetails?.subtotalCheck.status).toBe("unavailable");
});

test("active customer selector requires a role and a matching customer-account relationship", () => {
  const store = createDemoStateStore(null);
  const state = store.getState();
  expect(selectActiveCustomerId({ ...state, hydrationStatus: "pending" })).toBeNull();
  expect(selectActiveCustomerId({ ...state, hydrationStatus: "ready", activeAccountId: "account-admin-demo" })).toBeNull();
  expect(selectActiveCustomerId({ ...state, hydrationStatus: "ready", activeAccountId: "account-customer-demo" })).toBe("customer-demo");

  const invalidRelationship = structuredClone(state.snapshot);
  const customer = invalidRelationship.data.customers.find(({ id }) => id === "customer-demo");
  if (customer) customer.accountId = "account-admin-demo";
  expect(selectActiveCustomerId({ ...state, snapshot: invalidRelationship, hydrationStatus: "ready" })).toBeNull();
});
