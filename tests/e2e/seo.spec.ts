import { expect, test } from "@playwright/test";

async function expectCanonical(page: import("@playwright/test").Page, path: string) {
  await expect.poll(async () => new URL(await page.locator('link[rel="canonical"]').getAttribute("href") || "", "http://localhost").pathname).toBe(path);
}

test("public storefront routes render distinct titles, descriptions, canonical URLs and social metadata", async ({ page }) => {
  const cases = [
    ["/", "/", /marketplace demo/i],
    ["/products", "/products", /sample products/i],
    ["/categories", "/categories", /product categories/i],
    ["/category/electronics", "/category/electronics", /electronics products/i],
    ["/products/wireless-earbuds-pro", "/products/wireless-earbuds-pro", /wireless earbuds/i],
    ["/vendor/tech-haven", "/vendor/tech-haven", /Gadgets and accessories/i],
    ["/info/about-us", "/info/about-us", /frontend concept/i],
  ] as const;
  const titles = new Set<string>();
  for (const [route, canonical, description] of cases) {
    await page.goto(route);
    const title = await page.title();
    titles.add(title);
    expect(title).not.toMatch(/Kenakata.*Kenakata/i);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", description);
    await expectCanonical(page, canonical);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /.+/);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", /.+/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", /summary/);
  }
  expect(titles.size).toBe(cases.length);
});

test("listing query variants stay navigable but are canonicalized and noindexed", async ({ page }) => {
  await page.goto("/products?search=earbuds&sort=price-asc&page=2");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/);
  await expectCanonical(page, "/products");
  await expect(page.getByRole("search").filter({ has: page.getByPlaceholder("Search products") })).toBeVisible();
});

test("transactional and account routes are noindex", async ({ page }) => {
  for (const route of ["/cart", "/checkout", "/compare", "/wishlist", "/login", "/account"]) {
    await page.goto(route);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
});

test("product structured data uses catalog facts without invented offers or ratings", async ({ page }) => {
  await page.goto("/products/wireless-earbuds-pro");
  const product = await page.locator('script[type="application/ld+json"]').evaluate((node) => JSON.parse(node.textContent || "{}"));
  expect(product).toMatchObject({ "@type": "Product", name: "Wireless Earbuds Pro", sku: "SKU-WIRELESS-EARBUDS-PRO" });
  expect(product).not.toHaveProperty("offers");
  expect(product).not.toHaveProperty("aggregateRating");
  expect(product.url).toMatch(/\/products\/wireless-earbuds-pro$/);
});

test("robots and sitemap expose public canonical routes while excluding private and placeholder routes", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  const robotsBody = await robots.text();
  expect(robotsBody).toContain("Sitemap:");
  expect(robotsBody).toContain("Allow: /");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const xml = await sitemap.text();
  expect(xml).toContain("/products/wireless-earbuds-pro");
  expect(xml).toContain("/category/electronics");
  expect(xml).toContain("/vendor/tech-haven");
  expect(xml).not.toContain("/cart");
  expect(xml).not.toContain("/account");
  expect(xml).not.toContain("/checkout");
  expect(xml).not.toContain("/info/blog");
});

test("unknown product and vendor routes do not render indexable detail pages", async ({ page }) => {
  for (const route of ["/products/no-such-product-seo-audit", "/vendor/no-such-vendor-seo-audit", "/category/no-such-category-seo-audit"]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(404);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
});
