import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProductDetails } from "@/services/product-details";

const notFoundRoute = "/product-not-found-internal";

export async function proxy(request: NextRequest) {
  let slug: string;

  try {
    slug = decodeURIComponent(request.nextUrl.pathname.slice("/products/".length));
  } catch {
    return notFoundResponse(request);
  }

  if (await getProductDetails(slug)) return NextResponse.next();

  // App Router navigations need a page response so the client can render the
  // custom not-found UI. Document requests get the actual HTTP 404 directly.
  if (request.headers.get("RSC") === "1") {
    return NextResponse.rewrite(new URL(notFoundRoute, request.url));
  }

  return notFoundResponse(request);
}

function notFoundResponse(request: NextRequest) {
  const isRsc = request.headers.get("RSC") === "1";
  if (isRsc) return NextResponse.rewrite(new URL(notFoundRoute, request.url));

  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>Product not found | Kenakata</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; background: #fff; color: #0f172a; font-family: Arial, sans-serif; }
      header, main { width: min(100% - 32px, 1280px); margin: 0 auto; }
      header { display: flex; align-items: center; min-height: 72px; border-bottom: 1px solid #e5e7eb; }
      .brand { color: #0f172a; font-size: 20px; font-weight: 800; letter-spacing: -0.06em; text-decoration: none; }
      .brand span { color: #047857; }
      main { padding: 48px 0; }
      .message { max-width: 640px; padding: 32px; border: 1px solid #e5e7eb; border-radius: 16px; }
      h1 { margin: 0; font-size: clamp(28px, 5vw, 36px); line-height: 1.2; }
      p { margin: 16px 0 0; color: #64748b; line-height: 1.6; }
      .action { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; margin-top: 24px; padding: 0 20px; border-radius: 9999px; background: #047857; color: #fff; font-weight: 700; text-decoration: none; }
      .action:hover { background: #064e3b; }
      .action:focus-visible, .brand:focus-visible { outline: 3px solid #059669; outline-offset: 3px; }
      @media (max-width: 480px) { .message { padding: 24px; } }
    </style>
  </head>
  <body>
    <header><a class="brand" href="/" aria-label="Kenakata home">Kena<span>kata</span></a></header>
    <main>
      <section class="message" aria-labelledby="not-found-title">
        <h1 id="not-found-title">Product not found</h1>
        <p>This product is unavailable. Browse the catalog to find something else.</p>
        <a class="action" href="/products">Browse products</a>
      </section>
    </main>
  </body>
</html>`,
    {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    },
  );
}

export const config = {
  matcher: "/products/:slug",
};
