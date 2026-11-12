import Link from "next/link";
import { BadgeCheck, ShoppingCart, Star } from "lucide-react";
import { ProductWishlistButton } from "@/components/shared/product-wishlist-button";
import { ProductCompareButton } from "@/components/shared/product-compare-button";
import { calcDiscountPercent, formatPrice } from "@/lib/utils";
import { getAvailableVariantOptionValues } from "@/services/product-variant-selection";
import type { Product, ProductVariant } from "@/types/product";
import type { Vendor } from "@/types/vendor";

interface ProductInformationProps {
  product: Product;
  vendor: Vendor;
  selectedVariant: ProductVariant | null;
  selectedOptions: Record<string, string>;
  variants: ProductVariant[];
  minimumPrice: number;
  maximumPrice: number;
  minimumCompareAtPrice: number | null;
  maximumCompareAtPrice: number | null;
  selectedEffectivePrice: number | null;
  selectedEffectiveCompareAtPrice: number | null;
  quantity: number;
  maximumQuantity: number;
  canSetQuantity: boolean;
  canAddToCart: boolean;
  isCustomerAccount: boolean;
  isAccountReady: boolean;
  isAddingToCart: boolean;
  cartFeedback: { kind: "success" | "error"; message: string } | null;
  onAddToCart: () => void;
  onOptionChange: (name: string, value: string) => void;
  onQuantityChange: (quantity: number) => void;
}

export function ProductInformation({
  product, vendor, selectedVariant, selectedOptions, variants, minimumPrice, maximumPrice,
  minimumCompareAtPrice, maximumCompareAtPrice, quantity, maximumQuantity, canSetQuantity,
  selectedEffectivePrice, selectedEffectiveCompareAtPrice,
  canAddToCart, isCustomerAccount, isAccountReady, isAddingToCart, cartFeedback, onAddToCart,
  onOptionChange, onQuantityChange,
}: ProductInformationProps) {
  const currentPrice = selectedVariant ? selectedEffectivePrice : product.hasVariants ? null : minimumPrice;
  const originalPrice = selectedVariant
    ? selectedEffectiveCompareAtPrice !== null && selectedEffectiveCompareAtPrice > (selectedEffectivePrice ?? 0) ? selectedEffectiveCompareAtPrice : null
    : product.hasVariants ? minimumCompareAtPrice : minimumCompareAtPrice !== null && minimumCompareAtPrice > minimumPrice ? minimumCompareAtPrice : null;
  const discount = currentPrice !== null && originalPrice !== null ? calcDiscountPercent(currentPrice, originalPrice) : 0;
  const highlights = product.highlights.filter((highlight) => highlight.trim());
  const specifications = product.specifications.filter(({ label, value }) => label.trim() && value.trim());
  const { min, max } = product.deliveryDays;
  const deliveryKnown = Number.isFinite(min) && Number.isFinite(max) && min >= 0 && max > 0 && max >= min;
  const availability = !product.trackInventory
    ? "Availability not tracked"
    : product.hasVariants
      ? variants.length === 0 ? "Out of stock" : selectedVariant ? stockMessage(selectedVariant.stock, product.lowStockThreshold) : "Choose options to check stock"
      : stockMessage(product.stock, product.lowStockThreshold);
  const quantityGuidance = product.hasVariants && !selectedVariant
    ? `Choose options first. Order ${product.minOrderQty} to ${product.maxOrderQty} units.`
    : !canSetQuantity
      ? product.trackInventory && product.stock > 0 && product.stock < product.minOrderQty
        ? "Available stock is below the minimum order quantity."
        : "No quantity is currently available to order."
      : `Order ${product.minOrderQty} to ${maximumQuantity} units.`;
  const facts = [
    { label: "Availability", value: availability },
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
        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-mute">
          {product.ratingCount > 0 ? <>
            <Star aria-hidden="true" className="size-4 shrink-0 fill-accent text-accent" />
            <span className="font-bold text-ink">{product.ratingAverage.toFixed(1)}<span className="sr-only"> out of 5</span></span>
            <span>catalog sample ({product.ratingCount.toLocaleString("en-US")} {product.ratingCount === 1 ? "rating" : "ratings"})</span>
          </> : "No catalog sample rating"}
        </p>
      </div>

      <div className="border-y border-line py-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="font-head text-3xl font-extrabold text-ink"><span className="sr-only">Price: </span>{
            currentPrice !== null ? formatPrice(currentPrice) : `${formatPrice(minimumPrice)}${minimumPrice !== maximumPrice ? ` – ${formatPrice(maximumPrice)}` : ""}`
          }</p>
          {originalPrice !== null && <p className="text-sm text-mute"><span className="sr-only">Original price: </span><s>{
            selectedVariant || !product.hasVariants || minimumCompareAtPrice === maximumCompareAtPrice
              ? formatPrice(originalPrice)
              : `${formatPrice(minimumCompareAtPrice ?? originalPrice)} – ${formatPrice(maximumCompareAtPrice ?? originalPrice)}`
          }</s></p>}
          {discount > 0 && <span className="rounded-full bg-blush px-3 py-1 text-xs font-bold text-sale-strong">{discount}% off</span>}
        </div>
        {product.shortDescription.trim() && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-mute">{product.shortDescription}</p>}
      </div>

      {product.hasVariants && product.options.length > 0 && <fieldset className="space-y-4" aria-describedby="variant-help">
        <legend className="font-bold text-ink">Choose options</legend>
        {product.options.map((option) => {
          const availableValues = getAvailableVariantOptionValues(variants, selectedOptions, option.name);
          return <div key={option.name} className="space-y-2">
            <label htmlFor={`product-option-${option.name}`} className="block text-sm font-medium text-ink">{option.name}</label>
            <select id={`product-option-${option.name}`} className="input w-full" value={selectedOptions[option.name] ?? ""}
              disabled={!isAccountReady}
              onChange={(event) => onOptionChange(option.name, event.target.value)}>
              <option value="">Choose {option.name.toLowerCase()}</option>
              {option.values.map((value) => <option key={value} value={value} disabled={!availableValues.has(value)}>{value}{!availableValues.has(value) ? " (unavailable)" : ""}</option>)}
            </select>
          </div>;
        })}
        <p id="variant-help" className="text-xs text-mute">Options that cannot be ordered are unavailable.</p>
      </fieldset>}

      <div className="space-y-3">
        <p className="font-bold text-ink">Quantity</p>
        <div role="group" aria-label="Quantity" className="flex items-center gap-3">
          <button type="button" aria-label="Decrease quantity" className="btn btn-outline btn-md size-11 p-0"
            disabled={!canSetQuantity || quantity <= product.minOrderQty}
            onClick={() => onQuantityChange(Math.max(product.minOrderQty, quantity - 1))}>−</button>
          <output aria-live="polite" aria-atomic="true" className="min-w-8 text-center font-bold text-ink">{quantity}</output>
          <button type="button" aria-label="Increase quantity" className="btn btn-outline btn-md size-11 p-0"
            disabled={!canSetQuantity || quantity >= maximumQuantity}
            onClick={() => onQuantityChange(Math.min(maximumQuantity, quantity + 1))}>+</button>
        </div>
        <p className="text-sm text-mute">{quantityGuidance}</p>
        {product.hasVariants && variants.length === 0 && <p role="status" className="text-sm font-medium text-sale-strong">No orderable variants are available.</p>}
        {product.trackInventory && selectedVariant && selectedVariant.stock < product.minOrderQty && <p role="status" className="text-sm font-medium text-sale-strong">This option has less stock than the minimum order quantity.</p>}
        {!product.hasVariants && product.trackInventory && product.stock === 0 && <p role="status" className="text-sm font-medium text-sale-strong">This item is currently out of stock.</p>}
      </div>
      <div className="space-y-2">
        <ProductWishlistButton productId={product.id} productName={product.name} showText showAccountGuidance />
        <ProductCompareButton product={product} />
        <button
          type="button"
          className="btn btn-primary btn-lg w-full"
          disabled={!canAddToCart}
          onClick={onAddToCart}
          aria-describedby={!isAccountReady || !isCustomerAccount ? "cart-account-guidance" : undefined}
        >
          <ShoppingCart aria-hidden="true" className="size-5" />
          {isAddingToCart ? "Adding to cart…" : "Add to cart"}
        </button>
        {isAccountReady && !isCustomerAccount && <p id="cart-account-guidance" className="text-sm text-mute">
          Switch to a customer demo account before adding items to your cart.
        </p>}
        {!isAccountReady && <p id="cart-account-guidance" className="text-sm text-mute">Loading your demo account…</p>}
        {cartFeedback && <p role={cartFeedback.kind === "error" ? "alert" : "status"} className={`text-sm font-medium ${cartFeedback.kind === "success" ? "text-brand-strong" : "text-sale-strong"}`}>
          {cartFeedback.message}
        </p>}
      </div>
      <p className="text-xs text-mute">SKU: {selectedVariant?.sku ?? product.sku}</p>

      <div className="rounded-2xl border border-line p-4">
        <p className="text-xs text-mute">Sold by</p>
        <p className="mt-1 flex items-center gap-2 font-bold text-ink"><Link href={`/vendor/${vendor.slug}`} className="min-w-0 rounded-sm hover:text-brand-strong hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">{vendor.name}</Link>{vendor.verified && <BadgeCheck role="img" aria-label="Verified vendor" className="size-5 shrink-0 text-brand-strong" />}</p>
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

function stockMessage(stock: number, threshold: number): string {
  if (stock <= 0) return "Out of stock";
  if (stock <= threshold) return `Low stock · ${stock} ${stock === 1 ? "unit" : "units"} left`;
  return `${stock} available`;
}
