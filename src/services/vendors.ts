import { vendors } from "@/data/vendors";
import type { Vendor } from "@/types/vendor";

export function getPublicVendorBySlug(slug: string, records: readonly Vendor[] = vendors): Vendor | null {
  return records.find((vendor) => vendor.slug === slug && vendor.status === "approved") ?? null;
}

export async function getTopVendors(limit = 6): Promise<Vendor[]> {
  return vendors
    .filter((vendor) => vendor.status === "approved")
    .sort((a, b) => b.ratingAverage - a.ratingAverage || b.ratingCount - a.ratingCount)
    .slice(0, Math.max(0, limit));
}

export function getPublicVendors(): Vendor[] {
  return vendors.filter((vendor) => vendor.status === "approved");
}
