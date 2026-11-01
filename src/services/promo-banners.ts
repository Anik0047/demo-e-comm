import { promoBanners } from "@/data/promo-banners";
import type { PromoBanner } from "@/types/promo";

export async function getPromoBanners(): Promise<PromoBanner[]> {
  return promoBanners;
}
