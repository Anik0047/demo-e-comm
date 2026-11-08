import Link from "next/link";
import { CategoryTile } from "@/components/home/categories/category-tile";
import type { MainCategory } from "@/types/category";

interface CategoriesSectionProps {
  categories: MainCategory[];
}

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  return (
    <section aria-labelledby="cat-title" className="max-w-[1280px] mx-auto px-4 py-6 md:py-8 font-body">
  <div className="flex items-end justify-between gap-4 mb-5 md:mb-6">
    <div className="min-w-0">
      <h2 id="cat-title" className="font-head font-bold text-xl sm:text-2xl">Shop by category</h2>
      <p className="hidden sm:block text-sm text-mute mt-1">Find what you need from thousands of vendors</p>
    </div>
    <Link href="/categories" className="shrink-0 text-sm font-bold text-brand-strong hover:underline">View all →</Link>
  </div>
  <ul className="grid grid-cols-4 md:grid-cols-8 gap-x-2 gap-y-5 sm:gap-x-3 md:gap-4 lg:gap-6">
        {categories.map((category) => <CategoryTile key={category.id} category={category} />)}
      </ul>
</section>
  );
}
