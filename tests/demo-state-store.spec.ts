import { expect, test } from "@playwright/test";
import { createLocalStorageDemoStateAdapter, DEMO_STATE_STORAGE_KEY } from "@/services/demo-state-persistence";
import {
  createDemoStateStore,
  selectActiveAccountId,
  selectDemoSnapshot,
  selectHydrationReady,
} from "@/services/demo-state-store";
import { createDemoSeedSnapshot } from "@/services/demo-state-seed";
import type { DemoStatePersistenceAdapter } from "@/types/demo-state";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
    values,
  };
}

test("hydration hides the seed snapshot until persisted state is loaded", async () => {
  let finishRead: ((snapshot: ReturnType<typeof createDemoSeedSnapshot>) => void) | undefined;
  const persisted = createDemoSeedSnapshot();
  persisted.data.notifications.push({
    id: "notification-saved", recipientAccountId: "account-customer-demo", kind: "system", title: "Saved", message: "Persisted", href: null, readAt: null, createdAt: persisted.savedAt,
  });
  const adapter: DemoStatePersistenceAdapter = {
    read: () => new Promise((resolve) => { finishRead = resolve; }),
    write: async () => undefined,
    clear: async () => undefined,
  };
  const store = createDemoStateStore(adapter);
  expect(selectHydrationReady(store.getState())).toBe(false);
  expect(selectDemoSnapshot(store.getState())).toBeNull();
  const hydrating = store.getState().hydrate();
  finishRead?.(persisted);
  await hydrating;
  expect(selectHydrationReady(store.getState())).toBe(true);
  expect(selectDemoSnapshot(store.getState())?.data.notifications[0]?.id).toBe("notification-saved");
});

test("validated changes persist and survive store recreation", async () => {
  const storage = memoryStorage();
  const adapter = createLocalStorageDemoStateAdapter(storage);
  const firstStore = createDemoStateStore(adapter);
  await firstStore.getState().hydrate();
  const result = await firstStore.getState().applySnapshotUpdate((snapshot) => {
    snapshot.data.notifications.push({
      id: "notification-round-trip", recipientAccountId: "account-customer-demo", kind: "system", title: "Hello", message: "Saved state", href: null, readAt: null, createdAt: snapshot.savedAt,
    });
    return snapshot;
  });
  expect(result).toEqual({ ok: true, persisted: true });
  const secondStore = createDemoStateStore(createLocalStorageDemoStateAdapter(storage));
  await secondStore.getState().hydrate();
  expect(secondStore.getState().snapshot.data.notifications[0]?.id).toBe("notification-round-trip");
});

test("active demo account can switch without mutating the domain snapshot", async () => {
  const storage = memoryStorage();
  let writes = 0;
  const persistence = createLocalStorageDemoStateAdapter(storage);
  const adapter: DemoStatePersistenceAdapter = {
    read: () => persistence.read(),
    write: async (snapshot) => { writes += 1; await persistence.write(snapshot); },
    clear: () => persistence.clear(),
  };
  const store = createDemoStateStore(adapter);
  await store.getState().hydrate();
  const originalSnapshot = store.getState().snapshot;
  const adminId = originalSnapshot.data.accounts.find(({ role }) => role === "admin")?.id;
  expect(adminId).toBeTruthy();
  expect(store.getState().setActiveAccount(adminId ?? "missing-account")).toBe(adminId !== undefined);
  expect(selectActiveAccountId(store.getState())).toBe(adminId ?? null);
  expect(store.getState().snapshot).toBe(originalSnapshot);
  expect(writes).toBe(1);
});

test("reset restores memory and the persisted value to the deterministic seed", async () => {
  const storage = memoryStorage();
  const adapter = createLocalStorageDemoStateAdapter(storage);
  const store = createDemoStateStore(adapter);
  await store.getState().hydrate();
  await store.getState().applySnapshotUpdate((snapshot) => {
    snapshot.data.managedBanners.push({
      id: "banner-temporary", placement: "home_promo", title: "Temporary", body: "Temporary banner", imageUrl: null, imageAlt: "", href: "/", startsAt: null, endsAt: null, enabled: true, sortOrder: 1, updatedAt: snapshot.savedAt,
    });
    return snapshot;
  });
  const resetResult = await store.getState().resetToSeed();
  expect(resetResult).toEqual({ ok: true, persisted: true });
  expect(store.getState().snapshot).toEqual(createDemoSeedSnapshot());
  expect(await adapter.read()).toEqual(createDemoSeedSnapshot());
});

test("invalid persisted data is replaced by seed data during hydration", async () => {
  const storage = memoryStorage({ [DEMO_STATE_STORAGE_KEY]: JSON.stringify({ schemaVersion: 1, seedVersion: 1, data: { accounts: [] } }) });
  const store = createDemoStateStore(createLocalStorageDemoStateAdapter(storage));
  await store.getState().hydrate();
  expect(store.getState().snapshot).toEqual(createDemoSeedSnapshot());
  expect(JSON.parse(storage.getItem(DEMO_STATE_STORAGE_KEY) ?? "null")).toEqual(createDemoSeedSnapshot());
});

test("importing and creating a store never accesses browser storage during SSR", () => {
  expect(typeof window).toBe("undefined");
  const store = createDemoStateStore(() => {
    throw new Error("adapter factory should not run before hydrate");
  });
  expect(store.getState().hydrationStatus).toBe("pending");
});
