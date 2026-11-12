import assert from "node:assert/strict";
import { test } from "@playwright/test";
import { cancelCustomerDemoOrder, hideCustomerOrderFromHistory } from "@/services/customer-order-actions";
import { createLocalStorageDemoStateAdapter } from "@/services/demo-state-persistence";
import { createDemoStateStore } from "@/services/demo-state-store";
import { getCustomerOrderDetails } from "@/services/customer-order-details";
import { getCustomerOrderHistory } from "@/services/customer-order-history";
import { getCustomerOrderConfirmation } from "@/services/checkout";
import { getVendorOrderItems } from "@/types/order";
import type { DemoOrder } from "@/types/demo-state";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

async function createStore() {
  const storage = memoryStorage();
  const store = createDemoStateStore(createLocalStorageDemoStateAdapter(storage));
  await store.getState().hydrate();
  await store.getState().applySnapshotUpdate((snapshot) => {
    snapshot.data.accounts.push({ id: "account-second", email: "second@example.test", displayName: "Second", role: "customer", customerId: "customer-second", vendorId: null, createdAt: snapshot.savedAt });
    snapshot.data.customers.push({ id: "customer-second", accountId: "account-second", fullName: "Second", phone: "0", addresses: [], preferences: { promotionalUpdates: false, productGridDensity: "standard" }, hiddenOrderIds: [], recentlyViewedProductIds: [], createdAt: snapshot.savedAt, updatedAt: snapshot.savedAt });
    const order: DemoOrder = {
      id: "order:owned", orderNumber: "KN-OWNED", customerId: "customer-demo", fulfillmentGroupIds: ["group:owned"],
      shippingAddress: { id: "address:snapshot", label: "Home", recipientName: "Demo", phone: "0", division: "Dhaka", district: "Dhaka", area: "Area", streetAddress: "Road", postalCode: null, isDefault: true },
      paymentMethod: "cash_on_delivery", paymentStatus: "pending", status: "placed", subtotal: 1200, shippingTotal: 0, discountTotal: 0, grandTotal: 1200,
      placedAt: "2026-11-10T12:00:00.000Z", updatedAt: "2026-11-10T12:00:00.000Z",
    };
    snapshot.data.orders.push(order);
    snapshot.data.fulfillmentGroups.push({ id: "group:owned", orderId: order.id, vendorId: "vendor-tech-haven", itemIds: ["item:owned"], subtotal: 1200, status: "pending", trackingNumber: null, updatedAt: order.placedAt });
    snapshot.data.orderItems.push({ id: "item:owned", fulfillmentGroupId: "group:owned", productId: "prod-wireless-earbuds-pro", vendorId: "vendor-tech-haven", variantId: null, selectedVariant: null, productName: "Snapshot earbuds", sku: "SKU-1", unitPrice: 1200, quantity: 1, lineTotal: 1200 });
    return snapshot;
  });
  return { store, storage };
}

test("cancellation changes only parent status metadata and writes one customer notification", async () => {
  const { store, storage } = await createStore();
  const before = structuredClone(store.getState().snapshot.data);
  const results = await Promise.all([
    cancelCustomerDemoOrder("order:owned", store, { now: Date.parse("2026-11-11T08:00:00.000Z") }),
    cancelCustomerDemoOrder("order:owned", store, { now: Date.parse("2026-11-11T08:01:00.000Z") }),
  ]);
  assert.equal(results.filter(({ ok }) => ok).length, 1);
  assert.equal(results.filter((result) => !result.ok && result.reason === "invalid_status").length, 1);
  const after = store.getState().snapshot.data;
  const originalOrder = before.orders.find(({ id }) => id === "order:owned");
  const cancelledOrder = after.orders.find(({ id }) => id === "order:owned");
  assert.ok(originalOrder && cancelledOrder);
  assert.deepEqual(after.orders[0], { ...before.orders[0], status: "cancelled", updatedAt: "2026-11-11T08:00:00.000Z" });
  assert.deepEqual(after.fulfillmentGroups, before.fulfillmentGroups);
  assert.deepEqual(after.orderItems, before.orderItems);
  assert.deepEqual(after.customers.find(({ id }) => id === "customer-demo"), before.customers.find(({ id }) => id === "customer-demo"));
  assert.deepEqual(after.customers.find(({ id }) => id === "customer-second"), before.customers.find(({ id }) => id === "customer-second"));
  assert.equal(after.notifications.filter(({ id }) => id === "notification:order-cancelled:order:owned").length, 1);
  assert.equal(after.notifications[0]?.recipientAccountId, "account-customer-demo");
  assert.deepEqual(getVendorOrderItems(cancelledOrder, after.fulfillmentGroups, after.orderItems, "vendor-tech-haven"), getVendorOrderItems(originalOrder, before.fulfillmentGroups, before.orderItems, "vendor-tech-haven"));
  const restored = createDemoStateStore(createLocalStorageDemoStateAdapter(storage));
  await restored.getState().hydrate();
  assert.equal(restored.getState().snapshot.data.orders[0]?.status, "cancelled");
  assert.equal(restored.getState().snapshot.data.notifications.filter(({ id }) => id === "notification:order-cancelled:order:owned").length, 1);
});

test("cancellation rejects another role, another owner, and orders outside the pending transition", async () => {
  const { store } = await createStore();
  store.getState().setActiveAccount("account-admin-demo");
  assert.deepEqual(await cancelCustomerDemoOrder("order:owned", store), { ok: false, reason: "customer_required" });
  store.getState().setActiveAccount("account-second");
  assert.deepEqual(await cancelCustomerDemoOrder("order:owned", store), { ok: false, reason: "order_unavailable" });
  store.getState().setActiveAccount("account-customer-demo");
  await store.getState().applySnapshotUpdate((snapshot) => {
    const order = snapshot.data.orders.find(({ id }) => id === "order:owned");
    if (order) order.status = "processing";
    return snapshot;
  });
  const before = structuredClone(store.getState().snapshot.data);
  assert.deepEqual(await cancelCustomerDemoOrder("order:owned", store), { ok: false, reason: "invalid_status" });
  assert.deepEqual(store.getState().snapshot.data, before);
});

test("history visibility persists per customer and hidden orders resolve unavailable without deletion", async () => {
  const storage = memoryStorage();
  const store = createDemoStateStore(createLocalStorageDemoStateAdapter(storage));
  await store.getState().hydrate();
  await store.getState().applySnapshotUpdate((snapshot) => {
    snapshot.data.orders.push({
      id: "order:hidden", orderNumber: "KN-HIDDEN", customerId: "customer-demo", fulfillmentGroupIds: ["group:hidden"], shippingAddress: { id: "a", label: "Home", recipientName: "Demo", phone: "0", division: "Dhaka", district: "Dhaka", area: "Area", streetAddress: "Road", postalCode: null, isDefault: true },
      paymentMethod: "cash_on_delivery", paymentStatus: "pending", status: "placed", subtotal: 1200, shippingTotal: 0, discountTotal: 0, grandTotal: 1200, placedAt: snapshot.savedAt, updatedAt: snapshot.savedAt,
    });
    snapshot.data.fulfillmentGroups.push({ id: "group:hidden", orderId: "order:hidden", vendorId: "vendor-tech-haven", itemIds: ["item:hidden"], subtotal: 1200, status: "pending", trackingNumber: null, updatedAt: snapshot.savedAt });
    snapshot.data.orderItems.push({ id: "item:hidden", fulfillmentGroupId: "group:hidden", productId: "prod-wireless-earbuds-pro", vendorId: "vendor-tech-haven", variantId: null, selectedVariant: null, productName: "Preserved item", sku: "SKU-HIDDEN", unitPrice: 1200, quantity: 1, lineTotal: 1200 });
    snapshot.data.accounts.push({ id: "account-second", email: "second@example.test", displayName: "Second", role: "customer", customerId: "customer-second", vendorId: null, createdAt: snapshot.savedAt });
    snapshot.data.customers.push({ id: "customer-second", accountId: "account-second", fullName: "Second", phone: "0", addresses: [], preferences: { promotionalUpdates: false, productGridDensity: "standard" }, hiddenOrderIds: [], recentlyViewedProductIds: [], createdAt: snapshot.savedAt, updatedAt: snapshot.savedAt });
    return snapshot;
  });
  const canonicalBefore = structuredClone(store.getState().snapshot.data.orders[0]);
  assert.deepEqual(await hideCustomerOrderFromHistory("order:hidden", store), { ok: true, persisted: true });
  const snapshot = store.getState().snapshot;
  assert.equal(snapshot.data.orders.some(({ id }) => id === "order:hidden"), true);
  assert.deepEqual(snapshot.data.orders[0], canonicalBefore);
  assert.deepEqual(getCustomerOrderHistory(snapshot, "customer-demo"), []);
  assert.equal(getCustomerOrderDetails(snapshot, "customer-demo", "order:hidden"), null);
  assert.equal(getCustomerOrderConfirmation(snapshot, "customer-demo", "order:hidden"), null);
  assert.deepEqual(await hideCustomerOrderFromHistory("order:hidden", store), { ok: false, reason: "already_hidden" });
  const hiddenOrder = snapshot.data.orders.find(({ id }) => id === "order:hidden");
  assert.ok(hiddenOrder);
  assert.equal(getVendorOrderItems(hiddenOrder, snapshot.data.fulfillmentGroups, snapshot.data.orderItems, "vendor-tech-haven").length, 1);

  store.getState().setActiveAccount("account-second");
  assert.deepEqual(await hideCustomerOrderFromHistory("order:hidden", store), { ok: false, reason: "order_unavailable" });
  const restored = createDemoStateStore(createLocalStorageDemoStateAdapter(storage));
  await restored.getState().hydrate();
  assert.equal(restored.getState().snapshot.data.customers.find(({ id }) => id === "customer-demo")?.hiddenOrderIds.includes("order:hidden"), true);
  assert.equal(restored.getState().snapshot.data.orders[0]?.id, "order:hidden");
  assert.equal(getCustomerOrderHistory(restored.getState().snapshot, "customer-demo").length, 0);
  const restoredHiddenOrder = restored.getState().snapshot.data.orders.find(({ id }) => id === "order:hidden");
  assert.ok(restoredHiddenOrder);
  assert.equal(getVendorOrderItems(restoredHiddenOrder, restored.getState().snapshot.data.fulfillmentGroups, restored.getState().snapshot.data.orderItems, "vendor-tech-haven").length, 1);
});

test("failed cancellation persistence and invalid or stale actions leave canonical data unchanged", async () => {
  const { store, storage } = await createStore();
  const before = structuredClone(store.getState().snapshot.data);
  assert.deepEqual(await cancelCustomerDemoOrder("", store), { ok: false, reason: "order_unavailable" });
  assert.deepEqual(await cancelCustomerDemoOrder("missing-order", store), { ok: false, reason: "order_unavailable" });
  assert.deepEqual(await hideCustomerOrderFromHistory("missing-order", store), { ok: false, reason: "order_unavailable" });
  storage.setItem = () => { throw new Error("storage unavailable"); };
  assert.deepEqual(await cancelCustomerDemoOrder("order:owned", store), { ok: false, reason: "persistence_unavailable" });
  assert.deepEqual(store.getState().snapshot.data, before);
});
