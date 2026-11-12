"use client";

import { useSyncExternalStore } from "react";
import { getComparableProductIds } from "@/services/product-comparison";
import { addComparisonProduct, COMPARISON_LIMIT, COMPARISON_STORAGE_KEY, normalizeComparisonIds, removeComparisonProduct } from "@/lib/product-comparison-state";

const changedEvent = "kenakata:comparison-changed";
let snapshot: string[] = [];
let initialized = false;
const emptySnapshot: string[] = [];

function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    snapshot = normalizeComparisonIds(JSON.parse(window.sessionStorage.getItem(COMPARISON_STORAGE_KEY) ?? "[]"), getComparableProductIds());
  } catch {
    snapshot = [];
  }
  try {
    window.sessionStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Keep a usable in-memory selection when session storage is unavailable.
  }
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const onChange = () => {
    initialize();
    callback();
  };
  window.addEventListener(changedEvent, onChange);
  return () => window.removeEventListener(changedEvent, onChange);
}

function getSnapshot() {
  initialize();
  return snapshot;
}

function publish(ids: string[]) {
  snapshot = ids;
  try {
    window.sessionStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Keep the in-memory selection available for this page when storage is blocked.
  }
  window.dispatchEvent(new Event(changedEvent));
}

export function updateComparison(id: string): { added: boolean; reason?: "limit" | "unavailable"; count: number } {
  initialize();
  const result = addComparisonProduct(snapshot, id, getComparableProductIds());
  if (!result.ok) return { added: false, reason: result.reason, count: snapshot.length };
  if (!snapshot.includes(id)) publish(result.ids);
  return { added: true, count: result.ids.length };
}

export function removeComparedProduct(id: string) {
  initialize();
  publish(removeComparisonProduct(snapshot, id));
}

export function clearComparedProducts() {
  publish([]);
}

export function useProductComparison() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, () => emptySnapshot);
  return { ids, limit: COMPARISON_LIMIT };
}
