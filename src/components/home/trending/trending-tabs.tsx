"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/shared/product-card";
import { cn } from "@/lib/utils";
import type { TrendingTab } from "@/services/trending";
import type { ProductCardData } from "@/types/product";

const tabs: { id: TrendingTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New arrivals" },
  { id: "best-sellers", label: "Best sellers" },
  { id: "top-rated", label: "Top rated" },
];

interface TrendingTabsProps {
  products: Record<TrendingTab, ProductCardData[]>;
}

export function TrendingTabs({ products }: TrendingTabsProps) {
  const [active, setActive] = useState<TrendingTab>("all");
  const href = active === "all" ? "/products" : `/products?sort=${active === "new" ? "newest" : active === "best-sellers" ? "best-selling" : "top-rated"}`;
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let next: number;
    switch (event.key) {
      case "ArrowRight":
        next = (index + 1) % tabs.length;
        break;
      case "ArrowLeft":
        next = (index - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    setActive(tabs[next].id);
    buttons.current[next]?.focus({ preventScroll: true });
    buttons.current[next]?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "instant",
    });
  }

  return (
    <>
      <div className="mb-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="trending-title"
            className="font-head font-bold text-xl sm:text-2xl"
          >
            Trending products
          </h2>
          <p className="hidden sm:block text-sm text-mute mt-1">
            Most loved by shoppers this week
          </p>
        </div>
        <Link
          href={href}
          className="inline-flex min-h-11 items-end shrink-0 text-sm font-bold text-brand-strong hover:underline"
        >
          View all →
        </Link>
      </div>
      <div
        role="tablist"
        aria-label="Sort trending products"
        data-scroll-row=""
        className="mb-5 flex gap-2 overflow-x-auto -mx-4 px-4 pt-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0 md:overflow-visible"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`trending-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls="trending-panel"
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "h-11 px-4 rounded-full border text-sm font-bold shrink-0 scroll-mx-4",
              active === tab.id
                ? "bg-brand-strong border-brand-strong text-white"
                : "border-line bg-canvas text-ink hover:border-brand",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id="trending-panel"
        aria-labelledby={`trending-tab-${active}`}
      >
        <ul className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {products[active].map((product, index) => (
            <li
              key={product.id}
              className={cn("min-w-0", index >= 8 && "hidden xl:block")}
            >
              <ProductCard product={product} eagerImage={product.id === "prod-power-bank-10000"} />
            </li>
          ))}
        </ul>
        {products[active].length === 0 && (
          <p className="py-8 text-center text-sm text-mute">
            Discover more finds in all products.
          </p>
        )}
      </div>
      <div className="mt-8 flex justify-center">
        <Link href={href} className="btn btn-outline btn-md">
          View all products
        </Link>
      </div>
    </>
  );
}
