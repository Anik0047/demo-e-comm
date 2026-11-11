import type { DemoAddress, DemoId, DemoOrder, DemoOrderItem, DemoVendorFulfillmentGroup } from "@/types/demo-state";
import type { Vendor } from "@/types/vendor";

/** Immutable product and price details captured when an order is placed. */
export type OrderItemSnapshot = Readonly<Pick<DemoOrderItem,
  "id" | "productId" | "vendorId" | "productName" | "selectedVariant" | "quantity" | "unitPrice" | "lineTotal"
>>;

/** A vendor can query this group and receive only its own order item snapshots. */
export interface VendorOrderGroup {
  readonly id: DemoId;
  readonly vendorId: Vendor["id"];
  readonly items: readonly OrderItemSnapshot[];
  readonly subtotal: number;
}

/** Parent customer order model for the upcoming placement flow. */
/** Address fields copied by value at placement time; later profile edits cannot change an order. */
export type ShippingAddressSnapshot = Readonly<DemoAddress>;

/** Restrict a parent order to a single canonical vendor's items. */
export function getVendorOrderItems(
  order: DemoOrder,
  groups: readonly DemoVendorFulfillmentGroup[],
  items: readonly DemoOrderItem[],
  vendorId: Vendor["id"],
): readonly OrderItemSnapshot[] {
  const vendorGroupIds = new Set(groups
    .filter((group) => group.orderId === order.id && group.vendorId === vendorId && order.fulfillmentGroupIds.includes(group.id))
    .map(({ id }) => id));
  return items.filter((item) => item.vendorId === vendorId && vendorGroupIds.has(item.fulfillmentGroupId));
}
