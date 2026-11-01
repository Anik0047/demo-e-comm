import type { CategoryTone } from "@/types/category";

export type ProductStatus = "draft" | "pending_review" | "active" | "rejected" | "inactive";
export interface ProductImage { url: string; alt: string }
export interface ProductVariant {
  id: string;
  sku: string;
  optionValues: Record<string, string>;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  image?: ProductImage;
}
export interface Product {
  id: string; slug: string; sku: string; name: string;
  shortDescription: string; description: string; highlights: string[];
  specifications: { label: string; value: string }[];
  brand: string | null; tags: string[];
  categoryId: string; // deepest category level; parents are found via parentId
  vendorId: string;
  mainImage: ProductImage; gallery: ProductImage[]; videoUrl: string | null;
  price: number; // regular selling price (BDT, whole taka)
  compareAtPrice: number | null;
  currency: "BDT";
  hasVariants: boolean;
  options: { name: string; values: string[] }[];
  variants: ProductVariant[];
  stock: number; trackInventory: boolean; lowStockThreshold: number;
  minOrderQty: number; maxOrderQty: number;
  weightGrams: number;
  dimensionsCm: { length: number; width: number; height: number } | null;
  freeShipping: boolean; deliveryDays: { min: number; max: number };
  shipsFrom: string; codAvailable: boolean;
  returnWindowDays: number; warrantyMonths: number;
  ratingAverage: number; ratingCount: number; soldCount: number;
  badges: string[];
  status: ProductStatus; rejectionReason: string | null;
  approvedAt: string | null; approvedBy: string | null;
  metaTitle: string | null; metaDescription: string | null;
  createdAt: string; updatedAt: string; publishedAt: string | null;
}
export interface FlashDeal {
  id: string;
  productId: string;
  dealPrice: number;
  startsAt: string;
  endsAt: string;
  stockLimit: number;
  soldCount: number;
}
export type PlaceholderIcon = "headphones" | "watch" | "shirt" | "utensils" | "speaker" | "smartphone";

// What a product card needs. `placeholder` is temporary: it is used while `mainImage.url` is empty.
export interface ProductCardData
  extends Pick<Product, "id" | "slug" | "name" | "mainImage" | "price" | "compareAtPrice" | "ratingAverage" | "ratingCount" | "freeShipping"> {
  vendor: { name: string; slug: string };
  inStock: boolean;
  placeholder?: { icon: PlaceholderIcon; tone: CategoryTone };
}

// A product card inside a flash deal: `price` is the DEAL price, `compareAtPrice` is the regular price.
export interface FlashDealItem extends ProductCardData {
  stockLimit: number;
  soldCount: number;
}
