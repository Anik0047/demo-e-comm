import { DEMO_SEED_CATALOG } from "@/services/demo-state-seed";
import { getCustomerOrderDetails, type CustomerOrderDetails } from "@/services/customer-order-details";
import { selectCartSummary, type DemoCartCatalog, type DemoCartSummary } from "@/services/demo-cart";
import type { DemoStateSnapshot } from "@/types/demo-state";
import type { DemoAddress, DemoCustomer } from "@/types/demo-state";
import type { OrderItemSnapshot, VendorOrderGroup } from "@/types/order";
import type { ShippingAddressSnapshot } from "@/types/order";
import { validateCustomerAddress } from "@/services/customer-addresses";
import { flashDeals } from "@/data/flash-deals";

export type CheckoutEligibility =
  | { status: "customer_required" }
  | { status: "empty"; summary: DemoCartSummary }
  | { status: "unavailable"; summary: DemoCartSummary }
  | { status: "ready"; summary: DemoCartSummary; groups: readonly VendorOrderGroup[] };

const catalog: DemoCartCatalog = { ...DEMO_SEED_CATALOG, deals: flashDeals };

export type CustomerOrderConfirmation = CustomerOrderDetails;

/** Resolve confirmation details only when the order belongs to the active customer. */
export function getCustomerOrderConfirmation(
  snapshot: DemoStateSnapshot,
  customerId: string,
  orderId: string,
): CustomerOrderConfirmation | null {
  return getCustomerOrderDetails(snapshot, customerId, orderId);
}

export interface CheckoutShippingSelection {
  customer: DemoCustomer | null;
  addresses: readonly DemoAddress[];
  address: DemoAddress | null;
}

function isValidSavedAddress(value: unknown): value is DemoAddress {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const address = value as Record<string, unknown>;
  if (typeof address.id !== "string" || typeof address.label !== "string"
    || typeof address.recipientName !== "string" || typeof address.phone !== "string"
    || typeof address.division !== "string" || typeof address.district !== "string"
    || typeof address.area !== "string" || typeof address.streetAddress !== "string"
    || !(typeof address.postalCode === "string" || address.postalCode === null)
    || typeof address.isDefault !== "boolean") return false;
  return validateCustomerAddress(value as DemoAddress).ok;
}

/** Resolve only addresses owned by the active customer; a stale selection falls back to their valid default. */
export function resolveCheckoutShippingSelection(
  snapshot: DemoStateSnapshot,
  activeAccountId: string,
  selectedAddressId: string | null,
): CheckoutShippingSelection {
  const account = snapshot.data.accounts.find(({ id }) => id === activeAccountId);
  if (account?.role !== "customer" || !account.customerId) return { customer: null, addresses: [], address: null };
  const customer = snapshot.data.customers.find(({ id, accountId }) => id === account.customerId && accountId === account.id) ?? null;
  if (!customer) return { customer: null, addresses: [], address: null };
  const addresses = customer.addresses.filter(isValidSavedAddress);

  const selectedCandidate = selectedAddressId
    ? addresses.find(({ id }) => id === selectedAddressId)
    : undefined;
  const address = selectedCandidate ?? addresses.find((entry) => entry.isDefault) ?? null;
  return { customer, addresses, address };
}

/** Placement copies the currently selected address's primitive fields and freezes the order-time value. */
export function createShippingAddressSnapshot(address: DemoAddress): ShippingAddressSnapshot {
  return Object.freeze({ ...address });
}

export const CHECKOUT_ADDRESS_STORAGE_KEY = "kenakata:checkout-address";

export function readCheckoutAddressId(customerId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(`${CHECKOUT_ADDRESS_STORAGE_KEY}:${customerId}`);
  } catch {
    return null;
  }
}

const checkoutAddressListeners = new Set<() => void>();

export function subscribeCheckoutAddressSelection(listener: () => void): () => void {
  checkoutAddressListeners.add(listener);
  return () => checkoutAddressListeners.delete(listener);
}

export function writeCheckoutAddressId(customerId: string, addressId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const key = `${CHECKOUT_ADDRESS_STORAGE_KEY}:${customerId}`;
    if (addressId) window.sessionStorage.setItem(key, addressId);
    else window.sessionStorage.removeItem(key);
    checkoutAddressListeners.forEach((listener) => listener());
  } catch {
    // Selection remains available for this page session if storage is unavailable.
  }
}

export function getCheckoutEligibility(
  snapshot: DemoStateSnapshot,
  activeAccountId: string,
  catalogData: DemoCartCatalog = catalog,
  now = Date.now(),
): CheckoutEligibility {
  const account = snapshot.data.accounts.find(({ id }) => id === activeAccountId);
  if (account?.role !== "customer" || !account.customerId) return { status: "customer_required" };

  const cartCatalog = {
    ...catalogData,
    deals: catalogData.deals ?? flashDeals,
  };
  const summary = selectCartSummary(snapshot, activeAccountId, cartCatalog, now);
  if (!summary.lines.length) return { status: "empty", summary };
  if (summary.lines.some(({ available }) => !available)) return { status: "unavailable", summary };

  const byVendor = new Map<string, OrderItemSnapshot[]>();
  for (const line of summary.lines) {
    if (!line.product || !line.available || line.unitPrice === null || line.lineTotal === null) continue;
    const items = byVendor.get(line.product.vendorId) ?? [];
    const selectedVariant: OrderItemSnapshot["selectedVariant"] = line.variant
      ? { id: line.variant.id, optionValues: { ...line.variant.optionValues } }
      : null;
    items.push({
      id: `order-item:${line.item.id}`,
      productId: line.product.id,
      vendorId: line.product.vendorId,
      productName: line.product.name,
      selectedVariant,
      quantity: line.item.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    });
    byVendor.set(line.product.vendorId, items);
  }

  const groups = [...byVendor].map(([vendorId, items]) => ({
    id: `vendor-order:${vendorId}`,
    vendorId,
    items,
    subtotal: items.reduce((total, item) => total + item.lineTotal, 0),
  }));
  return { status: "ready", summary, groups };
}
