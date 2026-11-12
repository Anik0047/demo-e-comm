import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingSkeleton } from "@/components/products/listing-states";
import { ProductListing } from "@/components/products/product-listing";
import { getCategoryBySlug } from "@/services/categories";
import type { RawListingQuery } from "@/types/catalog";
import { listingMetadata } from "@/lib/seo";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<RawListingQuery>;
}

export const instant = false;

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category || category.level !== 1) notFound();

  return listingMetadata(category.name, `Browse sample ${category.name.toLowerCase()} products in the Kenakata marketplace demo.`, `/category/${category.slug}`, searchParams);
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

export default async function MainCategoryPage(props: CategoryPageProps) {
  const { category: slug } = await props.params;
  const category = await getCategoryBySlug(slug);
  if (!category || category.level !== 1) notFound();
  return <MainCategoryContent {...props} />;
}
