export const COMPARISON_LIMIT = 3;
export const COMPARISON_STORAGE_KEY = "kenakata-product-comparison-v1";

export type ComparisonUpdate =
  | { ok: true; ids: string[] }
  | { ok: false; reason: "limit" | "unavailable" };

export function addComparisonProduct(ids: readonly string[], id: string, validIds?: ReadonlySet<string>): ComparisonUpdate {
  if (validIds && !validIds.has(id)) return { ok: false, reason: "unavailable" };
  if (ids.includes(id)) return { ok: true, ids: [...ids] };
  if (ids.length >= COMPARISON_LIMIT) return { ok: false, reason: "limit" };
  return { ok: true, ids: [...ids, id] };
}

export function normalizeComparisonIds(value: unknown, validIds?: ReadonlySet<string>): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && (!validIds || validIds.has(id))))].slice(0, COMPARISON_LIMIT);
}

export function removeComparisonProduct(ids: readonly string[], id: string): string[] {
  return ids.filter((item) => item !== id);
}
