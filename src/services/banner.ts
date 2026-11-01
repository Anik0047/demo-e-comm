import { heroSlides, vendors } from "@/data/banner";
import type { HeroSlide, Vendor } from "@/types/banner";

export async function getHeroSlides(): Promise<HeroSlide[]> {
  return heroSlides;
}

export async function getTopVendors(): Promise<Vendor[]> {
  return vendors;
}

