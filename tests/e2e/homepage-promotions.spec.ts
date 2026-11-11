import { expect, test } from "@playwright/test";

test("hero flash deal CTA opens the active promotion listing", async ({ page }) => {
  await page.goto("/");

  const hero = page.locator("#hero");
  const cta = hero.getByRole("link", { name: "Shop flash deals" });
  await expect(cta).toHaveAttribute("href", "/products?promotion=flash-deals");
  await cta.click();

  await expect(page).toHaveURL(/\/products\?promotion=flash-deals$/);
  await expect(page.getByRole("heading", { level: 1, name: "Flash deals" })).toBeVisible();
  await expect(page.getByText("Flash deal prices are shown below, alongside regular prices.")).toBeVisible();
  const products = page.getByRole("list", { name: "Products" });
  await expect(products.getByRole("link", { name: "View Wireless Earbuds Pro" })).toBeVisible();
  await expect(products.getByText("৳2,450", { exact: true })).toBeVisible();
});

test("flash deal card price matches its product page", async ({ page }) => {
  await page.goto("/");

  const deals = page.locator('section[aria-labelledby="fd-title"]');
  const earbuds = deals.locator("article").filter({ has: page.getByRole("link", { name: "View Wireless Earbuds Pro" }) });
  await expect(earbuds.getByText("৳2,450", { exact: true })).toBeVisible();
  await expect(earbuds.getByText("৳3,770", { exact: true })).toBeVisible();
  await earbuds.getByRole("link", { name: "View Wireless Earbuds Pro" }).click();

  await expect(page).toHaveURL(/\/products\/wireless-earbuds-pro$/);
  await expect(page.getByRole("heading", { level: 1, name: "Wireless Earbuds Pro" })).toBeVisible();
  await expect(page.getByText("Price: ৳2,450", { exact: true })).toBeVisible();
});

test("homepage category shortcuts open canonical listings with eligible products", async ({ page }) => {
  await page.goto("/");

  const categories = page.locator('section[aria-labelledby="cat-title"]');
  const electronics = categories.getByRole("link", { name: "Electronics", exact: true });
  await expect(electronics).toHaveAttribute("href", "/category/electronics");
  await electronics.click();

  await expect(page).toHaveURL(/\/category\/electronics$/);
  await expect(page.getByRole("heading", { level: 1, name: "Electronics" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Wireless Earbuds Pro" })).toBeVisible();
});

test("promotional banners use valid storefront destinations", async ({ page }) => {
  await page.goto("/");

  const promotions = page.getByRole("region", { name: "Promotions" });
  const home = promotions.getByRole("link", { name: "Shop home" });
  await expect(home).toHaveAttribute("href", "/category/home-living");
  await home.click();

  await expect(page).toHaveURL(/\/category\/home-living$/);
  await expect(page.getByRole("heading", { level: 1, name: "Home & living" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Non-stick Cookware Set" })).toBeVisible();
});

test("homepage remains within the viewport and has no placeholder or dashboard links", async ({ page }) => {
  await page.goto("/");

  for (const width of [360, 375, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 780 });
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      overflowingElements: Array.from(document.body.querySelectorAll<HTMLElement>("*"))
        .flatMap((element) => {
          const rect = element.getBoundingClientRect();
          if (rect.width === 0 || rect.right <= document.documentElement.clientWidth + 0.5) return [];
          let ancestor = element.parentElement;
          while (ancestor && ancestor !== document.body) {
            if (["auto", "clip", "hidden", "scroll"].includes(getComputedStyle(ancestor).overflowX)) return [];
            ancestor = ancestor.parentElement;
          }
          const identity = `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${typeof element.className === "string" && element.className.trim() ? `.${element.className.trim().split(/\s+/u).join(".")}` : ""}`;
          return [{ identity: identity.slice(0, 180), left: Math.round(rect.left * 10) / 10, right: Math.round(rect.right * 10) / 10, width: Math.round(rect.width * 10) / 10 }];
        }).slice(0, 12),
    }));
    expect(dimensions.document, `horizontal overflow at ${width}px; elements beyond viewport: ${JSON.stringify(dimensions.overflowingElements)}`).toBeLessThanOrEqual(dimensions.viewport);
  }

  const mainLinks = await page.locator("main a").evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).getAttribute("href")));
  expect(mainLinks.every((href) => href !== "#" && href !== null)).toBe(true);
  expect(mainLinks.some((href) => href?.startsWith("/admin") || /^\/vendor\/[^/]+\/dashboard(?:\/|$)/.test(href ?? ""))).toBe(false);
  await expect(page.getByRole("link", { name: "Shop groceries" })).toHaveAttribute("href", "/category/groceries");
});
