import { BadgeCheck, Star } from "lucide-react";
import { calcDiscountPercent, formatPrice } from "@/lib/utils";
import type { Product } from "@/types/product";
import type { Vendor } from "@/types/vendor";

interface ProductInformationProps {
  product: Product;
  vendor: Vendor;
}

export function ProductInformation({ product, vendor }: ProductInformationProps) {
  const originalPrice = product.compareAtPrice !== null && product.compareAtPrice > product.price ? product.compareAtPrice : null;
  const discount = originalPrice !== null ? calcDiscountPercent(product.price, originalPrice) : 0;
  const highlights = product.highlights.filter((highlight) => highlight.trim());
  const specifications = product.specifications.filter(({ label, value }) => label.trim() && value.trim());
  const { min, max } = product.deliveryDays;
  const deliveryKnown = Number.isFinite(min) && Number.isFinite(max) && min >= 0 && max > 0 && max >= min;
  const facts = [
    { label: "Availability", value: product.trackInventory ? (product.stock > 0 ? "In stock" : "Out of stock") : "Availability not tracked" },
    ...(product.shipsFrom.trim() ? [{ label: "Ships from", value: product.shipsFrom }] : []),
    ...(deliveryKnown ? [{ label: "Estimated delivery", value: min === max ? `${min} ${min === 1 ? "day" : "days"}` : `${min}–${max} days` }] : []),
    ...(product.freeShipping ? [{ label: "Shipping", value: "Free delivery" }] : []),
    { label: "Cash on delivery", value: product.codAvailable ? "Available" : "Unavailable" },
    ...(product.returnWindowDays > 0 ? [{ label: "Return window", value: `${product.returnWindowDays} ${product.returnWindowDays === 1 ? "day" : "days"}` }] : []),
    ...(product.warrantyMonths > 0 ? [{ label: "Warranty", value: `${product.warrantyMonths} ${product.warrantyMonths === 1 ? "month" : "months"}` }] : []),
  ];

  return (
    <section aria-labelledby="product-name" className="min-w-0 space-y-6 break-words lg:col-span-5">
      <div>
        {product.brand?.trim() && <p className="mb-2 text-sm font-medium text-mute">{product.brand}</p>}
        <h1 id="product-name" className="font-head text-3xl font-extrabold sm:text-4xl lg:text-3xl">{product.name}</h1>
        {product.sku.trim() && <p className="mt-3 text-xs text-mute">SKU: {product.sku}</p>}
        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-mute">
          {product.ratingCount > 0 ? <>
            <Star aria-hidden="true" className="size-4 shrink-0 fill-accent text-accent" />
            <span className="font-bold text-ink">{product.ratingAverage.toFixed(1)}<span className="sr-only"> out of 5</span></span>
            <span>({product.ratingCount.toLocaleString("en-US")} {product.ratingCount === 1 ? "rating" : "ratings"})</span>
          </> : "No ratings yet"}
        </p>
      </div>

      <div className="border-y border-line py-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="font-head text-3xl font-extrabold text-ink"><span className="sr-only">Price: </span>{formatPrice(product.price)}</p>
          {originalPrice !== null && <p className="text-sm text-mute"><span className="sr-only">Original price: </span><s>{formatPrice(originalPrice)}</s></p>}
          {discount > 0 && <span className="rounded-full bg-blush px-3 py-1 text-xs font-bold text-sale-strong">{discount}% off</span>}
        </div>
        {product.shortDescription.trim() && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-mute">{product.shortDescription}</p>}
      </div>

      <div className="rounded-2xl border border-line p-4">
        <p className="text-xs text-mute">Sold by</p>
        <p className="mt-1 flex items-center gap-2 font-bold text-ink"><span className="min-w-0">{vendor.name}</span>{vendor.verified && <BadgeCheck role="img" aria-label="Verified vendor" className="size-5 shrink-0 text-brand-strong" />}</p>
        {vendor.location.trim() && <p className="mt-1 text-sm text-mute">{vendor.location}</p>}
      </div>

      <dl className="space-y-4 text-sm">
        {facts.map(({ label, value }) => <div key={label} className="grid grid-cols-2 gap-4">
          <dt className="min-w-0 text-mute">{label}</dt><dd className="min-w-0 font-medium text-ink">{value}</dd>
        </div>)}
      </dl>

      {product.description.trim() && <section aria-labelledby="product-description" className="border-t border-line pt-6">
        <h2 id="product-description" className="text-lg font-bold sm:text-xl">Description</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-mute">{product.description}</p>
      </section>}
      {highlights.length > 0 && <section aria-labelledby="product-highlights" className="border-t border-line pt-6">
        <h2 id="product-highlights" className="text-lg font-bold sm:text-xl">Highlights</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-mute">{highlights.map((highlight, index) => <li key={index}>{highlight}</li>)}</ul>
      </section>}
      {specifications.length > 0 && <section aria-labelledby="product-specifications" className="border-t border-line pt-6">
        <h2 id="product-specifications" className="text-lg font-bold sm:text-xl">Specifications</h2>
        <dl className="mt-3 divide-y divide-line text-sm">{specifications.map(({ label, value }, index) => <div key={index} className="grid grid-cols-2 gap-4 py-3">
          <dt className="min-w-0 text-mute">{label}</dt><dd className="min-w-0 text-ink">{value}</dd>
        </div>)}</dl>
      </section>}
    </section>
  );
}
