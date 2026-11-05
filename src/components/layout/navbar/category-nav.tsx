import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import type { CategoryGroup } from "@/types/navigation";
import { MegaMenu } from "./mega-menu";

interface CategoryNavProps {
  categories: CategoryGroup[];
}

export function CategoryNav({ categories }: CategoryNavProps) {
  return (
    <nav className="hidden lg:block relative z-20 bg-white border-b border-line font-body">
      <div className="max-w-[1280px] mx-auto px-4 h-12 flex items-center gap-7 text-sm font-medium">
        <div className="relative group">
          <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-brand-tint text-brand-strong border border-brand-border">
            <Menu className="w-5 h-5" />
            All categories
            <ChevronDown className="w-4 h-4" />
          </button>
          <MegaMenu categories={categories} />
        </div>
        <Link
          href="/products?promotion=flash-deals"
          className="flex items-center gap-2 text-sale font-bold"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sale" />
          Flash deals
        </Link>
        <Link href="#" className="hover:text-brand">
          Vouchers
        </Link>
        <Link href="/products?sort=newest" className="hover:text-brand">
          New arrivals
        </Link>
        <Link href="/products?sort=best-selling" className="hover:text-brand">
          Best sellers
        </Link>
        <Link href="#" className="hover:text-brand">
          Top vendors
        </Link>
        <Link href="#" className="hover:text-brand">
          Gift cards
        </Link>
        <Link
          href="#"
          className="ml-auto h-9 px-4 rounded-lg border border-brand text-brand-strong hover:bg-brand-tint inline-flex items-center font-bold"
        >
          Become a vendor
        </Link>
      </div>
    </nav>
  );
}

