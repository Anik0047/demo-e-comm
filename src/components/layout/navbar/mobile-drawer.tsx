"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import type { Category } from "@/types/category";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

export function MobileDrawer({ isOpen, onClose, categories }: MobileDrawerProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const mainCategories = categories.filter((category) => category.level === 1);

  function toggleCategory(categoryId: string) {
    setExpandedCategories((current) => current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId]);
  }

  return (
    <aside
      id="drawer"
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
          className="p-1 rounded-lg hover:bg-soft"
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-4 grid grid-cols-2 gap-2 border-b border-line">
        <Link
          href="#"
          className="text-center bg-brand text-white text-sm font-medium rounded-lg py-2"
        >
          Login
        </Link>
        <Link
          href="#"
          className="text-center border border-brand text-brand-strong text-sm font-medium rounded-lg py-2"
        >
          Register
        </Link>
      </div>
      <ul id="drawer-cats" className="p-2">
        {mainCategories.map((category) => {
          const subcategories = categories.filter((item) => item.level === 2 && item.parentId === category.id);
          const expanded = expandedCategories.includes(category.id);
          return (
            <li key={category.id}>
              <div className="flex min-w-0 items-center">
                <Link href={`/category/${category.slug}`} onClick={onClose} className="menu-link min-w-0 flex-1">
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
                        <Link href={`/category/${category.slug}/${subcategory.slug}`} onClick={onClose} className="menu-link font-medium">
                          {subcategory.name}
                        </Link>
                        {children.length > 0 && (
                          <ul className="ml-3 border-l border-line pl-2">
                            {children.map((child) => (
                              <li key={child.id}>
                                <Link href={`/category/${category.slug}/${subcategory.slug}/${child.slug}`} onClick={onClose} className="menu-link text-mute">
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
        <li>
          <Link href="/products?promotion=flash-deals" onClick={onClose} className="menu-link text-sale font-bold">
            Flash deals
          </Link>
        </li>
        <li>
          <Link href="#" className="menu-link">
            Vouchers
          </Link>
        </li>
        <li>
          <Link href="#" className="menu-link">
            Top vendors
          </Link>
        </li>
        <li>
          <Link href="#" className="menu-link">
            Track order
          </Link>
        </li>
        <li>
          <Link href="#" className="menu-link text-brand-strong font-bold">
            Become a vendor
          </Link>
        </li>
      </ul>
    </aside>
  );
}

