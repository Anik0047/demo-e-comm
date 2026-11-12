import { expect, test } from "@playwright/test";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import { createDemoStateStore } from "@/services/demo-state-store";
import { createLocalStorageDemoStateAdapter, migrateDemoSnapshot } from "@/services/demo-state-persistence";
import { createDemoSeedSnapshot } from "@/services/demo-state-seed";
import { RECENTLY_VIEWED_LIMIT, recordRecentlyViewedProduct, resolveRecentlyViewedProducts, selectRecentlyViewedProductIds } from "@/services/recently-viewed";
import type { DemoStatePersistenceAdapter } from "@/types/demo-state";

function memoryStorage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}

async function customerStore(adapter?: DemoStatePersistenceAdapter) {
  const store = createDemoStateStore(adapter ?? { read: async () => null, write: async () => undefined, clear: async () => undefined });
  await store.getState().hydrate();
  store.getState().setActiveAccount("account-customer-demo");
  return store;
}

test("records unique canonical product IDs newest first and moves repeated visits to the front", async () => {
  const store = await customerStore();
  expect(await recordRecentlyViewedProduct(store, "prod-wireless-earbuds-pro")).toMatchObject({ ok: true, result: { ok: true, changed: true } });
  await recordRecentlyViewedProduct(store, "prod-cotton-panjabi");
  await recordRecentlyViewedProduct(store, "prod-wireless-earbuds-pro");
  expect(selectRecentlyViewedProductIds(store.getState().snapshot, "account-customer-demo")).toEqual(["prod-wireless-earbuds-pro", "prod-cotton-panjabi"]);
  for (const product of products.slice(0, RECENTLY_VIEWED_LIMIT + 2)) await recordRecentlyViewedProduct(store, product.id);
  expect(store.getState().snapshot.data.customers[0]?.recentlyViewedProductIds).toHaveLength(RECENTLY_VIEWED_LIMIT);
});

test("does not record missing, inactive, or unapproved-vendor products and filters unavailable saved history without mutation", async () => {
  const store = await customerStore();
  const product = products[0];
  const vendor = vendors.find(({ id }) => id === product?.vendorId);
  if (!product || !vendor) throw new Error("Expected canonical catalog records");
  expect(await recordRecentlyViewedProduct(store, "missing-product")).toMatchObject({ result: { ok: false, reason: "product_not_found" } });
  expect(await recordRecentlyViewedProduct(store, product.id, { products: [{ ...product, status: "inactive" }], vendors: [vendor] })).toMatchObject({ result: { ok: false, reason: "product_unavailable" } });
  expect(await recordRecentlyViewedProduct(store, product.id, { products: [product], vendors: [{ ...vendor, status: "suspended" }] })).toMatchObject({ result: { ok: false, reason: "product_unavailable" } });
  const customer = store.getState().snapshot.data.customers[0];
  if (!customer) throw new Error("Expected customer seed");
  customer.recentlyViewedProductIds = ["removed-product", product.id];
  const before = [...customer.recentlyViewedProductIds];
  const cards = await resolveRecentlyViewedProducts(customer.recentlyViewedProductIds);
  expect(cards.map(({ id }) => id)).toEqual([product.id]);
  expect(customer.recentlyViewedProductIds).toEqual(before);
});

test("blocks non-customer access and isolates history between customers", async () => {
  const snapshot = createDemoSeedSnapshot();
  snapshot.data.accounts.push({ id: "account-customer-second", email: "second@example.test", displayName: "Second", role: "customer", customerId: "customer-second", vendorId: null, createdAt: snapshot.savedAt });
  snapshot.data.customers.push({ id: "customer-second", accountId: "account-customer-second", fullName: "Second", phone: "0", addresses: [], preferences: { promotionalUpdates: false, productGridDensity: "standard" }, hiddenOrderIds: [], recentlyViewedProductIds: [], createdAt: snapshot.savedAt, updatedAt: snapshot.savedAt });
  const store = createDemoStateStore({ read: async () => snapshot, write: async () => undefined, clear: async () => undefined });
  await store.getState().hydrate();
  await recordRecentlyViewedProduct(store, "prod-wireless-earbuds-pro");
  expect(selectRecentlyViewedProductIds(store.getState().snapshot, "account-admin-demo")).toEqual([]);
  store.getState().setActiveAccount("account-admin-demo");
  expect(await recordRecentlyViewedProduct(store, "prod-cotton-panjabi")).toMatchObject({ result: { ok: false, reason: "customer_required" } });
  store.getState().setActiveAccount("account-customer-second");
  expect(selectRecentlyViewedProductIds(store.getState().snapshot, "account-customer-second")).toEqual([]);
  await recordRecentlyViewedProduct(store, "prod-cotton-panjabi");
  store.getState().setActiveAccount("account-customer-demo");
  expect(selectRecentlyViewedProductIds(store.getState().snapshot, "account-customer-demo")).toEqual(["prod-wireless-earbuds-pro"]);
});

test("persists history and safely migrates schema-v5 snapshots without dropping customer data", async () => {
  const storage = memoryStorage();
  const first = await customerStore(createLocalStorageDemoStateAdapter(storage));
  await recordRecentlyViewedProduct(first, "prod-wireless-earbuds-pro");
  const restored = await customerStore(createLocalStorageDemoStateAdapter(storage));
  expect(selectRecentlyViewedProductIds(restored.getState().snapshot, "account-customer-demo")).toEqual(["prod-wireless-earbuds-pro"]);

  const legacy = createDemoSeedSnapshot();
  legacy.schemaVersion = 5;
  const savedCustomer = legacy.data.customers[0];
  if (!savedCustomer) throw new Error("Expected customer seed");
  savedCustomer.fullName = "Preserved customer";
  delete (savedCustomer as { recentlyViewedProductIds?: string[] }).recentlyViewedProductIds;
  const legacyStorage = memoryStorage();
  legacyStorage.setItem("kenakata:demo-state", JSON.stringify(legacy));
  const migrated = await customerStore(createLocalStorageDemoStateAdapter(legacyStorage));
  expect(migrated.getState().snapshot).toMatchObject({ schemaVersion: 7, data: { customers: [{ fullName: "Preserved customer", recentlyViewedProductIds: [] }], productReviews: [] } });
  expect(JSON.parse(legacyStorage.getItem("kenakata:demo-state") ?? "null").schemaVersion).toBe(7);

  const malformedCurrent = createDemoSeedSnapshot();
  const currentCustomer = malformedCurrent.data.customers[0];
  if (!currentCustomer) throw new Error("Expected current customer seed");
  currentCustomer.recentlyViewedProductIds = ["unknown", "unknown", ...Array.from({ length: RECENTLY_VIEWED_LIMIT + 2 }, (_, index) => `removed-${index}`)];
  const repaired = migrateDemoSnapshot(malformedCurrent);
  expect(repaired?.data.customers[0]?.recentlyViewedProductIds).toHaveLength(RECENTLY_VIEWED_LIMIT);
  expect(new Set(repaired?.data.customers[0]?.recentlyViewedProductIds).size).toBe(RECENTLY_VIEWED_LIMIT);
});
