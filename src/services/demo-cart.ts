import { DEMO_SEED_CATALOG } from "@/services/demo-state-seed";
import { getCompleteVariants } from "@/services/product-variant-selection";
import type { DemoStateStoreApi, DemoTransactionResult } from "@/services/demo-state-store";
import type { DemoCart, DemoCartItem, DemoStateSnapshot } from "@/types/demo-state";
import type { Product, ProductVariant } from "@/types/product";
import type { Vendor } from "@/types/vendor";

export interface DemoCartCatalog {
  products: readonly Product[];
  vendors: readonly Vendor[];
}

export type DemoCartIssue =
  | "customer_required"
  | "product_unavailable"
  | "vendor_unavailable"
  | "variant_required"
  | "variant_unavailable"
  | "invalid_quantity"
  | "below_minimum"
  | "above_maximum"
  | "insufficient_stock"
  | "cart_line_not_found";

export type DemoCartActionResult = DemoTransactionResult<
  | { ok: true; lineId?: string }
  | { ok: false; reason: DemoCartIssue }
>;
type CartMutationResult = { ok: true; lineId?: string } | { ok: false; reason: DemoCartIssue };

export interface DemoCartLineView {
  item: DemoCartItem;
  product: Product | null;
  variant: ProductVariant | null;
  unitPrice: number | null;
  lineTotal: number | null;
  available: boolean;
  issue: Extract<DemoCartIssue, "product_unavailable" | "vendor_unavailable" | "variant_unavailable" | "invalid_quantity" | "below_minimum" | "above_maximum" | "insufficient_stock"> | null;
}

export interface DemoCartSummary {
  cart: DemoCart | null;
  lines: DemoCartLineView[];
  itemCount: number;
  lineCount: number;
  subtotal: number;
}

export interface CartLineIdentity { productId: string; variantId?: string | null }
export interface AddCartItemInput extends CartLineIdentity { quantity: number }

const catalog: DemoCartCatalog = DEMO_SEED_CATALOG;

function customerCart(snapshot: DemoStateSnapshot, activeAccountId: string): DemoCart | null {
  const account = snapshot.data.accounts.find(({ id }) => id === activeAccountId);
  if (account?.role !== "customer" || !account.customerId) return null;
  return snapshot.data.carts.find(({ customerId }) => customerId === account.customerId) ?? null;
}

function lineKey({ productId, variantId }: CartLineIdentity): string {
  return `${productId}\u0000${variantId ?? ""}`;
}

function findProduct(catalogData: DemoCartCatalog, productId: string): Product | undefined {
  return catalogData.products.find(({ id }) => id === productId);
}

function findVendor(catalogData: DemoCartCatalog, product: Product): Vendor | undefined {
  return catalogData.vendors.find(({ id }) => id === product.vendorId);
}

function findOrderableProduct(
  catalogData: DemoCartCatalog,
  productId: string,
): { product: Product; vendor: Vendor } | DemoCartIssue {
  const product = findProduct(catalogData, productId);
  if (!product || product.status !== "active") return "product_unavailable";
  const vendor = findVendor(catalogData, product);
  if (!vendor || vendor.status !== "approved") return "vendor_unavailable";
  return { product, vendor };
}

function resolveLine(
  item: DemoCartItem,
  catalogData: DemoCartCatalog,
): DemoCartLineView {
  const product = findProduct(catalogData, item.productId) ?? null;
  if (!product || product.status !== "active") {
    return { item, product, variant: null, unitPrice: null, lineTotal: null, available: false, issue: "product_unavailable" };
  }
  const vendor = findVendor(catalogData, product);
  if (!vendor || vendor.status !== "approved") {
    return { item, product, variant: null, unitPrice: null, lineTotal: null, available: false, issue: "vendor_unavailable" };
  }
  const variant = item.variantId ? getCompleteVariants(product).find(({ id }) => id === item.variantId) ?? null : null;
  if ((product.hasVariants && !variant) || (!product.hasVariants && item.variantId) || (variant && !product.options.length)) {
    return { item, product, variant, unitPrice: null, lineTotal: null, available: false, issue: "variant_unavailable" };
  }
  const unitPrice = variant?.price ?? product.price;
  const issue = validateQuantity(product, variant, item.quantity);
  const available = issue === null;
  return {
    item,
    product,
    variant,
    unitPrice,
    lineTotal: available ? unitPrice * item.quantity : null,
    available,
    issue,
  };
}

type QuantityIssue = Extract<DemoCartIssue, "invalid_quantity" | "below_minimum" | "above_maximum" | "insufficient_stock">;

function validateQuantity(product: Product, variant: ProductVariant | null, quantity: number): QuantityIssue | null {
  if (!Number.isSafeInteger(quantity) || quantity < 1) return "invalid_quantity";
  if (quantity < product.minOrderQty) return "below_minimum";
  if (quantity > product.maxOrderQty) return "above_maximum";
  if (product.trackInventory && quantity > (variant?.stock ?? product.stock)) return "insufficient_stock";
  return null;
}

function lineId(customerId: string, identity: CartLineIdentity): string {
  return `cart-line:${encodeURIComponent(customerId)}:${encodeURIComponent(identity.productId)}:${encodeURIComponent(identity.variantId ?? "default")}`;
}

function ensureCart(snapshot: DemoStateSnapshot, customerId: string): DemoCart {
  let cart = snapshot.data.carts.find((entry) => entry.customerId === customerId);
  if (!cart) {
    cart = { id: `cart:${customerId}`, customerId, items: [], updatedAt: new Date().toISOString() };
    snapshot.data.carts.push(cart);
  }
  return cart;
}

function runAction(
  store: DemoStateStoreApi,
  mutate: (snapshot: DemoStateSnapshot, customerId: string, cart: DemoCart) => CartMutationResult,
): Promise<DemoCartActionResult> {
  const activeAccountId = store.getState().activeAccountId;
  return store.getState().transactSnapshot<CartMutationResult>((snapshot) => {
    const account = snapshot.data.accounts.find(({ id }) => id === activeAccountId);
    if (account?.role !== "customer" || !account.customerId) {
      return { snapshot: null, result: { ok: false, reason: "customer_required" } as const };
    }
    const cart = ensureCart(snapshot, account.customerId);
    const result = mutate(snapshot, account.customerId, cart);
    if (!result.ok) return { snapshot: null, result };
    cart.updatedAt = new Date().toISOString();
    return { snapshot, result };
  });
}

export function addCartItem(
  store: DemoStateStoreApi,
  input: AddCartItemInput,
  catalogData: DemoCartCatalog = catalog,
): Promise<DemoCartActionResult> {
  return runAction(store, (_snapshot, customerId, cart) => {
    const resolved = findOrderableProduct(catalogData, input.productId);
    if (typeof resolved === "string") return { ok: false, reason: resolved };
    const { product } = resolved;
    const variantId = input.variantId ?? null;
    const variant = variantId ? getCompleteVariants(product).find(({ id }) => id === variantId) ?? null : null;
    if ((product.hasVariants && !variant) || (!product.hasVariants && variantId) || (variant && !product.options.length)) {
      return { ok: false, reason: product.hasVariants && !variantId ? "variant_required" : "variant_unavailable" };
    }
    const matching = cart.items.find((item) => lineKey(item) === lineKey({ productId: product.id, variantId }));
    const quantity = input.quantity + (matching?.quantity ?? 0);
    const issue = validateQuantity(product, variant, quantity);
    if (issue) return { ok: false, reason: issue };
    if (matching) matching.quantity = quantity;
    else cart.items.push({ id: lineId(customerId, { productId: product.id, variantId }), productId: product.id, variantId, quantity: input.quantity, addedAt: new Date().toISOString() });
    return { ok: true, lineId: matching?.id ?? lineId(customerId, { productId: product.id, variantId }) };
  });
}

export function updateCartItemQuantity(
  store: DemoStateStoreApi,
  identity: CartLineIdentity,
  quantity: number,
  catalogData: DemoCartCatalog = catalog,
): Promise<DemoCartActionResult> {
  return runAction(store, (_snapshot, _customerId, cart) => {
    const item = cart.items.find((entry) => lineKey(entry) === lineKey(identity));
    if (!item) return { ok: false, reason: "cart_line_not_found" };
    const resolved = findOrderableProduct(catalogData, item.productId);
    if (typeof resolved === "string") return { ok: false, reason: resolved };
    const variant = item.variantId ? getCompleteVariants(resolved.product).find(({ id }) => id === item.variantId) ?? null : null;
    if ((resolved.product.hasVariants && !variant) || (!resolved.product.hasVariants && item.variantId)) return { ok: false, reason: "variant_unavailable" };
    const issue = validateQuantity(resolved.product, variant, quantity);
    if (issue) return { ok: false, reason: issue };
    item.quantity = quantity;
    return { ok: true, lineId: item.id };
  });
}

export function removeCartItem(store: DemoStateStoreApi, identity: CartLineIdentity): Promise<DemoCartActionResult> {
  return runAction(store, (_snapshot, _customerId, cart) => {
    const index = cart.items.findIndex((entry) => lineKey(entry) === lineKey(identity));
    if (index < 0) return { ok: false, reason: "cart_line_not_found" };
    const [removed] = cart.items.splice(index, 1);
    return { ok: true, lineId: removed?.id };
  });
}

export function clearCart(store: DemoStateStoreApi): Promise<DemoCartActionResult> {
  return runAction(store, (_snapshot, _customerId, cart) => {
    cart.items = [];
    return { ok: true };
  });
}

export function selectCustomerCart(snapshot: DemoStateSnapshot, activeAccountId: string): DemoCart | null {
  return customerCart(snapshot, activeAccountId);
}

export function selectCartSummary(
  snapshot: DemoStateSnapshot,
  activeAccountId: string,
  catalogData: DemoCartCatalog = catalog,
): DemoCartSummary {
  const cart = customerCart(snapshot, activeAccountId);
  const lines = cart?.items.map((item) => resolveLine(item, catalogData)) ?? [];
  return {
    cart,
    lines,
    itemCount: lines.reduce((total, { item }) => total + item.quantity, 0),
    lineCount: lines.length,
    subtotal: lines.reduce((total, line) => total + (line.lineTotal ?? 0), 0),
  };
}
