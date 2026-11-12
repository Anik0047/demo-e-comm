import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Vendor, VendorAvatarTone } from "@/types/vendor";

const avatarClasses: Record<VendorAvatarTone, string> = {
  brand: "bg-brand text-white",
  accent: "bg-accent text-ink",
  sky: "bg-sky text-white",
  ink: "bg-ink text-white",
  "info-ink": "bg-info-ink text-white",
  sale: "bg-sale text-white",
  "brand-strong": "bg-brand-strong text-white",
  "accent-strong": "bg-accent-strong text-ink",
};
const coverClasses = ["bg-info", "bg-blush", "bg-brand-soft", "bg-soft"];
const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

interface VendorCardProps {
  vendor: Vendor;
  index?: number;
}

export function VendorCard({ vendor, index = 0 }: VendorCardProps) {
  return (
    <article className="card card-hover overflow-hidden flex flex-col h-full min-w-0">
      <div className={cn("h-20 shrink-0", coverClasses[index % coverClasses.length])} aria-hidden="true" />
      <div className="px-4 pb-4 flex flex-col flex-1 min-w-0">
        <div className={cn("-mt-7 w-14 h-14 shrink-0 rounded-full border-4 border-canvas grid place-items-center overflow-hidden font-head font-extrabold text-lg", avatarClasses[vendor.avatarTone])}>
          {vendor.logoUrl ? (
            <Image src={vendor.logoUrl} alt={`${vendor.name} logo`} width={48} height={48} className="size-12 object-cover" loading="lazy" />
          ) : <span aria-hidden="true">{vendor.initials}</span>}
        </div>
        <div className="mt-2 flex items-center gap-1 min-w-0">
          <h3 className="min-w-0 font-head font-bold text-base">
            <Link href={`/vendor/${vendor.slug}`} className="relative block truncate py-3 -my-3 hover:text-brand-strong" title={vendor.name}>
              {vendor.name}
            </Link>
          </h3>
          {vendor.verified && <BadgeCheck className="w-4 h-4 shrink-0 text-brand" role="img" aria-label="Verified vendor" />}
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-mute">
          <svg className="w-3.5 h-3.5 shrink-0 text-accent-strong" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="font-medium text-ink">{vendor.ratingAverage.toFixed(1)}</span>
          <span title={`${vendor.ratingCount.toLocaleString("en-US")} ratings`}>({compactNumber.format(vendor.ratingCount)})</span>
        </div>
        <div className="mt-1 flex items-center gap-1 min-w-0 text-xs text-mute">
          <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate" title={`${vendor.location} · ${vendor.productCount} products`}>{vendor.location} · {vendor.productCount} products</span>
        </div>
        <div className="mt-auto pt-4">
          <Link href={`/vendor/${vendor.slug}`} data-slug={vendor.slug} aria-label={`Visit ${vendor.name} store`} className="btn btn-outline btn-sm w-full relative after:absolute after:-inset-y-1 after:inset-x-0 after:rounded-full">
            Visit store
          </Link>
        </div>
      </div>
    </article>
  );
}
