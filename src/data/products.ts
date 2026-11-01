import type { Product } from "@/types/product";

type ProductBase = Pick<Product, "id" | "slug" | "sku" | "name" | "vendorId" | "categoryId" | "price" | "ratingAverage" | "ratingCount"> & Partial<Product>;

export function createProduct(base: ProductBase): Product {
  return {
    shortDescription: "", description: "", highlights: [], specifications: [],
    brand: null, tags: [], mainImage: { url: "", alt: base.name }, gallery: [], videoUrl: null,
    compareAtPrice: null, currency: "BDT", hasVariants: false, options: [], variants: [],
    stock: 100, trackInventory: true, lowStockThreshold: 5, minOrderQty: 1, maxOrderQty: 10,
    weightGrams: 0, dimensionsCm: null, freeShipping: false, deliveryDays: { min: 2, max: 5 },
    shipsFrom: "Dhaka", codAvailable: true, returnWindowDays: 7, warrantyMonths: 0,
    soldCount: 0, badges: [], status: "active", rejectionReason: null, approvedAt: null,
    approvedBy: null, metaTitle: null, metaDescription: null,
    createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z", publishedAt: "2026-10-01T00:00:00.000Z",
    ...base,
  };
}

export const products: Product[] = [
  createProduct({"id": "prod-wireless-earbuds-pro", "slug": "wireless-earbuds-pro", "sku": "SKU-WIRELESS-EARBUDS-PRO", "name": "Wireless Earbuds Pro", "vendorId": "vendor-tech-haven", "categoryId": "cat-electronics", "price": 3770, "ratingAverage": 4.6, "ratingCount": 128}),
  createProduct({"id": "prod-smart-watch-series-5", "slug": "smart-watch-series-5", "sku": "SKU-SMART-WATCH-SERIES-5", "name": "Smart Watch Series 5", "vendorId": "vendor-tech-haven", "categoryId": "cat-electronics", "price": 6650, "ratingAverage": 4.4, "ratingCount": 86}),
  createProduct({"id": "prod-cotton-panjabi", "slug": "cotton-panjabi", "sku": "SKU-COTTON-PANJABI", "name": "Cotton Panjabi", "vendorId": "vendor-urban-fit", "categoryId": "cat-fashion", "price": 1600, "ratingAverage": 4.7, "ratingCount": 212}),
  createProduct({"id": "prod-nonstick-cookware-set", "slug": "nonstick-cookware-set", "sku": "SKU-NONSTICK-COOKWARE-SET", "name": "Non-stick Cookware Set", "vendorId": "vendor-home-nest", "categoryId": "cat-home-living", "price": 4750, "ratingAverage": 4.5, "ratingCount": 64}),
  createProduct({"id": "prod-bluetooth-speaker", "slug": "bluetooth-speaker", "sku": "SKU-BLUETOOTH-SPEAKER", "name": "Bluetooth Speaker", "vendorId": "vendor-sound-wave", "categoryId": "cat-electronics", "price": 2999, "ratingAverage": 4.3, "ratingCount": 97}),
  createProduct({"id": "prod-android-smartphone-128gb", "slug": "android-smartphone-128gb", "sku": "SKU-ANDROID-SMARTPHONE-128GB", "name": "Android Smartphone 128GB", "vendorId": "vendor-dhaka-bazaar", "categoryId": "cat-electronics", "price": 18990, "ratingAverage": 4.5, "ratingCount": 342}),
];
