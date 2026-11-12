import { expect, test } from "@playwright/test";
import { resetActiveCustomerDemoData } from "@/services/customer-demo-reset";
import { createDemoSeedSnapshot } from "@/services/demo-state-seed";
import { createDemoStateStore } from "@/services/demo-state-store";
import type { DemoStatePersistenceAdapter } from "@/types/demo-state";

function makeSnapshot() {
  const snapshot = createDemoSeedSnapshot();
  const now = snapshot.savedAt;
  snapshot.data.customers[0]!.fullName = "Edited Demo Name";
  snapshot.data.customers[0]!.phone = "01712345678";
  snapshot.data.customers[0]!.addresses.push({ id: "address:owned", label: "Home", recipientName: "Edited Demo Name", phone: "01712345678", division: "Dhaka", district: "Dhaka", area: "Gulshan", streetAddress: "Road 2", postalCode: null, isDefault: true });
  snapshot.data.customers[0]!.preferences = { promotionalUpdates: true, productGridDensity: "compact" };
  snapshot.data.customers[0]!.hiddenOrderIds.push("order:owned");
  snapshot.data.customers[0]!.recentlyViewedProductIds.push("prod-wireless-earbuds-pro", "prod-cotton-panjabi");
  snapshot.data.accounts.find(({ id }) => id === "account-customer-demo")!.displayName = "Edited Demo Name";
  snapshot.data.carts[0]!.items.push({ id: "cart-item:owned", productId: "prod-wireless-earbuds-pro", variantId: null, quantity: 1, addedAt: now });
  snapshot.data.wishlists[0]!.productIds.push("prod-wireless-earbuds-pro");
  snapshot.data.productReviews.push({ id: "review-customer-demo-prod-wireless-earbuds-pro", customerId: "customer-demo", productId: "prod-wireless-earbuds-pro", rating: 5, body: "Review owned by the customer being reset.", createdAt: now, updatedAt: now });
  snapshot.data.orders.push({ id: "order:owned", orderNumber: "KN-OWNED", customerId: "customer-demo", fulfillmentGroupIds: ["group:owned"], shippingAddress: { id: "address:owned", label: "Home", recipientName: "Edited Demo Name", phone: "01712345678", division: "Dhaka", district: "Dhaka", area: "Gulshan", streetAddress: "Road 2", postalCode: null, isDefault: true }, paymentMethod: "cash_on_delivery", paymentStatus: "pending", status: "placed", subtotal: 1200, shippingTotal: 0, discountTotal: 0, grandTotal: 1200, placedAt: now, updatedAt: now });
  snapshot.data.fulfillmentGroups.push({ id: "group:owned", orderId: "order:owned", vendorId: "vendor-tech-haven", itemIds: ["item:owned"], subtotal: 1200, status: "pending", trackingNumber: null, updatedAt: now });
  snapshot.data.orderItems.push({ id: "item:owned", fulfillmentGroupId: "group:owned", productId: "prod-wireless-earbuds-pro", vendorId: "vendor-tech-haven", variantId: null, selectedVariant: null, productName: "Snapshot headphones", sku: "SKU-SNAPSHOT", unitPrice: 1200, quantity: 1, lineTotal: 1200 });
  snapshot.data.notifications.push({ id: "notification:owned", recipientAccountId: "account-customer-demo", kind: "order", title: "Owned notice", message: "Owned", href: null, readAt: null, createdAt: now });

  snapshot.data.accounts.push({ id: "account-customer-second", email: "second@example.test", displayName: "Second Customer", role: "customer", customerId: "customer-second", vendorId: null, createdAt: now });
  snapshot.data.customers.push({ id: "customer-second", accountId: "account-customer-second", fullName: "Second Customer", phone: "00000000001", addresses: [], preferences: { promotionalUpdates: false, productGridDensity: "standard" }, hiddenOrderIds: [], recentlyViewedProductIds: [], createdAt: now, updatedAt: now });
  snapshot.data.carts.push({ id: "cart-customer-second", customerId: "customer-second", items: [{ id: "cart-item:second", productId: "prod-cotton-panjabi", variantId: null, quantity: 1, addedAt: now }], updatedAt: now });
  snapshot.data.wishlists.push({ id: "wishlist-customer-second", customerId: "customer-second", productIds: ["prod-cotton-panjabi"], updatedAt: now });
  snapshot.data.productReviews.push({ id: "review-customer-second-prod-cotton-panjabi", customerId: "customer-second", productId: "prod-cotton-panjabi", rating: 4, body: "Review owned by the other customer.", createdAt: now, updatedAt: now });
  snapshot.data.notifications.push({ id: "notification:second", recipientAccountId: "account-customer-second", kind: "system", title: "Other notice", message: "Other", href: null, readAt: null, createdAt: now });
  return snapshot;
}

function adapter(snapshot: ReturnType<typeof createDemoSeedSnapshot>, failWrite = false): DemoStatePersistenceAdapter {
  let saved = structuredClone(snapshot);
  return {
    read: async () => structuredClone(saved),
    write: async (next) => { if (failWrite) throw new Error("storage unavailable"); saved = structuredClone(next); },
    clear: async () => undefined,
  };
}

test("customer reset deletes only the active customer's complete order tree and restores their demo profile", async () => {
  const store = createDemoStateStore(adapter(makeSnapshot()));
  await store.getState().hydrate();
  store.getState().setActiveAccount("account-customer-demo");
  const result = await resetActiveCustomerDemoData(store);
  expect(result).toEqual({ ok: true, persisted: true, deletedOrders: 1 });
  const { data } = store.getState().snapshot;
  expect(data.customers.find(({ id }) => id === "customer-demo")).toMatchObject({ fullName: "Demo Customer", phone: "00000000000", addresses: [], preferences: { promotionalUpdates: false, productGridDensity: "standard" }, hiddenOrderIds: [], recentlyViewedProductIds: [] });
  expect(data.accounts.find(({ id }) => id === "account-customer-demo")?.displayName).toBe("Demo Customer");
  expect(data.carts.find(({ customerId }) => customerId === "customer-demo")?.items).toEqual([]);
  expect(data.wishlists.find(({ customerId }) => customerId === "customer-demo")?.productIds).toEqual([]);
  expect(data.orders).toEqual([]);
  expect(data.productReviews).toHaveLength(1);
  expect(data.productReviews[0]).toMatchObject({ id: "review-customer-second-prod-cotton-panjabi", customerId: "customer-second", productId: "prod-cotton-panjabi", rating: 4, body: "Review owned by the other customer." });
  expect(data.fulfillmentGroups).toEqual([]);
  expect(data.orderItems).toEqual([]);
  expect(data.notifications.map(({ id }) => id)).toEqual(["notification:second"]);
  expect(data.carts.find(({ customerId }) => customerId === "customer-second")?.items).toHaveLength(1);
  expect(data.wishlists.find(({ customerId }) => customerId === "customer-second")?.productIds).toEqual(["prod-cotton-panjabi"]);
  expect(data.customers.find(({ id }) => id === "customer-second")?.fullName).toBe("Second Customer");
  expect((await resetActiveCustomerDemoData(store))).toEqual({ ok: true, persisted: true, deletedOrders: 0 });
});

test("reset requires the active customer and refuses malformed vendor fulfillment references", async () => {
  const store = createDemoStateStore(adapter(makeSnapshot()));
  await store.getState().hydrate();
  store.getState().setActiveAccount("account-admin-demo");
  expect(await resetActiveCustomerDemoData(store)).toEqual({ ok: false, reason: "customer_required" });
  store.getState().setActiveAccount("account-customer-demo");
  await store.getState().applySnapshotUpdate((snapshot) => {
    snapshot.data.fulfillmentGroups.push({ id: "group:orphan", orderId: "order:owned", vendorId: "vendor-tech-haven", itemIds: [], subtotal: 0, status: "pending", trackingNumber: null, updatedAt: snapshot.savedAt });
    return snapshot;
  });
  const before = structuredClone(store.getState().snapshot);
  expect(await resetActiveCustomerDemoData(store)).toEqual({ ok: false, reason: "invalid_order_relationships" });
  expect(store.getState().snapshot).toEqual(before);
});

test("storage failure leaves the in-memory customer snapshot unchanged and reports failure", async () => {
  const store = createDemoStateStore(adapter(makeSnapshot(), true));
  await store.getState().hydrate();
  store.getState().setActiveAccount("account-customer-demo");
  const before = structuredClone(store.getState().snapshot);
  expect(await resetActiveCustomerDemoData(store)).toEqual({ ok: false, reason: "persistence_unavailable" });
  expect(store.getState().snapshot).toEqual(before);
});
