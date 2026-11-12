import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ListingSkeleton } from "@/components/products/listing-states";
import { ProductListing } from "@/components/products/product-listing";
import { getPublicVendorBySlug } from "@/services/vendors";
import type { Vendor } from "@/types/vendor";
import type { RawListingQuery } from "@/types/catalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listingMetadata } from "@/lib/seo";

interface PublicVendorPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawListingQuery>;
}
export const instant = false;

export async function generateMetadata({ params, searchParams }: PublicVendorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const vendor = getPublicVendorBySlug(slug);
  if (!vendor) notFound();
  const title = `${vendor.name} store`;
  const description = vendor.description.trim() || `Explore sample products in ${vendor.name}’s public storefront demo.`;
  const metadata = await listingMetadata(title, description, `/vendor/${vendor.slug}`, searchParams);
  return {
    ...metadata,
    ...(vendor.logoUrl ? { openGraph: { ...metadata.openGraph, images: [{ url: vendor.logoUrl, alt: `${vendor.name} logo` }] } } : {}),
  };
}

export default async function PublicVendorPage({ params, searchParams }: PublicVendorPageProps) {
  const { slug } = await params;
  const vendor = getPublicVendorBySlug(slug);
  if (!vendor) notFound();
  return <PublicVendorContent vendor={vendor} searchParams={searchParams} />;
}

async function PublicVendorContent({ vendor, searchParams }: { vendor: Vendor; searchParams: Promise<RawListingQuery> }) {
  return <section className="mx-auto max-w-[1280px] px-4 py-6 font-body md:py-8">
    <nav aria-label="Breadcrumb" className="mb-5 text-sm text-mute">
      <ol className="flex flex-wrap items-center gap-2">
        <li><Link href="/" className="inline-flex min-h-11 items-center hover:text-brand-strong hover:underline">Home</Link></li>
        <li aria-hidden="true">/</li>
        <li><Link href="/products" className="inline-flex min-h-11 items-center hover:text-brand-strong hover:underline">Products</Link></li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="font-medium text-ink">{vendor.name}</li>
      </ol>
    </nav>
    <VendorProfileHeader vendor={vendor} />
    <section aria-labelledby="vendor-products-heading" className="mt-8">
      <h2 id="vendor-products-heading" className="mb-5 font-head text-2xl font-bold sm:text-3xl">Products from {vendor.name}</h2>
      <Suspense fallback={<ListingSkeleton />}>
        <ProductListing searchParams={searchParams} vendor={vendor} basePath={`/vendor/${vendor.slug}`} showHeading={false} />
      </Suspense>
    </section>
  </section>;
}

function VendorProfileHeader({ vendor }: { vendor: Vendor }) {
  return <header className="card flex min-w-0 flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
    <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-tint font-head text-2xl font-extrabold text-brand-strong sm:size-24">
      {vendor.logoUrl
        ? <Image src={vendor.logoUrl} alt={`${vendor.name} logo`} width={96} height={96} className="size-full object-cover" loading="eager" />
        : <span aria-hidden="true">{vendor.initials}</span>}
    </div>
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="min-w-0 break-words font-head text-3xl font-extrabold sm:text-4xl">{vendor.name}</h1>
        {vendor.verified && <span className="badge badge-brand">Verified vendor</span>}
      </div>
      {vendor.description.trim() && <p className="mt-2 max-w-3xl break-words text-sm leading-relaxed text-mute sm:text-base">{vendor.description}</p>}
    </div>
  </header>;
}
