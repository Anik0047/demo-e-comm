import { TrendingTabs } from "@/components/home/trending/trending-tabs";
import { getTrendingProducts } from "@/services/trending";

export async function TrendingSection() {
  const products = await getTrendingProducts();

  return (
    <section
      aria-labelledby="trending-title"
      className="max-w-[1280px] mx-auto px-4 py-6 md:py-8 font-body"
    >
      <TrendingTabs products={products} />
    </section>
  );
}
