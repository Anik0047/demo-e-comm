import { expect, test } from "@playwright/test";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import { addWishlistProduct, isProductWishlisted, removeWishlistProduct, selectWishlistSummary, toggleWishlistProduct } from "@/services/demo-wishlist";
import { createDemoStateStore } from "@/services/demo-state-store";
import { createLocalStorageDemoStateAdapter } from "@/services/demo-state-persistence";
import { createDemoSeedSnapshot } from "@/services/demo-state-seed";
import type { DemoStatePersistenceAdapter } from "@/types/demo-state";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

async function customerStore(adapter?: DemoStatePersistenceAdapter) {
  const store = createDemoStateStore(adapter ?? { read: async () => null, write: async () => undefined, clear: async () => undefined });
  await store.getState().hydrate();
  store.getState().setActiveAccount("account-customer-demo");
  return store;
}

test("adds, removes, toggles, and checks wishlist products without duplicates", async () => {
  const store = await customerStore();
  expect(await addWishlistProduct(store, "prod-wireless-earbuds-pro")).toMatchObject({ ok: true, persisted: true, result: { ok: true, changed: true } });
  expect(await addWishlistProduct(store, "prod-wireless-earbuds-pro")).toMatchObject({ ok: true, result: { ok: true, changed: false } });
  expect(isProductWishlisted(store.getState().snapshot, "account-customer-demo", "prod-wireless-earbuds-pro")).toBe(true);
  expect(selectWishlistSummary(store.getState().snapshot, "account-customer-demo")).toMatchObject({ itemCount: 1, availableItemCount: 1 });
  expect(await removeWishlistProduct(store, "prod-wireless-earbuds-pro")).toMatchObject({ ok: true, result: { ok: true, changed: true } });
  expect(await removeWishlistProduct(store, "prod-wireless-earbuds-pro")).toMatchObject({ ok: true, result: { ok: false, reason: "product_not_wishlisted" } });
  expect(await toggleWishlistProduct(store, "prod-wireless-earbuds-pro")).toMatchObject({ ok: true, result: { ok: true, changed: true } });
  expect(await toggleWishlistProduct(store, "prod-wireless-earbuds-pro")).toMatchObject({ ok: true, result: { ok: true, changed: true } });
  expect(isProductWishlisted(store.getState().snapshot, "account-customer-demo", "prod-wireless-earbuds-pro")).toBe(false);
});

test("rejects missing, inactive, and unapproved-vendor products", async () => {
  const store = await customerStore();
  const product = products.find(({ id }) => id === "prod-wireless-earbuds-pro");
  const vendor = vendors.find(({ id }) => id === "vendor-tech-haven");
  if (!product || !vendor) throw new Error("Expected catalog records");
  expect(await addWishlistProduct(store, "missing-product")).toMatchObject({ ok: true, result: { ok: false, reason: "product_not_found" } });
  expect(await addWishlistProduct(store, product.id, { products: [{ ...product, status: "inactive" }], vendors: [vendor] })).toMatchObject({ ok: true, result: { ok: false, reason: "product_unavailable" } });
  expect(await addWishlistProduct(store, product.id, { products: [product], vendors: [{ ...vendor, status: "suspended" }] })).toMatchObject({ ok: true, result: { ok: false, reason: "product_unavailable" } });
  expect(selectWishlistSummary(store.getState().snapshot, "account-customer-demo").itemCount).toBe(0);
});

test("allows active products with no stock and reports them out of stock for purchase", async () => {
  const store = await customerStore();
  const product = products.find(({ id }) => id === "prod-double-door-refrigerator");
  if (!product) throw new Error("Expected the seeded refrigerator product");
  expect(await addWishlistProduct(store, product.id)).toMatchObject({ ok: true, persisted: true, result: { ok: true, changed: true } });
  expect(selectWishlistSummary(store.getState().snapshot, "account-customer-demo")).toMatchObject({
    itemCount: 1,
    availableItemCount: 0,
    items: [{ productId: product.id, available: false, availability: "out_of_stock" }],
  });
});

test("retains wishlisted items if catalog products later become unavailable and allows removing them", async () => {
  const store = await customerStore();
  await addWishlistProduct(store, "prod-wireless-earbuds-pro");
  const inactive = products.map((product) => product.id === "prod-wireless-earbuds-pro" ? { ...product, status: "inactive" as const } : product);
  expect(selectWishlistSummary(store.getState().snapshot, "account-customer-demo", { products: inactive, vendors })).toMatchObject({ itemCount: 1, availableItemCount: 0, items: [{ product: { id: "prod-wireless-earbuds-pro" }, available: false }] });
  expect(await removeWishlistProduct(store, "prod-wireless-earbuds-pro")).toMatchObject({ ok: true, result: { ok: true } });
});

test("restricts mutations and selectors to customer accounts", async () => {
  const store = await customerStore();
  for (const accountId of ["account-admin-demo", "account-vendor-tech-haven"]) {
    store.getState().setActiveAccount(accountId);
    expect(await addWishlistProduct(store, "prod-wireless-earbuds-pro")).toMatchObject({ ok: true, result: { ok: false, reason: "customer_required" } });
    expect(await removeWishlistProduct(store, "prod-wireless-earbuds-pro")).toMatchObject({ ok: true, result: { ok: false, reason: "customer_required" } });
    expect(await toggleWishlistProduct(store, "prod-wireless-earbuds-pro")).toMatchObject({ ok: true, result: { ok: false, reason: "customer_required" } });
    expect(selectWishlistSummary(store.getState().snapshot, accountId)).toMatchObject({ wishlist: null, itemCount: 0 });
  }
});

test("persists wishlist changes across store recreation", async () => {
  const storage = memoryStorage();
  const first = await customerStore(createLocalStorageDemoStateAdapter(storage));
  await addWishlistProduct(first, "prod-wireless-earbuds-pro");
  const restored = await customerStore(createLocalStorageDemoStateAdapter(storage));
  expect(selectWishlistSummary(restored.getState().snapshot, "account-customer-demo")).toMatchObject({ itemCount: 1, items: [{ productId: "prod-wireless-earbuds-pro", available: true }] });
});

test("keeps separate customer wishlists isolated", async () => {
  const snapshot = createDemoSeedSnapshot();
  snapshot.data.accounts.push({ id: "account-customer-second", email: "second@example.test", displayName: "Second Customer", role: "customer", customerId: "customer-second", vendorId: null, createdAt: snapshot.savedAt });
  snapshot.data.customers.push({ id: "customer-second", accountId: "account-customer-second", fullName: "Second Customer", phone: "00000000001", addresses: [], createdAt: snapshot.savedAt, updatedAt: snapshot.savedAt });
  snapshot.data.wishlists.push({ id: "wishlist-customer-second", customerId: "customer-second", productIds: [], updatedAt: snapshot.savedAt });
  const store = createDemoStateStore({ read: async () => snapshot, write: async () => undefined, clear: async () => undefined });
  await store.getState().hydrate();
  await addWishlistProduct(store, "prod-wireless-earbuds-pro");
  store.getState().setActiveAccount("account-customer-second");
  expect(selectWishlistSummary(store.getState().snapshot, "account-customer-second").itemCount).toBe(0);
  await addWishlistProduct(store, "prod-wireless-earbuds-pro");
  expect(selectWishlistSummary(store.getState().snapshot, "account-customer-second").itemCount).toBe(1);
  store.getState().setActiveAccount("account-customer-demo");
  expect(selectWishlistSummary(store.getState().snapshot, "account-customer-demo").itemCount).toBe(1);
});
