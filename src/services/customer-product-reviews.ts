import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import { demoStateStore } from "@/services/demo-state-store";
import type { DemoStateStoreApi } from "@/services/demo-state-store";
import type { DemoProductReview } from "@/types/demo-state";

export const PRODUCT_REVIEW_MIN_LENGTH = 10;
export const PRODUCT_REVIEW_MAX_LENGTH = 1000;

export type CustomerProductReviewMutationResult =
  | { ok: true; review: DemoProductReview; created: boolean }
  | { ok: false; reason: "customer_required" | "customer_missing" | "product_not_found" | "product_unavailable" | "invalid_rating" | "invalid_body" | "duplicate_review" | "invalid_review_state" };
type CustomerProductReviewFailure = Extract<CustomerProductReviewMutationResult, { ok: false }>;

export type CustomerProductReviewServiceResult =
  | { ok: true; persisted: true; review: DemoProductReview; created: boolean }
  | { ok: false; reason: "not_hydrated" | "invalid_snapshot" | "persistence_unavailable" | CustomerProductReviewFailure["reason"] };

function eligibleProduct(productId: string) {
  const product = products.find(({ id }) => id === productId);
  if (!product) return { ok: false as const, reason: "product_not_found" as const };
  const vendor = vendors.find(({ id }) => id === product.vendorId);
  if (product.status !== "active" || vendor?.status !== "approved") return { ok: false as const, reason: "product_unavailable" as const };
  return { ok: true as const };
}

/** Creates or edits only the active customer's single review for a canonical eligible product. */
export async function saveCustomerProductReview(
  input: { productId: unknown; rating: unknown; body: unknown },
  store: DemoStateStoreApi = demoStateStore,
): Promise<CustomerProductReviewServiceResult> {
  const transaction = await store.getState().transactSnapshot<CustomerProductReviewMutationResult>((snapshot) => {
    const account = snapshot.data.accounts.find(({ id }) => id === store.getState().activeAccountId);
    if (account?.role !== "customer" || !account.customerId) return { snapshot: null, result: { ok: false, reason: "customer_required" } };
    const customer = snapshot.data.customers.find(({ id, accountId }) => id === account.customerId && accountId === account.id);
    if (!customer) return { snapshot: null, result: { ok: false, reason: "customer_missing" } };

    if (typeof input.productId !== "string") return { snapshot: null, result: { ok: false, reason: "product_not_found" } };
    const productResult = eligibleProduct(input.productId);
    if (!productResult.ok) return { snapshot: null, result: productResult };
    if (!Number.isSafeInteger(input.rating) || typeof input.rating !== "number" || input.rating < 1 || input.rating > 5) {
      return { snapshot: null, result: { ok: false, reason: "invalid_rating" } };
    }
    if (typeof input.body !== "string") return { snapshot: null, result: { ok: false, reason: "invalid_body" } };
    const body = input.body.trim();
    if (body.length < PRODUCT_REVIEW_MIN_LENGTH || body.length > PRODUCT_REVIEW_MAX_LENGTH) {
      return { snapshot: null, result: { ok: false, reason: "invalid_body" } };
    }

    const customerReviews = snapshot.data.productReviews.filter(({ customerId, productId }) => customerId === customer.id && productId === input.productId);
    if (customerReviews.length > 1) return { snapshot: null, result: { ok: false, reason: "invalid_review_state" } };
    const existing = customerReviews[0];
    const now = new Date().toISOString();
    if (existing) {
      const updated = { ...existing, rating: input.rating, body, updatedAt: now };
      snapshot.data.productReviews = snapshot.data.productReviews.map((review) => review.id === existing.id ? updated : review);
      return { snapshot, result: { ok: true, review: updated, created: false } };
    }

    const review: DemoProductReview = {
      id: `review-${customer.id}-${input.productId}`,
      customerId: customer.id,
      productId: input.productId,
      rating: input.rating,
      body,
      createdAt: now,
      updatedAt: now,
    };
    if (snapshot.data.productReviews.some(({ id }) => id === review.id)) {
      return { snapshot: null, result: { ok: false, reason: "invalid_review_state" } };
    }
    snapshot.data.productReviews.push(review);
    return { snapshot, result: { ok: true, review, created: true } };
  }, { requirePersistence: true });

  if (!transaction.ok) return transaction;
  if (!transaction.result.ok) return transaction.result;
  return { ok: true, persisted: true, review: transaction.result.review, created: transaction.result.created };
}

export function getProductReviewSummary(reviews: readonly DemoProductReview[], productId: string) {
  const relevant = reviews.filter(({ productId: reviewProductId }) => reviewProductId === productId);
  const average = relevant.length === 0 ? null : relevant.reduce((total, { rating }) => total + rating, 0) / relevant.length;
  const countsByRating = [5, 4, 3, 2, 1].map((rating) => ({ rating, count: relevant.filter((review) => review.rating === rating).length }));
  return { average, count: relevant.length, countsByRating };
}
