"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeftRight, ImageIcon, X } from "lucide-react";
import { clearComparedProducts, removeComparedProduct, useProductComparison } from "@/hooks/use-product-comparison";
import { formatPrice } from "@/lib/utils";
import { showToast } from "@/services/toast";
import type { ComparableProduct } from "@/services/product-comparison";

interface ProductComparisonProps {
  products: ComparableProduct[];
}

export function ProductComparison({ products }: ProductComparisonProps) {
  const { ids, limit } = useProductComparison();
  const selected = ids.flatMap((id) => {
    const product = products.find((item) => item.id === id);
    return product ? [product] : [];
  });
  const attributes = [...new Map(selected.flatMap(({ specifications }) => specifications.map(({ label }) => [label.trim().toLocaleLowerCase(), label.trim()] as const))).values()];

  function handleClear() {
    clearComparedProducts();
    showToast("success", "All products removed from comparison.");
  }

  function handleRemove(productId: string, productName: string) {
    removeComparedProduct(productId);
    showToast("success", `${productName} removed from comparison.`);
  }

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-6 font-body md:py-8" aria-labelledby="compare-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-brand-strong"><ArrowLeftRight aria-hidden="true" className="size-4" /> Product comparison</p>
          <h1 id="compare-title" className="mt-2 text-3xl font-extrabold sm:text-4xl">Compare products</h1>
          <p className="mt-2 text-sm text-mute">Compare up to {limit} products using their current catalog details.</p>
        </div>
        {selected.length > 0 && <button type="button" className="btn btn-outline btn-sm" onClick={handleClear}>Clear all</button>}
      </div>

      {selected.length === 0 ? <div className="mt-8 rounded-2xl border border-line bg-soft p-6 text-center sm:p-10">
        <ArrowLeftRight aria-hidden="true" className="mx-auto size-8 text-brand-strong" />
        <h2 className="mt-4 text-xl font-bold">Start comparing products</h2>
        <p className="mt-2 text-sm text-mute">Add up to three products from their details pages to see them side by side.</p>
        <Link className="btn btn-primary btn-md mt-5" href="/products">Browse products</Link>
      </div> : <>
        <p className="mt-5 text-sm text-mute" role="status" aria-live="polite">{selected.length} of {limit} products selected.{selected.length < limit ? ` Add ${limit - selected.length} more for a fuller comparison.` : ""}</p>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-line" role="region" aria-label="Product comparison table" tabIndex={0}>
          <table className="w-full min-w-[760px] table-fixed border-collapse text-left text-sm">
            <colgroup><col className="w-36 sm:w-48" /><col /><col /><col /></colgroup>
            <thead>
              <tr className="bg-soft align-top">
                <th scope="col" className="border-b border-line p-3 font-bold text-mute sm:p-4">Product details</th>
                {Array.from({ length: limit }, (_, index) => {
                  const product = selected[index];
                  return <th key={product?.id ?? `empty-${index}`} scope="col" className="min-w-0 border-b border-l border-line p-3 sm:p-4">
                    {product ? <div className="min-w-0">
                      <div className="relative mb-3 grid aspect-square place-items-center overflow-hidden rounded-xl bg-white">
                        {product.image.url ? <Image src={product.image.url} alt={product.image.alt || product.name} fill sizes="(min-width: 768px) 220px, 180px" className="object-contain" /> : <ImageIcon aria-hidden="true" className="size-9 text-mute" />}
                      </div>
                      <Link href={`/products/${product.slug}`} className="block min-h-11 font-bold text-ink hover:text-brand-strong hover:underline">{product.name}</Link>
                      <button type="button" className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-sale-strong hover:underline" aria-label={`Remove ${product.name} from comparison`} onClick={() => handleRemove(product.id, product.name)}>
                        <X aria-hidden="true" className="size-4" /> Remove
                      </button>
                    </div> : <div className="grid aspect-square place-items-center rounded-xl border border-dashed border-line bg-white p-3 text-center font-medium text-mute">Choose another product from the catalog</div>}
                  </th>;
                })}
              </tr>
            </thead>
            <tbody>
              <ComparisonRow label="Vendor" values={selected.map(({ vendorName }) => vendorName)} />
              <ComparisonRow label="Category" values={selected.map(({ categoryName }) => categoryName)} />
              <ComparisonRow label="Starting price" values={selected.map(({ price }) => formatPrice(price))} emphasized />
              <ComparisonRow label="Availability" values={selected.map(({ inStock }) => inStock ? "In stock" : "Out of stock")} />
              {attributes.map((label) => <ComparisonRow key={label} label={label} values={selected.map((product) => product.specifications.find((spec) => spec.label.trim().toLocaleLowerCase() === label.trim().toLocaleLowerCase())?.value ?? "Not listed")} />)}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-mute">Prices show the lowest current option price, including any active deal. Availability reflects whether an orderable option is in stock.</p>
        {selected.length === limit && <p className="mt-2 text-sm text-mute" role="status">Comparison limit reached. Remove a product to add another.</p>}
      </>}
    </section>
  );
}

function ComparisonRow({ label, values, emphasized = false }: { label: string; values: string[]; emphasized?: boolean }) {
  return <tr className="border-b border-line last:border-b-0">
    <th scope="row" className="bg-soft p-3 font-bold text-mute sm:p-4">{label}</th>
    {Array.from({ length: 3 }, (_, index) => <td key={index} className={`border-l border-line p-3 sm:p-4 ${emphasized ? "font-head text-base font-extrabold text-ink" : "text-ink"}`}>{values[index] ?? "—"}</td>)}
  </tr>;
}
