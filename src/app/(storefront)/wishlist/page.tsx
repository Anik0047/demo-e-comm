import type { Metadata } from "next";
import { WishlistPage } from "@/components/wishlist/wishlist-page";

export const metadata: Metadata = {
  title: "Your wishlist | Kenakata",
  description: "Review the products saved to your Kenakata wishlist.",
};

export default function WishlistRoute() {
  return <WishlistPage />;
}
