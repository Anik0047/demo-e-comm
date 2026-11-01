import type { Product, ProductCardData } from "@/types/product";

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
  createProduct({
    "id": "prod-running-shoes",
    "slug": "running-shoes",
    "sku": "SKU-RUNNING-SHOES",
    "name": "Running Shoes",
    "vendorId": "vendor-urban-fit",
    "categoryId": "cat-fashion",
    "price": 2490,
    "compareAtPrice": 3200,
    "ratingAverage": 4.5,
    "ratingCount": 310,
    "soldCount": 1240,
    "createdAt": "2026-09-12T00:00:00.000Z",
    "publishedAt": "2026-09-12T00:00:00.000Z",
    "freeShipping": true
}),
  createProduct({
    "id": "prod-laptop-backpack",
    "slug": "laptop-backpack",
    "sku": "SKU-LAPTOP-BACKPACK",
    "name": "Laptop Backpack",
    "vendorId": "vendor-urban-fit",
    "categoryId": "cat-fashion",
    "price": 1450,
    "compareAtPrice": null,
    "ratingAverage": 4.6,
    "ratingCount": 188,
    "soldCount": 860,
    "createdAt": "2026-09-28T00:00:00.000Z",
    "publishedAt": "2026-09-28T00:00:00.000Z",
    "freeShipping": true
}),
  createProduct({
    "id": "prod-wireless-gaming-mouse",
    "slug": "wireless-gaming-mouse",
    "sku": "SKU-WIRELESS-GAMING-MOUSE",
    "name": "Wireless Gaming Mouse",
    "vendorId": "vendor-tech-haven",
    "categoryId": "cat-electronics",
    "price": 1290,
    "compareAtPrice": 1790,
    "ratingAverage": 4.4,
    "ratingCount": 142,
    "soldCount": 530,
    "createdAt": "2026-10-20T00:00:00.000Z",
    "publishedAt": "2026-10-20T00:00:00.000Z",
    "freeShipping": false
}),
  createProduct({
    "id": "prod-power-bank-10000",
    "slug": "power-bank-10000",
    "sku": "SKU-POWER-BANK-10000",
    "name": "10000mAh Power Bank",
    "vendorId": "vendor-tech-haven",
    "categoryId": "cat-electronics",
    "price": 1590,
    "compareAtPrice": null,
    "ratingAverage": 4.5,
    "ratingCount": 402,
    "soldCount": 2100,
    "createdAt": "2026-08-30T00:00:00.000Z",
    "publishedAt": "2026-08-30T00:00:00.000Z",
    "freeShipping": true
}),
  createProduct({
    "id": "prod-ceramic-coffee-mug-set",
    "slug": "ceramic-coffee-mug-set",
    "sku": "SKU-CERAMIC-COFFEE-MUG-SET",
    "name": "Ceramic Coffee Mug Set",
    "vendorId": "vendor-home-nest",
    "categoryId": "cat-home-living",
    "price": 890,
    "compareAtPrice": 1190,
    "ratingAverage": 4.3,
    "ratingCount": 77,
    "soldCount": 310,
    "createdAt": "2026-10-25T00:00:00.000Z",
    "publishedAt": "2026-10-25T00:00:00.000Z",
    "freeShipping": false
}),
  createProduct({
    "id": "prod-led-desk-lamp",
    "slug": "led-desk-lamp",
    "sku": "SKU-LED-DESK-LAMP",
    "name": "LED Desk Lamp",
    "vendorId": "vendor-home-nest",
    "categoryId": "cat-home-living",
    "price": 1250,
    "compareAtPrice": null,
    "ratingAverage": 4.6,
    "ratingCount": 120,
    "soldCount": 470,
    "createdAt": "2026-10-02T00:00:00.000Z",
    "publishedAt": "2026-10-02T00:00:00.000Z",
    "freeShipping": false
}),
  createProduct({
    "id": "prod-organic-face-serum",
    "slug": "organic-face-serum",
    "sku": "SKU-ORGANIC-FACE-SERUM",
    "name": "Organic Face Serum",
    "vendorId": "vendor-glowbd",
    "categoryId": "cat-beauty-health",
    "price": 1150,
    "compareAtPrice": 1500,
    "ratingAverage": 4.7,
    "ratingCount": 265,
    "soldCount": 980,
    "createdAt": "2026-10-15T00:00:00.000Z",
    "publishedAt": "2026-10-15T00:00:00.000Z",
    "freeShipping": true
}),
  createProduct({
    "id": "prod-basmati-rice-5kg",
    "slug": "basmati-rice-5kg",
    "sku": "SKU-BASMATI-RICE-5KG",
    "name": "Premium Basmati Rice 5kg",
    "vendorId": "vendor-dhaka-bazaar",
    "categoryId": "cat-groceries",
    "price": 780,
    "compareAtPrice": null,
    "ratingAverage": 4.4,
    "ratingCount": 530,
    "soldCount": 3400,
    "createdAt": "2026-07-18T00:00:00.000Z",
    "publishedAt": "2026-07-18T00:00:00.000Z",
    "freeShipping": true
}),
  createProduct({
    "id": "prod-kids-building-blocks",
    "slug": "kids-building-blocks",
    "sku": "SKU-KIDS-BUILDING-BLOCKS",
    "name": "Kids Building Blocks Set",
    "vendorId": "vendor-little-nest",
    "categoryId": "cat-mother-baby",
    "price": 1350,
    "compareAtPrice": 1800,
    "ratingAverage": 4.8,
    "ratingCount": 96,
    "soldCount": 420,
    "createdAt": "2026-10-29T00:00:00.000Z",
    "publishedAt": "2026-10-29T00:00:00.000Z",
    "freeShipping": false
}),
  createProduct({
    "id": "prod-yoga-mat",
    "slug": "yoga-mat",
    "sku": "SKU-YOGA-MAT",
    "name": "Yoga Mat",
    "vendorId": "vendor-fitzone",
    "categoryId": "cat-sports-outdoor",
    "price": 990,
    "compareAtPrice": 1290,
    "ratingAverage": 4.5,
    "ratingCount": 205,
    "soldCount": 700,
    "createdAt": "2026-10-10T00:00:00.000Z",
    "publishedAt": "2026-10-10T00:00:00.000Z",
    "freeShipping": false
}),
];

// Curated order for the Trending products All tab.
export const trendingProductIds: string[] = [
  "prod-running-shoes",
  "prod-laptop-backpack",
  "prod-wireless-gaming-mouse",
  "prod-power-bank-10000",
  "prod-ceramic-coffee-mug-set",
  "prod-led-desk-lamp",
  "prod-organic-face-serum",
  "prod-basmati-rice-5kg",
  "prod-kids-building-blocks",
  "prod-yoga-mat"
];

export const trendingPlaceholders: Record<string, NonNullable<ProductCardData["placeholder"]>> = {
  "prod-running-shoes": {
    "icon": "footprints",
    "tone": "info"
  },
  "prod-laptop-backpack": {
    "icon": "backpack",
    "tone": "blush"
  },
  "prod-wireless-gaming-mouse": {
    "icon": "mouse",
    "tone": "mint"
  },
  "prod-power-bank-10000": {
    "icon": "battery-charging",
    "tone": "gray"
  },
  "prod-ceramic-coffee-mug-set": {
    "icon": "coffee",
    "tone": "info"
  },
  "prod-led-desk-lamp": {
    "icon": "lamp",
    "tone": "blush"
  },
  "prod-organic-face-serum": {
    "icon": "sparkles",
    "tone": "mint"
  },
  "prod-basmati-rice-5kg": {
    "icon": "wheat",
    "tone": "gray"
  },
  "prod-kids-building-blocks": {
    "icon": "puzzle",
    "tone": "info"
  },
  "prod-yoga-mat": {
    "icon": "dumbbell",
    "tone": "blush"
  }
};
