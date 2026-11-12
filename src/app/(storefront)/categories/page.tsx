import type { Metadata } from "next";
import Link from "next/link";
import { CategoryTile } from "@/components/home/categories/category-tile";
import { getCatalogCategories, getMainCategories } from "@/services/categories";

export const metadata: Metadata = {
  title: "All categories",
  description: "Explore the product categories represented in the Kenakata marketplace demo.",
  alternates: { canonical: "/categories" },
  openGraph: { title: "All categories", description: "Explore the product categories represented in the Kenakata marketplace demo.", url: "/categories", type: "website" },
  twitter: { card: "summary", title: "All categories", description: "Explore the product categories represented in the Kenakata marketplace demo." },
};

export default async function CategoriesPage() {
  const [mainCategories, catalogCategories] = await Promise.all([
    getMainCategories(),
    getCatalogCategories(),
  ]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 font-body md:py-8">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-mute">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-brand-strong hover:underline">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-ink">All categories</li>
        </ol>
      </nav>

      <header className="mb-6 md:mb-8">
        <h1 className="font-head text-3xl font-extrabold sm:text-4xl">Shop by category</h1>
        <p className="mt-2 max-w-2xl text-sm text-mute sm:text-base">
          Explore the categories and find the right place to start shopping.
        </p>
      </header>

      {mainCategories.length > 0 ? (
        <nav aria-label="Shopping categories">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {mainCategories.map((category) => {
              const subcategoryNames = catalogCategories
                .filter((item) => item.level === 2 && item.parentId === category.id)
                .map((item) => item.name);

              return (
                <CategoryTile
                  key={category.id}
                  category={category}
                  subcategoryNames={subcategoryNames}
                />
              );
            })}
          </ul>
        </nav>
      ) : (
        <p className="card p-6 text-sm text-mute">
          Categories aren’t available right now. Please check back soon.
        </p>
      )}
    </div>
  );
}
