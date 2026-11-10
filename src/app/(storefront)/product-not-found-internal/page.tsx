import type { Metadata } from "next";
import { ProductNotFound } from "@/components/products/product-not-found";

export const metadata: Metadata = {
  title: "Product not found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProductNotFoundPage() {
  return <ProductNotFound />;
}
