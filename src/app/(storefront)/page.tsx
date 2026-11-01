import { TopVendorsSection } from "@/components/home/top-vendors/top-vendors-section";
import { PromoBannersSection } from "@/components/home/promo/promo-banners-section";
import { getTopVendors } from "@/services/vendors";
import { TrendingSection } from "@/components/home/trending/trending-section";
import { FlashDealsSection } from "@/components/home/flash-deals/flash-deals-section";
import { getFlashDeals } from "@/services/flash-deals";
import { Banner } from "@/components/home/banner/banner";
import { getHeroSlides } from "@/services/banner";

import { CategoriesSection } from "@/components/home/categories/categories-section";
import { getMainCategories } from "@/services/categories";
import { TrustStrip } from "@/components/shared/trust-strip";
import { getTrustPoints } from "@/services/trust-points";

export default async function HomePage() {
  const vendors = await getTopVendors();
  const flashDeals = await getFlashDeals();
  const slides = await getHeroSlides();

  const categories = await getMainCategories();
  const trustPoints = await getTrustPoints();

  return (
    <>
      <Banner slides={slides} />
      <CategoriesSection categories={categories} />
      <FlashDealsSection items={flashDeals.items} endsInSeconds={flashDeals.endsInSeconds} />
      <TrendingSection />
      <PromoBannersSection />
      <TopVendorsSection vendors={vendors} />
      <section
        aria-label="Why shop with Kenakata"
        className="mx-auto max-w-[1280px] px-4 py-6 font-body md:py-8"
      >
        <TrustStrip points={trustPoints} />
      </section>
    </>
  );
}
