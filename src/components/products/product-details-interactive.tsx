"use client";

import { useState } from "react";
import { ProductImageGallery } from "@/components/products/product-image-gallery";
import { ProductInformation } from "@/components/products/product-information";
import type { GalleryImage } from "@/services/product-gallery";
import { getCompleteVariants, matchesVariantOptions } from "@/services/product-variant-selection";
import type { Product, ProductVariant } from "@/types/product";
import type { Vendor } from "@/types/vendor";

interface ProductDetailsInteractiveProps {
  product: Product;
  vendor: Vendor;
  images: GalleryImage[];
}

function getMaxQuantity(product: Product, variant: ProductVariant | null): number {
  if (!product.trackInventory) return product.maxOrderQty;
  const stock = variant ? variant.stock : product.stock;
  return Math.min(product.maxOrderQty, stock);
}

export function ProductDetailsInteractive({ product, vendor, images }: ProductDetailsInteractiveProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(product.minOrderQty);
  const variants = getCompleteVariants(product);
  const orderableVariants = variants.filter((variant) => !product.trackInventory || variant.stock >= product.minOrderQty);
  const matchingVariants = variants.filter((variant) => matchesVariantOptions(variant, selectedOptions));
  const matchingOrderableVariants = orderableVariants.filter((variant) => matchesVariantOptions(variant, selectedOptions));
  const selectionComplete = product.options.length > 0 && product.options.every(({ name }) => selectedOptions[name]);
  const selectedVariant = selectionComplete ? matchingOrderableVariants[0] ?? null : null;
  const rangeVariants = matchingVariants.length ? matchingVariants : variants;
  const minimumPrice = rangeVariants.length ? Math.min(...rangeVariants.map(({ price }) => price)) : product.price;
  const maximumPrice = rangeVariants.length ? Math.max(...rangeVariants.map(({ price }) => price)) : product.price;
  const compareAtPrices = rangeVariants.map(({ price, compareAtPrice }) => compareAtPrice !== null && compareAtPrice > price ? compareAtPrice : null);
  const minimumCompareAtPrice = rangeVariants.length > 0 && compareAtPrices.every((price): price is number => price !== null)
    ? Math.min(...compareAtPrices)
    : null;
  const maximumCompareAtPrice = rangeVariants.length > 0 && compareAtPrices.every((price): price is number => price !== null)
    ? Math.max(...compareAtPrices)
    : null;
  const maximumQuantity = getMaxQuantity(product, selectedVariant);
  const canSetQuantity = product.hasVariants
    ? selectedVariant !== null && maximumQuantity >= product.minOrderQty
    : (!product.trackInventory || product.stock >= product.minOrderQty) && maximumQuantity >= product.minOrderQty;
  const displayImages = selectedVariant?.image?.url
    ? [{ ...selectedVariant.image }, ...images.filter(({ url }) => url !== selectedVariant.image?.url)]
    : images;

  function changeOption(name: string, value: string) {
    const next = { ...selectedOptions };
    if (value) next[name] = value;
    else delete next[name];
    const possible = orderableVariants.filter((variant) => matchesVariantOptions(variant, next));
    if (possible.length === 0) return;

    const nextIsComplete = product.options.every(({ name: optionName }) => next[optionName]);
    const nextVariant = nextIsComplete ? possible[0] : null;
    const nextMax = getMaxQuantity(product, nextVariant);
    setSelectedOptions(next);
    setQuantity((current) => nextVariant
      ? Math.max(product.minOrderQty, Math.min(current, nextMax))
      : product.minOrderQty);
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-12">
      <ProductImageGallery key={`${product.id}-${selectedVariant?.id ?? "default"}`} images={displayImages} name={product.name} />
      <ProductInformation
        product={product}
        vendor={vendor}
        selectedVariant={selectedVariant}
        selectedOptions={selectedOptions}
        variants={orderableVariants}
        minimumPrice={minimumPrice}
        maximumPrice={maximumPrice}
        minimumCompareAtPrice={minimumCompareAtPrice}
        maximumCompareAtPrice={maximumCompareAtPrice}
        quantity={quantity}
        maximumQuantity={maximumQuantity}
        canSetQuantity={canSetQuantity}
        onOptionChange={changeOption}
        onQuantityChange={setQuantity}
      />
    </div>
  );
}
