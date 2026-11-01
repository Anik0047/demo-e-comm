import { getHeroSlides, getTopVendors } from "@/services/banner";
import type { HeroSlide } from "@/types/banner";
import { HeroSlider } from "./hero-slider";
import { PromoTiles } from "./promo-tiles";

interface BannerProps {
  slides?: HeroSlide[];
}

export async function Banner({ slides }: BannerProps) {
  const resolvedSlides = slides ?? (await getHeroSlides());
  const vendors = await getTopVendors();

  return (
    <section
      aria-label="Featured offers"
      className="max-w-[1280px] mx-auto px-4 py-4 md:py-6 font-body"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="min-w-0 lg:col-span-8 xl:col-span-9">
          <HeroSlider slides={resolvedSlides} />
        </div>
        <PromoTiles vendors={vendors} />
      </div>
    </section>
  );
}

