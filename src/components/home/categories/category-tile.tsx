import Link from "next/link";
import { Smartphone, Shirt, ShoppingBasket, Bike } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryTone, MainCategory } from "@/types/category";

const toneClasses: Record<CategoryTone, string> = {
  info: "bg-info text-info-ink",
  blush: "bg-blush text-blush-ink",
  mint: "bg-brand-soft text-brand-deep",
  gray: "bg-soft text-ink",
};

// These reference glyphs differ from the installed Lucide versions.
const referenceIcons = {
  house: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-7 h-7 lg:w-8 lg:h-8"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>),
  sparkles: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-7 h-7 lg:w-8 lg:h-8"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>),
  baby: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-7 h-7 lg:w-8 lg:h-8"><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/></svg>),
  book: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-7 h-7 lg:w-8 lg:h-8"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>),
};
const lucideIcons = { smartphone: Smartphone, shirt: Shirt, basket: ShoppingBasket, bike: Bike };

interface CategoryTileProps {
  category: MainCategory;
  subcategoryNames?: string[];
}

export function CategoryTile({ category, subcategoryNames }: CategoryTileProps) {
  const icon = category.icon;
  const Icon = icon in lucideIcons ? lucideIcons[icon as keyof typeof lucideIcons] : null;
  return (
    <li className="min-w-0">
      <Link
        href={`/category/${category.slug}`}
        data-slug={category.slug}
        className={subcategoryNames
          ? "group card card-hover flex h-full min-w-0 flex-col items-center gap-3 p-4 text-center transition-colors sm:p-5"
          : "group flex flex-col items-center gap-2 text-center"}
      >
        <span className={cn("w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full", toneClasses[category.tone], "group-hover:bg-brand group-hover:text-white grid place-items-center transition-colors")}>
          {Icon ? <Icon className="w-7 h-7 lg:w-8 lg:h-8" /> : referenceIcons[icon as keyof typeof referenceIcons]}
        </span>
        <span className="text-xs lg:text-sm font-medium leading-tight break-words group-hover:text-brand-strong">{category.name}</span>
        {subcategoryNames && (
          <span className="text-xs leading-5 text-mute">
            {subcategoryNames.slice(0, 3).join(" · ")}
            {subcategoryNames.length > 3 && ` · +${subcategoryNames.length - 3} more`}
          </span>
        )}
      </Link>
    </li>
  );
}
