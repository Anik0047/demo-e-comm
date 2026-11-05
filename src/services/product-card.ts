import type { Product, ProductCardData } from "@/types/product";

export interface ProductCardOverrides {
  price?: number;
  compareAtPrice?: number | null;
  inStock?: boolean;
  placeholder?: ProductCardData["placeholder"];
}

// Projection only: callers retain ownership of membership and contextual rules.
export function projectProductCard(product: Product, vendor: ProductCardData["vendor"], overrides: ProductCardOverrides = {}): ProductCardData {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    mainImage: { url: product.mainImage.url, alt: product.mainImage.alt },
    price: overrides.price ?? product.price,
    compareAtPrice: overrides.compareAtPrice === undefined ? product.compareAtPrice : overrides.compareAtPrice,
    ratingAverage: product.ratingAverage,
    ratingCount: product.ratingCount,
    freeShipping: product.freeShipping,
    vendor: { name: vendor.name, slug: vendor.slug },
    inStock: overrides.inStock ?? (!product.trackInventory || product.stock > 0),
    placeholder: overrides.placeholder ? { ...overrides.placeholder } : undefined,
  };
}
