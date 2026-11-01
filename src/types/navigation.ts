export interface CategoryGroup {
  name: string;
  subcategories: string[];
}

export interface CartItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface NavbarData {
  topStripMessage: string;
  categories: CategoryGroup[];
  cartItems: CartItem[];
  wishlistCount: number;
}

