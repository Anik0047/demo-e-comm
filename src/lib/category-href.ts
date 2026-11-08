import type { RawListingQuery } from "@/types/catalog";

export function buildCategoryHref(path: string, raw: RawListingQuery): string {
  const params = new URLSearchParams();
  if (raw instanceof URLSearchParams) raw.forEach((value, key) => params.append(key, value));
  else for (const [key, value] of Object.entries(raw)) {
    if (key === "category" || key === "subcategory" || key === "child") continue;
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.append(key, value);
  }
  params.delete("category");
  params.delete("subcategory");
  params.delete("child");
  const query = params.toString();
  return `${path}${query ? `?${query}` : ""}`;
}
