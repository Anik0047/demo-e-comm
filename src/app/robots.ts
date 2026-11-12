import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kenakata.com";
  return {
    // Keep noindex routes crawlable so crawlers can read their robots metadata.
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
