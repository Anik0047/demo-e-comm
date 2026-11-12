import type { MetadataRoute } from "next";
import { getProductDetailSlugs, getProductDetails } from "@/services/product-details";
import { getPublicVendors } from "@/services/vendors";
import { getCatalogProducts } from "@/services/catalog";
import { getPublicInfoPages } from "@/services/public-info-pages";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://kenakata.com").replace(/\/$/, "");
  const paths = new Set(["/", "/products", "/categories"]);
  const slugs = await getProductDetailSlugs();
  for (const slug of slugs) {
    const details = await getProductDetails(slug);
    if (!details) continue;
    paths.add(`/products/${details.product.slug}`);
    paths.add(`/vendor/${details.vendor.slug}`);
    for (let depth = 1; depth <= details.categoryPath.length; depth += 1) {
      paths.add(`/category/${details.categoryPath.slice(0, depth).map(({ slug: categorySlug }) => categorySlug).join("/")}`);
    }
  }
  const [publicVendors, catalogProducts] = [getPublicVendors(), getCatalogProducts()];
  for (const vendor of publicVendors) {
    if (catalogProducts.some((product) => product.vendorId === vendor.id && product.status === "active")) {
      paths.add(`/vendor/${vendor.slug}`);
    }
  }
  const nonIndexableInfo = new Set(["blog", "careers", "gift-cards"]);
  for (const page of getPublicInfoPages()) {
    if (!nonIndexableInfo.has(page.slug)) paths.add(`/info/${page.slug}`);
  }
  return [...paths].sort().map((path) => ({ url: new URL(path, siteUrl).toString() }));
}
