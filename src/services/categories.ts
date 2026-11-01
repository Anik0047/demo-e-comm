import { mainCategories } from "@/data/categories";
import type { MainCategory } from "@/types/category";

export async function getMainCategories(): Promise<MainCategory[]> {
  return mainCategories;
}
