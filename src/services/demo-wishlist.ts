import { DEMO_SEED_CATALOG } from "@/services/demo-state-seed";
import type { DemoStateStoreApi, DemoTransactionResult } from "@/services/demo-state-store";
import type { DemoStateSnapshot, DemoWishlist } from "@/types/demo-state";
import type { Product } from "@/types/product";
import type { Vendor } from "@/types/vendor";

export interface DemoWishlistCatalog {
  products: readonly Product[];
  vendors: readonly Vendor[];
}

export type DemoWishlistIssue = "customer_required" | "product_not_found" | "product_unavailable" | "product_not_wishlisted";
export type DemoWishlistMutation = { ok: true; wishlistId: string; changed: boolean } | { ok: false; reason: DemoWishlistIssue };
export type DemoWishlistActionResult = DemoTransactionResult<DemoWishlistMutation>;

export interface DemoWishlistItemView {
  productId: Product["id"];
  product: Product | null;
  available: boolean;
  availability: "available" | "out_of_stock" | "unavailable";
}

export interface DemoWishlistSummary {
  wishlist: DemoWishlist | null;
  items: DemoWishlistItemView[];
  itemCount: number;
  availableItemCount: number;
}

const catalog: DemoWishlistCatalog = DEMO_SEED_CATALOG;

function customerWishlist(snapshot: DemoStateSnapshot, accountId: string): DemoWishlist | null {
  const account = snapshot.data.accounts.find(({ id }) => id === accountId);
  if (account?.role !== "customer" || !account.customerId) return null;
  return snapshot.data.wishlists.find(({ customerId }) => customerId === account.customerId) ?? null;
}

function productCanBeWishlisted(product: Product | undefined, catalogData: DemoWishlistCatalog): product is Product {
  if (!product || product.status !== "active") return false;
  return catalogData.vendors.some(({ id, status }) => id === product.vendorId && status === "approved");
}

function productIsAvailable(product: Product | undefined, catalogData: DemoWishlistCatalog): product is Product {
  if (!productCanBeWishlisted(product, catalogData)) return false;
  if (!product.trackInventory) return true;
  return product.hasVariants
    ? product.variants.some(({ stock }) => stock >= product.minOrderQty)
    : product.stock >= product.minOrderQty;
}

function productAvailability(product: Product | undefined, catalogData: DemoWishlistCatalog): DemoWishlistItemView["availability"] {
  if (!productCanBeWishlisted(product, catalogData)) return "unavailable";
  if (productIsAvailable(product, catalogData)) return "available";
  return "out_of_stock";
}

function ensureWishlist(snapshot: DemoStateSnapshot, customerId: string): DemoWishlist {
  let wishlist = snapshot.data.wishlists.find((entry) => entry.customerId === customerId);
  if (!wishlist) {
    wishlist = { id: `wishlist:${customerId}`, customerId, productIds: [], updatedAt: new Date().toISOString() };
    snapshot.data.wishlists.push(wishlist);
  }
  return wishlist;
}

function mutateWishlist(
  store: DemoStateStoreApi,
  mutate: (wishlist: DemoWishlist, snapshot: DemoStateSnapshot) => DemoWishlistMutation,
): Promise<DemoWishlistActionResult> {
  const accountId = store.getState().activeAccountId;
  return store.getState().transactSnapshot<DemoWishlistMutation>((snapshot) => {
    const account = snapshot.data.accounts.find(({ id }) => id === accountId);
    if (account?.role !== "customer" || !account.customerId) {
      return { snapshot: null, result: { ok: false, reason: "customer_required" } };
    }
    const wishlist = ensureWishlist(snapshot, account.customerId);
    const result = mutate(wishlist, snapshot);
    if (!result.ok || !result.changed) return { snapshot: null, result };
    wishlist.updatedAt = new Date().toISOString();
    return { snapshot, result };
  });
}

export function addWishlistProduct(store: DemoStateStoreApi, productId: string, catalogData: DemoWishlistCatalog = catalog): Promise<DemoWishlistActionResult> {
  return mutateWishlist(store, (wishlist) => {
    const product = catalogData.products.find(({ id }) => id === productId);
    if (!product) return { ok: false, reason: "product_not_found" };
    if (!productCanBeWishlisted(product, catalogData)) return { ok: false, reason: "product_unavailable" };
    if (wishlist.productIds.includes(productId)) return { ok: true, wishlistId: wishlist.id, changed: false };
    wishlist.productIds.push(productId);
    return { ok: true, wishlistId: wishlist.id, changed: true };
  });
}

export function removeWishlistProduct(store: DemoStateStoreApi, productId: string): Promise<DemoWishlistActionResult> {
  return mutateWishlist(store, (wishlist) => {
    const index = wishlist.productIds.indexOf(productId);
    if (index < 0) return { ok: false, reason: "product_not_wishlisted" };
    wishlist.productIds.splice(index, 1);
    return { ok: true, wishlistId: wishlist.id, changed: true };
  });
}

export function toggleWishlistProduct(store: DemoStateStoreApi, productId: string, catalogData: DemoWishlistCatalog = catalog): Promise<DemoWishlistActionResult> {
  return mutateWishlist(store, (wishlist) => {
    const index = wishlist.productIds.indexOf(productId);
    if (index >= 0) {
      wishlist.productIds.splice(index, 1);
      return { ok: true, wishlistId: wishlist.id, changed: true };
    }
    const product = catalogData.products.find(({ id }) => id === productId);
    if (!product) return { ok: false, reason: "product_not_found" };
    if (!productCanBeWishlisted(product, catalogData)) return { ok: false, reason: "product_unavailable" };
    wishlist.productIds.push(productId);
    return { ok: true, wishlistId: wishlist.id, changed: true };
  });
}

export function isProductWishlisted(snapshot: DemoStateSnapshot, accountId: string, productId: string): boolean {
  return customerWishlist(snapshot, accountId)?.productIds.includes(productId) ?? false;
}

export function selectCustomerWishlist(snapshot: DemoStateSnapshot, accountId: string): DemoWishlist | null {
  return customerWishlist(snapshot, accountId);
}

export function selectWishlistSummary(snapshot: DemoStateSnapshot, accountId: string, catalogData: DemoWishlistCatalog = catalog): DemoWishlistSummary {
  const wishlist = customerWishlist(snapshot, accountId);
  const items = wishlist?.productIds.map((productId) => {
    const product = catalogData.products.find(({ id }) => id === productId) ?? null;
    const availability = productAvailability(product ?? undefined, catalogData);
    return { productId, product, available: availability === "available", availability };
  }) ?? [];
  return {
    wishlist,
    items,
    itemCount: items.length,
    availableItemCount: items.filter(({ available }) => available).length,
  };
}
