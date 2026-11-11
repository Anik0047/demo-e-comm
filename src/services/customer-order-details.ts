import { vendors } from "@/data/vendors";
import type { DemoOrder, DemoOrderItem, DemoStateSnapshot, DemoVendorFulfillmentGroup } from "@/types/demo-state";
import { isOrderHiddenFromCustomer } from "@/services/customer-order-history";

export interface CustomerOrderDetailGroup {
  group: DemoVendorFulfillmentGroup;
  vendorId: string;
  vendorName: string;
  items: readonly DemoOrderItem[];
  capturedSubtotal: number | null;
}

export interface CustomerOrderDetails {
  order: DemoOrder;
  groups: readonly CustomerOrderDetailGroup[];
  subtotalCheck: {
    status: "verified" | "mismatch" | "unavailable";
    groupSubtotalTotal: number | null;
    parentItemsSubtotal: number | null;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMoney(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isOrderRecord(value: unknown): value is DemoOrder {
  return isRecord(value)
    && typeof value.id === "string"
    && value.id.trim().length > 0
    && typeof value.customerId === "string"
    && Array.isArray(value.fulfillmentGroupIds);
}

function isGroupRecord(value: unknown): value is DemoVendorFulfillmentGroup {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.orderId === "string"
    && typeof value.vendorId === "string"
    && Array.isArray(value.itemIds);
}

function isItemRecord(value: unknown): value is DemoOrderItem {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.fulfillmentGroupId === "string"
    && typeof value.vendorId === "string";
}

/** Resolves immutable order snapshots only for their owning customer. */
export function getCustomerOrderDetails(
  snapshot: DemoStateSnapshot,
  customerId: string,
  orderId: string,
): CustomerOrderDetails | null {
  if (isOrderHiddenFromCustomer(snapshot, customerId, orderId)) return null;
  const matchingOrders = snapshot.data.orders.filter((value) => isOrderRecord(value)
    && value.id === orderId
    && value.customerId === customerId);
  if (matchingOrders.length !== 1) return null;
  const order = matchingOrders[0];
  if (!order) return null;

  const referencedGroupIds = order.fulfillmentGroupIds.filter((id): id is string => typeof id === "string" && id.length > 0);
  const uniqueGroupIds = new Set(referencedGroupIds);
  const groups: CustomerOrderDetailGroup[] = [...uniqueGroupIds].flatMap((groupId) => {
    const group = snapshot.data.fulfillmentGroups.find((value) => isGroupRecord(value)
      && value.id === groupId
      && value.orderId === order.id);
    if (!group || !isGroupRecord(group)) return [];
    const vendor = vendors.find(({ id }) => id === group.vendorId);
    const seenItemIds = new Set<string>();
    const items = group.itemIds.flatMap((itemId) => {
      if (typeof itemId !== "string") return [];
      if (seenItemIds.has(itemId)) return [];
      const item = snapshot.data.orderItems.find((value) => isItemRecord(value)
        && value.id === itemId
        && value.fulfillmentGroupId === group.id
        && value.vendorId === group.vendorId);
      if (item) seenItemIds.add(itemId);
      return item && isItemRecord(item) ? [item] : [];
    });
    return [{
      group,
      vendorId: group.vendorId,
      vendorName: vendor?.name ?? "Seller",
      items,
      capturedSubtotal: isMoney(group.subtotal) ? group.subtotal : null,
    }];
  });

  const allGroupsResolved = uniqueGroupIds.size === referencedGroupIds.length
    && groups.length === uniqueGroupIds.size
    && order.fulfillmentGroupIds.every((id) => typeof id === "string" && uniqueGroupIds.has(id));
  const allGroupSubtotalsAvailable = groups.every(({ capturedSubtotal }) => capturedSubtotal !== null);
  const parentItemsSubtotal = isMoney(order.subtotal) ? order.subtotal : null;
  const groupSubtotalTotal = allGroupSubtotalsAvailable
    ? groups.reduce((total, { capturedSubtotal }) => total + (capturedSubtotal ?? 0), 0)
    : null;
  const canVerify = allGroupsResolved && allGroupSubtotalsAvailable && parentItemsSubtotal !== null && groupSubtotalTotal !== null;

  return {
    order,
    groups,
    subtotalCheck: {
      status: !canVerify ? "unavailable" : groupSubtotalTotal === parentItemsSubtotal ? "verified" : "mismatch",
      groupSubtotalTotal,
      parentItemsSubtotal,
    },
  };
}
