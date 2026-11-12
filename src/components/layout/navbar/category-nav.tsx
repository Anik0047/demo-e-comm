"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useId, useRef, useState } from "react";
import { ChevronDown, Menu } from "lucide-react";
import type { Category } from "@/types/category";
import { MegaMenu } from "./mega-menu";

interface CategoryNavProps {
  categories: Category[];
}

export function CategoryNav({ categories }: CategoryNavProps) {
  return <Suspense fallback={<nav aria-label="Primary navigation" className="hidden lg:block h-12 border-b border-line bg-white" />}><CategoryNavContent categories={categories} /></Suspense>;
}

function CategoryNavContent({ categories }: CategoryNavProps) {
  const pathname = usePathname();
  const menuId = useId();
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null);
  const suppressFocusOpen = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuOpen = menuOpenPath === pathname;
  const activeCategory = categories.find((category) => category.level === 1 && pathname.startsWith(`/category/${category.slug}`));

  function onMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && menuOpen) {
      setMenuOpenPath(null);
      suppressFocusOpen.current = true;
      triggerRef.current?.focus();
    }
  }

  return (
    <nav aria-label="Primary navigation" className="hidden lg:block relative z-20 bg-white border-b border-line font-body" onKeyDown={onMenuKeyDown}>
      <div className="max-w-[1280px] mx-auto px-4 h-12 flex items-center gap-3 text-sm font-medium xl:gap-7">
        <div className="relative group" onMouseEnter={() => setMenuOpenPath(pathname)} onMouseLeave={() => { if (!triggerRef.current?.parentElement?.contains(document.activeElement)) setMenuOpenPath(null); }}>
          <button ref={triggerRef} type="button" aria-expanded={menuOpen} aria-controls={menuId} onClick={() => setMenuOpenPath(pathname)} onFocus={() => { if (suppressFocusOpen.current) suppressFocusOpen.current = false; else setMenuOpenPath(pathname); }} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-brand-tint text-brand-strong border border-brand-border">
            <Menu className="w-5 h-5" />
            All categories
            <ChevronDown className="w-4 h-4" />
          </button>
          <MegaMenu id={menuId} categories={categories} activeCategoryId={activeCategory?.id} isOpen={menuOpen} onClose={() => setMenuOpenPath(null)} />
        </div>
        <Link href="/products" aria-current={pathname === "/products" ? "page" : undefined} className={`hover:text-brand ${pathname === "/products" ? "text-brand-strong" : ""}`}>
          Products
        </Link>
        <Link
          href="/products?promotion=flash-deals"
          className="flex items-center gap-2 text-sale-strong font-bold"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sale" />
          Flash deals
        </Link>
        <Link href="/products" className="hover:text-brand">
          Vouchers
        </Link>
        <Link href="/products?sort=newest" className="hover:text-brand">
          New arrivals
        </Link>
        <Link href="/products?sort=best-selling" className="hover:text-brand">
          Best sellers
        </Link>
        <Link href="/#vendors-title" className="hover:text-brand">Top vendors</Link>
        <Link href="/products" className="hover:text-brand">Gift cards</Link>
        <Link
          href="/login"
          className="ml-auto h-9 px-4 rounded-lg border border-brand text-brand-strong hover:bg-brand-tint inline-flex items-center font-bold"
        >
          Become a vendor
        </Link>
      </div>
    </nav>
  );
}
