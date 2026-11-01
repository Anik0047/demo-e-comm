import type { FlashDeal, ProductCardData } from "@/types/product";

export const flashDeals: FlashDeal[] = [
  {
    "id": "deal-1",
    "productId": "prod-wireless-earbuds-pro",
    "dealPrice": 2450,
    "stockLimit": 100,
    "soldCount": 72,
    "startsAt": "2026-11-01T00:00:00.000Z",
    "endsAt": "2026-11-30T23:59:59.000Z"
  },
  {
    "id": "deal-2",
    "productId": "prod-smart-watch-series-5",
    "dealPrice": 3990,
    "stockLimit": 60,
    "soldCount": 45,
    "startsAt": "2026-11-01T00:00:00.000Z",
    "endsAt": "2026-11-30T23:59:59.000Z"
  },
  {
    "id": "deal-3",
    "productId": "prod-cotton-panjabi",
    "dealPrice": 1200,
    "stockLimit": 200,
    "soldCount": 160,
    "startsAt": "2026-11-01T00:00:00.000Z",
    "endsAt": "2026-11-30T23:59:59.000Z"
  },
  {
    "id": "deal-4",
    "productId": "prod-nonstick-cookware-set",
    "dealPrice": 2850,
    "stockLimit": 50,
    "soldCount": 28,
    "startsAt": "2026-11-01T00:00:00.000Z",
    "endsAt": "2026-11-30T23:59:59.000Z"
  },
  {
    "id": "deal-5",
    "productId": "prod-bluetooth-speaker",
    "dealPrice": 1799,
    "stockLimit": 100,
    "soldCount": 88,
    "startsAt": "2026-11-01T00:00:00.000Z",
    "endsAt": "2026-11-30T23:59:59.000Z"
  },
  // {
  //   "id": "deal-6",
  //   "productId": "prod-android-smartphone-128gb",
  //   "dealPrice": 15990,
  //   "stockLimit": 40,
  //   "soldCount": 30,
  //   "startsAt": "2026-11-01T00:00:00.000Z",
  //   "endsAt": "2026-11-30T23:59:59.000Z"
  // }
];

export const flashDealPlaceholders: Record<string, NonNullable<ProductCardData["placeholder"]>> = {
  "prod-wireless-earbuds-pro": {
    "icon": "headphones",
    "tone": "info"
  },
  "prod-smart-watch-series-5": {
    "icon": "watch",
    "tone": "blush"
  },
  "prod-cotton-panjabi": {
    "icon": "shirt",
    "tone": "mint"
  },
  "prod-nonstick-cookware-set": {
    "icon": "utensils",
    "tone": "gray"
  },
  "prod-bluetooth-speaker": {
    "icon": "speaker",
    "tone": "info"
  },
  "prod-android-smartphone-128gb": {
    "icon": "smartphone",
    "tone": "mint"
  }
};
