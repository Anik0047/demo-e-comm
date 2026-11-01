import { FlashDealsSection } from "@/components/home/flash-deals/flash-deals-section";
import { getFlashDeals } from "@/services/flash-deals";
import { Banner } from "@/components/home/banner/banner";
import { getHeroSlides } from "@/services/banner";

import { CategoriesSection } from "@/components/home/categories/categories-section";
import { getMainCategories } from "@/services/categories";

export default async function HomePage() {
  const flashDeals = await getFlashDeals();
  const slides = await getHeroSlides();

  const categories = await getMainCategories();

  return (
    <>
      <Banner slides={slides} />
      <CategoriesSection categories={categories} />
      <FlashDealsSection items={flashDeals.items} endsInSeconds={flashDeals.endsInSeconds} />
    </>
  );
}
