"use client";

import { useState } from "react";
import type { NavbarData } from "@/types/navigation";
import { TopStrip } from "./top-strip";
import { MainHeader } from "./main-header";
import { CategoryNav } from "./category-nav";
import { MobileDrawer } from "./mobile-drawer";

interface NavbarProps {
  data: NavbarData;
}

export function Navbar({ data }: NavbarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <TopStrip message={data.topStripMessage} />
      <MainHeader
        onOpenDrawer={() => setIsDrawerOpen(true)}
        wishlistCount={data.wishlistCount}
        cartItems={data.cartItems}
        categories={data.categories}
        searchProducts={data.searchProducts}
        popularSearches={data.popularSearches}
      />
      <CategoryNav categories={data.categories} />
      <div
        id="overlay"
        className={`fixed inset-0 z-50 bg-black/40 ${
          isDrawerOpen ? "" : "hidden"
        }`}
        onClick={() => setIsDrawerOpen(false)}
      />
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        categories={data.categories}
      />
    </>
  );
}

