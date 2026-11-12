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
  const imageSizes = compact
    ? "(min-width: 1280px) calc((1280px - 96px) / 5), (min-width: 1024px) calc((100vw - 80px) / 4), (min-width: 768px) calc((100vw - 64px) / 3), calc((100vw - 44px) / 2)"
    : "(min-width: 1280px) calc((1280px - 80px) / 4), (min-width: 768px) calc((100vw - 64px) / 3), calc((100vw - 44px) / 2)";
  return (
    <ul aria-label="Products" data-density={compact ? "compact" : "standard"} className={compact
      ? "grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5"
      : "grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4"}>
      {items.map((product) => (
        <li key={product.id} data-product-id={product.id} className="flex min-w-0 flex-col">
          <div className="min-w-0 flex-1"><ProductCard product={product} imageSizes={imageSizes} /></div>
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
