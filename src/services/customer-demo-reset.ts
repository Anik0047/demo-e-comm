import type { DemoStateStoreApi } from "@/services/demo-state-store";
import { demoStateStore } from "@/services/demo-state-store";
import { DEFAULT_DEMO_CUSTOMER_PREFERENCES } from "@/types/demo-state";

export type CustomerDemoResetResult =
  | { ok: true; persisted: true; deletedOrders: number }
  | { ok: false; reason: "not_hydrated" | "invalid_snapshot" | "persistence_unavailable" | "customer_required" | "customer_missing" | "invalid_order_relationships" };

type ResetTransactionResult =
  | { ok: true; deletedOrders: number }
  | { ok: false; reason: "customer_required" | "customer_missing" | "invalid_order_relationships" };

/** Erases only the active customer's demo-owned state and persists before publishing it in memory. */
export async function resetActiveCustomerDemoData(
  store: DemoStateStoreApi = demoStateStore,
): Promise<CustomerDemoResetResult> {
  const transaction = await store.getState().transactSnapshot<ResetTransactionResult>((snapshot) => {
    const account = snapshot.data.accounts.find(({ id }) => id === store.getState().activeAccountId);
    if (account?.role !== "customer" || !account.customerId) {
      return { snapshot: null, result: { ok: false, reason: "customer_required" } };
    }
    const customer = snapshot.data.customers.find(({ id, accountId }) => id === account.customerId && accountId === account.id);
    if (!customer) return { snapshot: null, result: { ok: false, reason: "customer_missing" } };

    const ownedOrders = snapshot.data.orders.filter(({ customerId }) => customerId === customer.id);
    const ownedOrderIds = new Set(ownedOrders.map(({ id }) => id));
    const referencedGroupIds = new Set(ownedOrders.flatMap(({ fulfillmentGroupIds }) => fulfillmentGroupIds));
    const ownedGroups = snapshot.data.fulfillmentGroups.filter(({ orderId, id }) => ownedOrderIds.has(orderId) || referencedGroupIds.has(id));
    const ownedGroupIds = new Set(ownedGroups.map(({ id }) => id));

    // Refuse malformed shared trees; never remove vendor-visible records referenced elsewhere.
    if (ownedGroups.some(({ id, orderId, itemIds }) => {
      const parent = ownedOrders.find(({ id: orderIdValue }) => orderIdValue === orderId);
      const isReferencedByForeignOrder = snapshot.data.orders.some((order) => !ownedOrderIds.has(order.id) && order.fulfillmentGroupIds.includes(id));
      const orderReferenceCount = snapshot.data.orders.filter((order) => order.fulfillmentGroupIds.includes(id)).length;
      const groupItems = snapshot.data.orderItems.filter(({ fulfillmentGroupId }) => fulfillmentGroupId === id);
      return !parent || !parent.fulfillmentGroupIds.includes(id) || isReferencedByForeignOrder
        || orderReferenceCount !== 1
        || groupItems.length !== itemIds.length || groupItems.some(({ id: itemId }) => !itemIds.includes(itemId));
    }) || ownedOrders.some(({ fulfillmentGroupIds }) => fulfillmentGroupIds.some((id) => !ownedGroupIds.has(id)))) {
      return { snapshot: null, result: { ok: false, reason: "invalid_order_relationships" } };
    }

    const ownedItemIds = new Set(ownedGroups.flatMap(({ itemIds }) => itemIds));
    const isReferencedByForeignGroup = snapshot.data.fulfillmentGroups.some(({ id, itemIds }) =>
      !ownedGroupIds.has(id) && itemIds.some((itemId) => ownedItemIds.has(itemId)));
    if (isReferencedByForeignGroup || snapshot.data.orderItems.some(({ id, fulfillmentGroupId }) => ownedItemIds.has(id) !== ownedGroupIds.has(fulfillmentGroupId))) {
      return { snapshot: null, result: { ok: false, reason: "invalid_order_relationships" } };
    }

    const resetProfile = customer.resetProfile ?? { fullName: account.displayName, phone: customer.phone };
    customer.fullName = resetProfile.fullName;
    customer.phone = resetProfile.phone;
    customer.addresses = [];
    customer.preferences = { ...DEFAULT_DEMO_CUSTOMER_PREFERENCES };
    customer.hiddenOrderIds = [];
    customer.recentlyViewedProductIds = [];
    customer.updatedAt = new Date().toISOString();
    account.displayName = resetProfile.fullName;
    snapshot.data.carts = snapshot.data.carts.map((cart) => cart.customerId === customer.id
      ? { ...cart, items: [], updatedAt: customer.updatedAt }
      : cart);
    snapshot.data.wishlists = snapshot.data.wishlists.map((wishlist) => wishlist.customerId === customer.id
      ? { ...wishlist, productIds: [], updatedAt: customer.updatedAt }
      : wishlist);
    snapshot.data.orders = snapshot.data.orders.filter(({ id }) => !ownedOrderIds.has(id));
    snapshot.data.fulfillmentGroups = snapshot.data.fulfillmentGroups.filter(({ id }) => !ownedGroupIds.has(id));
    snapshot.data.orderItems = snapshot.data.orderItems.filter(({ id }) => !ownedItemIds.has(id));
    snapshot.data.notifications = snapshot.data.notifications.filter(({ recipientAccountId }) => recipientAccountId !== account.id);
    snapshot.data.productReviews = snapshot.data.productReviews.filter(({ customerId }) => customerId !== customer.id);

    return { snapshot, result: { ok: true, deletedOrders: ownedOrders.length } };
  }, { requirePersistence: true });

  if (!transaction.ok) return transaction;
  if (!transaction.result.ok) return transaction.result;
  return { ok: true, persisted: true, deletedOrders: transaction.result.deletedOrders };
}
