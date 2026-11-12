"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import type { Category } from "@/types/category";
import { useDemoState } from "@/hooks/use-demo-state";
import { selectActiveAccount } from "@/services/demo-state-store";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

export function MobileDrawer({ isOpen, onClose, categories }: MobileDrawerProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const drawerRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);
  const mainCategories = categories.filter((category) => category.level === 1);
  const activeAccount = useDemoState(selectActiveAccount);
  const isCustomer = activeAccount?.role === "customer" && activeAccount.customerId !== null;

  function toggleCategory(categoryId: string) {
    setExpandedCategories((current) => current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId]);
  }

  useEffect(() => {
    if (!isOpen) {
      if (wasOpen.current) document.getElementById("open-drawer")?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const trigger = document.getElementById("open-drawer");
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => Array.from(drawerRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []);
    focusable()[0]?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        trigger?.focus();
      } else if (event.key === "Tab") {
        const items = focusable();
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <aside
      ref={drawerRef}
      id="drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={`fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85%] bg-white transition-transform duration-200 overflow-y-auto font-body ${
        isOpen ? "" : "-translate-x-full"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="flex items-center justify-between p-4 border-b border-line">
        <span className="font-head font-extrabold text-xl">
          Kena<span className="text-brand">kata</span>
        </span>
        <button
          id="close-drawer"
          onClick={onClose}
          className="grid size-11 shrink-0 place-items-center rounded-lg hover:bg-soft"
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-4 border-b border-line">
        <Link
          href="/login"
          className="block text-center bg-brand text-white text-sm font-medium rounded-lg py-3"
        >
          Login or switch demo account
        </Link>
      </div>
      <ul id="drawer-cats" className="p-2">
        {mainCategories.map((category) => {
          const subcategories = categories.filter((item) => item.level === 2 && item.parentId === category.id);
          const expanded = expandedCategories.includes(category.id);
          return (
            <li key={category.id}>
              <div className="flex min-w-0 items-center">
                <Link href={`/category/${category.slug}`} onClick={onClose} className="menu-link min-h-11 min-w-0 flex-1">
                  {category.name}
                </Link>
                {subcategories.length > 0 && (
                  <button
                    type="button"
                    aria-label={`${expanded ? "Hide" : "Show"} ${category.name} subcategories`}
                    aria-expanded={expanded}
                    aria-controls={`drawer-subcategories-${category.id}`}
                    onClick={() => toggleCategory(category.id)}
                    className="grid size-11 shrink-0 place-items-center rounded-lg hover:bg-soft"
                  >
                    <ChevronRight className={`size-4 text-mute transition-transform ${expanded ? "rotate-90" : ""}`} aria-hidden="true" />
                  </button>
                )}
              </div>
              {expanded && (
                <ul id={`drawer-subcategories-${category.id}`} className="ml-3 border-l border-line pl-2">
                  {subcategories.map((subcategory) => {
                    const children = categories.filter((item) => item.level === 3 && item.parentId === subcategory.id);
                    return (
                      <li key={subcategory.id}>
                        <Link href={`/category/${category.slug}/${subcategory.slug}`} onClick={onClose} className="menu-link min-h-11 font-medium">
                          {subcategory.name}
                        </Link>
                        {children.length > 0 && (
                          <ul className="ml-3 border-l border-line pl-2">
                            {children.map((child) => (
                              <li key={child.id}>
                                <Link href={`/category/${category.slug}/${subcategory.slug}/${child.slug}`} onClick={onClose} className="menu-link min-h-11 text-mute">
                                  {child.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <ul className="p-2 border-t border-line">
        {isCustomer && <li><Link href="/account" onClick={onClose} className="menu-link min-h-11 font-bold text-brand-strong">My account</Link></li>}
        <li><Link href="/products" onClick={onClose} className="menu-link min-h-11">Products</Link></li>
        <li><Link href="/wishlist" onClick={onClose} className="menu-link min-h-11">Wishlist</Link></li>
        <li><Link href="/cart" onClick={onClose} className="menu-link min-h-11">Cart</Link></li>
        <li>
          <Link href="/products?promotion=flash-deals" onClick={onClose} className="menu-link min-h-11 text-sale-strong font-bold">
            Flash deals
          </Link>
        </li>
        <li>
          <Link href="/products" onClick={onClose} className="menu-link min-h-11">
            Vouchers
          </Link>
        </li>
        <li>
          <Link href="/#vendors-title" onClick={onClose} className="menu-link min-h-11">
            Top vendors
          </Link>
        </li>
        <li>
          <Link href="/login" onClick={onClose} className="menu-link min-h-11">
            Track order
          </Link>
        </li>
        <li>
          <Link href="/login" onClick={onClose} className="menu-link min-h-11 text-brand-strong font-bold">
            Become a vendor
          </Link>
        </li>
      </ul>
    </aside>
  );
}

