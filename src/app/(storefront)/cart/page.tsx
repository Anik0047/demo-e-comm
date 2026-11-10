import type { Metadata } from "next";
import { CartPage } from "@/components/cart/cart-page";

export const metadata: Metadata = {
  title: "Your cart | Kenakata",
  description: "Review products in your Kenakata cart.",
};

export default function CartRoute() {
  return <CartPage />;
}
