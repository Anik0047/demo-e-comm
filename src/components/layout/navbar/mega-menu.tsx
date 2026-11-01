"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CategoryGroup } from "@/types/navigation";

interface MegaMenuProps {
  categories: CategoryGroup[];
}

export function MegaMenu({ categories }: MegaMenuProps) {
  const [active, setActive] = useState(categories[0]?.name ?? "");
  const activeCategory =
    categories.find((cat) => cat.name === active) ?? categories[0];

  return (
    <div className="hidden group-hover:flex group-focus-within:flex absolute left-0 top-full w-[720px] pt-2">
      <div className="flex w-full bg-white border border-line rounded-xl shadow-lg overflow-hidden font-normal">
        <ul className="w-60 border-r border-line p-2">
          {categories.map((category) => {
            const isActive = category.name === active;
            return (
              <li
                key={category.name}
                onMouseEnter={() => setActive(category.name)}
              >
                <Link
                  href="#"
                  onFocus={() => setActive(category.name)}
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
              <p className="font-head font-bold mb-3">{activeCategory.name}</p>
              <div className="grid grid-cols-2 gap-x-6">
                {activeCategory.subcategories.map((sub) => (
                  <Link key={sub} href="#" className="menu-link">
                    {sub}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

