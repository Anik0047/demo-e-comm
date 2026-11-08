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
  createProduct({"id": "prod-wireless-earbuds-pro", "slug": "wireless-earbuds-pro", "sku": "SKU-WIRELESS-EARBUDS-PRO", "name": "Wireless Earbuds Pro", "vendorId": "vendor-tech-haven", "categoryId": "child-audio-earbuds", "price": 3770, "ratingAverage": 4.6, "ratingCount": 128, "stock": 76, "soldCount": 820, "publishedAt": "2026-09-15T00:00:00.000Z"}),
  createProduct({"id": "prod-smart-watch-series-5", "slug": "smart-watch-series-5", "sku": "SKU-SMART-WATCH-SERIES-5", "name": "Smart Watch Series 5", "vendorId": "vendor-tech-haven", "categoryId": "sub-electronics-mobile-phones", "price": 6650, "ratingAverage": 4.4, "ratingCount": 86, "stock": 44, "soldCount": 510, "publishedAt": "2026-08-18T00:00:00.000Z"}),
  createProduct({"id": "prod-cotton-panjabi", "slug": "cotton-panjabi", "sku": "SKU-COTTON-PANJABI", "name": "Cotton Panjabi", "vendorId": "vendor-urban-fit", "categoryId": "child-fashion-men-panjabi", "price": 1600, "ratingAverage": 4.7, "ratingCount": 212, "stock": 88, "soldCount": 940, "publishedAt": "2026-09-05T00:00:00.000Z"}),
  createProduct({"id": "prod-nonstick-cookware-set", "slug": "nonstick-cookware-set", "sku": "SKU-NONSTICK-COOKWARE-SET", "name": "Non-stick Cookware Set", "vendorId": "vendor-home-nest", "categoryId": "child-home-kitchen-cookware", "price": 4750, "ratingAverage": 4.5, "ratingCount": 64, "stock": 31, "soldCount": 290, "publishedAt": "2026-08-28T00:00:00.000Z"}),
  createProduct({"id": "prod-bluetooth-speaker", "slug": "bluetooth-speaker", "sku": "SKU-BLUETOOTH-SPEAKER", "name": "Bluetooth Speaker", "vendorId": "vendor-sound-wave", "categoryId": "sub-electronics-audio", "price": 2999, "ratingAverage": 4.3, "ratingCount": 97, "stock": 59, "soldCount": 460, "publishedAt": "2026-09-21T00:00:00.000Z"}),
  createProduct({"id": "prod-android-smartphone-128gb", "slug": "android-smartphone-128gb", "sku": "SKU-ANDROID-SMARTPHONE-128GB", "name": "Android Smartphone 128GB", "vendorId": "vendor-dhaka-bazaar", "categoryId": "child-mobile-xiaomi", "price": 18990, "ratingAverage": 4.5, "ratingCount": 342, "stock": 24, "soldCount": 690, "publishedAt": "2026-10-01T00:00:00.000Z"}),
  createProduct({
    "id": "prod-running-shoes",
    "slug": "running-shoes",
    "sku": "SKU-RUNNING-SHOES",
    "name": "Running Shoes",
    "vendorId": "vendor-urban-fit",
    "categoryId": "child-fashion-shoes-sneakers",
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
    "categoryId": "child-fashion-bags-backpacks",
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
    "categoryId": "sub-electronics-computers",
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
    "categoryId": "sub-electronics-mobile-phones",
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
    "categoryId": "sub-home-kitchen",
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
    "categoryId": "child-home-decor-lighting",
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
    "categoryId": "child-beauty-skincare-serums",
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
    "categoryId": "child-grocery-rice-basmati",
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
    "categoryId": "child-baby-toys-building",
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
    "categoryId": "child-sports-fitness-yoga",
    "price": 990,
    "compareAtPrice": 1290,
    "ratingAverage": 4.5,
    "ratingCount": 205,
    "soldCount": 700,
    "createdAt": "2026-10-10T00:00:00.000Z",
    "publishedAt": "2026-10-10T00:00:00.000Z",
    "freeShipping": false
}),
  createProduct({"id":"prod-over-ear-headphones","slug":"over-ear-headphones","sku":"SKU-OVER-EAR-HEADPHONES","name":"Noise-isolating Over-ear Headphones","vendorId":"vendor-sound-wave","categoryId":"child-audio-headphones","price":3250,"compareAtPrice":3990,"ratingAverage":4.6,"ratingCount":174,"stock":63,"soldCount":620,"createdAt":"2026-11-02T00:00:00.000Z","publishedAt":"2026-11-02T00:00:00.000Z","freeShipping":true}),
  createProduct({"id":"prod-gaming-laptop-15","slug":"gaming-laptop-15","sku":"SKU-GAMING-LAPTOP-15","name":"15-inch Core i5 Gaming Laptop","vendorId":"vendor-tech-haven","categoryId":"child-computers-gaming","price":82900,"compareAtPrice":89900,"ratingAverage":4.7,"ratingCount":48,"stock":12,"soldCount":95,"createdAt":"2026-10-28T00:00:00.000Z","publishedAt":"2026-10-28T00:00:00.000Z","freeShipping":true}),
  createProduct({"id":"prod-double-door-refrigerator","slug":"double-door-refrigerator","sku":"SKU-DOUBLE-DOOR-REFRIGERATOR","name":"255L Frost-free Double-door Refrigerator","vendorId":"vendor-dhaka-bazaar","categoryId":"child-appliances-refrigerators","price":48900,"compareAtPrice":52900,"ratingAverage":4.5,"ratingCount":36,"stock":9,"soldCount":42,"createdAt":"2026-10-26T00:00:00.000Z","publishedAt":"2026-10-26T00:00:00.000Z"}),
  createProduct({"id":"prod-jamdani-cotton-saree","slug":"jamdani-cotton-saree","sku":"SKU-JAMDANI-COTTON-SAREE","name":"Handloom Jamdani Cotton Saree","vendorId":"vendor-urban-fit","categoryId":"child-fashion-women-sarees","price":3850,"compareAtPrice":4500,"ratingAverage":4.8,"ratingCount":91,"stock":28,"soldCount":230,"createdAt":"2026-10-31T00:00:00.000Z","publishedAt":"2026-10-31T00:00:00.000Z","freeShipping":true}),
  createProduct({"id":"prod-mens-oxford-shirt","slug":"mens-oxford-shirt","sku":"SKU-MENS-OXFORD-SHIRT","name":"Men’s Slim-fit Oxford Shirt","vendorId":"vendor-urban-fit","categoryId":"child-fashion-men-shirts","price":1290,"compareAtPrice":1590,"ratingAverage":4.5,"ratingCount":143,"stock":72,"soldCount":510,"createdAt":"2026-10-22T00:00:00.000Z","publishedAt":"2026-10-22T00:00:00.000Z"}),
  createProduct({"id":"prod-womens-cotton-kurti","slug":"womens-cotton-kurti","sku":"SKU-WOMENS-COTTON-KURTI","name":"Printed Cotton Kurti","vendorId":"vendor-urban-fit","categoryId":"sub-fashion-womens-clothing","price":1450,"compareAtPrice":null,"ratingAverage":4.4,"ratingCount":67,"stock":54,"soldCount":188,"createdAt":"2026-11-04T00:00:00.000Z","publishedAt":"2026-11-04T00:00:00.000Z"}),
  createProduct({"id":"prod-cotton-bed-sheet-set","slug":"cotton-bed-sheet-set","sku":"SKU-COTTON-BED-SHEET-SET","name":"King-size Cotton Bed Sheet Set","vendorId":"vendor-home-nest","categoryId":"child-home-bedding-sheets","price":2190,"compareAtPrice":2590,"ratingAverage":4.6,"ratingCount":118,"stock":39,"soldCount":370,"createdAt":"2026-10-30T00:00:00.000Z","publishedAt":"2026-10-30T00:00:00.000Z"}),
  createProduct({"id":"prod-airtight-food-containers","slug":"airtight-food-containers","sku":"SKU-AIRTIGHT-FOOD-CONTAINERS","name":"Airtight Food Storage Container Set","vendorId":"vendor-home-nest","categoryId":"child-home-kitchen-storage","price":890,"compareAtPrice":1090,"ratingAverage":4.4,"ratingCount":83,"stock":90,"soldCount":280,"createdAt":"2026-10-19T00:00:00.000Z","publishedAt":"2026-10-19T00:00:00.000Z"}),
  createProduct({"id":"prod-hydrating-face-moisturizer","slug":"hydrating-face-moisturizer","sku":"SKU-HYDRATING-FACE-MOISTURIZER","name":"Hydrating Face Moisturizer 50g","vendorId":"vendor-glowbd","categoryId":"child-beauty-skincare-moisturizers","price":850,"compareAtPrice":990,"ratingAverage":4.7,"ratingCount":203,"stock":62,"soldCount":710,"createdAt":"2026-11-01T00:00:00.000Z","publishedAt":"2026-11-01T00:00:00.000Z"}),
  createProduct({"id":"prod-herbal-shampoo","slug":"herbal-shampoo","sku":"SKU-HERBAL-SHAMPOO","name":"Herbal Nourishing Shampoo 400ml","vendorId":"vendor-glowbd","categoryId":"child-beauty-hair-shampoo","price":520,"compareAtPrice":620,"ratingAverage":4.5,"ratingCount":156,"stock":83,"soldCount":490,"createdAt":"2026-10-18T00:00:00.000Z","publishedAt":"2026-10-18T00:00:00.000Z"}),
  createProduct({"id":"prod-miniket-rice-5kg","slug":"miniket-rice-5kg","sku":"SKU-MINIKET-RICE-5KG","name":"Premium Miniket Rice 5kg","vendorId":"vendor-dhaka-bazaar","categoryId":"child-grocery-rice-miniket","price":520,"compareAtPrice":null,"ratingAverage":4.5,"ratingCount":412,"stock":145,"soldCount":2860,"createdAt":"2026-10-12T00:00:00.000Z","publishedAt":"2026-10-12T00:00:00.000Z","freeShipping":true}),
  createProduct({"id":"prod-butter-cookies-tin","slug":"butter-cookies-tin","sku":"SKU-BUTTER-COOKIES-TIN","name":"Butter Cookies Gift Tin 400g","vendorId":"vendor-dhaka-bazaar","categoryId":"child-grocery-snacks-biscuits","price":390,"compareAtPrice":450,"ratingAverage":4.3,"ratingCount":59,"stock":110,"soldCount":320,"createdAt":"2026-11-03T00:00:00.000Z","publishedAt":"2026-11-03T00:00:00.000Z"}),
  createProduct({"id":"prod-baby-feeding-bottle","slug":"baby-feeding-bottle","sku":"SKU-BABY-FEEDING-BOTTLE","name":"BPA-free Baby Feeding Bottle 240ml","vendorId":"vendor-little-nest","categoryId":"child-baby-feeding-bottles","price":590,"compareAtPrice":690,"ratingAverage":4.7,"ratingCount":104,"stock":58,"soldCount":390,"createdAt":"2026-10-27T00:00:00.000Z","publishedAt":"2026-10-27T00:00:00.000Z"}),
  createProduct({"id":"prod-baby-cotton-clothing-set","slug":"baby-cotton-clothing-set","sku":"SKU-BABY-COTTON-CLOTHING-SET","name":"Newborn Cotton Clothing Set, 5 Pieces","vendorId":"vendor-little-nest","categoryId":"child-baby-clothing-sets","price":1190,"compareAtPrice":1450,"ratingAverage":4.8,"ratingCount":73,"stock":36,"soldCount":245,"createdAt":"2026-10-24T00:00:00.000Z","publishedAt":"2026-10-24T00:00:00.000Z"}),
  createProduct({"id":"prod-cycling-helmet","slug":"cycling-helmet","sku":"SKU-CYCLING-HELMET","name":"Adjustable Ventilated Cycling Helmet","vendorId":"vendor-fitzone","categoryId":"child-sports-cycling-helmets","price":1650,"compareAtPrice":1990,"ratingAverage":4.6,"ratingCount":88,"stock":26,"soldCount":310,"createdAt":"2026-10-23T00:00:00.000Z","publishedAt":"2026-10-23T00:00:00.000Z"}),
  createProduct({"id":"prod-camping-dome-tent","slug":"camping-dome-tent","sku":"SKU-CAMPING-DOME-TENT","name":"2-person Waterproof Camping Dome Tent","vendorId":"vendor-fitzone","categoryId":"child-sports-camping-tents","price":4990,"compareAtPrice":5590,"ratingAverage":4.5,"ratingCount":41,"stock":14,"soldCount":78,"createdAt":"2026-10-16T00:00:00.000Z","publishedAt":"2026-10-16T00:00:00.000Z","freeShipping":true}),
  createProduct({"id":"prod-bengali-short-story-collection","slug":"bengali-short-story-collection","sku":"SKU-BENGALI-SHORT-STORY-COLLECTION","name":"Bengali Short Story Collection","vendorId":"vendor-dhaka-bazaar","categoryId":"child-books-fiction-novels","price":420,"compareAtPrice":null,"ratingAverage":4.8,"ratingCount":226,"stock":95,"soldCount":930,"createdAt":"2026-10-29T00:00:00.000Z","publishedAt":"2026-10-29T00:00:00.000Z"}),
  createProduct({"id":"prod-primary-school-textbook-set","slug":"primary-school-textbook-set","sku":"SKU-PRIMARY-SCHOOL-TEXTBOOK-SET","name":"Primary School Practice Book Set","vendorId":"vendor-dhaka-bazaar","categoryId":"child-books-educational-school","price":680,"compareAtPrice":750,"ratingAverage":4.6,"ratingCount":134,"stock":71,"soldCount":580,"createdAt":"2026-10-21T00:00:00.000Z","publishedAt":"2026-10-21T00:00:00.000Z"}),
  createProduct({"id":"prod-hardcover-notebook-pack","slug":"hardcover-notebook-pack","sku":"SKU-HARDCOVER-NOTEBOOK-PACK","name":"A5 Hardcover Notebook Pack of 3","vendorId":"vendor-dhaka-bazaar","categoryId":"child-books-office-notebooks","price":360,"compareAtPrice":420,"ratingAverage":4.5,"ratingCount":97,"stock":130,"soldCount":440,"createdAt":"2026-11-05T00:00:00.000Z","publishedAt":"2026-11-05T00:00:00.000Z"}),
  createProduct({"id":"prod-watercolor-paint-set","slug":"watercolor-paint-set","sku":"SKU-WATERCOLOR-PAINT-SET","name":"Watercolor Paint Set with 12 Colors","vendorId":"vendor-dhaka-bazaar","categoryId":"child-books-art-painting","price":490,"compareAtPrice":590,"ratingAverage":4.6,"ratingCount":62,"stock":47,"soldCount":205,"createdAt":"2026-10-25T00:00:00.000Z","publishedAt":"2026-10-25T00:00:00.000Z"}),
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
  "prod-yoga-mat",
  "prod-over-ear-headphones",
  "prod-womens-cotton-kurti",
  "prod-hydrating-face-moisturizer",
  "prod-butter-cookies-tin",
  "prod-baby-cotton-clothing-set",
  "prod-camping-dome-tent",
  "prod-bengali-short-story-collection",
  "prod-hardcover-notebook-pack"
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
  },
  "prod-over-ear-headphones": { "icon": "headphones", "tone": "info" },
  "prod-womens-cotton-kurti": { "icon": "shirt", "tone": "blush" },
  "prod-hydrating-face-moisturizer": { "icon": "sparkles", "tone": "mint" },
  "prod-butter-cookies-tin": { "icon": "wheat", "tone": "gray" },
  "prod-baby-cotton-clothing-set": { "icon": "shirt", "tone": "info" },
  "prod-camping-dome-tent": { "icon": "dumbbell", "tone": "blush" },
  "prod-bengali-short-story-collection": { "icon": "puzzle", "tone": "info" },
  "prod-hardcover-notebook-pack": { "icon": "puzzle", "tone": "gray" }
};
