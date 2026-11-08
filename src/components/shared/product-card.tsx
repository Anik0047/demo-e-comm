import Link from "next/link";
import { ProductPlaceholderIcon } from "@/components/shared/product-placeholder-icon";
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
  return (
    <article className="flex flex-col h-full rounded-2xl border border-line bg-white overflow-hidden hover:border-brand transition-colors">
      <div className="relative">
        {!product.mainImage.url && (
          <Link
            href="#"
            className={cn(
              "grid place-items-center aspect-[4/3] md:aspect-square",
              product.placeholder && toneClasses[product.placeholder.tone],
            )}
            aria-label={`View ${product.name}`}
          >
            {product.placeholder && (
              <ProductPlaceholderIcon icon={product.placeholder.icon} />
            )}
          </Link>
        )}
        {product.compareAtPrice !== null && (
          <span className="absolute top-2 left-2 rounded-full bg-sale text-white text-xs font-bold px-2 py-0.5">
            -{calcDiscountPercent(product.price, product.compareAtPrice)}%
          </span>
        )}
        <button
          type="button"
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white text-ink hover:text-sale grid place-items-center after:absolute after:-inset-1.5 after:rounded-full"
          aria-label={`Add ${product.name} to wishlist`}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>
      </div>
      <div className="flex flex-col flex-1 p-2 md:p-3">
        <Link
          href="#"
          className="text-xs text-mute truncate hover:text-brand-strong"
        >
          {product.vendor.name}
        </Link>
        <h3 className="mt-1 text-sm font-medium line-clamp-2 min-h-[2.5rem]">
          <Link href="#" className="hover:text-brand-strong">
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
          <button
            type="button"
            className={cn(
              deal && "mt-3",
              "relative after:absolute after:-inset-y-1.5 after:inset-x-0 after:rounded-full w-full h-9 rounded-full border border-brand text-brand-strong hover:bg-brand-tint inline-flex items-center justify-center gap-2 text-sm font-bold transition-colors",
            )}
            aria-label={`Add ${product.name} to cart`}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            <span className="hidden sm:inline">Add to cart</span>
          </button>
        </div>
      </div>
    </article>
  );
}
