"use client";

import { useState } from "react";
import { useDemoState } from "@/hooks/use-demo-state";
import { selectCustomerWishlist } from "@/services/demo-wishlist";
import { selectActiveAccount, selectDemoSnapshot } from "@/services/demo-state-store";
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
  const activeAccount = useDemoState(selectActiveAccount);
  const snapshot = useDemoState(selectDemoSnapshot);
  const wishlistCount = snapshot && activeAccount?.role === "customer" && activeAccount.customerId
    ? selectCustomerWishlist(snapshot, activeAccount.id)?.productIds.length ?? 0
    : null;

  return (
    <>
      <TopStrip message={data.topStripMessage} />
      <MainHeader
        onOpenDrawer={() => setIsDrawerOpen(true)}
        wishlistCount={wishlistCount}
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

