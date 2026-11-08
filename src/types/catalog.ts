import type { Category } from "@/types/category";
import type { FlashDeal, Product, ProductCardData } from "@/types/product";
import type { VendorSummary } from "@/types/vendor";

export const CATALOG_SORTS = ["catalog", "price-asc", "price-desc", "newest", "best-selling", "top-rated"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];
export const CATALOG_PAGE_SIZE = 12;
export interface ListingState {
  category?: string;
  subcategory?: string;
  child?: string;
  vendor?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: "in-stock" | "out-of-stock";
  promotion?: "flash-deals";
  freeShipping?: true;
  sort: CatalogSort;
  page: number;
}
export type ListingFilterKey = Exclude<keyof ListingState, "sort" | "page">;
export type ListingFilters = Pick<ListingState, ListingFilterKey>;
export interface ListingOption { slug: string; name: string; parentSlug?: string }
export interface ListingOptions { categories: ListingOption[]; subcategories?: ListingOption[]; children?: ListingOption[]; vendors: ListingOption[] }
export interface ListingNotice {
  reason: "unavailable-filter" | "invalid-price" | "truncated-search" | "invalid-sort" | "invalid-page";
  message: string;
}
export interface ListingItem extends ProductCardData {
  availability: "in-stock" | "out-of-stock";
  hasReviews: boolean;
}
interface ListingResultBase {
  state: ListingState;
  href: string;
  notices: ListingNotice[];
  options: ListingOptions;
}
export interface ListingSuccess extends ListingResultBase {
  status: "ready";
  totalResults: number;
  totalPages: number;
  pageSize: typeof CATALOG_PAGE_SIZE;
  items: ListingItem[];
}
export interface ListingUnavailable extends ListingResultBase { status: "unavailable" }
export type ListingResult = ListingSuccess | ListingUnavailable;
export type RawListingQuery = Record<string, string | string[] | undefined> | URLSearchParams;
export interface ParsedListingQuery { state: ListingState; notices: ListingNotice[] }
// UI drafts are separate from applied state and are never serialized directly.
export interface ListingDraft {
  search: string;
  minPrice: string;
  maxPrice: string;
  filters: Omit<ListingFilters, "search" | "minPrice" | "maxPrice">;
}
export type ListingCommittedAction =
  | { type: "filters"; values: ListingFilters }
  | { type: "search"; value: string }
  | { type: "price"; minPrice: string; maxPrice: string }
  | { type: "sort"; value: CatalogSort }
  | { type: "page"; value: number }
  | { type: "remove"; key: ListingFilterKey }
  | { type: "clear" };
export interface ListingTransition extends ParsedListingQuery { changed: boolean; href: string }
// Internal service input; never serialized to client controls.
export interface CatalogDataset {
  products: readonly Product[];
  categories: readonly Category[];
  vendors: readonly VendorSummary[];
  deals: readonly FlashDeal[];
  trendingProductIds?: readonly string[];
}
export interface CatalogIssue {
  severity: "fatal" | "omission";
  source: "products" | "categories" | "vendors" | "deals" | "selections";
  code: "duplicate" | "reference" | "hierarchy" | "scalar";
  detail: string;
}
export interface CatalogValidation {
  available: boolean;
  releaseValid: boolean;
  issues: CatalogIssue[];
}
export interface CatalogRow {
  product: Product;
  vendor: VendorSummary;
  deal?: FlashDeal;
  price: number;
  compareAtPrice: number | null;
  inStock: boolean;
}
export interface CatalogQueryResult {
  state: ListingState;
  rows: CatalogRow[];
  totalResults: number;
  totalPages: number;
  pageSize: typeof CATALOG_PAGE_SIZE;
}
