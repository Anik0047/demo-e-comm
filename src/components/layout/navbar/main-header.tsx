import Link from "next/link";
import { Heart, Menu, ShoppingBag } from "lucide-react";
import type { SearchProduct } from "@/types/navigation";
import { SearchForm } from "./search-form";
import { AccountMenu } from "./account-menu";
import { MiniCart } from "./mini-cart";

interface MainHeaderProps {
  onOpenDrawer: () => void;
  wishlistCount: number | null;
  categories: import("@/types/category").Category[];
  searchProducts: SearchProduct[];
  popularSearches: string[];
}

export function MainHeader({
  onOpenDrawer,
  wishlistCount,
  categories,
  searchProducts,
  popularSearches,
}: MainHeaderProps) {
  return (
    <header
      className="sticky z-30 bg-white border-b border-line font-body"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="max-w-[1280px] mx-auto px-4 py-3 flex items-center gap-3 lg:gap-8 max-[359px]:gap-2">
        <button
          id="open-drawer"
          onClick={onOpenDrawer}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-soft"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <Link
          href="/"
          className="flex items-center gap-2 max-[359px]:gap-1.5 shrink-0"
          aria-label="Kenakata home"
        >
          <span className="w-10 h-10 max-[359px]:w-9 max-[359px]:h-9 rounded-xl bg-brand text-white grid place-items-center">
            <ShoppingBag className="w-5 h-5" />
          </span>
          <span className="font-head font-extrabold text-2xl max-[359px]:text-xl tracking-tight">
            Kena<span className="text-brand">kata</span>
          </span>
        </Link>

        <SearchForm categories={categories} searchProducts={searchProducts} popularSearches={popularSearches} />

        <div className="ml-auto md:ml-0 flex items-center gap-1 sm:gap-2">
          <Link
            href="/wishlist"
            className="relative p-2.5 rounded-full hover:bg-soft"
            aria-label={wishlistCount === null ? "Wishlist" : `Wishlist, ${wishlistCount} ${wishlistCount === 1 ? "item" : "items"}`}
          >
            <Heart className="w-6 h-6" />
            {wishlistCount !== null && <span aria-hidden="true" className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-sale text-white text-[11px] font-bold grid place-items-center">
              {wishlistCount}
            </span>}
          </Link>

          <AccountMenu />

          <MiniCart />
        </div>
      </div>

      <SearchForm mobile categories={categories} searchProducts={searchProducts} popularSearches={popularSearches} />
    </header>
  );
}
