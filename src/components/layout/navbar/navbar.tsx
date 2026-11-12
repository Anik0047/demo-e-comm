"use client";

import { useCallback, useRef, useState } from "react";
import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
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

function RouteChangeHandler({ onRouteChange }: { onRouteChange: () => void }) {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      onRouteChange();
    }
  }, [pathname, onRouteChange]);
  return null;
}

export function Navbar({ data }: NavbarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const activeAccount = useDemoState(selectActiveAccount);
  const snapshot = useDemoState(selectDemoSnapshot);
  const wishlistCount = snapshot && activeAccount?.role === "customer" && activeAccount.customerId
    ? selectCustomerWishlist(snapshot, activeAccount.id)?.productIds.length ?? 0
    : null;

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    function closeOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) closeDrawer();
    }
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [closeDrawer]);

  return (
    <>
      <TopStrip message={data.topStripMessage} />
      <MainHeader
        onOpenDrawer={openDrawer}
        isDrawerOpen={isDrawerOpen}
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
        onClick={closeDrawer}
      />
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        categories={data.categories}
      />
      <Suspense fallback={null}><RouteChangeHandler onRouteChange={closeDrawer} /></Suspense>
    </>
  );
}

