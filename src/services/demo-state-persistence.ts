import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import { classifyDemoSnapshot, DEFAULT_DEMO_CUSTOMER_PREFERENCES, validateDemoState } from "@/types/demo-state";
import type { DemoCustomerPreferences, DemoStateData, DemoStatePersistenceAdapter, DemoStateSnapshot } from "@/types/demo-state";
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
    for (const customer of value.data.customers) {
      if (typeof customer.preferences?.promotionalUpdates !== "boolean") return false;
      if (customer.preferences.productGridDensity !== "standard" && customer.preferences.productGridDensity !== "compact") return false;
    }
    for (const account of value.data.accounts) {
      if (account.role === "vendor" && (!account.vendorId || !catalogIds.vendors.has(account.vendorId))) return false;
      if (account.vendorId && !catalogIds.vendors.has(account.vendorId)) return false;
      if (account.customerId && !customerIds.has(account.customerId)) return false;
    }
    for (const customer of value.data.customers) if (!accountIds.has(customer.accountId)) return false;
    for (const cart of value.data.carts) for (const item of cart.items) if (!catalogIds.products.has(item.productId)) return false;
    for (const wishlist of value.data.wishlists) for (const id of wishlist.productIds) if (!catalogIds.products.has(id)) return false;
    for (const item of value.data.orderItems) {
      if (!catalogIds.products.has(item.productId) || !catalogIds.vendors.has(item.vendorId)) return false;
      if (item.selectedVariant && (typeof item.selectedVariant.id !== "string" || !isRecord(item.selectedVariant.optionValues)
        || !Object.values(item.selectedVariant.optionValues).every((optionValue) => typeof optionValue === "string"))) return false;
    }
    for (const group of value.data.fulfillmentGroups) if (!catalogIds.vendors.has(group.vendorId)) return false;
    return true;
  } catch {
    return false;
  }
}

function normalizeCustomerPreferences(value: unknown): DemoCustomerPreferences {
  const preferences = isRecord(value) ? value : {};
  return {
    promotionalUpdates: typeof preferences.promotionalUpdates === "boolean"
      ? preferences.promotionalUpdates
      : DEFAULT_DEMO_CUSTOMER_PREFERENCES.promotionalUpdates,
    productGridDensity: preferences.productGridDensity === "compact" || preferences.productGridDensity === "standard"
      ? preferences.productGridDensity
      : DEFAULT_DEMO_CUSTOMER_PREFERENCES.productGridDensity,
  };
}

function migrateOrderSnapshots(data: DemoStateData): Pick<DemoStateData, "orderItems" | "fulfillmentGroups"> {
  const groupsById = new Map(data.fulfillmentGroups.map((group) => [group.id, group]));
  const migratedItems = (data.orderItems as unknown[]).map((value) => {
    if (!isRecord(value)) return value;
    const product = products.find(({ id }) => id === value.productId);
    const group = typeof value.fulfillmentGroupId === "string" ? groupsById.get(value.fulfillmentGroupId) : undefined;
    const variantId = typeof value.variantId === "string" ? value.variantId : null;
    const canonicalVariant = product?.variants.find(({ id }) => id === variantId);
    const selectedVariant = variantId === null
      ? null
      : canonicalVariant
        ? { id: canonicalVariant.id, optionValues: { ...canonicalVariant.optionValues } }
        : { id: variantId, optionValues: {} };
    return {
      ...value,
      vendorId: group?.vendorId ?? product?.vendorId ?? value.vendorId,
      selectedVariant,
    };
  });
  const itemsById = new Map(migratedItems.filter(isRecord).map((item) => [item.id, item]));
  const migratedGroups = (data.fulfillmentGroups as unknown[]).map((value) => {
    if (!isRecord(value)) return value;
    const itemIds = Array.isArray(value.itemIds) ? value.itemIds.filter((id): id is string => typeof id === "string") : [];
    const subtotal = itemIds.reduce((total, itemId) => {
      const item = itemsById.get(itemId);
      return total + (typeof item?.lineTotal === "number" ? item.lineTotal : 0);
    }, 0);
    return { ...value, subtotal };
  });
  return {
    orderItems: migratedItems as DemoStateData["orderItems"],
    fulfillmentGroups: migratedGroups as DemoStateData["fulfillmentGroups"],
  };
}

/** Adds order-time vendor/variant snapshots while preserving all schema-v2 demo records. */
export function migrateDemoSnapshot(value: unknown): DemoStateSnapshot | null {
  if (!isDemoStateSnapshot(value)) return null;
  const compatibility = classifyDemoSnapshot(value);
  if (compatibility.kind === "reset_seed") return null;
  if (compatibility.kind === "migrate_schema" && ![1, 2].includes(compatibility.fromSchemaVersion)) return null;

  const orderSnapshots = compatibility.kind === "migrate_schema"
    ? migrateOrderSnapshots(value.data as DemoStateData)
    : { orderItems: value.data.orderItems, fulfillmentGroups: value.data.fulfillmentGroups };

  const snapshot: DemoStateSnapshot = {
    ...value,
    schemaVersion: compatibility.kind === "migrate_schema" ? compatibility.toSchemaVersion : value.schemaVersion,
    data: {
      ...value.data,
      customers: value.data.customers.map((customer) => ({
        ...customer,
        preferences: normalizeCustomerPreferences(customer.preferences),
      })),
      ...orderSnapshots,
    },
  };
  if (!validateDemoSnapshot(snapshot)) return null;
  return JSON.stringify(snapshot) === JSON.stringify(value) ? value : snapshot;
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
        const migrated = migrateDemoSnapshot(parsed);
        if (migrated) {
          if (migrated !== parsed) {
            try {
              storage.setItem(key, JSON.stringify(migrated));
            } catch {
              // The migrated snapshot remains usable for this session if storage is unavailable.
            }
          }
          return migrated;
        }
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
