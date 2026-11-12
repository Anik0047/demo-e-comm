import { flashDeals, flashDealPlaceholders } from "@/data/flash-deals";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import { projectProductCard } from "@/services/product-card";
import type { FlashDealItem } from "@/types/product";
import { getPricingTime, isFlashDealActive, resolveEffectivePrice } from "@/services/effective-price";

interface FlashDealData {
  products: typeof products;
  vendors: typeof vendors;
  deals: typeof flashDeals;
}

export async function getFlashDeals(
  now = getPricingTime(),
  data: FlashDealData = { products, vendors, deals: flashDeals },
): Promise<{ endsInSeconds: number; items: FlashDealItem[] }> {
  const items: FlashDealItem[] = [];
  const selectedDeals: typeof data.deals = [];
  const seenProducts = new Set<string>();
  for (const deal of data.deals) {
    if (!isFlashDealActive(deal, now)) continue;
    const product = data.products.find((product) => product.id === deal.productId);
    if (!product || product.status !== "active") continue;
    const vendor = data.vendors.find((vendor) => vendor.id === product.vendorId);
    if (!vendor || vendor.status !== "approved") continue;
    if (seenProducts.has(product.id)) continue;
    const effective = resolveEffectivePrice(product, null, [deal], true, now);
    if (!effective.deal) continue;
    seenProducts.add(product.id);
    selectedDeals.push(deal);
    items.push({
      ...projectProductCard(product, vendor, {
        price: effective.price,
        compareAtPrice: effective.compareAtPrice,
        inStock: (!product.trackInventory || product.stock > 0) && deal.soldCount < deal.stockLimit,
        placeholder: flashDealPlaceholders[product.id],
      }, now),
      stockLimit: deal.stockLimit,
      soldCount: deal.soldCount,
    });
  }
  const earliestEnd = selectedDeals
    .reduce((end, deal) => Math.min(end, Date.parse(deal.endsAt)), Number.POSITIVE_INFINITY);
  const endsInSeconds = Number.isFinite(earliestEnd) ? Math.max(0, Math.ceil((earliestEnd - now) / 1000)) : 0;
  return { endsInSeconds, items };
}
