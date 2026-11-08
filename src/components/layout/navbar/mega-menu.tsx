"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Category } from "@/types/category";

interface MegaMenuProps {
  categories: Category[];
}

export function MegaMenu({ categories }: MegaMenuProps) {
  const mainCategories = categories.filter((category) => category.level === 1);
  const [active, setActive] = useState(mainCategories[0]?.id ?? "");
  const activeCategory = mainCategories.find((category) => category.id === active) ?? mainCategories[0];
  const subcategories = activeCategory
    ? categories.filter((category) => category.level === 2 && category.parentId === activeCategory.id)
    : [];

  return (
    <div className="hidden group-hover:flex group-focus-within:flex absolute left-0 top-full w-[720px] pt-2">
      <div className="flex w-full bg-white border border-line rounded-xl shadow-lg overflow-hidden font-normal">
        <ul className="w-60 border-r border-line p-2">
          {mainCategories.map((category) => {
            const isActive = category.id === active;
            return (
              <li
                key={category.id}
                onMouseEnter={() => setActive(category.id)}
              >
                <Link
                  href={`/category/${category.slug}`}
                  onFocus={() => setActive(category.id)}
                  className={`menu-link flex items-center justify-between ${
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
              <Link href={`/category/${activeCategory.slug}`} className="mb-3 inline-flex font-head font-bold hover:text-brand-strong">
                {activeCategory.name}
              </Link>
              <div className="grid grid-cols-2 gap-x-6">
                {subcategories.map((subcategory) => {
                  const children = categories.filter((category) => category.level === 3 && category.parentId === subcategory.id);
                  return (
                    <div key={subcategory.id} className="min-w-0">
                      <Link href={`/category/${activeCategory.slug}/${subcategory.slug}`} className="menu-link font-medium">
                        {subcategory.name}
                      </Link>
                      {children.map((child) => (
                        <Link key={child.id} href={`/category/${activeCategory.slug}/${subcategory.slug}/${child.slug}`} className="menu-link pl-4 text-mute">
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

