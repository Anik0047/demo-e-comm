import { expect, test } from "@playwright/test";
import { saveCustomerPreferences, validateCustomerPreferences } from "@/services/customer-preferences";
import { createLocalStorageDemoStateAdapter, DEMO_STATE_STORAGE_KEY } from "@/services/demo-state-persistence";
import { createDemoSeedSnapshot } from "@/services/demo-state-seed";
import { createDemoStateStore } from "@/services/demo-state-store";
import { DEFAULT_DEMO_CUSTOMER_PREFERENCES, type DemoStatePersistenceAdapter } from "@/types/demo-state";

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

test("seeded customer preferences have deterministic opt-out and standard grid defaults", () => {
  const snapshot = createDemoSeedSnapshot();
  expect(snapshot.data.customers[0]?.preferences).toEqual(DEFAULT_DEMO_CUSTOMER_PREFERENCES);
});

test("validates promotional opt-in and supported product grid settings", () => {
  expect(validateCustomerPreferences({ promotionalUpdates: true, productGridDensity: "compact" })).toEqual({
    ok: true,
    value: { promotionalUpdates: true, productGridDensity: "compact" },
  });
  expect(validateCustomerPreferences({ promotionalUpdates: "yes", productGridDensity: "dense" })).toMatchObject({
    ok: false,
    errors: { promotionalUpdates: expect.any(String), productGridDensity: expect.any(String) },
  });
});

test("saves preferences by customer ID without changing profile, addresses, cart, wishlist, or active account", async () => {
  const storage = memoryStorage();
  const store = await customerStore(createLocalStorageDemoStateAdapter(storage));
  const before = structuredClone(store.getState().snapshot.data);
  const result = await saveCustomerPreferences(store, "customer-demo", { promotionalUpdates: true, productGridDensity: "compact" });
  expect(result).toMatchObject({ ok: true, persisted: true, customer: { id: "customer-demo", preferences: { promotionalUpdates: true, productGridDensity: "compact" } } });
  expect(store.getState().activeAccountId).toBe("account-customer-demo");
  expect(store.getState().snapshot.data.customers[0]).toMatchObject({
    fullName: before.customers[0]?.fullName,
    phone: before.customers[0]?.phone,
    addresses: before.customers[0]?.addresses,
  });
  expect(store.getState().snapshot.data.carts).toEqual(before.carts);
  expect(store.getState().snapshot.data.wishlists).toEqual(before.wishlists);

  const restored = await customerStore(createLocalStorageDemoStateAdapter(storage));
  expect(restored.getState().snapshot.data.customers[0]?.preferences).toEqual({ promotionalUpdates: true, productGridDensity: "compact" });
});

test("preference changes are isolated to the active customer and restricted from admin accounts", async () => {
  const snapshot = createDemoSeedSnapshot();
  snapshot.data.accounts.push({ id: "account-customer-second", email: "second@example.test", displayName: "Second Customer", role: "customer", customerId: "customer-second", vendorId: null, createdAt: snapshot.savedAt });
  snapshot.data.customers.push({ id: "customer-second", accountId: "account-customer-second", fullName: "Second Customer", phone: "00000000001", addresses: [], preferences: { ...DEFAULT_DEMO_CUSTOMER_PREFERENCES }, createdAt: snapshot.savedAt, updatedAt: snapshot.savedAt });
  snapshot.data.carts.push({ id: "cart-customer-second", customerId: "customer-second", items: [], updatedAt: snapshot.savedAt });
  snapshot.data.wishlists.push({ id: "wishlist-customer-second", customerId: "customer-second", productIds: [], updatedAt: snapshot.savedAt });
  const store = createDemoStateStore({ read: async () => snapshot, write: async () => undefined, clear: async () => undefined });
  await store.getState().hydrate();
  store.getState().setActiveAccount("account-customer-demo");

  expect(await saveCustomerPreferences(store, "customer-second", { promotionalUpdates: true, productGridDensity: "compact" })).toMatchObject({ ok: false, reason: "customer_required" });
  expect(await saveCustomerPreferences(store, "customer-demo", { promotionalUpdates: true, productGridDensity: "compact" })).toMatchObject({ ok: true });
  expect(store.getState().snapshot.data.customers.find(({ id }) => id === "customer-second")?.preferences).toEqual(DEFAULT_DEMO_CUSTOMER_PREFERENCES);
  store.getState().setActiveAccount("account-admin-demo");
  expect(await saveCustomerPreferences(store, "customer-demo", { promotionalUpdates: false, productGridDensity: "standard" })).toMatchObject({ ok: false, reason: "customer_required" });
});

test("migrates schema v1 customer data in place and repairs only invalid preference values", async () => {
  const storage = memoryStorage();
  const oldSnapshot = createDemoSeedSnapshot();
  const customer = oldSnapshot.data.customers[0];
  const cart = oldSnapshot.data.carts[0];
  const wishlist = oldSnapshot.data.wishlists[0];
  if (!customer || !cart || !wishlist) throw new Error("Expected seeded customer state");
  oldSnapshot.schemaVersion = 1;
  customer.fullName = "Saved customer name";
  delete (customer as { preferences?: typeof customer.preferences }).preferences;
  customer.addresses.push({ id: "address-saved", label: "Home", recipientName: "Saved Recipient", phone: "01712345678", division: "Dhaka", district: "Dhaka", area: "Gulshan", streetAddress: "House 4, Road 2", postalCode: null, isDefault: true });
  cart.items.push({ id: "cart-item-saved", productId: "prod-wireless-earbuds-pro", variantId: null, quantity: 2, addedAt: oldSnapshot.savedAt });
  wishlist.productIds.push("prod-wireless-earbuds-pro");
  storage.setItem(DEMO_STATE_STORAGE_KEY, JSON.stringify(oldSnapshot));

  const migrated = await createLocalStorageDemoStateAdapter(storage).read();
  expect(migrated).toMatchObject({ schemaVersion: 3, data: { customers: [{ fullName: "Saved customer name", preferences: DEFAULT_DEMO_CUSTOMER_PREFERENCES, addresses: [{ id: "address-saved" }] }], carts: [{ items: [{ id: "cart-item-saved" }] }], wishlists: [{ productIds: ["prod-wireless-earbuds-pro"] }] } });
  expect(JSON.parse(storage.getItem(DEMO_STATE_STORAGE_KEY) ?? "null").schemaVersion).toBe(3);

  const corrupted = JSON.parse(storage.getItem(DEMO_STATE_STORAGE_KEY) ?? "null") as typeof oldSnapshot;
  const migratedCustomer = corrupted.data.customers[0];
  if (!migratedCustomer) throw new Error("Expected migrated customer data");
  migratedCustomer.preferences = { promotionalUpdates: true, productGridDensity: "dense" as "standard" };
  storage.setItem(DEMO_STATE_STORAGE_KEY, JSON.stringify(corrupted));
  const repaired = await createLocalStorageDemoStateAdapter(storage).read();
  expect(repaired?.data.customers[0]?.preferences).toEqual({ promotionalUpdates: true, productGridDensity: "standard" });
  expect(repaired?.data.customers[0]?.addresses).toHaveLength(1);
  expect(repaired?.data.carts[0]?.items).toHaveLength(1);
  expect(repaired?.data.wishlists[0]?.productIds).toEqual(["prod-wireless-earbuds-pro"]);
});

test("invalid choices do not change persisted preferences", async () => {
  const store = await customerStore();
  const before = store.getState().snapshot.data.customers[0]?.preferences;
  expect(await saveCustomerPreferences(store, "customer-demo", { promotionalUpdates: 1, productGridDensity: "wide" })).toMatchObject({ ok: false, reason: "invalid_input" });
  expect(store.getState().snapshot.data.customers[0]?.preferences).toEqual(before);
});
