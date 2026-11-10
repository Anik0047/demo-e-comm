import type { FlashDeal, Product, ProductVariant } from "@/types/product";

export interface EffectivePrice {
  price: number;
  compareAtPrice: number | null;
  deal: FlashDeal | null;
}

export function getPricingTime(): number {
  return Date.now();
}

export function isFlashDealActive(deal: FlashDeal, now: number): boolean {
  return Date.parse(deal.startsAt) <= now && now <= Date.parse(deal.endsAt) && deal.soldCount < deal.stockLimit;
}

export function resolveEffectivePrice(
  product: Product,
  variant: ProductVariant | null,
  deals: readonly FlashDeal[],
  vendorEligible: boolean,
  now = getPricingTime(),
): EffectivePrice {
  const regularPrice = variant?.price ?? product.price;
  const deal = vendorEligible ? deals.find((item) => item.productId === product.id && isFlashDealActive(item, now) && item.dealPrice < regularPrice) ?? null : null;
  return deal
    ? { price: deal.dealPrice, compareAtPrice: regularPrice, deal }
    : { price: regularPrice, compareAtPrice: variant?.compareAtPrice ?? product.compareAtPrice, deal: null };
}

export function maximumOrderQuantity(product: Product, variant: ProductVariant | null): number {
  return Math.min(product.maxOrderQty, product.trackInventory ? variant?.stock ?? product.stock : product.maxOrderQty);
}
