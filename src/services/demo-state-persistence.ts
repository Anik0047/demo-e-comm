import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import { classifyDemoSnapshot, validateDemoState } from "@/types/demo-state";
import type { DemoStatePersistenceAdapter, DemoStateSnapshot } from "@/types/demo-state";
import { createDemoSeedSnapshot } from "@/services/demo-state-seed";

export const DEMO_STATE_STORAGE_KEY = "kenakata:demo-state";

const catalogIds = {
  products: new Set(products.map(({ id }) => id)),
  vendors: new Set(vendors.map(({ id }) => id)),
  categories: new Set(categories.map(({ id }) => id)),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Structural check before validating references. JSON data is untrusted even in a demo. */
export function isDemoStateSnapshot(value: unknown): value is DemoStateSnapshot {
  if (!isRecord(value) || !isRecord(value.data)) return false;
  const data = value.data;
  const arrays = ["accounts", "customers", "carts", "wishlists", "orders", "orderItems", "fulfillmentGroups", "notifications", "managedBanners"];
  if (!arrays.every((key) => Array.isArray(data[key]))) return false;
  const entityArrays = arrays.map((key) => data[key] as unknown[]);
  if (!entityArrays.every((items) => items.every((item) => isRecord(item) && typeof item.id === "string" && item.id.length > 0))) return false;
  const hasNestedArray = (key: string, nestedKey: string) => (data[key] as unknown[]).every((item) => isRecord(item) && Array.isArray(item[nestedKey]));
  if (!hasNestedArray("customers", "addresses") || !hasNestedArray("carts", "items")
    || !hasNestedArray("wishlists", "productIds") || !hasNestedArray("orders", "fulfillmentGroupIds")
    || !hasNestedArray("fulfillmentGroups", "itemIds")) return false;
  return Number.isSafeInteger(value.schemaVersion)
    && Number.isSafeInteger(value.seedVersion)
    && typeof value.savedAt === "string";
}

export function validateDemoSnapshot(value: unknown): value is DemoStateSnapshot {
  if (!isDemoStateSnapshot(value)) return false;
  try {
    if (classifyDemoSnapshot(value).kind !== "compatible") return false;
    const { valid } = validateDemoState(value.data);
    if (!valid) return false;
    const accountIds = new Set(value.data.accounts.map(({ id }) => id));
    const customerIds = new Set(value.data.customers.map(({ id }) => id));
    for (const account of value.data.accounts) {
      if (account.role === "vendor" && (!account.vendorId || !catalogIds.vendors.has(account.vendorId))) return false;
      if (account.vendorId && !catalogIds.vendors.has(account.vendorId)) return false;
      if (account.customerId && !customerIds.has(account.customerId)) return false;
    }
    for (const customer of value.data.customers) if (!accountIds.has(customer.accountId)) return false;
    for (const cart of value.data.carts) for (const item of cart.items) if (!catalogIds.products.has(item.productId)) return false;
    for (const wishlist of value.data.wishlists) for (const id of wishlist.productIds) if (!catalogIds.products.has(id)) return false;
    for (const item of value.data.orderItems) if (!catalogIds.products.has(item.productId)) return false;
    for (const group of value.data.fulfillmentGroups) if (!catalogIds.vendors.has(group.vendorId)) return false;
    return true;
  } catch {
    return false;
  }
}

export interface DemoStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Safe, injectable localStorage adapter. Storage is only accessed when an adapter is created. */
export function createLocalStorageDemoStateAdapter(storage: DemoStorage, key = DEMO_STATE_STORAGE_KEY): DemoStatePersistenceAdapter {
  return {
    async read() {
      let raw: string | null;
      try {
        raw = storage.getItem(key);
      } catch {
        return null;
      }
      if (raw === null) return null;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (validateDemoSnapshot(parsed)) return parsed;
      } catch {
        // Invalid JSON or inaccessible data falls back to a fresh seed below.
      }
      const fallback = createDemoSeedSnapshot();
      try {
        storage.setItem(key, JSON.stringify(fallback));
      } catch {
        // The current caller still receives usable seed state if persistence is unavailable.
      }
      return fallback;
    },
    async write(snapshot) {
      if (!validateDemoSnapshot(snapshot)) throw new TypeError("Cannot persist an invalid demo state snapshot");
      storage.setItem(key, JSON.stringify(snapshot));
    },
    async clear() {
      storage.removeItem(key);
    },
  };
}

/** Server-safe factory: returns null during SSR and never reads browser globals there. */
export function createBrowserDemoStateAdapter(): DemoStatePersistenceAdapter | null {
  if (typeof window === "undefined") return null;
  try {
    return createLocalStorageDemoStateAdapter(window.localStorage);
  } catch {
    return null;
  }
}
