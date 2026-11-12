import { expect, test } from "@playwright/test";
import { updateCustomerProfile, validateCustomerProfile } from "@/services/customer-profile";
import { createDemoStateStore } from "@/services/demo-state-store";
import { createDemoSeedSnapshot } from "@/services/demo-state-seed";
import { createLocalStorageDemoStateAdapter } from "@/services/demo-state-persistence";
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

test("validates trimmed names and Bangladesh mobile numbers", () => {
  expect(validateCustomerProfile({ fullName: "  A  ", phone: "01712345678" })).toMatchObject({ ok: false, errors: { fullName: expect.any(String) } });
  expect(validateCustomerProfile({ fullName: "  Samira Khan  ", phone: "+8801712345678" })).toEqual({ ok: true, value: { fullName: "Samira Khan", phone: "+8801712345678" } });
  expect(validateCustomerProfile({ fullName: "Samira", phone: "02112345678" })).toMatchObject({ ok: false, errors: { phone: expect.any(String) } });
});

test("updates only the active customer record and persists without touching cart or wishlist records", async () => {
  const storage = memoryStorage();
  const store = await customerStore(createLocalStorageDemoStateAdapter(storage));
  const before = structuredClone(store.getState().snapshot.data);

  const result = await updateCustomerProfile(store, "customer-demo", { fullName: "Samira Khan", phone: "01712345678" });
  expect(result).toMatchObject({ ok: true, persisted: true, customer: { id: "customer-demo", fullName: "Samira Khan", phone: "01712345678" } });
  expect(store.getState().snapshot.data.accounts.find(({ id }) => id === "account-customer-demo")?.displayName).toBe("Samira Khan");
  expect(store.getState().snapshot.data.carts).toEqual(before.carts);
  expect(store.getState().snapshot.data.wishlists).toEqual(before.wishlists);

  const restored = await customerStore(createLocalStorageDemoStateAdapter(storage));
  expect(restored.getState().snapshot.data.customers.find(({ id }) => id === "customer-demo")).toMatchObject({ fullName: "Samira Khan", phone: "01712345678" });
});

test("keeps profile edits isolated by immutable customer ID and blocks non-customer accounts", async () => {
  const snapshot = createDemoSeedSnapshot();
  snapshot.data.accounts.push({ id: "account-customer-second", email: "second@example.test", displayName: "Second Customer", role: "customer", customerId: "customer-second", vendorId: null, createdAt: snapshot.savedAt });
  snapshot.data.customers.push({ id: "customer-second", accountId: "account-customer-second", fullName: "Second Customer", phone: "00000000001", addresses: [], preferences: { promotionalUpdates: false, productGridDensity: "standard" }, hiddenOrderIds: [], recentlyViewedProductIds: [], createdAt: snapshot.savedAt, updatedAt: snapshot.savedAt });
  snapshot.data.carts.push({ id: "cart-customer-second", customerId: "customer-second", items: [], updatedAt: snapshot.savedAt });
  snapshot.data.wishlists.push({ id: "wishlist-customer-second", customerId: "customer-second", productIds: [], updatedAt: snapshot.savedAt });
  const store = createDemoStateStore({ read: async () => snapshot, write: async () => undefined, clear: async () => undefined });
  await store.getState().hydrate();
  store.getState().setActiveAccount("account-customer-demo");

  expect(await updateCustomerProfile(store, "customer-second", { fullName: "Wrong target", phone: "01712345678" })).toMatchObject({ ok: false, reason: "customer_required" });
  expect(await updateCustomerProfile(store, "customer-demo", { fullName: "Changed Customer", phone: "01712345678" })).toMatchObject({ ok: true });
  expect(store.getState().snapshot.data.customers.find(({ id }) => id === "customer-second")?.fullName).toBe("Second Customer");
  expect(store.getState().snapshot.data.accounts.find(({ id }) => id === "account-customer-second")?.displayName).toBe("Second Customer");

  store.getState().setActiveAccount("account-admin-demo");
  expect(await updateCustomerProfile(store, "customer-demo", { fullName: "Blocked Admin", phone: "01712345678" })).toMatchObject({ ok: false, reason: "customer_required" });
});

test("rejects invalid input without changing persisted profile data", async () => {
  const store = await customerStore();
  const before = store.getState().snapshot.data.customers[0];
  const result = await updateCustomerProfile(store, "customer-demo", { fullName: " ", phone: "not a phone" });
  expect(result).toMatchObject({ ok: false, reason: "invalid_input", errors: { fullName: expect.any(String), phone: expect.any(String) } });
  expect(store.getState().snapshot.data.customers[0]).toEqual(before);
});
