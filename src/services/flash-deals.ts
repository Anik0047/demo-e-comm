import { flashDeals, flashDealPlaceholders } from "@/data/flash-deals";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import { projectProductCard } from "@/services/product-card";
import type { FlashDealItem } from "@/types/product";
import { getPricingTime, isFlashDealActive } from "@/services/effective-price";

export async function getFlashDeals(now = getPricingTime()): Promise<{ endsInSeconds: number; items: FlashDealItem[] }> {
  const items: FlashDealItem[] = [];
  for (const deal of flashDeals) {
    if (!isFlashDealActive(deal, now)) continue;
    const product = products.find((product) => product.id === deal.productId);
    if (!product || product.status !== "active") continue;
    const vendor = vendors.find((vendor) => vendor.id === product.vendorId);
    if (!vendor || vendor.status !== "approved") continue;
    items.push({
      ...projectProductCard(product, vendor, {
        price: deal.dealPrice,
        compareAtPrice: product.price,
        inStock: (!product.trackInventory || product.stock > 0) && deal.soldCount < deal.stockLimit,
        placeholder: flashDealPlaceholders[product.id],
      }, now),
      stockLimit: deal.stockLimit,
      soldCount: deal.soldCount,
    });
  }
  return { endsInSeconds: 4 * 3600 + 32 * 60 + 10, items };
}
