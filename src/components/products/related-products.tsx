import { ProductCard } from "@/components/shared/product-card";
import type { ProductCardData } from "@/types/product";

interface RelatedProductsProps {
  products: ProductCardData[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="related-products-heading" className="mt-10 border-t border-line pt-8">
      <h2 id="related-products-heading" className="mb-5 text-2xl font-bold text-ink">Related Products</h2>
      <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {products.map((product) => (
          <div key={product.id} className="min-w-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
