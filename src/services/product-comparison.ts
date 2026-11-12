import { categories } from "@/data/categories";
import { flashDeals } from "@/data/flash-deals";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import { resolveEffectivePrice } from "@/services/effective-price";
import { normalizeComparisonIds } from "@/lib/product-comparison-state";
import type { Product } from "@/types/product";

export { addComparisonProduct, normalizeComparisonIds, removeComparisonProduct } from "@/lib/product-comparison-state";

export interface ComparableProduct {
  id: string;
  slug: string;
  name: string;
  image: Product["mainImage"];
  vendorName: string;
  categoryName: string;
  price: number;
  inStock: boolean;
  specifications: { label: string; value: string }[];
}

const catalog = { products, categories, vendors, deals: flashDeals };

export function getComparableProductIds(): Set<string> {
  return new Set(products.filter((product) => product.status === "active").map(({ id }) => id));
}

export function getComparableProducts(ids: readonly string[], now = Date.now()): ComparableProduct[] {
  const validIds = new Set(products.filter((product) => product.status === "active").map(({ id }) => id));
  const normalizedIds = normalizeComparisonIds(ids, validIds);
  return normalizedIds.flatMap((id) => {
    const product = catalog.products.find((item) => item.id === id);
    const vendor = product && catalog.vendors.find((item) => item.id === product.vendorId && item.status === "approved");
    const category = product && catalog.categories.find((item) => item.id === product.categoryId);
    if (!product || !vendor || !category) return [];
    const variants = product.hasVariants && product.variants.length ? product.variants : [null];
    const orderableVariants = product.hasVariants
      ? product.variants.filter((variant) => !product.trackInventory || variant.stock >= product.minOrderQty)
      : variants;
    const pricedVariants = orderableVariants.length ? orderableVariants : variants;
    const prices = pricedVariants.map((variant) => resolveEffectivePrice(product, variant, catalog.deals, true, now).price);
    const inStock = !product.trackInventory || (product.hasVariants
      ? product.variants.some((variant) => variant.stock >= product.minOrderQty)
      : product.stock >= product.minOrderQty);
    return [{
      id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.mainImage,
      vendorName: vendor.name,
      categoryName: category.name,
      price: Math.min(...prices),
      inStock,
      specifications: product.specifications,
    }];
  });
}

export function getSupportedComparisonAttributes(items: readonly ComparableProduct[]): string[] {
  const labels = new Map<string, string>();
  for (const item of items) {
    for (const { label } of item.specifications) {
      const key = label.trim().toLocaleLowerCase();
      if (key && !labels.has(key)) labels.set(key, label.trim());
    }
  }
  return [...labels.values()];
}
