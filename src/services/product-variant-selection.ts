import type { Product, ProductVariant } from "@/types/product";

export function getCompleteVariants(product: Pick<Product, "options" | "variants">): ProductVariant[] {
  return product.variants.filter((variant) => product.options.length > 0 && product.options.every(({ name, values }) => {
    const value = variant.optionValues[name];
    return typeof value === "string" && values.includes(value);
  }));
}

export function matchesVariantOptions(variant: ProductVariant, selected: Record<string, string>, except?: string): boolean {
  return Object.entries(selected).every(([name, value]) => name === except || variant.optionValues[name] === value);
}

export function getAvailableVariantOptionValues(
  variants: readonly ProductVariant[],
  selected: Record<string, string>,
  optionName: string,
): Set<string> {
  return new Set(variants
    .filter((variant) => matchesVariantOptions(variant, selected, optionName))
    .map((variant) => variant.optionValues[optionName]));
}
