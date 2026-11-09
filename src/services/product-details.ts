import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import type { CatalogDataset } from "@/types/catalog";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";
import type { Vendor } from "@/types/vendor";

export interface ProductDetails {
  product: Product;
  vendor: Vendor;
  categoryPath: Category[];
}

type ProductDetailDataset = Pick<CatalogDataset, "products" | "categories"> & {
  vendors: readonly Vendor[];
};

const catalog: ProductDetailDataset = { products, categories, vendors };

export async function getProductDetails(slug: string, data: ProductDetailDataset = catalog): Promise<ProductDetails | null> {
  const product = data.products.find((item) => item.slug === slug && item.status === "active");
  if (!product) return null;

  const vendor = data.vendors.find((item) => item.id === product.vendorId && item.status === "approved");
  if (!vendor) return null;

  const categoryPath: Category[] = [];
  const visited = new Set<string>();
  let categoryId: string | null = product.categoryId;

  while (categoryId !== null) {
    const category = data.categories.find((item) => item.id === categoryId);
    if (!category || visited.has(category.id)) return null;
    if (categoryPath.length && category.level !== categoryPath[0].level - 1) return null;
    visited.add(category.id);
    categoryPath.unshift(category);
    categoryId = category.parentId;
  }

  if (categoryPath[0]?.level !== 1) return null;
  return { product, vendor, categoryPath };
}

export async function getProductDetailSlugs(data: ProductDetailDataset = catalog): Promise<string[]> {
  const details = await Promise.all(data.products.map((product) => getProductDetails(product.slug, data)));
  return details.flatMap((detail) => detail ? [detail.product.slug] : []);
}
