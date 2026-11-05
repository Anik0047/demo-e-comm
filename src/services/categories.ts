import { mainCategories } from "@/data/categories";
import type { Category, MainCategory } from "@/types/category";

export async function getMainCategories(): Promise<MainCategory[]> {
  return mainCategories;
}

// Canonical lookup only: navbar subcategory labels are not category records.
export async function getCatalogCategories(): Promise<Category[]> {
  return mainCategories;
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return mainCategories.find((category) => category.slug === slug);
}
