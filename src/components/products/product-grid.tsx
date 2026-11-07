import { ProductCard } from "@/components/shared/product-card";
import type { ListingItem } from "@/types/catalog";

export function ProductGrid({ items }: { items: ListingItem[] }) {
  return (
    <ul aria-label="Products" className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
      {items.map((product) => (
        <li key={product.id} data-product-id={product.id} className="flex min-w-0 flex-col">
          <div className="min-w-0 flex-1"><ProductCard product={product} /></div>
          {(product.availability === "out-of-stock" || !product.hasReviews) && (
            <div className="px-2 pt-2 text-xs text-mute md:px-3">
              {product.availability === "out-of-stock" && <p>Out of stock</p>}
              {!product.hasReviews && <p>No reviews yet</p>}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
