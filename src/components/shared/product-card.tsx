import Link from "next/link";
import { X } from "lucide-react";
import { ProductWishlistButton } from "@/components/shared/product-wishlist-button";
import { ProductCardImage } from "@/components/shared/product-card-image";
import { formatPrice } from "@/lib/utils";
import type { ProductCardData } from "@/types/product";

interface ProductCardProps {
  product: ProductCardData;
  variant?: "standard" | "recently-viewed";
  onRemove?: () => void;
  removeDisabled?: boolean;
  imageSizes?: string;
}

export function ProductCard({
  product,
  variant = "standard",
  onRemove,
  removeDisabled = false,
  imageSizes = "(min-width: 1280px) calc((1280px - 96px) / 5), (min-width: 768px) calc((100vw - 80px) / 4), calc((100vw - 44px) / 2)",
}: ProductCardProps) {
  const originalPrice = product.compareAtPrice !== null && product.compareAtPrice > product.price
    ? product.compareAtPrice
    : null;
  const isHistoryCard = variant === "recently-viewed";

  return (
    <article className="group relative flex h-full min-w-0 flex-col rounded-2xl border border-line bg-white transition-colors hover:border-brand">
      <Link
        href={`/products/${product.slug}`}
        aria-label={`View ${product.name}`}
        className="flex h-full min-w-0 flex-col rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand"
      >
        <div className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-t-2xl bg-soft">
          <ProductCardImage
            key={product.mainImage.url}
            image={product.mainImage}
            name={product.name}
            placeholder={product.placeholder}
            sizes={imageSizes}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
          <h3 className="min-h-10 line-clamp-2 text-sm font-medium leading-5 text-ink group-hover:text-brand-strong">
            {product.name}
          </h3>
          <div className="mt-auto flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-head text-base font-extrabold text-ink">
              {formatPrice(product.price)}
            </span>
            {originalPrice !== null && (
              <s className="text-xs text-mute">
                {formatPrice(originalPrice)}
              </s>
            )}
          </div>
        </div>
      </Link>

      {isHistoryCard ? (
        <button
          type="button"
          className="absolute right-2 top-2 z-10 grid size-10 place-items-center rounded-full border border-line bg-white text-ink transition-colors hover:border-sale hover:text-sale focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:text-mute"
          aria-label={`Remove ${product.name} from recently viewed`}
          disabled={removeDisabled}
          onClick={onRemove}
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      ) : (
        <ProductWishlistButton
          productId={product.id}
          productName={product.name}
          className="absolute right-2 top-2 z-10"
          compact
        />
      )}
    </article>
  );
}
