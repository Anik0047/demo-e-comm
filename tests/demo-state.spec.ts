import { expect, test } from "@playwright/test";
import { createDemoSeedSnapshot, resetDemoStateToSeed, DEMO_SEED_CATALOG } from "@/services/demo-state-seed";
import { createLocalStorageDemoStateAdapter, DEMO_STATE_STORAGE_KEY, validateDemoSnapshot } from "@/services/demo-state-persistence";
import { validateDemoState } from "@/types/demo-state";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
    values,
  };
}

test("seed is deterministic, relationally valid, and points at canonical catalog records", () => {
  const first = createDemoSeedSnapshot();
  const second = createDemoSeedSnapshot();
  expect(first).toEqual(second);
  expect(validateDemoState(first.data).valid).toBe(true);
  expect(first.data.accounts.filter(({ role }) => role === "vendor").length).toBeGreaterThan(1);
  expect(first.data.accounts.some(({ role }) => role === "admin")).toBe(true);
  expect(first.data.accounts.some(({ role }) => role === "customer")).toBe(true);
  expect(first.data.accounts.filter(({ vendorId }) => vendorId).every(({ vendorId }) => DEMO_SEED_CATALOG.vendors.some(({ id }) => id === vendorId))).toBe(true);
  expect(validateDemoSnapshot(first)).toBe(true);
});

test("local storage adapter round-trips a valid snapshot", async () => {
  const storage = memoryStorage();
  const adapter = createLocalStorageDemoStateAdapter(storage);
  const snapshot = createDemoSeedSnapshot();
  await adapter.write(snapshot);
  expect(storage.getItem(DEMO_STATE_STORAGE_KEY)).not.toBeNull();
  expect(await adapter.read()).toEqual(snapshot);
});

test("corrupted storage safely falls back to and repairs with the seed", async () => {
  const storage = memoryStorage({ [DEMO_STATE_STORAGE_KEY]: "{bad json" });
  const adapter = createLocalStorageDemoStateAdapter(storage);
  const fallback = await adapter.read();
  expect(fallback).toEqual(createDemoSeedSnapshot());
  expect(JSON.parse(storage.getItem(DEMO_STATE_STORAGE_KEY) ?? "null")).toEqual(fallback);
});

test("persisted snapshots with broken entity references are rejected", async () => {
  const invalid = createDemoSeedSnapshot();
  const firstCart = invalid.data.carts[0];
  if (firstCart) firstCart.customerId = "missing-customer";
  expect(validateDemoSnapshot(invalid)).toBe(false);
  const storage = memoryStorage({ [DEMO_STATE_STORAGE_KEY]: JSON.stringify(invalid) });
  expect(await createLocalStorageDemoStateAdapter(storage).read()).toEqual(createDemoSeedSnapshot());
});

test("unsupported seed and schema versions fall back to the current seed", async () => {
  for (const versionPatch of [{ seedVersion: 0 }, { seedVersion: 99 }, { schemaVersion: 99 }]) {
    const unsupported = { ...createDemoSeedSnapshot(), ...versionPatch };
    const storage = memoryStorage({ [DEMO_STATE_STORAGE_KEY]: JSON.stringify(unsupported) });
    expect(await createLocalStorageDemoStateAdapter(storage).read()).toEqual(createDemoSeedSnapshot());
  }
});

test("reset returns a fresh deterministic seed and does not mutate future resets", () => {
  const first = resetDemoStateToSeed();
  first.data.accounts.pop();
  expect(resetDemoStateToSeed()).toEqual(createDemoSeedSnapshot());
});

test("adapter clear removes the persisted snapshot", async () => {
  const storage = memoryStorage();
  const adapter = createLocalStorageDemoStateAdapter(storage);
  await adapter.write(createDemoSeedSnapshot());
  await adapter.clear();
  expect(storage.getItem(DEMO_STATE_STORAGE_KEY)).toBeNull();
});
