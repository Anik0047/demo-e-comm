import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProductDetails } from "@/services/product-details";

export async function proxy(request: NextRequest) {
  let slug: string;
  try {
    slug = decodeURIComponent(request.nextUrl.pathname.slice("/products/".length));
  } catch {
    return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
  }

  // Reject missing products before the parent loading boundary starts streaming.
  if (!await getProductDetails(slug)) {
    return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/products/:slug",
};
