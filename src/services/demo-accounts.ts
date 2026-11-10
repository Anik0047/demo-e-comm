import { vendors } from "@/data/vendors";

export function getDemoAccountDestination(role: "customer" | "vendor" | "admin", vendorId: string | null): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "vendor") {
    const slug = vendors.find((vendor) => vendor.id === vendorId)?.slug;
    return slug ? `/vendor/${slug}/dashboard` : "/vendor/dashboard";
  }
  return "/";
}
