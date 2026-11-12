import { Suspense } from "react";
import { connection } from "next/server";
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
import { getPricingTime } from "@/services/effective-price";
import { RecentlyViewedSection } from "@/components/home/recently-viewed-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bangladesh marketplace demo",
  description: "Explore sample products, category pages, and public seller storefronts in Kenakata’s frontend marketplace demonstration.",
  alternates: { canonical: "/" },
  openGraph: { title: "Bangladesh marketplace demo", description: "Explore sample products, category pages, and public seller storefronts in Kenakata’s frontend marketplace demonstration.", url: "/", type: "website" },
  twitter: { card: "summary", title: "Bangladesh marketplace demo", description: "Explore sample products, category pages, and public seller storefronts in Kenakata’s frontend marketplace demonstration." },
};

export default async function HomePage() {
  const vendors = await getTopVendors();
  const slides = await getHeroSlides();

  const categories = await getMainCategories();
  const trustPoints = await getTrustPoints();

  return (
    <>
      <Banner slides={slides} />
      <RecentlyViewedSection />
      <CategoriesSection categories={categories} />
      <Suspense fallback={null}>
        <RuntimeFlashDeals />
      </Suspense>
      <Suspense fallback={null}>
        <TrendingSection />
      </Suspense>
      <PromoBannersSection />
      <TopVendorsSection vendors={vendors} />
      <section
        aria-label="Why shop with Kenakata"
        className="mx-auto max-w-7xl px-4 py-6 font-body md:py-8"
      >
        <TrustStrip points={trustPoints} />
      </section>
    </>
  );
}

async function RuntimeFlashDeals() {
  await connection();
  const flashDeals = await getFlashDeals(getPricingTime());
  return (
    <FlashDealsSection
      items={flashDeals.items}
      endsInSeconds={flashDeals.endsInSeconds}
    />
  );
}
