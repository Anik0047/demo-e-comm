"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { ProductCardImage } from "@/components/shared/product-card-image";
import { useDemoState } from "@/hooks/use-demo-state";
import { getCustomerProductReviewHistory } from "@/services/customer-product-reviews";
import {
  selectActiveAccount,
  selectDemoSnapshot,
  selectHydrationReady,
} from "@/services/demo-state-store";

function reviewDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(parsed);
}

export default function CustomerReviewsPage() {
  const ready = useDemoState(selectHydrationReady);
  const account = useDemoState(selectActiveAccount);
  const snapshot = useDemoState(selectDemoSnapshot);
  const customerId =
    account?.role === "customer" ? account.customerId : null;
  const history =
    ready && snapshot && customerId
      ? getCustomerProductReviewHistory(snapshot, customerId)
      : [];

  if (!ready) {
    return (
      <section aria-label="Loading your reviews" aria-busy="true" className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-36 w-full rounded-2xl" />
        <div className="skeleton h-36 w-full rounded-2xl" />
      </section>
    );
  }

  return (
    <section aria-labelledby="my-reviews-heading" className="space-y-4">
      <header className="card p-5 sm:p-6">
        <h2 id="my-reviews-heading" className="font-head text-2xl font-extrabold">
          My Reviews
        </h2>
        <p className="mt-2 text-sm text-mute">
          Your product reviews, newest first.
        </p>
      </header>

      {history.length === 0 ? (
        <div className="card p-6 text-center sm:p-8">
          <h3 className="font-bold text-ink">You haven’t reviewed a product yet</h3>
          <p className="mt-2 text-sm text-mute">
            Share what you think after shopping for something you love.
          </p>
          <Link href="/products" className="btn btn-primary btn-md mt-5">
            Explore products
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {history.map(({ review, product, productAvailable }) => (
            <li key={review.id} className="card min-w-0 p-4 sm:p-5">
              <article className="flex min-w-0 flex-col gap-4 sm:flex-row">
                <div className="relative size-24 shrink-0 self-start overflow-hidden rounded-xl bg-soft sm:size-28">
                  {product ? (
                    <ProductCardImage
                      image={product.mainImage}
                      name={product.name}
                      placeholder={undefined}
                    />
                  ) : (
                    <div className="grid size-full place-items-center px-2 text-center text-xs text-mute">
                      Product unavailable
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {product && productAvailable ? (
                    <Link
                      href={`/products/${product.slug}`}
                      className="inline-flex min-h-11 min-w-0 items-center font-bold text-ink hover:text-brand-strong hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      <span className="line-clamp-2">{product.name}</span>
                    </Link>
                  ) : product ? (
                    <h3 className="min-h-11 py-2 font-bold text-mute">
                      {product.name} (unavailable)
                    </h3>
                  ) : (
                    <h3 className="min-h-11 py-2 font-bold text-mute">
                      Product unavailable
                    </h3>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span
                      aria-label={`${review.rating} out of 5 stars`}
                      className="inline-flex items-center gap-1 text-sm font-bold text-ink"
                    >
                      <Star aria-hidden="true" className="size-4 fill-accent text-accent" />
                      {review.rating}/5
                    </span>
                    <time className="text-sm text-mute" dateTime={review.createdAt}>
                      {reviewDate(review.createdAt)}
                    </time>
                  </div>
                  <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-ink">
                    {review.body}
                  </p>
                  {product && productAvailable ? (
                    <Link
                      href={`/products/${product.slug}?editReview=${encodeURIComponent(review.id)}#customer-review-editor`}
                      className="mt-3 inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-brand-strong hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      Edit review
                    </Link>
                  ) : (
                    <p className="mt-3 text-xs text-mute">
                      This product is unavailable, so its review can’t be opened or edited here.
                    </p>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
