import type { Category } from "@/types/category";

export interface NavbarData {
  topStripMessage: string;
  categories: Category[];
  searchProducts: SearchProduct[];
  popularSearches: string[];
}

export interface SearchProduct {
  id: string;
  name: string;
  categoryName: string;
  categorySlug: string;
  searchFields: string[];
}

