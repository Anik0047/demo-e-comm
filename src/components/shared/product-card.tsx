import Link from "next/link";
import { ProductWishlistButton } from "@/components/shared/product-wishlist-button";
import { ProductCardCartButton } from "@/components/shared/product-card-cart-button";
import { ProductCardImage } from "@/components/shared/product-card-image";
import { calcDiscountPercent, cn, formatPrice } from "@/lib/utils";
import type { CategoryTone } from "@/types/category";
import type { ProductCardData } from "@/types/product";

const toneClasses: Record<CategoryTone, string> = {
  info: "bg-info text-info-ink",
  blush: "bg-blush text-blush-ink",
  mint: "bg-brand-soft text-brand-deep",
  gray: "bg-soft text-ink",
};
interface ProductCardProps {
  product: ProductCardData;
  deal?: { soldCount: number; stockLimit: number };
}
export function ProductCard({ product, deal }: ProductCardProps) {
  const productHref = `/products/${product.slug}`;
  return (
    <article className="flex flex-col h-full rounded-2xl border border-line bg-white overflow-hidden hover:border-brand transition-colors">
      <div className="relative">
        <Link
          href={productHref}
          className={cn(
            "relative grid place-items-center aspect-[4/3] md:aspect-square",
            toneClasses[product.placeholder?.tone ?? "gray"],
          )}
          aria-label={`View ${product.name}`}
        >
          <ProductCardImage
            key={product.mainImage.url}
            image={product.mainImage}
            name={product.name}
            placeholder={product.placeholder}
          />
        </Link>
        {product.compareAtPrice !== null && (
          <span className="absolute top-2 left-2 rounded-full bg-sale text-white text-xs font-bold px-2 py-0.5">
            -{calcDiscountPercent(product.price, product.compareAtPrice)}%
          </span>
        )}
        <ProductWishlistButton
          productId={product.id}
          productName={product.name}
          className="absolute right-2 top-2 z-10"
          compact
        />
      </div>
      <div className="flex flex-col flex-1 p-2 md:p-3">
        <Link
          href="#"
          className="text-xs text-mute truncate hover:text-brand-strong"
        >
          {product.vendor.name}
        </Link>
        <h3 className="mt-1 text-sm font-medium line-clamp-2 min-h-[2.5rem]">
          <Link href={productHref} className="hover:text-brand-strong">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-mute">
          <svg
            className="w-3.5 h-3.5 text-accent-strong"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth={1}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="font-medium text-ink">{product.ratingAverage}</span>
          <span>({product.ratingCount})</span>
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="font-head font-extrabold text-base">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice !== null && (
            <span className="text-xs text-mute line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
        <div className="mt-auto pt-3">
          {/* {deal && (
            <>
              <div
                className="h-1.5 rounded-full bg-soft overflow-hidden"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full bg-sale"
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-mute">
                Sold {deal.soldCount} of {deal.stockLimit}
              </p>
            </>
          )} */}
          <ProductCardCartButton
            productId={product.id}
            productName={product.name}
            productSlug={product.slug}
            className={cn(
              deal && "mt-3",
              "relative after:absolute after:-inset-y-1.5 after:inset-x-0 after:rounded-full w-full h-9 rounded-full border border-brand text-brand-strong hover:bg-brand-tint inline-flex items-center justify-center gap-2 text-sm font-bold transition-colors",
            )}
          />
        </div>
      </div>
    </article>
  );
}
