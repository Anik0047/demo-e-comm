import Link from "next/link";
import type { Vendor, VendorAvatarTone } from "@/types/vendor";
import { CouponTile } from "./coupon-tile";

interface PromoTilesProps {
  vendors: Vendor[];
}

const avatarClasses: Record<VendorAvatarTone, string> = {
  brand: "bg-brand-strong text-white", accent: "bg-accent text-ink", sky: "bg-info-strong text-white", ink: "bg-ink text-white",
  "info-ink": "bg-info-ink text-white", sale: "bg-sale-strong text-white", "brand-strong": "bg-brand-strong text-white", "accent-strong": "bg-accent-strong text-ink",
};

export function PromoTiles({ vendors }: PromoTilesProps) {
  return (
    <div className="min-w-0 lg:col-span-4 xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
      <CouponTile />
      <div className="rounded-2xl bg-soft p-5 flex flex-col justify-between">
        <div>
          <p className="text-xs font-bold text-brand-strong">This week</p>
          <p className="font-head font-extrabold text-xl leading-snug mt-1">
            Top-rated vendors
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex -space-x-2">
            {vendors.map((vendor) => (
              <span
                key={vendor.id}
                className={`w-9 h-9 rounded-full ${avatarClasses[vendor.avatarTone]} text-xs font-bold grid place-items-center border-2 border-soft`}
              >
                {vendor.initials}
              </span>
            ))}
          </div>
          <Link
            href="/products"
            className="text-sm font-bold text-brand-strong hover:underline"
          >
            Browse products →
          </Link>
        </div>
      </div>
    </div>
  );
}

