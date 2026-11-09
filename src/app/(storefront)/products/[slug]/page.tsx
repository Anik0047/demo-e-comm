import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductImageCredits } from "@/components/products/product-image-credits";
import { ProductImageGallery } from "@/components/products/product-image-gallery";
import { ProductInformation } from "@/components/products/product-information";
import { getProductDetails, getProductDetailSlugs } from "@/services/product-details";
import { getProductGallery } from "@/services/product-gallery";

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

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { slug } = await params;
  const details = await getProductDetails(slug);
  if (!details) notFound();

  const { product, vendor, categoryPath } = details;
  const images = getProductGallery(product);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 font-body md:py-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-mute">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li><Link href="/" className="inline-flex min-h-11 items-center hover:text-brand-strong hover:underline">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/products" className="inline-flex min-h-11 items-center hover:text-brand-strong hover:underline">Products</Link></li>
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

      <article className="grid grid-cols-1 gap-8 lg:grid-cols-12" aria-labelledby="product-name">
        <ProductImageGallery key={product.id} images={images} name={product.name} />

        <ProductInformation product={product} vendor={vendor} />
        <div className="min-w-0 lg:col-span-12">
          <ProductImageCredits images={images} />
        </div>
      </article>
    </div>
  );
}
