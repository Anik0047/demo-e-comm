import Link from "next/link";
import { TrendingTabs } from "@/components/home/trending/trending-tabs";
import { getTrendingProducts } from "@/services/trending";

export async function TrendingSection() {
  const products = await getTrendingProducts();

  return (
    <section
      aria-labelledby="trending-title"
      className="max-w-[1280px] mx-auto px-4 py-6 md:py-8 font-body"
    >
      <div className="mb-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="trending-title"
            className="font-head font-bold text-xl sm:text-2xl"
          >
            Trending products
          </h2>
          <p className="hidden sm:block text-sm text-mute mt-1">
            Most loved by shoppers this week
          </p>
        </div>
        <Link
          href="#"
          className="inline-flex min-h-11 items-end shrink-0 text-sm font-bold text-brand-strong hover:underline"
        >
          View all →
        </Link>
      </div>
      <TrendingTabs products={products} />
    </section>
  );
}
