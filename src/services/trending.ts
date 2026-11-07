import { products, trendingPlaceholders, trendingProductIds } from "@/data/products";
import { vendors } from "@/data/vendors";
import { projectProductCard } from "@/services/product-card";
import type { Product, ProductCardData } from "@/types/product";

export type TrendingTab = "all" | "new" | "best-sellers" | "top-rated";

function toCard(product: Product): ProductCardData {
  const vendor = vendors.find((vendor) => vendor.id === product.vendorId);
  if (!vendor) throw new Error(`Missing vendor for ${product.id}`);
  return projectProductCard(product, vendor, { placeholder: trendingPlaceholders[product.id] });
}

export async function getTrendingProducts(): Promise<Record<TrendingTab, ProductCardData[]>> {
  const active = trendingProductIds.flatMap((id) => {
    const product = products.find((product) => product.id === id && product.status === "active");
    return product ? [product] : [];
  });
  return {
    all: active.map(toCard),
    new: [...active].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")).map(toCard),
    "best-sellers": [...active].sort((a, b) => b.soldCount - a.soldCount).map(toCard),
    "top-rated": [...active].sort((a, b) => b.ratingAverage - a.ratingAverage || b.ratingCount - a.ratingCount).map(toCard),
  };
}
