import type { Metadata } from "next";
import type { RawListingQuery } from "@/types/catalog";

export function canonicalMetadata(path: string, noindex = false): Metadata {
  return {
    alternates: { canonical: path },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export async function listingMetadata(
  title: string,
  description: string,
  path: string,
  searchParams?: Promise<RawListingQuery>,
): Promise<Metadata> {
  const query = searchParams ? await searchParams : undefined;
  const hasQuery = Boolean(query && (query instanceof URLSearchParams ? query.size > 0 : Object.values(query).some((value) => value !== undefined)));
  return {
    title,
    description,
    ...canonicalMetadata(path, hasQuery),
    ...(hasQuery ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, type: "website", url: path },
    twitter: { card: "summary", title, description },
  };
}

export function jsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function absoluteSiteUrl(path: string): string {
  return new URL(path, process.env.NEXT_PUBLIC_SITE_URL || "https://kenakata.com").toString();
}
