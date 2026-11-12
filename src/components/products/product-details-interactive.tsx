"use client";

import { useEffect, useState } from "react";
import { ProductImageGallery } from "@/components/products/product-image-gallery";
import { ProductInformation } from "@/components/products/product-information";
import { useDemoState } from "@/hooks/use-demo-state";
import { addCartItem } from "@/services/demo-cart";
import { recordRecentlyViewedProduct } from "@/services/recently-viewed";
import { demoStateStore, selectActiveAccount, selectHydrationReady } from "@/services/demo-state-store";
import type { GalleryImage } from "@/services/product-gallery";
import { getCompleteVariants, matchesVariantOptions } from "@/services/product-variant-selection";
import type { Product } from "@/types/product";
import type { Vendor } from "@/types/vendor";
import type { FlashDeal } from "@/types/product";
import { resolveEffectivePrice, maximumOrderQuantity as getMaximumOrderQuantity } from "@/services/effective-price";
import { showToast } from "@/services/toast";

interface ProductDetailsInteractiveProps {
  product: Product;
  vendor: Vendor;
  deals: readonly FlashDeal[];
  images: GalleryImage[];
  pricingTime: number;
}

export function ProductDetailsInteractive({ product, vendor, deals, images, pricingTime }: ProductDetailsInteractiveProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(product.minOrderQty);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const activeAccount = useDemoState(selectActiveAccount);
  const hydrationReady = useDemoState(selectHydrationReady);
  const variants = getCompleteVariants(product);
  const orderableVariants = variants.filter((variant) => !product.trackInventory || variant.stock >= product.minOrderQty);
  const matchingVariants = variants.filter((variant) => matchesVariantOptions(variant, selectedOptions));
  const matchingOrderableVariants = orderableVariants.filter((variant) => matchesVariantOptions(variant, selectedOptions));
  const selectionComplete = product.options.length > 0 && product.options.every(({ name }) => selectedOptions[name]);
  const selectedVariant = selectionComplete ? matchingOrderableVariants[0] ?? null : null;
  const rangeVariants = matchingVariants.length ? matchingVariants : variants;
  const basePrice = resolveEffectivePrice(product, null, deals, vendor.status === "approved", pricingTime);
  const prices = rangeVariants.map((variant) => resolveEffectivePrice(product, variant, deals, vendor.status === "approved", pricingTime));
  const selectedPrice = selectedVariant ? resolveEffectivePrice(product, selectedVariant, deals, vendor.status === "approved", pricingTime) : null;
  const minimumPrice = prices.length ? Math.min(...prices.map(({ price }) => price)) : resolveEffectivePrice(product, null, deals, vendor.status === "approved", pricingTime).price;
  const maximumPrice = prices.length ? Math.max(...prices.map(({ price }) => price)) : minimumPrice;
  const compareAtPrices = prices.map(({ price, compareAtPrice }) => compareAtPrice !== null && compareAtPrice > price ? compareAtPrice : null);
  const minimumCompareAtPrice = rangeVariants.length > 0 && compareAtPrices.every((price): price is number => price !== null)
    ? Math.min(...compareAtPrices)
    : !product.hasVariants && basePrice.compareAtPrice !== null && basePrice.compareAtPrice > basePrice.price ? basePrice.compareAtPrice : null;
  const maximumCompareAtPrice = rangeVariants.length > 0 && compareAtPrices.every((price): price is number => price !== null)
    ? Math.max(...compareAtPrices)
    : !product.hasVariants && basePrice.compareAtPrice !== null && basePrice.compareAtPrice > basePrice.price ? basePrice.compareAtPrice : null;
  const maximumQuantity = getMaximumOrderQuantity(product, selectedVariant);
  const canSetQuantity = product.hasVariants
    ? selectedVariant !== null && maximumQuantity >= product.minOrderQty
    : (!product.trackInventory || product.stock >= product.minOrderQty) && maximumQuantity >= product.minOrderQty;
  const isCustomerAccount = hydrationReady && activeAccount?.role === "customer" && activeAccount.customerId !== null;
  useEffect(() => {
    if (!hydrationReady || activeAccount?.role !== "customer" || !activeAccount.customerId) return;
    void recordRecentlyViewedProduct(demoStateStore, product.id);
  }, [activeAccount?.customerId, activeAccount?.role, hydrationReady, product.id]);
  const quantityIsValid = Number.isSafeInteger(quantity)
    && quantity >= product.minOrderQty
    && quantity <= maximumQuantity;
  const canAddToCart = isCustomerAccount
    && canSetQuantity
    && quantityIsValid
    && (!product.hasVariants || selectedVariant !== null)
    && !isAddingToCart;
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
    const nextMax = getMaximumOrderQuantity(product, nextVariant);
    setSelectedOptions(next);
    setQuantity((current) => nextVariant
      ? Math.max(product.minOrderQty, Math.min(current, nextMax))
      : product.minOrderQty);
  }

  async function handleAddToCart() {
    if (!canAddToCart) return;
    setIsAddingToCart(true);
    try {
      const result = await addCartItem(demoStateStore, {
        productId: product.id,
        variantId: selectedVariant?.id ?? null,
        quantity,
      });
      if (!result.ok) {
        showToast("error", "Your cart is not ready. Please try again.");
      } else if (!result.result.ok) {
        const message = result.result.reason === "customer_required"
          ? "Switch to a customer demo account to add items to your cart."
          : "This item is no longer available in the selected quantity. Review your options and try again.";
        showToast("error", message);
      } else if (!result.persisted) {
        showToast("error", "Your cart could not be saved. Please try again.");
      } else {
        showToast("success", `${product.name} added to your cart.`);
      }
    } catch {
      showToast("error", "Your cart could not be updated. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
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
        selectedEffectivePrice={selectedPrice?.price ?? null}
        selectedEffectiveCompareAtPrice={selectedPrice?.compareAtPrice ?? null}
        quantity={quantity}
        maximumQuantity={maximumQuantity}
        canSetQuantity={canSetQuantity}
        canAddToCart={canAddToCart}
        isCustomerAccount={isCustomerAccount}
        isAccountReady={hydrationReady}
        isAddingToCart={isAddingToCart}
        onAddToCart={handleAddToCart}
        onOptionChange={changeOption}
        onQuantityChange={setQuantity}
      />
    </div>
  );
}
