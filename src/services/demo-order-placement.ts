import { DEMO_SEED_CATALOG } from "@/services/demo-state-seed";
import { createShippingAddressSnapshot, getCheckoutEligibility, resolveCheckoutShippingSelection } from "@/services/checkout";
import type { DemoCartCatalog } from "@/services/demo-cart";
import { flashDeals } from "@/data/flash-deals";
import { demoStateStore, type DemoStateStoreApi } from "@/services/demo-state-store";
import type { DemoOrder, DemoOrderItem, DemoStateSnapshot, DemoVendorFulfillmentGroup } from "@/types/demo-state";

export type DemoOrderPlacementIssue =
  | "customer_required"
  | "cart_empty"
  | "cart_unavailable"
  | "address_required"
  | "address_unavailable"
  | "id_generation_failed";

export type DemoOrderPlacementResult =
  | { ok: true; persisted: boolean; order: DemoOrder }
  | { ok: false; reason: DemoOrderPlacementIssue | "not_hydrated" | "invalid_snapshot" };

export interface DemoOrderPlacementOptions {
  catalog?: DemoCartCatalog;
  now?: number;
  createId?: () => string;
}

const defaultCatalog: DemoCartCatalog = { ...DEMO_SEED_CATALOG, deals: flashDeals };

function defaultId(): string {
  return globalThis.crypto.randomUUID();
}

function collectIds(snapshot: DemoStateSnapshot): Set<string> {
  return new Set([
    ...snapshot.data.accounts.map(({ id }) => id),
    ...snapshot.data.customers.map(({ id }) => id),
    ...snapshot.data.carts.map(({ id }) => id),
    ...snapshot.data.wishlists.map(({ id }) => id),
    ...snapshot.data.orders.map(({ id }) => id),
    ...snapshot.data.orderItems.map(({ id }) => id),
    ...snapshot.data.fulfillmentGroups.map(({ id }) => id),
  ]);
}

function nextUniqueId(prefix: string, used: Set<string>, createId: () => string): string | null {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = `${prefix}:${createId()}`;
    if (!used.has(id)) {
      used.add(id);
      return id;
    }
  }
  return null;
}

function placeInSnapshot(
  snapshot: DemoStateSnapshot,
  activeAccountId: string,
  selectedAddressId: string | null,
  catalog: DemoCartCatalog,
  now: number,
  createId: () => string,
): { snapshot: DemoStateSnapshot | null; result: { ok: true; order: DemoOrder } | { ok: false; reason: DemoOrderPlacementIssue } } {
  const account = snapshot.data.accounts.find(({ id }) => id === activeAccountId);
  if (account?.role !== "customer" || !account.customerId) return { snapshot: null, result: { ok: false, reason: "customer_required" } };

  const shipping = resolveCheckoutShippingSelection(snapshot, activeAccountId, selectedAddressId);
  if (!shipping.customer || shipping.customer.id !== account.customerId) return { snapshot: null, result: { ok: false, reason: "customer_required" } };
  if (!shipping.address) return { snapshot: null, result: { ok: false, reason: "address_required" } };
  if (selectedAddressId && shipping.address.id !== selectedAddressId) return { snapshot: null, result: { ok: false, reason: "address_unavailable" } };

  const eligibility = getCheckoutEligibility(snapshot, activeAccountId, catalog, now);
  if (eligibility.status === "empty") return { snapshot: null, result: { ok: false, reason: "cart_empty" } };
  if (eligibility.status !== "ready") return { snapshot: null, result: { ok: false, reason: eligibility.status === "customer_required" ? "customer_required" : "cart_unavailable" } };
  const cart = snapshot.data.carts.find(({ customerId }) => customerId === account.customerId);
  if (!cart || !cart.items.length) return { snapshot: null, result: { ok: false, reason: "cart_empty" } };

  const usedIds = collectIds(snapshot);
  const orderId = nextUniqueId("order", usedIds, createId);
  if (!orderId) return { snapshot: null, result: { ok: false, reason: "id_generation_failed" } };

  const orderItems: DemoOrderItem[] = [];
  const groups: DemoVendorFulfillmentGroup[] = [];
  const linesByVendor = new Map<string, typeof eligibility.summary.lines>();
  for (const line of eligibility.summary.lines) {
    if (!line.product || line.unitPrice === null || line.lineTotal === null || !line.available) {
      return { snapshot: null, result: { ok: false, reason: "cart_unavailable" } };
    }
    const lines = linesByVendor.get(line.product.vendorId) ?? [];
    lines.push(line);
    linesByVendor.set(line.product.vendorId, lines);
  }

  for (const [vendorId, lines] of linesByVendor) {
    const groupId = nextUniqueId("fulfillment-group", usedIds, createId);
    if (!groupId) return { snapshot: null, result: { ok: false, reason: "id_generation_failed" } };
    const groupItems: DemoOrderItem[] = [];
    for (const line of lines) {
      const product = catalog.products.find(({ id }) => id === line.item.productId);
      if (!product || product.vendorId !== vendorId || line.unitPrice === null || line.lineTotal === null || !line.available) {
        return { snapshot: null, result: { ok: false, reason: "cart_unavailable" } };
      }
      const variant = line.variant;
      const itemId = nextUniqueId("order-item", usedIds, createId);
      if (!itemId) return { snapshot: null, result: { ok: false, reason: "id_generation_failed" } };
      const item: DemoOrderItem = {
        id: itemId,
        fulfillmentGroupId: groupId,
        productId: product.id,
        vendorId: product.vendorId,
        variantId: variant?.id ?? null,
        selectedVariant: variant ? { id: variant.id, optionValues: { ...variant.optionValues } } : null,
        productName: product.name,
        sku: variant?.sku ?? product.sku,
        unitPrice: line.unitPrice,
        quantity: line.item.quantity,
        lineTotal: line.lineTotal,
      };
      groupItems.push(item);
      orderItems.push(item);
    }
    groups.push({
      id: groupId,
      orderId,
      vendorId,
      itemIds: groupItems.map(({ id }) => id),
      subtotal: groupItems.reduce((total, item) => total + item.lineTotal, 0),
      status: "pending",
      trackingNumber: null,
      updatedAt: new Date(now).toISOString(),
    });
  }

  const subtotal = orderItems.reduce((total, item) => total + item.lineTotal, 0);
  const orderNumber = `KN-${new Date(now).toISOString().slice(0, 10).replaceAll("-", "")}-${orderId.split(":").at(-1)?.slice(0, 8).toUpperCase() ?? "ORDER"}`;
  const order: DemoOrder = {
    id: orderId,
    orderNumber,
    customerId: shipping.customer.id,
    fulfillmentGroupIds: groups.map(({ id }) => id),
    shippingAddress: createShippingAddressSnapshot(shipping.address),
    paymentMethod: "cash_on_delivery",
    paymentStatus: "pending",
    status: "placed",
    subtotal,
    shippingTotal: 0,
    discountTotal: 0,
    grandTotal: subtotal,
    placedAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  };

  snapshot.data.orders.push(order);
  snapshot.data.fulfillmentGroups.push(...groups);
  snapshot.data.orderItems.push(...orderItems);
  cart.items = [];
  cart.updatedAt = new Date(now).toISOString();
  return { snapshot, result: { ok: true, order } };
}

/** Revalidates and places one demo COD order in the store's serialized snapshot transaction. */
export async function placeDemoOrder(
  selectedAddressId: string | null,
  store: DemoStateStoreApi = demoStateStore,
  options: DemoOrderPlacementOptions = {},
): Promise<DemoOrderPlacementResult> {
  const catalog = options.catalog ?? defaultCatalog;
  const createId = options.createId ?? defaultId;
  const transaction = await store.getState().transactSnapshot((snapshot) => placeInSnapshot(
    snapshot,
    store.getState().activeAccountId,
    selectedAddressId,
    catalog,
    options.now ?? Date.now(),
    createId,
  ), { requirePersistence: true });
  if (!transaction.ok) return { ok: false, reason: transaction.reason };
  if (!transaction.result.ok) return transaction.result;
  return { ok: true, persisted: transaction.persisted, order: transaction.result.order };
}
