import { expect, test } from "@playwright/test";
import { createDemoSeedSnapshot } from "@/services/demo-state-seed";
import { createDemoStateStore } from "@/services/demo-state-store";
import { saveCustomerProductReview, getProductReviewSummary } from "@/services/customer-product-reviews";
import { migrateDemoSnapshot, validateDemoSnapshot } from "@/services/demo-state-persistence";
import type { DemoStatePersistenceAdapter } from "@/types/demo-state";

function adapter(initial = createDemoSeedSnapshot(), failWrite = false): DemoStatePersistenceAdapter & { readSaved: () => ReturnType<typeof createDemoSeedSnapshot> } {
  let saved = structuredClone(initial);
  return {
    read: async () => structuredClone(saved),
    write: async (snapshot) => { if (failWrite) throw new Error("storage unavailable"); saved = structuredClone(snapshot); },
    clear: async () => undefined,
    readSaved: () => structuredClone(saved),
  };
}

async function customerStore(persistence = adapter()) {
  const store = createDemoStateStore(persistence);
  await store.getState().hydrate();
  store.getState().setActiveAccount("account-customer-demo");
  return { store, persistence };
}

test("submits one canonical review, edits it in place, derives its summary, and persists", async () => {
  const { store, persistence } = await customerStore();
  const created = await saveCustomerProductReview({ productId: "prod-wireless-earbuds-pro", rating: 4, body: "Comfortable fit and clear sound." }, store);
  expect(created).toMatchObject({ ok: true, persisted: true, created: true, review: { id: "review-customer-demo-prod-wireless-earbuds-pro", customerId: "customer-demo", productId: "prod-wireless-earbuds-pro", rating: 4, body: "Comfortable fit and clear sound." } });
  if (!created.ok) throw new Error("Expected a saved review");
  expect(created.review.createdAt).toBe(created.review.updatedAt);

  const edited = await saveCustomerProductReview({ productId: "prod-wireless-earbuds-pro", rating: 5, body: "Comfortable fit, clear sound, and reliable battery life." }, store);
  expect(edited).toMatchObject({ ok: true, created: false, review: { id: created.review.id, rating: 5 } });
  if (!edited.ok) throw new Error("Expected an edited review");
  expect(edited.review.createdAt).toBe(created.review.createdAt);
  expect(Date.parse(edited.review.updatedAt)).toBeGreaterThanOrEqual(Date.parse(edited.review.createdAt));
  expect(store.getState().snapshot.data.productReviews).toHaveLength(1);
  const summary = getProductReviewSummary(store.getState().snapshot.data.productReviews, "prod-wireless-earbuds-pro");
  expect(summary).toMatchObject({ average: 5, count: 1 });
  expect(summary.countsByRating.find(({ rating }) => rating === 5)).toEqual({ rating: 5, count: 1 });
  expect(persistence.readSaved().data.productReviews).toEqual(store.getState().snapshot.data.productReviews);
  expect(validateDemoSnapshot(store.getState().snapshot)).toBe(true);
});

test("validates customer, canonical product, rating, and written review input", async () => {
  const { store } = await customerStore();
  expect(await saveCustomerProductReview({ productId: "removed-product", rating: 5, body: "This review is long enough." }, store)).toMatchObject({ ok: false, reason: "product_not_found" });
  expect(await saveCustomerProductReview({ productId: "prod-wireless-earbuds-pro", rating: 0, body: "This review is long enough." }, store)).toMatchObject({ ok: false, reason: "invalid_rating" });
  expect(await saveCustomerProductReview({ productId: "prod-wireless-earbuds-pro", rating: 3.2, body: "This review is long enough." }, store)).toMatchObject({ ok: false, reason: "invalid_rating" });
  expect(await saveCustomerProductReview({ productId: "prod-wireless-earbuds-pro", rating: 5, body: "too short" }, store)).toMatchObject({ ok: false, reason: "invalid_body" });
  expect(await saveCustomerProductReview({ productId: "prod-wireless-earbuds-pro", rating: 5, body: "x".repeat(1001) }, store)).toMatchObject({ ok: false, reason: "invalid_body" });
  expect(await saveCustomerProductReview({ productId: null, rating: 5, body: "This review is long enough." }, store)).toMatchObject({ ok: false, reason: "product_not_found" });
  expect(store.getState().snapshot.data.productReviews).toEqual([]);

  store.getState().setActiveAccount("account-admin-demo");
  expect(await saveCustomerProductReview({ productId: "prod-wireless-earbuds-pro", rating: 5, body: "This review is long enough." }, store)).toMatchObject({ ok: false, reason: "customer_required" });
  store.getState().setActiveAccount("account-customer-demo");
  const staleCustomerSnapshot = structuredClone(store.getState().snapshot);
  staleCustomerSnapshot.data.customers[0]!.accountId = "missing-account";
  store.setState({ snapshot: staleCustomerSnapshot });
  expect(await saveCustomerProductReview({ productId: "prod-wireless-earbuds-pro", rating: 5, body: "This review is long enough." }, store)).toMatchObject({ ok: false, reason: "customer_missing" });
});

test("isolates reviews by active customer and never edits another customer's review", async () => {
  const snapshot = createDemoSeedSnapshot();
  snapshot.data.accounts.push({ id: "account-customer-second", email: "second@example.test", displayName: "Second Customer", role: "customer", customerId: "customer-second", vendorId: null, createdAt: snapshot.savedAt });
  snapshot.data.customers.push({ id: "customer-second", accountId: "account-customer-second", fullName: "Second Customer", phone: "00000000001", addresses: [], preferences: { promotionalUpdates: false, productGridDensity: "standard" }, hiddenOrderIds: [], recentlyViewedProductIds: [], createdAt: snapshot.savedAt, updatedAt: snapshot.savedAt });
  const store = createDemoStateStore(adapter(snapshot));
  await store.getState().hydrate();

  await saveCustomerProductReview({ productId: "prod-wireless-earbuds-pro", rating: 4, body: "The first customer review." }, store);
  store.getState().setActiveAccount("account-customer-second");
  await saveCustomerProductReview({ productId: "prod-wireless-earbuds-pro", rating: 2, body: "The second customer review." }, store);
  const first = store.getState().snapshot.data.productReviews.find(({ customerId }) => customerId === "customer-demo");
  expect(store.getState().snapshot.data.productReviews).toHaveLength(2);
  expect(store.getState().snapshot.data.productReviews.find(({ customerId }) => customerId === "customer-second")).toMatchObject({ rating: 2, body: "The second customer review." });
  store.getState().setActiveAccount("account-customer-demo");
  await saveCustomerProductReview({ productId: "prod-wireless-earbuds-pro", rating: 5, body: "Edited only by the first customer." }, store);
  expect(store.getState().snapshot.data.productReviews.find(({ customerId }) => customerId === "customer-demo")).toMatchObject({ id: first?.id, rating: 5 });
  expect(store.getState().snapshot.data.productReviews.find(({ customerId }) => customerId === "customer-second")).toMatchObject({ rating: 2, body: "The second customer review." });
});

test("uses a data-preserving v6 to v7 migration and refuses partial writes", async () => {
  const legacy = createDemoSeedSnapshot();
  legacy.schemaVersion = 6;
  delete (legacy.data as { productReviews?: typeof legacy.data.productReviews }).productReviews;
  legacy.data.carts[0]?.items.push({ id: "cart-item-saved", productId: "prod-wireless-earbuds-pro", variantId: null, quantity: 2, addedAt: legacy.savedAt });
  legacy.data.wishlists[0]?.productIds.push("prod-cotton-panjabi");
  legacy.data.orders.push({ id: "order-saved", orderNumber: "KN-SAVED", customerId: "customer-demo", fulfillmentGroupIds: ["group-saved"], shippingAddress: { id: "address-saved", label: "Home", recipientName: "Demo Customer", phone: "01712345678", division: "Dhaka", district: "Dhaka", area: "Dhanmondi", streetAddress: "House 1, Road 2", postalCode: "1205", isDefault: true }, paymentMethod: "cash_on_delivery", paymentStatus: "pending", status: "placed", subtotal: 1600, shippingTotal: 0, discountTotal: 0, grandTotal: 1600, placedAt: legacy.savedAt, updatedAt: legacy.savedAt });
  legacy.data.fulfillmentGroups.push({ id: "group-saved", orderId: "order-saved", vendorId: "vendor-urban-fit", itemIds: ["item-saved"], subtotal: 1600, status: "pending", trackingNumber: null, updatedAt: legacy.savedAt });
  legacy.data.orderItems.push({ id: "item-saved", fulfillmentGroupId: "group-saved", productId: "prod-cotton-panjabi", vendorId: "vendor-urban-fit", variantId: "var-panjabi-m", selectedVariant: { id: "var-panjabi-m", optionValues: { Size: "M" } }, productName: "Cotton Panjabi", sku: "SKU-COTTON-PANJABI-M", unitPrice: 1600, quantity: 1, lineTotal: 1600 });
  const migrated = migrateDemoSnapshot(legacy);
  expect(migrated).toMatchObject({ schemaVersion: 7, data: { productReviews: [], carts: [{ items: [{ id: "cart-item-saved" }] }], wishlists: [{ productIds: ["prod-cotton-panjabi"] }], orders: [{ id: "order-saved" }], orderItems: [{ id: "item-saved" }], fulfillmentGroups: [{ id: "group-saved" }] } });

  const failed = adapter(createDemoSeedSnapshot(), true);
  const { store } = await customerStore(failed);
  const before = structuredClone(store.getState().snapshot);
  expect(await saveCustomerProductReview({ productId: "prod-wireless-earbuds-pro", rating: 4, body: "Storage failure should not publish." }, store)).toMatchObject({ ok: false, reason: "persistence_unavailable" });
  expect(store.getState().snapshot).toEqual(before);
  expect(failed.readSaved().data.productReviews).toEqual([]);
});
