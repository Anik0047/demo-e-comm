import { DEMO_SEED_CATALOG } from "@/services/demo-state-seed";
import { getProductDetails } from "@/services/product-details";
import { projectProductCard } from "@/services/product-card";
import type { DemoStateStoreApi, DemoTransactionResult } from "@/services/demo-state-store";
import type { DemoStateSnapshot } from "@/types/demo-state";
import { DEMO_RECENTLY_VIEWED_LIMIT } from "@/types/demo-state";
import type { Product, ProductCardData } from "@/types/product";
import type { Vendor } from "@/types/vendor";

export interface RecentlyViewedCatalog {
  products: readonly Product[];
  vendors: readonly Vendor[];
}

export const RECENTLY_VIEWED_LIMIT = DEMO_RECENTLY_VIEWED_LIMIT;
const catalog: RecentlyViewedCatalog = DEMO_SEED_CATALOG;

export type RecentlyViewedMutation =
  | { ok: true; changed: boolean }
  | { ok: false; reason: "customer_required" | "product_not_found" | "product_unavailable" };
export type RecentlyViewedActionResult = DemoTransactionResult<RecentlyViewedMutation>;

function activeCustomer(snapshot: DemoStateSnapshot, accountId: string) {
  const account = snapshot.data.accounts.find(({ id }) => id === accountId);
  if (account?.role !== "customer" || !account.customerId) return null;
  return snapshot.data.customers.find(({ id, accountId: owner }) => id === account.customerId && owner === account.id) ?? null;
}

function isEligibleProduct(product: Product | undefined, catalogData: RecentlyViewedCatalog): product is Product {
  return Boolean(product && product.status === "active"
    && catalogData.vendors.some(({ id, status }) => id === product.vendorId && status === "approved"));
}

export function selectRecentlyViewedProductIds(snapshot: DemoStateSnapshot, accountId: string): string[] {
  const customer = activeCustomer(snapshot, accountId);
  return customer ? [...customer.recentlyViewedProductIds] : [];
}

/** Records canonical catalog IDs only, after hydration; repeats move to the front. */
export function recordRecentlyViewedProduct(
  store: DemoStateStoreApi,
  productId: string,
  catalogData: RecentlyViewedCatalog = catalog,
): Promise<RecentlyViewedActionResult> {
  const accountId = store.getState().activeAccountId;
  return store.getState().transactSnapshot<RecentlyViewedMutation>((snapshot) => {
    const customer = activeCustomer(snapshot, accountId);
    if (!customer) return { snapshot: null, result: { ok: false, reason: "customer_required" } };
    const product = catalogData.products.find(({ id }) => id === productId);
    if (!product) return { snapshot: null, result: { ok: false, reason: "product_not_found" } };
    if (!isEligibleProduct(product, catalogData)) return { snapshot: null, result: { ok: false, reason: "product_unavailable" } };
    const nextIds = [product.id, ...customer.recentlyViewedProductIds.filter((id) => id !== product.id)].slice(0, RECENTLY_VIEWED_LIMIT);
    const changed = nextIds.some((id, index) => customer.recentlyViewedProductIds[index] !== id)
      || customer.recentlyViewedProductIds.length !== nextIds.length;
    if (!changed) return { snapshot: null, result: { ok: true, changed: false } };
    customer.recentlyViewedProductIds = nextIds;
    customer.updatedAt = new Date().toISOString();
    return { snapshot, result: { ok: true, changed: true } };
  });
}

/** Resolves saved IDs against the current canonical product, vendor, category and price data. */
export async function resolveRecentlyViewedProducts(productIds: readonly string[], now = Date.now()): Promise<ProductCardData[]> {
  const products = await Promise.all(productIds.map(async (id) => {
    const product = catalog.products.find(({ id: productId }) => productId === id);
    if (!product) return null;
    const details = await getProductDetails(product.slug);
    if (!details || details.product.id !== id) return null;
    return projectProductCard(details.product, details.vendor, {
      inStock: !details.product.trackInventory || (details.product.hasVariants
        ? details.product.variants.some(({ stock }) => stock >= details.product.minOrderQty)
        : details.product.stock >= details.product.minOrderQty),
    }, now, details.deals);
  }));
  return products.filter((product): product is ProductCardData => product !== null);
}
