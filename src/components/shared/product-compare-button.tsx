"use client";

import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { updateComparison, useProductComparison } from "@/hooks/use-product-comparison";
import { showToast } from "@/services/toast";
import type { ProductCardData } from "@/types/product";

interface ProductCompareButtonProps {
  product: Pick<ProductCardData, "id" | "name">;
  compact?: boolean;
}

export function ProductCompareButton({ product, compact = false }: ProductCompareButtonProps) {
  const { ids, limit } = useProductComparison();
  const selected = ids.includes(product.id);
  const atLimit = ids.length >= limit && !selected;

  function handleClick() {
    const outcome = updateComparison(product.id);
    if (!outcome.added && outcome.reason === "limit") showToast("info", "You can compare up to three products. Remove one to add another.");
    if (!outcome.added && outcome.reason === "unavailable") showToast("error", "This product is unavailable for comparison.");
  }

  if (selected) {
    return <Link
      className={compact
        ? "group relative grid size-11 place-items-center rounded-full border border-brand-border bg-brand-tint text-brand-strong transition-colors hover:border-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        : "btn btn-outline btn-sm w-full"}
      href="/compare"
      aria-label={`View comparison with ${ids.length} ${ids.length === 1 ? "product" : "products"}`}
      title={`In comparison (${ids.length})`}
    >
      {compact ? <>
        <ArrowLeftRight aria-hidden="true" className="size-5" />
        <span role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-white px-2 py-1 text-xs font-medium text-ink shadow-lg group-hover:block group-focus-within:block">In comparison ({ids.length})</span>
      </> : `View comparison (${ids.length})`}
    </Link>;
  }

  return (
    <div className="group relative space-y-1">
      <button
        type="button"
        className={compact
          ? "relative grid size-11 place-items-center rounded-full border border-line bg-white text-ink transition-colors hover:border-brand hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          : "btn btn-outline btn-sm min-h-11 w-full"}
        aria-label={`Compare ${product.name}`}
        aria-pressed={false}
        title="Add to comparison"
        onClick={handleClick}
      >
        <ArrowLeftRight aria-hidden="true" className={compact ? "size-5" : "size-4"} />
        {compact && <span role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-white px-2 py-1 text-xs font-medium text-ink shadow-lg group-hover:block group-focus-within:block">Add to comparison</span>}
        {!compact && (atLimit ? "Limit reached" : "Compare")}
      </button>
      {atLimit && !compact && <span className="sr-only">Comparison limit reached. Remove a product to add another.</span>}
    </div>
  );
}
