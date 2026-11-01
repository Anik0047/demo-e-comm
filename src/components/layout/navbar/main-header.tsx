import Link from "next/link";
import { Heart, Menu, ShoppingBag } from "lucide-react";
import type { CartItem } from "@/types/navigation";
import { SearchForm } from "./search-form";
import { AccountMenu } from "./account-menu";
import { MiniCart } from "./mini-cart";

interface MainHeaderProps {
  onOpenDrawer: () => void;
  wishlistCount: number;
  cartItems: CartItem[];
}

export function MainHeader({
  onOpenDrawer,
  wishlistCount,
  cartItems,
}: MainHeaderProps) {
  return (
    <header
      className="sticky z-30 bg-white border-b border-line font-body"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="max-w-[1280px] mx-auto px-4 py-3 flex items-center gap-3 lg:gap-8">
        <button
          id="open-drawer"
          onClick={onOpenDrawer}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-soft"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <Link
          href="#"
          className="flex items-center gap-2 shrink-0"
          aria-label="Kenakata home"
        >
          <span className="w-10 h-10 rounded-xl bg-brand text-white grid place-items-center">
            <ShoppingBag className="w-5 h-5" />
          </span>
          <span className="font-head font-extrabold text-2xl tracking-tight">
            Kena<span className="text-brand">kata</span>
          </span>
        </Link>

        <SearchForm />

        <div className="ml-auto md:ml-0 flex items-center gap-1 sm:gap-2">
          <Link
            href="#"
            className="relative p-2.5 rounded-full hover:bg-soft"
            aria-label="Wishlist"
          >
            <Heart className="w-6 h-6" />
            <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-sale text-white text-[11px] font-bold grid place-items-center">
              {wishlistCount}
            </span>
          </Link>

          <AccountMenu />

          <MiniCart items={cartItems} />
        </div>
      </div>

      <SearchForm mobile />
    </header>
  );
}

