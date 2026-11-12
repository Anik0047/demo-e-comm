import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { ProductComparison } from "@/components/products/product-comparison";
import { getComparableProductIds, getComparableProducts } from "@/services/product-comparison";
import { getPricingTime } from "@/services/effective-price";

export const metadata: Metadata = {
  title: "Compare products | Kenakata",
  description: "Compare product details side by side on Kenakata.",
};

export default async function ComparePage() {
  return <Suspense fallback={<CompareLoading />}><CompareContent /></Suspense>;
}

async function CompareContent() {
  await connection();
  const products = getComparableProducts([...getComparableProductIds()], getPricingTime());
  return <ProductComparison products={products} />;
}

function CompareLoading() {
  return <section className="mx-auto max-w-[1280px] px-4 py-6 font-body md:py-8" aria-label="Loading product comparison" aria-busy="true">
    <div className="skeleton h-10 w-64" />
    <div className="skeleton mt-6 h-72 w-full rounded-2xl" />
  </section>;
}
