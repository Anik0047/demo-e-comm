import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingSkeleton } from "@/components/products/listing-states";
import { ProductListing } from "@/components/products/product-listing";
import { getCatalogCategories } from "@/services/categories";
import type { RawListingQuery } from "@/types/catalog";
import { listingMetadata } from "@/lib/seo";

interface SubcategoryPageProps {
  params: Promise<{ category: string; subcategory: string }>;
  searchParams: Promise<RawListingQuery>;
}

export const instant = false;

async function resolveHierarchy(params: SubcategoryPageProps["params"]) {
  const [{ category: categorySlug, subcategory: subcategorySlug }, categories] = await Promise.all([
    params,
    getCatalogCategories(),
  ]);
  const category = categories.find((item) => item.slug === categorySlug);
  const subcategory = categories.find((item) => item.slug === subcategorySlug);
  if (!category || category.level !== 1 || !subcategory || subcategory.level !== 2 || subcategory.parentId !== category.id) {
    notFound();
  }
  return { category, subcategory };
}

export async function generateMetadata({ params, searchParams }: SubcategoryPageProps): Promise<Metadata> {
  const { category, subcategory } = await resolveHierarchy(params);
  const path = `/category/${category.slug}/${subcategory.slug}`;
  return listingMetadata(`${subcategory.name} in ${category.name}`, `Browse sample ${subcategory.name.toLowerCase()} products in the Kenakata marketplace demo.`, path, searchParams);
}

async function SubcategoryContent({ params, searchParams }: SubcategoryPageProps) {
  const { category, subcategory } = await resolveHierarchy(params);
  const basePath = `/category/${category.slug}/${subcategory.slug}`;

  return (
    <section aria-label={`${subcategory.name} products`} className="mx-auto max-w-[1280px] px-4 py-6 font-body md:py-8">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-mute">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-brand-strong hover:underline">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/categories" className="hover:text-brand-strong hover:underline">All categories</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href={`/category/${category.slug}`} className="hover:text-brand-strong hover:underline">{category.name}</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-ink">{subcategory.name}</li>
        </ol>
      </nav>

      <header className="mb-6 min-w-0 md:mb-8">
        <h1 className="break-words font-head text-3xl font-extrabold sm:text-4xl">{subcategory.name}</h1>
        <p className="mt-2 text-sm text-mute sm:text-base">Browse {subcategory.name.toLowerCase()} from trusted sellers.</p>
      </header>

      <Suspense fallback={<ListingSkeleton />}>
        <ProductListing searchParams={searchParams} categoryScope={subcategory.slug} filterCategoryScope={subcategory.slug} subcategoryScope={subcategory.slug} basePath={basePath} showHeading={false} categoryLabel="Category" />
      </Suspense>
    </section>
  );
}

export default async function SubcategoryPage(props: SubcategoryPageProps) {
  await resolveHierarchy(props.params);
  return <SubcategoryContent {...props} />;
}
