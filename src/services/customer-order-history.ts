import type { DemoOrder, DemoOrderStatus, DemoPaymentMethod, DemoStateSnapshot } from "@/types/demo-state";

export interface CustomerOrderHistoryEntry {
  order: DemoOrder;
  itemCount: number;
  vendorCount: number;
}

const orderStatuses = new Set<DemoOrderStatus>(["placed", "processing", "shipped", "delivered", "cancelled", "returned"]);
const paymentMethods = new Set<DemoPaymentMethod>(["cash_on_delivery", "bkash", "nagad", "card"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOrderRecord(value: unknown): value is DemoOrder {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && value.id.trim().length > 0
    && typeof value.customerId === "string" && value.customerId.trim().length > 0
    && Array.isArray(value.fulfillmentGroupIds);
}

function getSnapshotCounts(snapshot: DemoStateSnapshot, order: DemoOrder): Pick<CustomerOrderHistoryEntry, "itemCount" | "vendorCount"> {
  const orderGroupIds = new Set(order.fulfillmentGroupIds.filter((id): id is string => typeof id === "string" && id.length > 0));
  const groups = snapshot.data.fulfillmentGroups.filter((value) => isRecord(value)
    && typeof value.id === "string"
    && orderGroupIds.has(value.id)
    && value.orderId === order.id
    && typeof value.vendorId === "string"
    && Array.isArray(value.itemIds));
  const itemIds = new Set<string>();
  const vendors = new Set<string>();

  for (const group of groups) {
    if (!isRecord(group) || typeof group.vendorId !== "string" || !Array.isArray(group.itemIds)) continue;
    vendors.add(group.vendorId);
    for (const id of group.itemIds) {
      if (typeof id === "string" && id.length > 0) itemIds.add(id);
    }
  }

  const matchedItemIds = new Set(snapshot.data.orderItems.filter((value) => isRecord(value)
    && typeof value.id === "string"
    && itemIds.has(value.id)
    && groups.some((group) => isRecord(group) && group.id === value.fulfillmentGroupId && group.vendorId === value.vendorId))
    .map((value) => isRecord(value) ? value.id as string : ""));

  return { itemCount: matchedItemIds.size, vendorCount: vendors.size };
}

/** Resolve saved history through the active customer account and sort it deterministically. */
export function getCustomerOrderHistory(snapshot: DemoStateSnapshot, customerId: string): CustomerOrderHistoryEntry[] {
  const seenOrderIds = new Set<string>();
  return snapshot.data.orders
    .filter((value): value is DemoOrder => isOrderRecord(value)
      && value.customerId === customerId
      && !snapshot.data.customers.find(({ id }) => id === customerId)?.hiddenOrderIds.includes(value.id)
      && !seenOrderIds.has(value.id)
      && Boolean(seenOrderIds.add(value.id)))
    .map((order) => ({ order, ...getSnapshotCounts(snapshot, order) }))
    .sort((left, right) => {
      const leftDate = Date.parse(left.order.placedAt);
      const rightDate = Date.parse(right.order.placedAt);
      const validLeftDate = Number.isFinite(leftDate) ? leftDate : Number.NEGATIVE_INFINITY;
      const validRightDate = Number.isFinite(rightDate) ? rightDate : Number.NEGATIVE_INFINITY;
      if (validRightDate !== validLeftDate) return validRightDate > validLeftDate ? 1 : -1;
      return left.order.id < right.order.id ? -1 : left.order.id > right.order.id ? 1 : 0;
    });
}

/** Direct details use the same visibility rule as history; hidden records remain canonical. */
export function isOrderHiddenFromCustomer(snapshot: DemoStateSnapshot, customerId: string, orderId: string): boolean {
  return snapshot.data.customers.find(({ id }) => id === customerId)?.hiddenOrderIds.includes(orderId) ?? false;
}

export function getOrderStatusLabel(status: unknown): string {
  if (typeof status !== "string" || !orderStatuses.has(status as DemoOrderStatus)) return "Status unavailable";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getPaymentMethodLabel(method: unknown): string {
  if (typeof method !== "string" || !paymentMethods.has(method as DemoPaymentMethod)) return "Payment method unavailable";
  const labels: Record<DemoPaymentMethod, string> = {
    cash_on_delivery: "Cash on delivery",
    bkash: "bKash",
    nagad: "Nagad",
    card: "Card",
  };
  return labels[method as DemoPaymentMethod];
}
