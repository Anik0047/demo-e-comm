import assert from "node:assert/strict";
import { test } from "@playwright/test";
import { createDemoSeedSnapshot } from "@/services/demo-state-seed";
import { createLocalStorageDemoStateAdapter } from "@/services/demo-state-persistence";
import { createDemoStateStore } from "@/services/demo-state-store";
import { placeDemoOrder } from "@/services/demo-order-placement";
import { products } from "@/data/products";
import { getVendorOrderItems } from "@/types/order";
import { getCustomerOrderConfirmation } from "@/services/checkout";
import { migrateDemoSnapshot, validateDemoSnapshot } from "@/services/demo-state-persistence";

const NOW = Date.parse("2026-11-10T12:00:00.000Z");
const address = {
  id: "address-home", label: "Home", recipientName: "Demo Customer", phone: "01712345678",
  division: "Dhaka", district: "Dhaka", area: "Dhanmondi", streetAddress: "House 1, Road 2",
  postalCode: "1205", isDefault: true,
};

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
    values,
  };
}

async function customerOrderStore() {
  const storage = memoryStorage();
  const adapter = createLocalStorageDemoStateAdapter(storage);
  const store = createDemoStateStore(adapter);
  await store.getState().hydrate();
  await store.getState().applySnapshotUpdate((snapshot) => {
    const customer = snapshot.data.customers.find(({ id }) => id === "customer-demo");
    const cart = snapshot.data.carts.find(({ customerId }) => customerId === "customer-demo");
    assert.ok(customer && cart);
    customer.addresses = [{ ...address }];
    cart.items = [
      { id: "cart-panjabi", productId: "prod-cotton-panjabi", variantId: "var-panjabi-m", quantity: 2, addedAt: snapshot.savedAt },
      { id: "cart-earbuds", productId: "prod-wireless-earbuds-pro", variantId: null, quantity: 1, addedAt: snapshot.savedAt },
    ];
    snapshot.data.accounts.push({ id: "account-customer-second", email: "second@example.test", displayName: "Second Customer", role: "customer", customerId: "customer-second", vendorId: null, createdAt: snapshot.savedAt });
    snapshot.data.customers.push({ id: "customer-second", accountId: "account-customer-second", fullName: "Second Customer", phone: "01712345679", addresses: [], preferences: { promotionalUpdates: true, productGridDensity: "compact" }, createdAt: snapshot.savedAt, updatedAt: snapshot.savedAt });
    snapshot.data.carts.push({ id: "cart-customer-second", customerId: "customer-second", items: [{ id: "second-cart-item", productId: "prod-smart-watch-series-5", variantId: null, quantity: 1, addedAt: snapshot.savedAt }], updatedAt: snapshot.savedAt });
    snapshot.data.wishlists.push({ id: "wishlist-customer-second", customerId: "customer-second", productIds: ["prod-wireless-earbuds-pro"], updatedAt: snapshot.savedAt });
    return snapshot;
  });
  return { store, storage, adapter };
}

function sequenceIds() {
  let sequence = 0;
  return () => `test-${++sequence}`;
}

test("placement persists one COD parent order with canonical vendor groups and clears only the buyer cart", async () => {
  const { store, storage, adapter } = await customerOrderStore();
  const originalSecondCustomer = structuredClone(store.getState().snapshot.data.customers.find(({ id }) => id === "customer-second"));
  const originalSecondCart = structuredClone(store.getState().snapshot.data.carts.find(({ customerId }) => customerId === "customer-second"));
  const originalSecondWishlist = structuredClone(store.getState().snapshot.data.wishlists.find(({ customerId }) => customerId === "customer-second"));
  const result = await placeDemoOrder(address.id, store, { now: NOW, createId: sequenceIds() });
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const state = store.getState().snapshot;
  assert.equal(result.persisted, true);
  assert.equal(state.schemaVersion, 3);
  assert.equal(state.data.orders.length, 1);
  const order = state.data.orders[0];
  assert.ok(order);
  const confirmation = getCustomerOrderConfirmation(state, "customer-demo", order.id);
  assert.ok(confirmation);
  assert.equal(confirmation.groups.length, 2);
  assert.equal(getCustomerOrderConfirmation(state, "customer-second", order.id), null);
  assert.equal(getCustomerOrderConfirmation(state, "customer-demo", "missing-order"), null);
  assert.equal(order.id, result.order.id);
  assert.equal(order.customerId, "customer-demo");
  assert.equal(order.paymentMethod, "cash_on_delivery");
  assert.equal(order.paymentStatus, "pending");
  assert.equal(order.placedAt, new Date(NOW).toISOString());
  assert.equal(order.subtotal, 4850);
  assert.equal(order.grandTotal, order.subtotal + order.shippingTotal - order.discountTotal);
  assert.deepEqual(order.shippingAddress, address);
  assert.notEqual(order.shippingAddress, state.data.customers.find(({ id }) => id === "customer-demo")?.addresses[0]);

  const groups = state.data.fulfillmentGroups.filter(({ orderId }) => orderId === order.id);
  const items = state.data.orderItems.filter(({ fulfillmentGroupId }) => groups.some(({ id }) => id === fulfillmentGroupId));
  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map(({ subtotal }) => subtotal).sort((a, b) => a - b), [2400, 2450]);
  assert.equal(items.reduce((sum, item) => sum + item.lineTotal, 0), order.subtotal);
  for (const group of groups) {
    assert.ok(group.itemIds.every((itemId) => items.find(({ id }) => id === itemId)?.vendorId === group.vendorId));
    const visibleToVendor = getVendorOrderItems(order, groups, items, group.vendorId);
    assert.ok(visibleToVendor.length > 0);
    assert.ok(visibleToVendor.every(({ vendorId }) => vendorId === group.vendorId));
  }
  const panjabi = items.find(({ productId }) => productId === "prod-cotton-panjabi");
  assert.equal(panjabi?.vendorId, products.find(({ id }) => id === "prod-cotton-panjabi")?.vendorId);
  assert.deepEqual(panjabi?.selectedVariant, { id: "var-panjabi-m", optionValues: { Size: "M" } });
  assert.equal(panjabi?.unitPrice, 1200);
  assert.equal(panjabi?.lineTotal, 2400);

  assert.equal(store.getState().snapshot.data.carts.find(({ customerId }) => customerId === "customer-demo")?.items.length, 0);
  assert.deepEqual(store.getState().snapshot.data.customers.find(({ id }) => id === "customer-second"), originalSecondCustomer);
  assert.deepEqual(store.getState().snapshot.data.carts.find(({ customerId }) => customerId === "customer-second"), originalSecondCart);
  assert.deepEqual(store.getState().snapshot.data.wishlists.find(({ customerId }) => customerId === "customer-second"), originalSecondWishlist);
  await store.getState().applySnapshotUpdate((snapshot) => {
    const customer = snapshot.data.customers.find(({ id }) => id === "customer-demo");
    if (customer?.addresses[0]) customer.addresses[0].streetAddress = "Edited after placement";
    return snapshot;
  });
  assert.equal(store.getState().snapshot.data.orders[0]?.shippingAddress.streetAddress, "House 1, Road 2");
  assert.equal(store.getState().snapshot.data.orderItems.find(({ productId }) => productId === "prod-cotton-panjabi")?.unitPrice, 1200);
  const restored = await createDemoStateStore(createLocalStorageDemoStateAdapter(storage));
  await restored.getState().hydrate();
  assert.equal(restored.getState().snapshot.data.orders[0]?.id, order.id);
  assert.equal(restored.getState().snapshot.data.orders[0]?.shippingAddress.streetAddress, "House 1, Road 2");
  assert.equal(validateDemoSnapshot(await adapter.read()), true);
});

test("invalid address, cart, role, and ID generation failures leave every order and cart untouched", async () => {
  for (const failure of ["address", "no_address", "cart", "role", "ids"] as const) {
    const { store } = await customerOrderStore();
    if (failure === "no_address") {
      await store.getState().applySnapshotUpdate((snapshot) => {
        const customer = snapshot.data.customers.find(({ id }) => id === "customer-demo");
        if (customer) customer.addresses = [];
        return snapshot;
      });
    }
    if (failure === "cart") {
      await store.getState().applySnapshotUpdate((snapshot) => {
        const cart = snapshot.data.carts.find(({ customerId }) => customerId === "customer-demo");
        if (cart?.items[0]) cart.items[0].variantId = "missing-variant";
        return snapshot;
      });
    }
    const before = structuredClone(store.getState().snapshot.data);
    if (failure === "role") store.getState().setActiveAccount("account-admin-demo");
    const result = await placeDemoOrder(failure === "address" ? "deleted-address" : address.id, store, {
      now: NOW,
      createId: failure === "ids" ? () => "collision" : sequenceIds(),
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, { address: "address_unavailable", no_address: "address_required", cart: "cart_unavailable", role: "customer_required", ids: "id_generation_failed" }[failure]);
    const after = store.getState().snapshot.data;
    assert.deepEqual(after.orders, before.orders);
    assert.deepEqual(after.orderItems, before.orderItems);
    assert.deepEqual(after.fulfillmentGroups, before.fulfillmentGroups);
    assert.deepEqual(after.carts, before.carts);
  }
});

test("persistence failure keeps the order and cart unchanged", async () => {
  const { store, storage } = await customerOrderStore();
  const before = structuredClone(store.getState().snapshot.data);
  storage.setItem = () => { throw new Error("storage unavailable"); };
  const result = await placeDemoOrder(address.id, store, { now: NOW, createId: sequenceIds() });
  assert.deepEqual(result, { ok: false, reason: "invalid_snapshot" });
  assert.deepEqual(store.getState().snapshot.data.orders, before.orders);
  assert.deepEqual(store.getState().snapshot.data.orderItems, before.orderItems);
  assert.deepEqual(store.getState().snapshot.data.fulfillmentGroups, before.fulfillmentGroups);
  assert.deepEqual(store.getState().snapshot.data.carts, before.carts);
});

test("parallel repeated placement submits create at most one order", async () => {
  const { store } = await customerOrderStore();
  let sequence = 0;
  const results = await Promise.all([
    placeDemoOrder(address.id, store, { now: NOW, createId: () => `parallel-${++sequence}` }),
    placeDemoOrder(address.id, store, { now: NOW, createId: () => `parallel-${++sequence}` }),
  ]);
  assert.equal(results.filter(({ ok }) => ok).length, 1);
  assert.equal(store.getState().snapshot.data.orders.length, 1);
  assert.equal(store.getState().snapshot.data.carts.find(({ customerId }) => customerId === "customer-demo")?.items.length, 0);
});

test("schema-v1 and v2 orders migrate with snapshots and preserve all customer records", async () => {
 for (const schemaVersion of [1, 2]) {
  const snapshot = createDemoSeedSnapshot();
  snapshot.schemaVersion = schemaVersion;
  const customer = snapshot.data.customers.find(({ id }) => id === "customer-demo");
  const cart = snapshot.data.carts.find(({ customerId }) => customerId === "customer-demo");
  const wishlist = snapshot.data.wishlists.find(({ customerId }) => customerId === "customer-demo");
  assert.ok(customer && cart && wishlist);
  customer.fullName = "Saved name";
  customer.addresses.push({ ...address });
  customer.preferences = { promotionalUpdates: true, productGridDensity: "compact" };
  cart.items.push({ id: "preserved-cart-line", productId: "prod-wireless-earbuds-pro", variantId: null, quantity: 2, addedAt: snapshot.savedAt });
  wishlist.productIds.push("prod-smart-watch-series-5");
  snapshot.data.orders.push({
    id: "legacy-order", orderNumber: "KN-OLD", customerId: "customer-demo", fulfillmentGroupIds: ["legacy-group"],
    shippingAddress: { ...address }, paymentMethod: "cash_on_delivery", paymentStatus: "pending", status: "placed",
    subtotal: 1600, shippingTotal: 0, discountTotal: 0, grandTotal: 1600, placedAt: snapshot.savedAt, updatedAt: snapshot.savedAt,
  });
  snapshot.data.fulfillmentGroups.push({ id: "legacy-group", orderId: "legacy-order", vendorId: "vendor-urban-fit", itemIds: ["legacy-item"], status: "pending", trackingNumber: null, updatedAt: snapshot.savedAt } as never);
  snapshot.data.orderItems.push({ id: "legacy-item", fulfillmentGroupId: "legacy-group", productId: "prod-cotton-panjabi", variantId: "var-panjabi-m", productName: "Cotton Panjabi", sku: "SKU-COTTON-PANJABI-M", unitPrice: 1600, quantity: 1, lineTotal: 1600 } as never);

  const migrated = migrateDemoSnapshot(snapshot);
  assert.ok(migrated);
  assert.equal(migrated.schemaVersion, 3);
  assert.equal(validateDemoSnapshot(migrated), true);
  assert.equal(migrated.data.customers[0]?.fullName, "Saved name");
  assert.deepEqual(migrated.data.customers[0]?.addresses, [address]);
  assert.deepEqual(migrated.data.customers[0]?.preferences, { promotionalUpdates: true, productGridDensity: "compact" });
  assert.equal(migrated.data.carts[0]?.items[0]?.id, "preserved-cart-line");
  assert.deepEqual(migrated.data.wishlists[0]?.productIds, ["prod-smart-watch-series-5"]);
  assert.equal(migrated.data.fulfillmentGroups[0]?.subtotal, 1600);
  assert.equal(migrated.data.orderItems[0]?.vendorId, "vendor-urban-fit");
  assert.deepEqual(migrated.data.orderItems[0]?.selectedVariant, { id: "var-panjabi-m", optionValues: { Size: "M" } });
 }
});
