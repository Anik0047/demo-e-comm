import { categories } from "@/data/categories";
import { flashDeals, flashDealPlaceholders } from "@/data/flash-deals";
import { products, trendingPlaceholders } from "@/data/products";
import { vendors } from "@/data/vendors";
import { projectProductCard } from "@/services/product-card";
import type { Category } from "@/types/category";
import type { FlashDeal, Product, ProductCardData } from "@/types/product";
import type { Vendor } from "@/types/vendor";

export const RELATED_PRODUCTS_LIMIT = 4;

interface RelatedProductDataset {
  products: readonly Product[];
  categories: readonly Category[];
  vendors: readonly Vendor[];
  deals: readonly FlashDeal[];
}

interface RelatedProductOptions {
  now?: number;
  limit?: number;
  data?: RelatedProductDataset;
}

const catalog: RelatedProductDataset = { products, categories, vendors, deals: flashDeals };
const ordinal = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;

function categoryPath(categoryId: string, byId: ReadonlyMap<string, Category>): Category[] | null {
  const path: Category[] = [];
  const visited = new Set<string>();
  let category = byId.get(categoryId);

  while (category) {
    if (visited.has(category.id)) return null;
    visited.add(category.id);
    path.unshift(category);
    if (category.parentId === null) break;
    const parent = byId.get(category.parentId);
    if (!parent || parent.level !== category.level - 1) return null;
    category = parent;
  }

  return path[0]?.level === 1 ? path : null;
}

function categoryRank(currentPath: readonly Category[], candidatePath: readonly Category[]): number | null {
  const current = currentPath.at(-1);
  const candidate = candidatePath.at(-1);
  if (!current || !candidate) return null;
  if (current.id === candidate.id) return 0;
  if (current.level === candidate.level && current.parentId !== null && current.parentId === candidate.parentId) return 1;
  if (currentPath[0]?.id === candidatePath[0]?.id) return 2;
  return null;
}

export function getRelatedProducts(productId: string, options: RelatedProductOptions = {}): ProductCardData[] {
  const data = options.data ?? catalog;
  const limit = Math.max(0, Math.min(RELATED_PRODUCTS_LIMIT, Math.floor(options.limit ?? RELATED_PRODUCTS_LIMIT)));
  if (!limit) return [];

  const current = data.products.find(({ id, status }) => id === productId && status === "active");
  const vendorsById = new Map(data.vendors.map((vendor) => [vendor.id, vendor]));
  const categoriesById = new Map(data.categories.map((category) => [category.id, category]));
  const currentVendor = current ? vendorsById.get(current.vendorId) : undefined;
  const currentPath = current ? categoryPath(current.categoryId, categoriesById) : null;
  if (!current || !currentVendor || currentVendor.status !== "approved" || !currentPath) return [];

  const seen = new Set<string>([current.id]);
  const ranked = data.products.flatMap((product) => {
    if (seen.has(product.id) || product.status !== "active") return [];
    const vendor = vendorsById.get(product.vendorId);
    if (!vendor || vendor.status !== "approved") return [];
    const path = categoryPath(product.categoryId, categoriesById);
    const relevance = path ? categoryRank(currentPath, path) : null;
    const rank = relevance ?? (product.vendorId === current.vendorId ? 3 : null);
    if (rank === null) return [];
    seen.add(product.id);
    return [{ product, vendor, rank }];
  });

  ranked.sort((left, right) => left.rank - right.rank || ordinal(left.product.id, right.product.id));
  return ranked.slice(0, limit).map(({ product, vendor }) => projectProductCard(
    product,
    vendor,
    { placeholder: trendingPlaceholders[product.id] ?? flashDealPlaceholders[product.id] },
    options.now,
    data.deals,
  ));
}
