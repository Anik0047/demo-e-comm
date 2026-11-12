import { heroSlides } from "@/data/banner";
import type { HeroSlide } from "@/types/banner";

export async function getHeroSlides(): Promise<HeroSlide[]> {
  return heroSlides;
}

