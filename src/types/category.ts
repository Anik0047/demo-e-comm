export type CategoryLevel = 1 | 2 | 3; // 1 = category, 2 = subcategory, 3 = child category
export type CategoryTone = "info" | "blush" | "mint" | "gray";
export type CategoryIconKey =
  | "smartphone" | "shirt" | "house" | "sparkles"
  | "basket" | "baby" | "bike" | "book";

export interface Category {
  id: string;
  name: string;
  slug: string; // unique, URL-safe
  parentId: string | null; // null for main categories
  level: CategoryLevel;
}

export interface MainCategory extends Category {
  parentId: null;
  level: 1;
  icon: CategoryIconKey;
  tone: CategoryTone;
}
