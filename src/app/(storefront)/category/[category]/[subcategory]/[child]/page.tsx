import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingSkeleton } from "@/components/products/listing-states";
import { ProductListing } from "@/components/products/product-listing";
import { getCatalogCategories } from "@/services/categories";
import type { RawListingQuery } from "@/types/catalog";
import { listingMetadata } from "@/lib/seo";

interface ChildCategoryPageProps {
  params: Promise<{ category: string; subcategory: string; child: string }>;
  searchParams: Promise<RawListingQuery>;
}

export const instant = false;

async function resolveHierarchy(params: ChildCategoryPageProps["params"]) {
  const [{ category: categorySlug, subcategory: subcategorySlug, child: childSlug }, categories] = await Promise.all([
    params,
    getCatalogCategories(),
  ]);
  const category = categories.find((item) => item.slug === categorySlug);
  const subcategory = categories.find((item) => item.slug === subcategorySlug);
  const child = categories.find((item) => item.slug === childSlug);
  if (!category || category.level !== 1 || !subcategory || subcategory.level !== 2 || subcategory.parentId !== category.id || !child || child.level !== 3 || child.parentId !== subcategory.id) {
    notFound();
  }
  return { category, subcategory, child };
}

export async function generateMetadata({ params, searchParams }: ChildCategoryPageProps): Promise<Metadata> {
  const { category, subcategory, child } = await resolveHierarchy(params);
  const path = `/category/${category.slug}/${subcategory.slug}/${child.slug}`;
  return listingMetadata(`${child.name} in ${subcategory.name}`, `Browse sample ${child.name.toLowerCase()} products in the Kenakata marketplace demo.`, path, searchParams);
}

async function ChildCategoryContent({ params, searchParams }: ChildCategoryPageProps) {
  const { category, subcategory, child } = await resolveHierarchy(params);
  const basePath = `/category/${category.slug}/${subcategory.slug}/${child.slug}`;

  return (
    <section aria-label={`${child.name} products`} className="mx-auto max-w-[1280px] px-4 py-6 font-body md:py-8">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-mute">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-brand-strong hover:underline">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/categories" className="hover:text-brand-strong hover:underline">All categories</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href={`/category/${category.slug}`} className="hover:text-brand-strong hover:underline">{category.name}</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href={`/category/${category.slug}/${subcategory.slug}`} className="hover:text-brand-strong hover:underline">{subcategory.name}</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-ink">{child.name}</li>
        </ol>
      </nav>

      <header className="mb-6 min-w-0 md:mb-8">
        <h1 className="break-words font-head text-3xl font-extrabold sm:text-4xl">{child.name}</h1>
        <p className="mt-2 text-sm text-mute sm:text-base">Browse {child.name.toLowerCase()} from trusted sellers.</p>
      </header>

      <Suspense fallback={<ListingSkeleton />}>
        <ProductListing searchParams={searchParams} categoryScope={child.slug} basePath={basePath} showHeading={false} categoryLabel="Category" />
      </Suspense>
    </section>
  );
}

export default async function ChildCategoryPage(props: ChildCategoryPageProps) {
  await resolveHierarchy(props.params);
  return <ChildCategoryContent {...props} />;
}
