import type { Category } from "@/types/category";

export interface CartItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface NavbarData {
  topStripMessage: string;
  categories: Category[];
  cartItems: CartItem[];
  wishlistCount: number;
}

