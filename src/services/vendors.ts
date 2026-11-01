import { vendors } from "@/data/vendors";
import type { Vendor } from "@/types/vendor";

export async function getTopVendors(limit = 6): Promise<Vendor[]> {
  return vendors
    .filter((vendor) => vendor.status === "approved")
    .sort((a, b) => b.ratingAverage - a.ratingAverage || b.ratingCount - a.ratingCount)
    .slice(0, Math.max(0, limit));
}
