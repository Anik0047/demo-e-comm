import { createStore } from "zustand/vanilla";
import { createDemoSeedSnapshot, resetDemoStateToSeed } from "@/services/demo-state-seed";
import { clearDemoAccountPreference, readDemoAccountPreference, writeDemoAccountPreference } from "@/services/demo-account-preference";
import { createBrowserDemoStateAdapter, migrateDemoSnapshot, validateDemoSnapshot } from "@/services/demo-state-persistence";
import type { DemoStatePersistenceAdapter, DemoStateSnapshot } from "@/types/demo-state";

export type DemoHydrationStatus = "pending" | "ready";
export type DemoPersistenceStatus = "available" | "unavailable";
export type DemoUpdateResult =
  | { ok: true; persisted: boolean }
  | { ok: false; reason: "not_hydrated" | "invalid_snapshot" };
export type DemoTransactionResult<T> =
  | { ok: true; persisted: boolean; result: T }
  | { ok: false; reason: "not_hydrated" | "invalid_snapshot" };
export type DemoSnapshotTransaction<T> = (current: DemoStateSnapshot) => { snapshot: DemoStateSnapshot | null; result: T };

export interface DemoStateStore {
  snapshot: DemoStateSnapshot;
  activeAccountId: string;
  hydrationStatus: DemoHydrationStatus;
  persistenceStatus: DemoPersistenceStatus;
  hydrate(): Promise<void>;
  getCurrentSnapshot(): DemoStateSnapshot | null;
  setActiveAccount(accountId: string): boolean;
  applySnapshotUpdate(update: (current: DemoStateSnapshot) => DemoStateSnapshot): Promise<DemoUpdateResult>;
  transactSnapshot<T>(transaction: DemoSnapshotTransaction<T>, options?: { requirePersistence?: boolean }): Promise<DemoTransactionResult<T>>;
  resetToSeed(): Promise<DemoUpdateResult>;
}

export type DemoStateStoreApi = ReturnType<typeof createDemoStateStore>;
export type DemoStateAdapterFactory = () => DemoStatePersistenceAdapter | null;

const defaultAdapterFactory: DemoStateAdapterFactory = createBrowserDemoStateAdapter;

function initialActiveAccountId(snapshot: DemoStateSnapshot): string {
  return snapshot.data.accounts.find(({ role }) => role === "customer")?.id
    ?? snapshot.data.accounts[0]?.id
    ?? "";
}

/** Creates an isolated store instance. Storage is only requested by hydrate(). */
export function createDemoStateStore(
  adapterOrFactory?: DemoStatePersistenceAdapter | DemoStateAdapterFactory | null,
) {
  const adapterFactory: DemoStateAdapterFactory = typeof adapterOrFactory === "function"
    ? adapterOrFactory
    : () => adapterOrFactory ?? defaultAdapterFactory();
  let adapter: DemoStatePersistenceAdapter | null = null;
  let hydrationPromise: Promise<void> | null = null;
  let mutationQueue: Promise<void> = Promise.resolve();
  const seed = createDemoSeedSnapshot();

  const store = createStore<DemoStateStore>((set, get) => ({
    snapshot: seed,
    activeAccountId: initialActiveAccountId(seed),
    hydrationStatus: "pending",
    persistenceStatus: "unavailable",

    async hydrate() {
      if (get().hydrationStatus === "ready") return;
      if (hydrationPromise) return hydrationPromise;
      hydrationPromise = (async () => {
        try {
          adapter = adapterFactory();
          const persisted = await adapter?.read() ?? null;
          const snapshot = persisted ? migrateDemoSnapshot(persisted) ?? createDemoSeedSnapshot() : createDemoSeedSnapshot();
          const preferredAccountId = readDemoAccountPreference();
          const activeAccountId = snapshot.data.accounts.some(({ id }) => id === preferredAccountId)
            ? preferredAccountId ?? initialActiveAccountId(snapshot)
            : initialActiveAccountId(snapshot);
          if (preferredAccountId && activeAccountId !== preferredAccountId) clearDemoAccountPreference();
          set({
            snapshot,
            activeAccountId,
            hydrationStatus: "ready",
            persistenceStatus: adapter ? "available" : "unavailable",
          });
          if (adapter && (!persisted || snapshot !== persisted)) {
            try {
              await adapter.write(snapshot);
            } catch {
              set({ persistenceStatus: "unavailable" });
            }
          }
        } catch {
          adapter = null;
          set({
            snapshot: createDemoSeedSnapshot(),
            activeAccountId: initialActiveAccountId(createDemoSeedSnapshot()),
            hydrationStatus: "ready",
            persistenceStatus: "unavailable",
          });
        }
      })();
      return hydrationPromise;
    },

    getCurrentSnapshot() {
      return get().hydrationStatus === "ready" ? get().snapshot : null;
    },

    setActiveAccount(accountId) {
      const state = get();
      if (state.hydrationStatus !== "ready" || !state.snapshot.data.accounts.some(({ id }) => id === accountId)) return false;
      writeDemoAccountPreference(accountId);
      if (state.activeAccountId !== accountId) set({ activeAccountId: accountId });
      return true;
    },

    applySnapshotUpdate(update) {
      return enqueue(async () => {
        const current = get();
        if (current.hydrationStatus !== "ready") return { ok: false, reason: "not_hydrated" } as const;
        let next: DemoStateSnapshot;
        try {
          next = update(structuredClone(current.snapshot));
          next = { ...next, savedAt: new Date().toISOString() };
        } catch {
          return { ok: false, reason: "invalid_snapshot" } as const;
        }
        if (!validateDemoSnapshot(next)) return { ok: false, reason: "invalid_snapshot" } as const;
        const activeAccountId = next.data.accounts.some(({ id }) => id === current.activeAccountId)
          ? current.activeAccountId
          : initialActiveAccountId(next);
        set({ snapshot: next, activeAccountId });
        const persisted = await persist(next);
        return { ok: true, persisted } as const;
      });
    },

    transactSnapshot<T>(transaction: DemoSnapshotTransaction<T>, options?: { requirePersistence?: boolean }): Promise<DemoTransactionResult<T>> {
      return enqueue(async () => {
        const current = get();
        if (current.hydrationStatus !== "ready") return { ok: false, reason: "not_hydrated" } as const;
        let outcome: { snapshot: DemoStateSnapshot | null; result: T };
        try {
          outcome = transaction(structuredClone(current.snapshot));
          if (outcome.snapshot === null) return { ok: true, persisted: false, result: outcome.result } as const;
          outcome = { ...outcome, snapshot: { ...outcome.snapshot, savedAt: new Date().toISOString() } };
        } catch {
          return { ok: false, reason: "invalid_snapshot" } as const;
        }
        if (!validateDemoSnapshot(outcome.snapshot)) return { ok: false, reason: "invalid_snapshot" } as const;
        if (options?.requirePersistence) {
          const persisted = await persist(outcome.snapshot);
          if (!persisted) return { ok: false, reason: "invalid_snapshot" } as const;
          const latestActiveAccountId = get().activeAccountId;
          const activeAccountId = outcome.snapshot.data.accounts.some(({ id }) => id === latestActiveAccountId)
            ? latestActiveAccountId
            : initialActiveAccountId(outcome.snapshot);
          set({ snapshot: outcome.snapshot, activeAccountId });
          return { ok: true, persisted: true, result: outcome.result } as const;
        }
        const latestActiveAccountId = get().activeAccountId;
        const activeAccountId = outcome.snapshot.data.accounts.some(({ id }) => id === latestActiveAccountId)
          ? latestActiveAccountId
          : initialActiveAccountId(outcome.snapshot);
        set({ snapshot: outcome.snapshot, activeAccountId });
        const persisted = await persist(outcome.snapshot);
        return { ok: true, persisted, result: outcome.result } as const;
      });
    },

    resetToSeed() {
      return enqueue(async () => {
        if (get().hydrationStatus !== "ready") return { ok: false, reason: "not_hydrated" } as const;
        const snapshot = resetDemoStateToSeed();
        const activeAccountId = initialActiveAccountId(snapshot);
        writeDemoAccountPreference(activeAccountId);
        set({ snapshot, activeAccountId });
        const persisted = await persist(snapshot);
        return { ok: true, persisted } as const;
      });
    },
  }));

  async function persist(snapshot: DemoStateSnapshot): Promise<boolean> {
    if (!adapter) {
      store.setState({ persistenceStatus: "unavailable" });
      return false;
    }
    try {
      await adapter.write(snapshot);
      store.setState({ persistenceStatus: "available" });
      return true;
    } catch {
      store.setState({ persistenceStatus: "unavailable" });
      return false;
    }
  }

  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = mutationQueue.then(operation, operation);
    mutationQueue = result.then(() => undefined, () => undefined);
    return result;
  }

  return store;
}

/** Client singleton. Importing it does not read window or localStorage. */
export const demoStateStore = createDemoStateStore();

export const selectDemoSnapshot = (state: DemoStateStore): DemoStateSnapshot | null =>
  state.hydrationStatus === "ready" ? state.snapshot : null;
export const selectHydrationReady = (state: DemoStateStore): boolean => state.hydrationStatus === "ready";
export const selectActiveAccountId = (state: DemoStateStore): string | null =>
  state.hydrationStatus === "ready" ? state.activeAccountId : null;
export const selectActiveAccount = (state: DemoStateStore) => state.hydrationStatus === "ready"
  ? state.snapshot.data.accounts.find(({ id }) => id === state.activeAccountId) ?? null
  : null;
/** Returns a customer ID only when it is linked back to the active customer account. */
export const selectActiveCustomerId = (state: DemoStateStore): string | null => {
  if (state.hydrationStatus !== "ready") return null;
  const account = state.snapshot.data.accounts.find(({ id }) => id === state.activeAccountId);
  if (account?.role !== "customer" || !account.customerId) return null;
  return state.snapshot.data.customers.some(({ id, accountId }) => id === account.customerId && accountId === account.id)
    ? account.customerId
    : null;
};
export const selectDemoCarts = (state: DemoStateStore) => state.hydrationStatus === "ready" ? state.snapshot.data.carts : null;
export const selectDemoWishlists = (state: DemoStateStore) => state.hydrationStatus === "ready" ? state.snapshot.data.wishlists : null;
export const selectDemoOrders = (state: DemoStateStore) => state.hydrationStatus === "ready" ? state.snapshot.data.orders : null;
export const selectDemoNotifications = (state: DemoStateStore) => state.hydrationStatus === "ready" ? state.snapshot.data.notifications : null;
export const selectPersistenceStatus = (state: DemoStateStore): DemoPersistenceStatus => state.persistenceStatus;
