import type { NavbarData } from "@/types/navigation";

export const navbarData: Omit<NavbarData, "categories" | "searchProducts" | "popularSearches"> = {
  topStripMessage: "Free delivery on orders over ৳2,000",
  wishlistCount: 2,
  cartItems: [
    {
      id: "item-1",
      name: "Wireless Earbuds Pro",
      qty: 1,
      price: 2450,
    },
    {
      id: "item-2",
      name: "Cotton Panjabi",
      qty: 2,
      price: 1200,
    },
  ],
};

