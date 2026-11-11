import { categories, mainCategories } from "@/data/categories";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import type { Category, MainCategory } from "@/types/category";

export async function getMainCategories(): Promise<MainCategory[]> {
  return mainCategories.filter((category) => hasEligibleProduct(category.id));
}

// Canonical flat hierarchy used by catalog lookups.
export async function getCatalogCategories(): Promise<Category[]> {
  return categories;
}

// Keep navigation branches only when an active product from an approved vendor
// exists somewhere in that branch. Filtering preserves canonical data order.
export async function getCategoryNavigation(): Promise<Category[]> {
  return categories.filter((category) => hasEligibleProduct(category.id));
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return categories.find((category) => category.slug === slug);
}

function hasEligibleProduct(categoryId: string): boolean {
  const approvedVendorIds = new Set(vendors.filter((vendor) => vendor.status === "approved").map((vendor) => vendor.id));
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  return products.some((product) => {
    if (product.status !== "active" || !approvedVendorIds.has(product.vendorId)) return false;
    let category = categoryById.get(product.categoryId);
    while (category) {
      if (category.id === categoryId) return true;
      category = category.parentId ? categoryById.get(category.parentId) : undefined;
    }
    return false;
  });
}
