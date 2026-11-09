import { navbarData } from "@/data/navbar";
import type { NavbarData } from "@/types/navigation";

export async function getNavbarData(): Promise<Omit<NavbarData, "categories" | "searchProducts" | "popularSearches">> {
  return navbarData;
}

