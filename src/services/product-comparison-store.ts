"use client";

import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import { getComparableProductIds } from "@/services/product-comparison";
import { COMPARISON_LIMIT, COMPARISON_STORAGE_KEY, normalizeComparisonIds, addComparisonProduct, removeComparisonProduct } from "@/lib/product-comparison-state";

interface ProductComparisonState {
  ids: string[];
  hydrated: boolean;
  storageReady: boolean;
  hydrate: () => void;
  add: (id: string) => { added: boolean; reason?: "limit" | "unavailable"; count: number };
  remove: (id: string) => void;
  clear: () => void;
}

function readStoredIds(): { ids: string[]; storageReady: boolean; shouldRepairStorage: boolean } {
  if (typeof window === "undefined") return { ids: [], storageReady: false, shouldRepairStorage: false };
  let stored: string | null;
  try {
    stored = window.sessionStorage.getItem(COMPARISON_STORAGE_KEY);
  } catch {
    return { ids: [], storageReady: false, shouldRepairStorage: false };
  }
  if (stored === null) return { ids: [], storageReady: true, shouldRepairStorage: false };
  try {
    const ids = normalizeComparisonIds(JSON.parse(stored), getComparableProductIds());
    return { ids, storageReady: true, shouldRepairStorage: JSON.stringify(ids) !== stored };
  } catch {
    return { ids: [], storageReady: true, shouldRepairStorage: true };
  }
}

function persistIds(ids: readonly string[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.sessionStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(ids));
    return true;
  } catch {
    // The in-memory store remains authoritative when session storage is unavailable.
    return false;
  }
}

type ComparisonSet = (state: Partial<ProductComparisonState> | ((current: ProductComparisonState) => Partial<ProductComparisonState>)) => void;

function hydrateStore(set: ComparisonSet, get: () => ProductComparisonState) {
  if (get().hydrated) return;
  const { ids, storageReady, shouldRepairStorage } = readStoredIds();
  // A caller may have queued an in-memory selection before the browser read
  // completed. Keep that newer state and repair storage from it instead.
  const currentIds = normalizeComparisonIds(get().ids, getComparableProductIds());
  const hasCurrentSelection = currentIds.length > 0;
  const selectedIds = hasCurrentSelection ? currentIds : ids;
  set({ ids: selectedIds, hydrated: true, storageReady });
  if (storageReady && (shouldRepairStorage || hasCurrentSelection) && !persistIds(selectedIds)) {
    set({ storageReady: false });
  }
}

export const productComparisonStore = createStore<ProductComparisonState>((set, get) => ({
  ids: [],
  hydrated: false,
  storageReady: false,
  hydrate: () => hydrateStore(set, get),
  add: (id) => {
    hydrateStore(set, get);
    let outcome: ReturnType<ProductComparisonState["add"]> = { added: false, reason: "unavailable", count: get().ids.length };
    set((state) => {
      const result = addComparisonProduct(state.ids, id, getComparableProductIds());
      if (!result.ok) {
        outcome = { added: false, reason: result.reason, count: state.ids.length };
        return state;
      }
      outcome = { added: true, count: result.ids.length };
      if (result.ids.length === state.ids.length) return state;
      if (state.storageReady && !persistIds(result.ids)) {
        return { ids: result.ids, storageReady: false };
      }
      return { ids: result.ids };
    });
    return outcome;
  },
  remove: (id) => {
    hydrateStore(set, get);
    const ids = removeComparisonProduct(get().ids, id);
    if (ids.length !== get().ids.length) {
      set({ ids });
      if (get().storageReady && !persistIds(ids)) set({ storageReady: false });
    }
  },
  clear: () => {
    hydrateStore(set, get);
    if (get().ids.length > 0) {
      set({ ids: [] });
      if (get().storageReady && !persistIds([])) set({ storageReady: false });
    }
  },
}));

export function useProductComparison<T>(selector: (state: ProductComparisonState) => T): T {
  return useStore(productComparisonStore, selector);
}

export { COMPARISON_LIMIT, COMPARISON_STORAGE_KEY };
