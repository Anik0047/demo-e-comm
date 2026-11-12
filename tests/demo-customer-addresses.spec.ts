import { expect, test } from "@playwright/test";
import {
  addCustomerAddress,
  deleteCustomerAddress,
  setDefaultCustomerAddress,
  updateCustomerAddress,
  validateCustomerAddress,
  type CustomerAddressInput,
} from "@/services/customer-addresses";
import { createLocalStorageDemoStateAdapter } from "@/services/demo-state-persistence";
import { createDemoSeedSnapshot } from "@/services/demo-state-seed";
import { createDemoStateStore } from "@/services/demo-state-store";
import type { DemoStatePersistenceAdapter } from "@/types/demo-state";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

const makeAddress = (overrides: Partial<CustomerAddressInput> = {}): CustomerAddressInput => ({
  label: "Home",
  recipientName: "Samira Khan",
  phone: "01712345678",
  division: "Dhaka",
  district: "Dhaka",
  area: "Gulshan",
  streetAddress: "House 12, Road 5",
  postalCode: "1212",
  isDefault: false,
  ...overrides,
});

async function customerStore(adapter?: DemoStatePersistenceAdapter) {
  const store = createDemoStateStore(adapter ?? { read: async () => null, write: async () => undefined, clear: async () => undefined });
  await store.getState().hydrate();
  store.getState().setActiveAccount("account-customer-demo");
  return store;
}

test("validates required Bangladesh address fields and optional four-digit postal code", () => {
  expect(validateCustomerAddress(makeAddress({ phone: "02112345678" }))).toMatchObject({ ok: false, errors: { phone: expect.any(String) } });
  expect(validateCustomerAddress(makeAddress({ streetAddress: "  ", district: "", postalCode: "12A" }))).toMatchObject({ ok: false, errors: { streetAddress: expect.any(String), district: expect.any(String), postalCode: expect.any(String) } });
  expect(validateCustomerAddress(makeAddress({ phone: "+8801712345678", postalCode: "" }))).toMatchObject({ ok: true, value: { phone: "+8801712345678", postalCode: null } });
});

test("adds, edits, selects, and deletes addresses while keeping exactly one default", async () => {
  const store = await customerStore();
  const first = await addCustomerAddress(store, "customer-demo", makeAddress());
  expect(first).toMatchObject({ ok: true, address: { isDefault: true } });
  if (!first.ok || !first.address) throw new Error("Expected the first address to be saved");

  const second = await addCustomerAddress(store, "customer-demo", makeAddress({ label: "Work", area: "Motijheel", isDefault: false }));
  expect(second).toMatchObject({ ok: true, address: { isDefault: false } });
  if (!second.ok || !second.address) throw new Error("Expected the second address to be saved");
  expect(await setDefaultCustomerAddress(store, "customer-demo", second.address.id)).toMatchObject({ ok: true });

  const edited = await updateCustomerAddress(store, "customer-demo", second.address.id, makeAddress({ label: "Work", area: "Banani", isDefault: true }));
  expect(edited).toMatchObject({ ok: true, address: { area: "Banani", isDefault: true } });
  let addresses = store.getState().snapshot.data.customers.find(({ id }) => id === "customer-demo")?.addresses ?? [];
  expect(addresses.filter(({ isDefault }) => isDefault).map(({ id }) => id)).toEqual([second.address.id]);

  await deleteCustomerAddress(store, "customer-demo", second.address.id);
  addresses = store.getState().snapshot.data.customers.find(({ id }) => id === "customer-demo")?.addresses ?? [];
  expect(addresses).toHaveLength(1);
  expect(addresses[0]).toMatchObject({ id: first.address.id, isDefault: true });
  await deleteCustomerAddress(store, "customer-demo", first.address.id);
  expect(store.getState().snapshot.data.customers.find(({ id }) => id === "customer-demo")?.addresses).toEqual([]);
});

test("promotes the first remaining address when the default is deleted and persists by customer", async () => {
  const storage = memoryStorage();
  const store = await customerStore(createLocalStorageDemoStateAdapter(storage));
  const first = await addCustomerAddress(store, "customer-demo", makeAddress());
  const second = await addCustomerAddress(store, "customer-demo", makeAddress({ label: "Work" }));
  const third = await addCustomerAddress(store, "customer-demo", makeAddress({ label: "Other" }));
  if (!first.ok || !first.address || !second.ok || !second.address || !third.ok || !third.address) throw new Error("Expected addresses to be saved");

  await deleteCustomerAddress(store, "customer-demo", first.address.id);
  const current = store.getState().snapshot.data.customers.find(({ id }) => id === "customer-demo");
  expect(current?.addresses.map(({ id, isDefault }) => ({ id, isDefault }))).toEqual([
    { id: second.address.id, isDefault: true },
    { id: third.address.id, isDefault: false },
  ]);

  const restored = await customerStore(createLocalStorageDemoStateAdapter(storage));
  expect(restored.getState().snapshot.data.customers.find(({ id }) => id === "customer-demo")?.addresses).toEqual(current?.addresses);
});

test("address mutations are isolated by customer identity and cannot be used by other roles", async () => {
  const snapshot = createDemoSeedSnapshot();
  snapshot.data.accounts.push({ id: "account-customer-second", email: "second@example.test", displayName: "Second Customer", role: "customer", customerId: "customer-second", vendorId: null, createdAt: snapshot.savedAt });
  snapshot.data.customers.push({ id: "customer-second", accountId: "account-customer-second", fullName: "Second Customer", phone: "00000000001", addresses: [], preferences: { promotionalUpdates: false, productGridDensity: "standard" }, hiddenOrderIds: [], recentlyViewedProductIds: [], createdAt: snapshot.savedAt, updatedAt: snapshot.savedAt });
  snapshot.data.carts.push({ id: "cart-customer-second", customerId: "customer-second", items: [], updatedAt: snapshot.savedAt });
  snapshot.data.wishlists.push({ id: "wishlist-customer-second", customerId: "customer-second", productIds: [], updatedAt: snapshot.savedAt });
  const store = createDemoStateStore({ read: async () => snapshot, write: async () => undefined, clear: async () => undefined });
  await store.getState().hydrate();
  store.getState().setActiveAccount("account-customer-demo");
  const before = structuredClone(store.getState().snapshot.data);

  expect(await addCustomerAddress(store, "customer-second", makeAddress())).toMatchObject({ ok: false, reason: "customer_required" });
  expect(await addCustomerAddress(store, "customer-demo", makeAddress())).toMatchObject({ ok: true });
  expect(store.getState().snapshot.data.customers.find(({ id }) => id === "customer-second")?.addresses).toEqual([]);
  expect(store.getState().snapshot.data.carts).toEqual(before.carts);
  expect(store.getState().snapshot.data.wishlists).toEqual(before.wishlists);
  expect(store.getState().snapshot.data.customers.find(({ id }) => id === "customer-demo")?.fullName).toBe("Demo Customer");

  store.getState().setActiveAccount("account-admin-demo");
  expect(await addCustomerAddress(store, "customer-demo", makeAddress())).toMatchObject({ ok: false, reason: "customer_required" });
});

test("invalid address input leaves customer data unchanged", async () => {
  const store = await customerStore();
  const before = structuredClone(store.getState().snapshot.data.customers[0]);
  expect(await addCustomerAddress(store, "customer-demo", makeAddress({ phone: "invalid", streetAddress: "" }))).toMatchObject({ ok: false, reason: "invalid_input", errors: { phone: expect.any(String), streetAddress: expect.any(String) } });
  expect(store.getState().snapshot.data.customers[0]).toEqual(before);
});
