import { flashDeals, flashDealPlaceholders } from "@/data/flash-deals";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import { projectProductCard } from "@/services/product-card";
import type { FlashDealItem } from "@/types/product";

export async function getFlashDeals(): Promise<{ endsInSeconds: number; items: FlashDealItem[] }> {
  const items: FlashDealItem[] = [];
  for (const deal of flashDeals) {
    const product = products.find((product) => product.id === deal.productId);
    if (!product || product.status !== "active") continue;
    const vendor = vendors.find((vendor) => vendor.id === product.vendorId);
    if (!vendor) throw new Error(`Missing vendor for ${product.id}`);
    items.push({
      ...projectProductCard(product, vendor, {
        price: deal.dealPrice,
        compareAtPrice: product.price,
        inStock: deal.soldCount < deal.stockLimit,
        placeholder: flashDealPlaceholders[product.id],
      }),
      stockLimit: deal.stockLimit,
      soldCount: deal.soldCount,
    });
  }
  return { endsInSeconds: 4 * 3600 + 32 * 60 + 10, items };
}
