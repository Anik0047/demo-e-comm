"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Category } from "@/types/category";

interface MegaMenuProps {
  id: string;
  categories: Category[];
  activeCategoryId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MegaMenu({ id, categories, activeCategoryId, isOpen, onClose }: MegaMenuProps) {
  const pathname = usePathname();
  const mainCategories = categories.filter((category) => category.level === 1);
  const [active, setActive] = useState<{ pathname: string; id: string }>({ pathname: "", id: "" });
  const selectedCategory = active.pathname === pathname
    ? active.id
    : activeCategoryId ?? mainCategories[0]?.id ?? "";
  const activeCategory = mainCategories.find((category) => category.id === selectedCategory) ?? mainCategories[0];
  const subcategories = activeCategory
    ? categories.filter((category) => category.level === 2 && category.parentId === activeCategory.id)
    : [];

  return (
    <div id={id} hidden={!isOpen} className="absolute left-0 top-full w-[min(720px,calc(100vw-2rem))] pt-2">
      <div className="flex w-full bg-white border border-line rounded-xl shadow-lg overflow-hidden font-normal">
        <ul aria-label="Main categories" className="w-60 border-r border-line p-2">
          {mainCategories.map((category) => {
            const isActive = category.id === selectedCategory;
            return (
              <li
                key={category.id}
                onMouseEnter={() => setActive({ pathname, id: category.id })}
              >
                <Link
                  href={`/category/${category.slug}`}
                  aria-current={activeCategoryId === category.id ? "location" : undefined}
                  onFocus={() => setActive({ pathname, id: category.id })}
                  onClick={onClose}
                  className={`menu-link min-h-11 flex items-center justify-between ${
                    isActive ? "bg-brand-tint" : ""
                  }`}
                >
                  {category.name}
                  <ChevronRight className="w-4 h-4 text-mute" />
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="flex-1 p-5 bg-soft">
          {activeCategory && (
            <>
              <Link href={`/category/${activeCategory.slug}`} onClick={onClose} className="mb-3 inline-flex font-head font-bold hover:text-brand-strong">
                {activeCategory.name}
              </Link>
              <div className="grid grid-cols-2 gap-x-6">
                {subcategories.map((subcategory) => {
                  const children = categories.filter((category) => category.level === 3 && category.parentId === subcategory.id);
                  return (
                    <div key={subcategory.id} className="min-w-0">
                      <Link href={`/category/${activeCategory.slug}/${subcategory.slug}`} onClick={onClose} className="menu-link min-h-11 font-medium">
                        {subcategory.name}
                      </Link>
                      {children.map((child) => (
                        <Link key={child.id} href={`/category/${activeCategory.slug}/${subcategory.slug}/${child.slug}`} onClick={onClose} className="menu-link min-h-11 pl-4 text-mute">
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

