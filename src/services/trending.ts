import { categories } from "@/data/categories";
import { products, trendingPlaceholders, trendingProductIds } from "@/data/products";
import { vendors } from "@/data/vendors";
import { projectProductCard } from "@/services/product-card";
import type { Product, ProductCardData } from "@/types/product";
import type { Category } from "@/types/category";
import type { Vendor } from "@/types/vendor";

export type TrendingTab = "all" | "new" | "best-sellers" | "top-rated";

interface TrendingData {
  products: readonly Product[];
  vendors: readonly Vendor[];
  categories: readonly Category[];
  ids: readonly string[];
}

function toCard(product: Product, vendor: Vendor, now?: number): ProductCardData {
  return projectProductCard(product, vendor, { placeholder: trendingPlaceholders[product.id] }, now);
}

export async function getTrendingProducts(
  now?: number,
  data: TrendingData = { products, vendors, categories, ids: trendingProductIds },
): Promise<Record<TrendingTab, ProductCardData[]>> {
  const vendorById = new Map(data.vendors.map((vendor) => [vendor.id, vendor]));
  const categoryIds = new Set(data.categories.map((category) => category.id));
  const seen = new Set<string>();
  const active = data.ids.flatMap((id) => {
    const product = data.products.find((product) => product.id === id && product.status === "active");
    const vendor = product ? vendorById.get(product.vendorId) : undefined;
    if (!product || !vendor || vendor.status !== "approved" || !categoryIds.has(product.categoryId) || seen.has(product.id)) return [];
    seen.add(product.id);
    return [{ product, vendor }];
  });
  const toProductCards = (rows: typeof active) => rows.map(({ product, vendor }) => toCard(product, vendor, now));
  return {
    all: toProductCards(active),
    new: toProductCards([...active].sort((a, b) => (b.product.publishedAt ?? "").localeCompare(a.product.publishedAt ?? "") || a.product.id.localeCompare(b.product.id))),
    "best-sellers": toProductCards([...active].sort((a, b) => b.product.soldCount - a.product.soldCount || a.product.id.localeCompare(b.product.id))),
    "top-rated": toProductCards([...active].sort((a, b) => b.product.ratingAverage - a.product.ratingAverage || b.product.ratingCount - a.product.ratingCount || a.product.id.localeCompare(b.product.id))),
  };
}
