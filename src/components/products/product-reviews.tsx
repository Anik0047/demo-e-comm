"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Star } from "lucide-react";
import { useDemoState } from "@/hooks/use-demo-state";
import {
  getProductReviewSummary,
  PRODUCT_REVIEW_MAX_LENGTH,
  PRODUCT_REVIEW_MIN_LENGTH,
  saveCustomerProductReview,
} from "@/services/customer-product-reviews";
import {
  demoStateStore,
  selectActiveAccount,
  selectHydrationReady,
} from "@/services/demo-state-store";
import type { DemoProductReview } from "@/types/demo-state";
import { showToast } from "@/services/toast";

interface ProductReviewsProps {
  productId: string;
}

const formatReviewDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );

export function ProductReviews({ productId }: ProductReviewsProps) {
  const activeAccount = useDemoState(selectActiveAccount);
  const customerId =
    activeAccount?.role === "customer" ? activeAccount.customerId : null;
  return (
    <ProductReviewsContent
      key={`${productId}:${customerId ?? "guest"}`}
      productId={productId}
    />
  );
}

function ProductReviewsContent({ productId }: ProductReviewsProps) {
  const activeAccount = useDemoState(selectActiveAccount);
  const hydrationReady = useDemoState(selectHydrationReady);
  const reviews = useDemoState((state) => state.snapshot.data.productReviews);
  const customers = useDemoState((state) => state.snapshot.data.customers);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const requestedReviewId = searchParams.get("editReview");
  const productReviews = useMemo(
    () => reviews.filter((review) => review.productId === productId),
    [productId, reviews],
  );
  const summary = getProductReviewSummary(productReviews, productId);
  const customerId =
    activeAccount?.role === "customer" ? activeAccount.customerId : null;
  const ownReview = customerId
    ? productReviews.find(({ customerId: ownerId }) => ownerId === customerId)
    : undefined;
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorClosed, setEditorClosed] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [feedback, setFeedback] = useState<{
    kind: "error";
    message: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const ratingValues = [1, 2, 3, 4, 5];
  const queryEdit = Boolean(
    ownReview && requestedReviewId === ownReview.id && !editorClosed,
  );
  const editorVisible = Boolean(
    hydrationReady &&
      customerId &&
      !editorClosed &&
      (!ownReview || editorOpen || queryEdit),
  );
  const draftRating = queryEdit && !editorOpen && ownReview ? ownReview.rating : rating;
  const draftBody = queryEdit && !editorOpen && ownReview ? ownReview.body : body;

  useEffect(() => {
    if (requestedReviewId === ownReview?.id && editorVisible) {
      document.getElementById("customer-review-editor")?.scrollIntoView({
        block: "start",
      });
    }
  }, [editorVisible, ownReview?.id, requestedReviewId]);

  function openEditor(review?: DemoProductReview) {
    setRating(review?.rating ?? null);
    setBody(review?.body ?? "");
    setFeedback(null);
    setEditorClosed(false);
    setEditorOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setFeedback(null);
    try {
      const result = await saveCustomerProductReview(
        { productId, rating: draftRating, body: draftBody },
        demoStateStore,
      );
      if (!result.ok) {
        const message =
          result.reason === "customer_required" ||
          result.reason === "customer_missing"
            ? "Switch to an active customer demo account to write a review."
            : result.reason === "invalid_body"
              ? `Write between ${PRODUCT_REVIEW_MIN_LENGTH} and ${PRODUCT_REVIEW_MAX_LENGTH} characters. Your draft is kept.`
              : result.reason === "invalid_rating"
                ? "Choose a rating from 1 to 5 stars. Your draft is kept."
                : result.reason === "persistence_unavailable"
                  ? "Your review could not be saved in this browser. Your draft is kept; try again when storage is available."
                  : "This product review could not be saved. Your draft is kept; refresh the page and try again.";
        setFeedback({ kind: "error", message });
        return;
      }

      setRating(null);
      setBody("");
      setEditorOpen(false);
      setEditorClosed(true);
      if (requestedReviewId) {
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.delete("editReview");
        const query = nextParams.toString();
        router.replace(
          `${pathname}${query ? `?${query}` : ""}#customer-reviews`,
          { scroll: false },
        );
      }
      showToast("success", result.created ? "Your review has been submitted." : "Your review has been updated.");
    } catch {
      setFeedback({
        kind: "error",
        message: "Your review could not be saved. Your draft is kept; try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      id="customer-reviews"
      aria-labelledby="product-reviews-heading"
      className="mt-10 border-t border-line pt-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="product-reviews-heading" className="text-2xl font-bold">
            Customer reviews
          </h2>
          <p className="mt-1 text-sm text-mute">
            Reviews submitted by customers in this demo.
          </p>
        </div>
        {summary.count > 0 && (
          <div
            aria-label={`${summary.average?.toFixed(1)} out of 5 from ${summary.count} customer reviews`}
            className="flex items-center gap-2 text-sm"
          >
            <Star
              aria-hidden="true"
              className="size-5 fill-accent text-accent"
            />
            <span className="font-bold text-ink">
              {summary.average?.toFixed(1)} out of 5
            </span>
            <span className="text-mute">
              ({summary.count} {summary.count === 1 ? "review" : "reviews"})
            </span>
          </div>
        )}
      </div>

      {hydrationReady && activeAccount?.role === "customer" && customerId ? (
        <div className="mt-5">
          {editorVisible ? (
            <form
              id="customer-review-editor"
              className="rounded-2xl border border-line p-4 sm:p-5"
              onSubmit={(event) => void handleSubmit(event)}
            >
              <h3 className="font-bold text-ink">
                {ownReview ? "Edit your review" : "Write a review"}
              </h3>
              <fieldset className="mt-4">
                <legend className="text-sm font-medium text-ink">
                  Your rating
                </legend>
                <div
                  role="radiogroup"
                  aria-label="Your rating"
                  aria-describedby={feedback?.kind === "error" ? "review-feedback" : undefined}
                  className="mt-1 flex gap-1"
                >
                  {ratingValues.map((value) => (
                    <button
                      key={value}
                      id={`review-rating-${productId}-${value}`}
                      type="button"
                      role="radio"
                      aria-checked={draftRating === value}
                      aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                      tabIndex={draftRating === value || (draftRating === null && value === 1) ? 0 : -1}
                      className="inline-flex size-11 items-center justify-center rounded-lg text-accent hover:bg-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      onKeyDown={(event) => {
                        const currentIndex = ratingValues.indexOf(value);
                        let nextIndex: number | null = null;
                        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % ratingValues.length;
                        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + ratingValues.length) % ratingValues.length;
                        else if (event.key === "Home") nextIndex = 0;
                        else if (event.key === "End") nextIndex = ratingValues.length - 1;
                        if (nextIndex === null) return;
                        event.preventDefault();
                        const nextRating = ratingValues[nextIndex];
                        if (nextRating === undefined) return;
                        setEditorOpen(true);
                        setRating(nextRating);
                        document.getElementById(`review-rating-${productId}-${nextRating}`)?.focus();
                      }}
                      onClick={() => {
                        setEditorOpen(true);
                        setRating(value);
                      }}
                    >
                      <Star
                        aria-hidden="true"
                        className={`size-6 ${draftRating !== null && value <= draftRating ? "fill-accent" : "fill-transparent"}`}
                      />
                    </button>
                  ))}
                </div>
              </fieldset>
              <label
                htmlFor="customer-product-review"
                className="mt-4 block text-sm font-medium text-ink"
              >
                Your review
              </label>
              <textarea
                id="customer-product-review"
                className="input mt-2 min-h-28 w-full resize-y py-3"
                minLength={PRODUCT_REVIEW_MIN_LENGTH}
                maxLength={PRODUCT_REVIEW_MAX_LENGTH}
                value={draftBody}
                onChange={(event) => {
                  setEditorOpen(true);
                  setBody(event.target.value);
                }}
                placeholder="What should other shoppers know?"
                aria-describedby={`customer-product-review-help${feedback?.kind === "error" ? " review-feedback" : ""}`}
                required
                onInvalid={() =>
                  setFeedback({
                    kind: "error",
                    message: `Write between ${PRODUCT_REVIEW_MIN_LENGTH} and ${PRODUCT_REVIEW_MAX_LENGTH} characters. Your draft is kept.`,
                  })
                }
              />
              <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-mute">
                <p id="customer-product-review-help">
                  {PRODUCT_REVIEW_MIN_LENGTH}–{PRODUCT_REVIEW_MAX_LENGTH} characters
                </p>
                <p>{draftBody.length}/{PRODUCT_REVIEW_MAX_LENGTH}</p>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="btn btn-primary btn-md"
                  disabled={saving}
                >
                  {saving
                    ? "Saving review…"
                    : ownReview
                      ? "Save changes"
                      : "Submit review"}
                </button>
                {ownReview && (
                  <button
                    type="button"
                    className="btn btn-outline btn-md"
                    onClick={() => {
                      setRating(null);
                      setBody("");
                      setFeedback(null);
                      setEditorOpen(false);
                      setEditorClosed(true);
                    }}
                  >
                    Cancel
                  </button>
                )}
                {feedback && (
                  <p
                    id="review-feedback"
                    role="alert"
                    className="text-sm font-medium text-sale-strong"
                  >
                    {feedback.message}
                  </p>
                )}
              </div>
            </form>
          ) : ownReview ? (
            <button
              type="button"
              className="btn btn-outline btn-md"
              onClick={() => openEditor(ownReview)}
            >
              Edit your review
            </button>
          ) : null}
        </div>
      ) : hydrationReady ? (
        <p className="mt-5 rounded-xl border border-info bg-info p-4 text-sm text-info-ink">
          Switch to an active customer demo account to write a review.
        </p>
      ) : (
        <div
          aria-label="Loading customer reviews"
          aria-busy="true"
          className="mt-5 space-y-3"
        >
          <div className="skeleton h-5 w-40" />
          <div className="skeleton h-20 w-full rounded-2xl" />
        </div>
      )}

      {!hydrationReady ? (
        <div
          aria-label="Loading saved reviews"
          aria-busy="true"
          className="mt-6 space-y-4"
        >
          <div className="skeleton h-20 w-full rounded-xl" />
          <div className="skeleton h-20 w-full rounded-xl" />
        </div>
      ) : productReviews.length === 0 ? (
        <p className="mt-6 rounded-xl border border-line bg-soft p-4 text-sm text-mute">
          No customer reviews yet. Share your experience with this product.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line">
          {productReviews
            .slice()
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
            .map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                customerName={
                  customers.find(({ id }) => id === review.customerId)
                    ?.fullName ?? "Customer record unavailable"
                }
                isOwnReview={review.customerId === customerId}
              />
            ))}
        </ul>
      )}
    </section>
  );
}

function ReviewItem({
  review,
  customerName,
  isOwnReview,
}: {
  review: DemoProductReview;
  customerName: string;
  isOwnReview: boolean;
}) {
  return (
    <li className="py-5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-ink">
            {customerName}
            {isOwnReview && (
              <span className="ml-2 text-xs font-medium text-mute">
                Your review
              </span>
            )}
          </p>
          <time className="text-xs text-mute" dateTime={review.createdAt}>
            {formatReviewDate(review.createdAt)}
            {review.updatedAt !== review.createdAt && " · edited"}
          </time>
        </div>
        <span
          aria-label={`${review.rating} out of 5 stars`}
          className="flex items-center gap-1 text-sm font-medium text-ink"
        >
          <Star
            aria-hidden="true"
            className="size-4 fill-accent text-accent"
          />
          {review.rating}/5
        </span>
      </div>
      <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-ink">
        {review.body}
      </p>
    </li>
  );
}
