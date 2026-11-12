import { demoStateStore, type DemoStateStoreApi } from "@/services/demo-state-store";
import type { DemoNotification, DemoOrder, DemoStateSnapshot } from "@/types/demo-state";

export type CustomerOrderActionIssue = "customer_required" | "order_unavailable" | "invalid_status" | "already_hidden" | "not_hydrated" | "invalid_snapshot" | "persistence_unavailable";
export type CustomerOrderActionResult =
  | { ok: true; persisted: boolean; order?: DemoOrder }
  | { ok: false; reason: CustomerOrderActionIssue };

function addOrderNotification(snapshot: DemoStateSnapshot, order: DemoOrder, action: "placed" | "cancelled", createdAt: string) {
  const customer = snapshot.data.customers.find(({ id }) => id === order.customerId);
  const account = customer && snapshot.data.accounts.find(({ id, role, customerId }) => id === customer.accountId && role === "customer" && customerId === customer.id);
  if (!customer || !account) return;
  const id = `notification:order-${action}:${order.id}`;
  if (snapshot.data.notifications.some((notification) => notification.id === id)) return;
  const notification: DemoNotification = {
    id,
    recipientAccountId: account.id,
    kind: "order",
    title: action === "placed" ? "Demo order placed" : "Demo order cancelled",
    message: action === "placed"
      ? `Your demo order ${order.orderNumber} was placed. Local demo notice only; no email, SMS, payment, or delivery update was sent.`
      : `Your demo order ${order.orderNumber} was cancelled. Local demo notice only; no email, SMS, payment, refund, or delivery update was sent.`,
    href: `/account/orders/${encodeURIComponent(order.id)}`,
    readAt: null,
    createdAt,
  };
  snapshot.data.notifications.push(notification);
}

export function addDemoOrderPlacementNotification(snapshot: DemoStateSnapshot, order: DemoOrder, createdAt: string): void {
  addOrderNotification(snapshot, order, "placed", createdAt);
}

export interface CustomerOrderActionOptions {
  now?: number;
}

function resolveOwningCustomer(snapshot: DemoStateSnapshot, activeAccountId: string, orderId: string) {
  const account = snapshot.data.accounts.find(({ id }) => id === activeAccountId);
  if (account?.role !== "customer" || !account.customerId) return null;
  const customer = snapshot.data.customers.find(({ id, accountId }) => id === account.customerId && accountId === account.id);
  if (!customer) return null;
  const order = snapshot.data.orders.find(({ id, customerId }) => id === orderId && customerId === customer.id);
  return { customer, order: order ?? null, account };
}

/** Cancels only an owned, pending demo COD order. This changes parent status metadata only. */
export async function cancelCustomerDemoOrder(
  orderId: string,
  store: DemoStateStoreApi = demoStateStore,
  options: CustomerOrderActionOptions = {},
): Promise<CustomerOrderActionResult> {
  const now = new Date(options.now ?? Date.now()).toISOString();
  const transaction = await store.getState().transactSnapshot<{ ok: true; order: DemoOrder } | { ok: false; reason: "customer_required" | "order_unavailable" | "invalid_status" }>((snapshot) => {
    const owned = resolveOwningCustomer(snapshot, store.getState().activeAccountId, orderId);
    if (!owned) return { snapshot: null, result: { ok: false, reason: "customer_required" } as const };
    if (!owned.order) return { snapshot: null, result: { ok: false, reason: "order_unavailable" } as const };
    const { order } = owned;
    if (order.status !== "placed" || order.paymentMethod !== "cash_on_delivery" || order.paymentStatus !== "pending") {
      return { snapshot: null, result: { ok: false, reason: "invalid_status" } as const };
    }
    const groups = snapshot.data.fulfillmentGroups.filter(({ id, orderId: groupOrderId }) => groupOrderId === order.id && order.fulfillmentGroupIds.includes(id));
    if (!groups.length || groups.length !== order.fulfillmentGroupIds.length || groups.some(({ status }) => status !== "pending")) {
      return { snapshot: null, result: { ok: false, reason: "invalid_status" } as const };
    }
    order.status = "cancelled";
    order.updatedAt = now;
    addOrderNotification(snapshot, order, "cancelled", now);
    return { snapshot, result: { ok: true, order } as const };
  }, { requirePersistence: true });
  if (!transaction.ok) return { ok: false, reason: transaction.reason };
  return transaction.result.ok
    ? { ok: true, persisted: transaction.persisted, order: transaction.result.order }
    : transaction.result;
}

/** Hides an owned order from history without modifying or deleting its canonical record. */
export async function hideCustomerOrderFromHistory(
  orderId: string,
  store: DemoStateStoreApi = demoStateStore,
): Promise<CustomerOrderActionResult> {
  const transaction = await store.getState().transactSnapshot<{ ok: true } | { ok: false; reason: "customer_required" | "order_unavailable" | "already_hidden" }>((snapshot) => {
    const owned = resolveOwningCustomer(snapshot, store.getState().activeAccountId, orderId);
    if (!owned) return { snapshot: null, result: { ok: false, reason: "customer_required" } as const };
    if (!owned.order) {
      return { snapshot: null, result: { ok: false, reason: "order_unavailable" } as const };
    }
    if (owned.customer.hiddenOrderIds.includes(orderId)) return { snapshot: null, result: { ok: false, reason: "already_hidden" } as const };
    owned.customer.hiddenOrderIds.push(orderId);
    return { snapshot, result: { ok: true } as const };
  }, { requirePersistence: true });
  if (!transaction.ok) return { ok: false, reason: transaction.reason };
  return transaction.result.ok ? { ok: true, persisted: transaction.persisted } : transaction.result;
}
