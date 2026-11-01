import { PromoBannerCard } from "@/components/home/promo/promo-banner-card";
import { getPromoBanners } from "@/services/promo-banners";

export async function PromoBannersSection() {
  const banners = await getPromoBanners();
  if (!banners.length) return null;

  return (
    <section aria-label="Promotions" className="max-w-[1280px] mx-auto px-4 py-6 md:py-8 font-body">
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {banners.map((banner) => (
          <li key={banner.id} className="min-w-0">
            <PromoBannerCard banner={banner} />
          </li>
        ))}
      </ul>
    </section>
  );
}
