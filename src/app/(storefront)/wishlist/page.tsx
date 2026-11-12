import type { Metadata } from "next";
import { WishlistPage } from "@/components/wishlist/wishlist-page";

export const metadata: Metadata = {
  title: "Your wishlist",
  description: "Review products saved to this browser’s demo wishlist.",
  robots: { index: false, follow: true },
};

export default function WishlistRoute() {
  return <WishlistPage />;
}
