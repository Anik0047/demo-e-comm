import Link from "next/link";
import type { Vendor } from "@/types/banner";
import { CouponTile } from "./coupon-tile";

interface PromoTilesProps {
  vendors: Vendor[];
}

export function PromoTiles({ vendors }: PromoTilesProps) {
  return (
    <div className="lg:col-span-4 xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
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
                className={`w-9 h-9 rounded-full ${vendor.colorClasses} text-xs font-bold grid place-items-center border-2 border-soft`}
              >
                {vendor.initials}
              </span>
            ))}
          </div>
          <Link
            href="#"
            className="text-sm font-bold text-brand-strong hover:underline"
          >
            View all →
          </Link>
        </div>
      </div>
    </div>
  );
}

