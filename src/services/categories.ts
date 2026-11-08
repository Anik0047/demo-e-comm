import { categories, mainCategories } from "@/data/categories";
import type { Category, MainCategory } from "@/types/category";

export async function getMainCategories(): Promise<MainCategory[]> {
  return mainCategories;
}

// Canonical flat hierarchy used by catalog lookups.
export async function getCatalogCategories(): Promise<Category[]> {
  return categories;
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return categories.find((category) => category.slug === slug);
}
