import { CATALOG_PAGE_SIZE } from "@/types/catalog";
import type { CatalogDataset, CatalogQueryResult, CatalogRow, ListingState } from "@/types/catalog";

const ordinal = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
function categoryClosure(data: CatalogDataset, slug: string): Set<string> {
  const found = data.categories.find((category) => category.slug === slug);
  const selected = new Set<string>();
  const pending = found ? [found.id] : [];
  while (pending.length) {
    const id = pending.pop();
    if (id === undefined || selected.has(id)) continue;
    selected.add(id);
    for (const category of data.categories) if (category.parentId === id) pending.push(category.id);
  }
  return selected;
}

export function matchesCatalogSearchFields(fields: readonly string[], search?: string): boolean {
  const tokens = search?.trim().toLowerCase().split(/\s+/u).filter(Boolean) ?? [];
  return tokens.every((token) => fields.some((field) => field.toLowerCase().includes(token)));
}
function compareRows(a: CatalogRow, b: CatalogRow, sort: ListingState["sort"]): number {
  const left = a.product;
  const right = b.product;
  let primary = 0;
  switch (sort) {
    case "catalog": return 0; // Stable sort retains the canonical array order.
    case "price-asc": primary = a.price - b.price; break;
    case "price-desc": primary = b.price - a.price; break;
    case "best-selling": primary = right.soldCount - left.soldCount; break;
    case "newest":
      if (left.publishedAt === null || right.publishedAt === null) {
        primary = Number(left.publishedAt === null) - Number(right.publishedAt === null);
      } else primary = Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
      break;
    case "top-rated":
      primary = Number(right.ratingCount > 0) - Number(left.ratingCount > 0);
      if (!primary && left.ratingCount > 0 && right.ratingCount > 0) primary = right.ratingAverage - left.ratingAverage || right.ratingCount - left.ratingCount;
      break;
  }
  return primary || ordinal(left.id, right.id);
}

// Input has passed catalog validation and slug resolution at the service boundary.
export function queryCatalog(data: CatalogDataset, applied: ListingState, categoryScope?: string): CatalogQueryResult {
  const vendors = new Map(data.vendors.map((vendor) => [vendor.id, vendor]));
  const deals = new Map(data.deals.map((deal) => [deal.productId, deal]));
  const categories = applied.category ? categoryClosure(data, applied.category) : undefined;
  const subcategories = applied.subcategory ? categoryClosure(data, applied.subcategory) : undefined;
  const children = applied.child ? categoryClosure(data, applied.child) : undefined;
  const scopedCategories = categoryScope ? categoryClosure(data, categoryScope) : undefined;
  const rows: CatalogRow[] = [];
  for (const product of data.products) {
    if (product.status !== "active") continue;
    const vendor = vendors.get(product.vendorId);
    if (!vendor) continue;
    const deal = applied.promotion ? deals.get(product.id) : undefined;
    if (applied.promotion && !deal) continue;
    const price = deal?.dealPrice ?? product.price;
    const inStock = (!product.trackInventory || product.stock > 0) && (!deal || deal.soldCount < deal.stockLimit);
    if (categories && !categories.has(product.categoryId)) continue;
    if (subcategories && !subcategories.has(product.categoryId)) continue;
    if (children && !children.has(product.categoryId)) continue;
    if (scopedCategories && !scopedCategories.has(product.categoryId)) continue;
    if (applied.vendor && vendor.slug !== applied.vendor) continue;
    if (applied.minPrice !== undefined && price < applied.minPrice) continue;
    if (applied.maxPrice !== undefined && price > applied.maxPrice) continue;
    if (applied.freeShipping && !product.freeShipping) continue;
    if (applied.availability && inStock !== (applied.availability === "in-stock")) continue;
    const fields = [product.name, product.brand ?? "", ...product.tags, vendor.name];
    if (!matchesCatalogSearchFields(fields, applied.search)) continue;
    rows.push({ product, vendor, deal, price, compareAtPrice: deal ? product.price : product.compareAtPrice, inStock });
  }
  rows.sort((a, b) => compareRows(a, b, applied.sort));
  const totalResults = rows.length;
  const totalPages = Math.ceil(totalResults / CATALOG_PAGE_SIZE);
  const page = Math.max(1, Math.min(applied.page, totalPages));
  return {
    state: { ...applied, page }, totalResults, totalPages, pageSize: CATALOG_PAGE_SIZE,
    rows: rows.slice((page - 1) * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE),
  };
}
