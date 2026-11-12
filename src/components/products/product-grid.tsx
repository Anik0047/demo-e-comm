"use client";

import { ProductCard } from "@/components/shared/product-card";
import { useDemoState } from "@/hooks/use-demo-state";
import type { ListingItem } from "@/types/catalog";

export function ProductGrid({ items }: { items: ListingItem[] }) {
  const compact = useDemoState((state) => {
    if (state.hydrationStatus !== "ready") return false;
    const account = state.snapshot.data.accounts.find(({ id }) => id === state.activeAccountId);
    if (account?.role !== "customer" || !account.customerId) return false;
    return state.snapshot.data.customers.find(({ id, accountId }) => id === account.customerId && accountId === account.id)?.preferences.productGridDensity === "compact";
  });
  const firstImageIndex = items.findIndex((product) => product.mainImage.url.trim().length > 0);
  return (
    <ul aria-label="Products" data-density={compact ? "compact" : "standard"} className={compact
      ? "grid min-w-0 grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-4 xl:grid-cols-5"
      : "grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4"}>
      {items.map((product, index) => (
        <li key={product.id} data-product-id={product.id} className="flex min-w-0 flex-col">
          <div className="min-w-0 flex-1"><ProductCard product={product} eagerImage={index === firstImageIndex} /></div>
          {(product.availability === "out-of-stock" || !product.hasReviews) && (
            <div className="px-2 pt-2 text-xs text-mute md:px-3">
              {product.availability === "out-of-stock" && <p>Out of stock</p>}
              {!product.hasReviews && <p>No reviews yet</p>}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
