import type { Product, ProductCardData } from "@/types/product";
import { flashDeals } from "@/data/flash-deals";
import { resolveEffectivePrice } from "@/services/effective-price";

export interface ProductCardOverrides {
  price?: number;
  compareAtPrice?: number | null;
  inStock?: boolean;
  placeholder?: ProductCardData["placeholder"];
}

// Projection only: callers retain ownership of membership and contextual rules.
export function projectProductCard(product: Product, vendor: ProductCardData["vendor"], overrides: ProductCardOverrides = {}, now?: number): ProductCardData {
  const effective = resolveEffectivePrice(product, null, flashDeals, true, now);
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    mainImage: { url: product.mainImage.url, alt: product.mainImage.alt },
    price: overrides.price ?? effective.price,
    compareAtPrice: overrides.compareAtPrice === undefined ? effective.compareAtPrice : overrides.compareAtPrice,
    ratingAverage: product.ratingAverage,
    ratingCount: product.ratingCount,
    freeShipping: product.freeShipping,
    vendor: { name: vendor.name, slug: vendor.slug },
    inStock: overrides.inStock ?? (!product.trackInventory || product.stock > 0),
    placeholder: overrides.placeholder ? { ...overrides.placeholder } : undefined,
  };
}
