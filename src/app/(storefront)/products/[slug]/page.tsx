import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ProductDetailsInteractive } from "@/components/products/product-details-interactive";
import { ProductReviews } from "@/components/products/product-reviews";
import { ProductImageCredits } from "@/components/products/product-image-credits";
import { RelatedProducts } from "@/components/products/related-products";
import { getProductDetails, getProductDetailSlugs } from "@/services/product-details";
import { getProductGallery } from "@/services/product-gallery";
import { getPricingTime } from "@/services/effective-price";
import { getRelatedProducts } from "@/services/related-products";
import type { ProductCardData } from "@/types/product";

interface ProductDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getProductDetailSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProductDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const details = await getProductDetails(slug);
  if (!details) notFound();

  return {
    title: details.product.metaTitle || details.product.name,
    description: details.product.metaDescription || details.product.shortDescription || undefined,
  };
}

export default function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  return (
    <Suspense fallback={<ProductDetailsSkeleton />}>
      <ProductDetailsPageContent params={params} />
    </Suspense>
  );
}

async function ProductDetailsPageContent({ params }: ProductDetailsPageProps) {
  await connection();
  const pricingTime = getPricingTime();
  const { slug } = await params;
  const details = await getProductDetails(slug);
  if (!details) notFound();
  const relatedProducts = getRelatedProducts(details.product.id, { now: pricingTime });

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 font-body md:py-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-mute">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li><Link href="/" className="inline-flex min-h-11 items-center hover:text-brand-strong hover:underline">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/products" className="inline-flex min-h-11 items-center font-medium text-ink hover:text-brand-strong hover:underline">Products</Link></li>
        </ol>
      </nav>
      <ProductDetails details={details} pricingTime={pricingTime} relatedProducts={relatedProducts} />
    </div>
  );
}

function ProductDetails({ details, pricingTime, relatedProducts }: { details: NonNullable<Awaited<ReturnType<typeof getProductDetails>>>; pricingTime: number; relatedProducts: ProductCardData[] }) {
  const { product, vendor, deals, categoryPath } = details;
  const images = getProductGallery(product);

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-mute">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {categoryPath.map((category, index) => (
            <li key={category.id} className="flex min-w-0 items-center gap-2">
              <span aria-hidden="true">/</span>
              <Link
                href={`/category/${categoryPath.slice(0, index + 1).map((item) => item.slug).join("/")}`}
                className="inline-flex min-h-11 items-center break-words hover:text-brand-strong hover:underline"
              >
                {category.name}
              </Link>
            </li>
          ))}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="min-w-0 break-words font-medium text-ink">{product.name}</li>
        </ol>
      </nav>

      <article aria-labelledby="product-name">
        <ProductDetailsInteractive product={product} vendor={vendor} deals={deals} images={images} pricingTime={pricingTime} />
        <ProductReviews productId={product.id} />
        <div className="mt-8 min-w-0">
          <ProductImageCredits images={images} />
        </div>
      </article>
      <RelatedProducts products={relatedProducts} />
    </>
  );
}

function ProductDetailsSkeleton() {
  return (
    <div aria-label="Loading product details" aria-busy="true" className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="aspect-square animate-pulse rounded-2xl bg-soft lg:col-span-7" />
      <div className="min-w-0 space-y-6 lg:col-span-5">
        <div className="space-y-3">
          <div className="skeleton h-8 w-4/5" />
          <div className="skeleton h-4 w-1/3" />
        </div>
        <div className="space-y-3 border-y border-line py-6">
          <div className="skeleton h-9 w-1/2" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-4/5" />
        </div>
        <div className="skeleton h-24 w-full rounded-2xl" />
      </div>
    </div>
  );
}
