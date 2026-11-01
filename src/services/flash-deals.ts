import { flashDeals, flashDealPlaceholders } from "@/data/flash-deals";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import type { FlashDealItem } from "@/types/product";

export async function getFlashDeals(): Promise<{ endsInSeconds: number; items: FlashDealItem[] }> {
  const items: FlashDealItem[] = [];
  for (const deal of flashDeals) {
    const product = products.find((product) => product.id === deal.productId);
    if (!product || product.status !== "active") continue;
    const vendor = vendors.find((vendor) => vendor.id === product.vendorId);
    if (!vendor) throw new Error(`Missing vendor for ${product.id}`);
    items.push({
      id: product.id, slug: product.slug, name: product.name, mainImage: product.mainImage,
      price: deal.dealPrice, compareAtPrice: product.price,
      ratingAverage: product.ratingAverage, ratingCount: product.ratingCount, freeShipping: product.freeShipping,
      vendor: { name: vendor.name, slug: vendor.slug }, inStock: deal.soldCount < deal.stockLimit,
      stockLimit: deal.stockLimit, soldCount: deal.soldCount, placeholder: flashDealPlaceholders[product.id],
    });
  }
  return { endsInSeconds: 4 * 3600 + 32 * 60 + 10, items };
}
