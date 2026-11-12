"use client";

import { productComparisonStore, useProductComparison as useComparisonStore } from "@/services/product-comparison-store";
import { COMPARISON_LIMIT } from "@/lib/product-comparison-state";

export function updateComparison(id: string) {
  return productComparisonStore.getState().add(id);
}

export function removeComparedProduct(id: string) {
  productComparisonStore.getState().remove(id);
}

export function clearComparedProducts() {
  productComparisonStore.getState().clear();
}

export function useProductComparison() {
  const ids = useComparisonStore((state) => state.ids);
  const hydrated = useComparisonStore((state) => state.hydrated);
  return { ids, hydrated, limit: COMPARISON_LIMIT };
}
