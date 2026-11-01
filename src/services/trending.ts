import { products, trendingPlaceholders, trendingProductIds } from "@/data/products";
import { vendors } from "@/data/vendors";
import type { Product, ProductCardData } from "@/types/product";

export type TrendingTab = "all" | "new" | "best-sellers" | "top-rated";

function toCard(product: Product): ProductCardData {
  const vendor = vendors.find((vendor) => vendor.id === product.vendorId);
  if (!vendor) throw new Error(`Missing vendor for ${product.id}`);
  return {
    id: product.id, slug: product.slug, name: product.name, mainImage: product.mainImage,
    price: product.price, compareAtPrice: product.compareAtPrice,
    ratingAverage: product.ratingAverage, ratingCount: product.ratingCount,
    freeShipping: product.freeShipping, vendor: { name: vendor.name, slug: vendor.slug },
    inStock: !product.trackInventory || product.stock > 0,
    placeholder: trendingPlaceholders[product.id],
  };
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
