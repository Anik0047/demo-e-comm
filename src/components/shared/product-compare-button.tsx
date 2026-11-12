"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { updateComparison, useProductComparison } from "@/hooks/use-product-comparison";
import type { ProductCardData } from "@/types/product";

interface ProductCompareButtonProps {
  product: Pick<ProductCardData, "id" | "name">;
  compact?: boolean;
}

export function ProductCompareButton({ product, compact = false }: ProductCompareButtonProps) {
  const { ids, limit } = useProductComparison();
  const [message, setMessage] = useState("");
  const selected = ids.includes(product.id);
  const atLimit = ids.length >= limit && !selected;

  function handleClick() {
    const outcome = updateComparison(product.id);
    setMessage(outcome.reason === "limit" ? "You can compare up to three products. Remove one to add another." : "");
  }

  if (selected) {
    return <Link className="btn btn-outline btn-sm w-full" href="/compare">View comparison ({ids.length})</Link>;
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        className={`btn btn-outline btn-sm min-h-11 w-full ${compact ? "px-2 text-xs" : ""}`}
        aria-label={`Compare ${product.name}`}
        onClick={handleClick}
      >
        <ArrowLeftRight aria-hidden="true" className="size-4" />
        {atLimit ? "Limit reached" : "Compare"}
      </button>
      {atLimit && <span role="status" className="text-xs text-mute">{message || "Remove a product to compare another."}</span>}
    </div>
  );
}
