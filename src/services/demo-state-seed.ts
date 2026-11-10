import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import { DEMO_SEED_VERSION, DEMO_STATE_SCHEMA_VERSION } from "@/types/demo-state";
import type { DemoStateData, DemoStateSnapshot } from "@/types/demo-state";

const SEEDED_AT = "2026-01-01T00:00:00.000Z";

const seedData: DemoStateData = {
  accounts: [
    { id: "account-admin-demo", email: "admin@kenakata.test", displayName: "Demo Admin", role: "admin", customerId: null, vendorId: null, createdAt: SEEDED_AT },
    ...vendors.slice(0, 3).map((vendor) => ({
      id: `account-${vendor.id}`,
      email: `${vendor.slug}@vendors.kenakata.test`,
      displayName: `${vendor.name} seller`,
      role: "vendor" as const,
      customerId: null,
      vendorId: vendor.id,
      createdAt: SEEDED_AT,
    })),
    { id: "account-customer-demo", email: "customer@kenakata.test", displayName: "Demo Customer", role: "customer", customerId: "customer-demo", vendorId: null, createdAt: SEEDED_AT },
  ],
  customers: [{
    id: "customer-demo", accountId: "account-customer-demo", fullName: "Demo Customer", phone: "00000000000", addresses: [], createdAt: SEEDED_AT, updatedAt: SEEDED_AT,
  }],
  carts: [{ id: "cart-customer-demo", customerId: "customer-demo", items: [], updatedAt: SEEDED_AT }],
  wishlists: [{ id: "wishlist-customer-demo", customerId: "customer-demo", productIds: [], updatedAt: SEEDED_AT }],
  orders: [],
  orderItems: [],
  fulfillmentGroups: [],
  notifications: [],
  managedBanners: [],
};

/** Stable identity records point to canonical catalog entities; no credentials are seeded. */
export const DEMO_SEED_CATALOG = { products, vendors, categories } as const;

/** Returns a fresh copy so consumers can mutate demo state without changing the seed. */
export function createDemoSeedSnapshot(): DemoStateSnapshot {
  return {
    schemaVersion: DEMO_STATE_SCHEMA_VERSION,
    seedVersion: DEMO_SEED_VERSION,
    savedAt: SEEDED_AT,
    data: structuredClone(seedData),
  };
}

/** Pure reset operation: reset state to a fresh deterministic seed snapshot. */
export function resetDemoStateToSeed(): DemoStateSnapshot {
  return createDemoSeedSnapshot();
}
