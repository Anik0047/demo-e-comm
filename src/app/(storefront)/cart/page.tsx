import type { Metadata } from "next";
import { CartPage } from "@/components/cart/cart-page";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review sample items saved in this browser’s demo cart.",
  robots: { index: false, follow: true },
};

export default function CartRoute() {
  return <CartPage />;
}
