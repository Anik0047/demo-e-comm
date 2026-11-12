import { publicInfoPages } from "@/data/public-info-pages";
import type { PublicInfoPage } from "@/types/public-info";

export function getPublicInfoPage(slug: string): PublicInfoPage | undefined {
  return publicInfoPages.find((page) => page.slug === slug);
}

export function getPublicInfoPages(): PublicInfoPage[] {
  return publicInfoPages;
}
