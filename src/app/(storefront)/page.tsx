import { TopVendorsSection } from "@/components/home/top-vendors/top-vendors-section";
import { getTopVendors } from "@/services/vendors";
import { TrendingSection } from "@/components/home/trending/trending-section";
import { FlashDealsSection } from "@/components/home/flash-deals/flash-deals-section";
import { getFlashDeals } from "@/services/flash-deals";
import { Banner } from "@/components/home/banner/banner";
import { getHeroSlides } from "@/services/banner";

import { CategoriesSection } from "@/components/home/categories/categories-section";
import { getMainCategories } from "@/services/categories";

export default async function HomePage() {
  const vendors = await getTopVendors();
  const flashDeals = await getFlashDeals();
  const slides = await getHeroSlides();

  const categories = await getMainCategories();

  return (
    <>
      <Banner slides={slides} />
      <CategoriesSection categories={categories} />
      <FlashDealsSection items={flashDeals.items} endsInSeconds={flashDeals.endsInSeconds} />
      <TrendingSection />
      <TopVendorsSection vendors={vendors} />
    </>
  );
}
