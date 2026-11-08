import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingSkeleton } from "@/components/products/listing-states";
import { ProductListing } from "@/components/products/product-listing";
import { getCategoryBySlug } from "@/services/categories";
import type { RawListingQuery } from "@/types/catalog";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<RawListingQuery>;
}

export async function generateMetadata({ params }: Pick<CategoryPageProps, "params">): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category || category.level !== 1) return { title: "Category not found" };

  return {
    title: category.name,
    description: `Browse ${category.name.toLowerCase()} from trusted sellers on Kenakata.`,
  };
}

async function MainCategoryContent({ params, searchParams }: CategoryPageProps) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category || category.level !== 1) notFound();

  const basePath = `/category/${category.slug}`;

  return (
    <section aria-label={`${category.name} products`} className="mx-auto max-w-[1280px] px-4 py-6 font-body md:py-8">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-mute">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-brand-strong hover:underline">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/categories" className="hover:text-brand-strong hover:underline">All categories</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-ink">{category.name}</li>
        </ol>
      </nav>

      <header className="mb-6 min-w-0 md:mb-8">
        <h1 className="break-words font-head text-3xl font-extrabold sm:text-4xl">{category.name}</h1>
        <p className="mt-2 text-sm text-mute sm:text-base">
          Browse products from trusted sellers across {category.name.toLowerCase()}.
        </p>
      </header>

      <Suspense fallback={<ListingSkeleton />}>
        <ProductListing
          searchParams={searchParams}
          categoryScope={category.slug}
          basePath={basePath}
          showHeading={false}
          categoryLabel="Subcategory"
        />
      </Suspense>
    </section>
  );
}

export default function MainCategoryPage(props: CategoryPageProps) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <MainCategoryContent {...props} />
    </Suspense>
  );
}
