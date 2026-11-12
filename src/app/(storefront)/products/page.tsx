import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductListing } from "@/components/products/product-listing";
import { ListingSkeleton } from "@/components/products/listing-states";
import type { RawListingQuery } from "@/types/catalog";
import { listingMetadata } from "@/lib/seo";

export async function generateMetadata({ searchParams }: { searchParams: Promise<RawListingQuery> }): Promise<Metadata> {
  return listingMetadata("Products", "Browse sample products from independent seller storefronts in Bangladesh.", "/products", searchParams);
}

export default function ProductsPage({ searchParams }: { searchParams: Promise<RawListingQuery> }) {
  return (
    <section aria-label="Product catalog" className="mx-auto max-w-[1280px] px-4 py-6 font-body md:py-8">
      <Suspense fallback={<ListingSkeleton />}>
        <ProductListing searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
