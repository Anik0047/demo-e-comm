import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const viewportWidths = [320, 360, 390, 768, 1024, 1280, 1440];
const storefrontRoutes = [
  "/",
  "/categories",
  "/products",
  "/products?search=cotton",
  "/category/electronics",
  "/category/electronics/wearables/smart-watches",
  "/vendor/tech-haven",
  "/products/cotton-panjabi",
  "/compare",
  "/cart",
  "/wishlist",
  "/checkout",
  "/order-confirmation/not-a-saved-order",
  "/account",
  "/account/orders",
  "/account/reviews",
  "/account/recently-viewed",
  "/account/profile",
  "/account/addresses",
  "/account/preferences",
];

test.describe("customer storefront responsive layout", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Viewport matrix uses explicit widths in Chromium.");
  });

  test("routes fit the requested viewport matrix without page-level horizontal overflow", async ({ page }) => {
    test.setTimeout(60_000);
    for (const width of viewportWidths) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of storefrontRoutes) {
        await page.goto(route);
        await expect(page.locator("main").first(), `${route} at ${width}px`).toBeVisible();
        const dimensions = await page.evaluate(() => ({
          viewportWidth: document.documentElement.clientWidth,
          documentWidth: document.documentElement.scrollWidth,
        }));
        expect(dimensions.documentWidth, `${route} at ${width}px`).toBeLessThanOrEqual(dimensions.viewportWidth);
      }
    }
  });

  test("listing cards retain square media, a top-right wishlist action, and readable content", async ({ page }) => {
    const screenshotDirectory = join(process.cwd(), "test-results", "responsive-qa");
    await mkdir(screenshotDirectory, { recursive: true });
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/products");
      const card = page.getByRole("list", { name: "Products" }).locator("article").first();
      const media = card.locator(":scope > a > div").first();
      const mediaBox = await media.boundingBox();
      const cardBox = await card.boundingBox();
      const heart = card.getByRole("button", { name: /wishlist/i });
      const heartBox = await heart.boundingBox();
      expect(mediaBox).not.toBeNull();
      expect(cardBox).not.toBeNull();
      expect(heartBox).not.toBeNull();
      expect(Math.abs((mediaBox?.width ?? 0) - (mediaBox?.height ?? 0))).toBeLessThanOrEqual(1);
      expect((heartBox?.x ?? 0) + (heartBox?.width ?? 0)).toBeLessThanOrEqual((cardBox?.x ?? 0) + (cardBox?.width ?? 0) + 1);
      expect(heartBox?.y ?? Infinity).toBeLessThanOrEqual((mediaBox?.y ?? -Infinity) + 48);
      await expect(card.locator("h3")).toBeVisible();
      await expect(card.getByText(/৳/).first()).toBeVisible();
      if (width === 320 || width === 1440) {
        await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
        await page.screenshot({ path: join(screenshotDirectory, `product-listing-${width}.png`), fullPage: false, animations: "disabled" });
        await expect(page).toHaveScreenshot(`product-listing-${width}.png`, { fullPage: false, animations: "disabled" });
      }
    }
  });

  test("comparison scroll stays inside its labeled table region", async ({ page }) => {
    await page.addInitScript(() => {
      window.sessionStorage.setItem("kenakata-product-comparison-v1", JSON.stringify([
        "prod-bluetooth-speaker",
        "prod-wireless-earbuds-pro",
        "prod-cotton-panjabi",
      ]));
    });

    for (const width of viewportWidths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/compare");
      const region = page.getByRole("region", { name: "Product comparison table" });
      await expect(region).toBeVisible();
      const dimensions = await page.evaluate(() => {
        const regionElement = document.querySelector<HTMLElement>("[aria-label='Product comparison table']");
        return {
          viewportWidth: document.documentElement.clientWidth,
          documentWidth: document.documentElement.scrollWidth,
          regionWidth: regionElement?.clientWidth ?? 0,
          regionScrollWidth: regionElement?.scrollWidth ?? 0,
        };
      });
      expect(dimensions.documentWidth, `compare page at ${width}px`).toBeLessThanOrEqual(dimensions.viewportWidth);
      if (width <= 768) {
        expect(dimensions.regionScrollWidth, `comparison table at ${width}px`).toBeGreaterThan(dimensions.regionWidth);
      } else {
        expect(dimensions.regionScrollWidth, `comparison table at ${width}px`).toBeLessThanOrEqual(dimensions.regionWidth);
      }
    }
  });

  test("homepage and PDP keep key actions within the viewport at desktop and mobile widths", async ({ page }) => {
    for (const [width, route] of [[320, "/"], [390, "/products/cotton-panjabi"], [1440, "/products/cotton-panjabi"]] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      const dimensions = await page.evaluate(() => ({
        viewportWidth: document.documentElement.clientWidth,
        documentWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.documentWidth, `${route} at ${width}px`).toBeLessThanOrEqual(dimensions.viewportWidth);
      if (route.startsWith("/products/")) {
        const title = page.getByRole("heading", { level: 1 });
        await expect(title).toBeVisible();
        const actions = page.getByRole("group", { name: "Product actions" });
        await expect(actions.getByRole("button", { name: /wishlist/i })).toBeVisible();
        await expect(actions.getByRole("button", { name: /compare/i })).toBeVisible();
        const gallery = page.getByRole("region", { name: /images$/i }).first();
        await expect(gallery).toBeVisible();
        if (width === 390) {
          const variant = page.getByLabel("Size");
          await expect(variant).toBeVisible();
          const variantBox = await variant.boundingBox();
          expect(variantBox).not.toBeNull();
          expect((variantBox?.x ?? 0) + (variantBox?.width ?? 0)).toBeLessThanOrEqual(width);
        }
      }
    }
  });

  test("mobile navigation, search suggestions, filter dialog, gallery viewer, and feedback fit", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto("/");
    const carousel = page.locator("#hero");
    await expect(carousel).toBeVisible();
    await carousel.getByRole("button", { name: "Pause slideshow" }).click();
    await carousel.getByRole("button", { name: "Go to slide 2" }).click();
    await expect(carousel.getByRole("group", { name: "2 of 4" })).toBeVisible();
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("dialog", { name: "Mobile navigation" })).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Mobile navigation" }).getByRole("link", { name: "Electronics", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Close menu" }).click();

    const search = page.getByPlaceholder("Search Kenakata");
    await search.fill("cotton");
    const suggestions = page.getByRole("listbox", { name: "Search suggestions" });
    await expect(suggestions).toBeVisible();
    const suggestionBox = await suggestions.boundingBox();
    expect(suggestionBox).not.toBeNull();
    expect(suggestionBox?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((suggestionBox?.x ?? 0) + (suggestionBox?.width ?? 0)).toBeLessThanOrEqual(320);

    await page.goto("/products");
    const firstCard = page.getByRole("list", { name: "Products" }).locator("article").first();
    const wishlistButton = firstCard.getByRole("button", { name: /wishlist/i });
    const wishlistLabel = await wishlistButton.getAttribute("aria-label");
    const productName = wishlistLabel?.replace(/^Add /u, "").replace(/ to wishlist$/u, "") ?? "Product";
    await wishlistButton.click();
    await expect(page.getByRole("status").getByText(`${productName} added to your wishlist.`, { exact: true })).toBeVisible();
    const toast = page.getByRole("status").filter({ hasText: `${productName} added to your wishlist.` });
    const toastBox = await toast.boundingBox();
    expect(toastBox).not.toBeNull();
    expect(toastBox?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((toastBox?.x ?? 0) + (toastBox?.width ?? 0)).toBeLessThanOrEqual(320);
    await page.getByRole("button", { name: /filters/i }).click();
    const filterDialog = page.getByRole("dialog", { name: "Filters" });
    await expect(filterDialog).toBeVisible();
    const filterBox = await filterDialog.boundingBox();
    expect(filterBox).not.toBeNull();
    expect(filterBox?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((filterBox?.x ?? 0) + (filterBox?.width ?? 0)).toBeLessThanOrEqual(320);
    await page.getByRole("button", { name: "Close filters" }).click();

    await page.goto("/products/bluetooth-speaker");
    await page.getByRole("button", { name: /Enlarge image 1 of/i }).click();
    const imageDialog = page.getByRole("dialog", { name: /image viewer/i });
    await expect(imageDialog).toBeVisible();
    const viewerBox = await imageDialog.boundingBox();
    expect(viewerBox).not.toBeNull();
    expect(viewerBox?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((viewerBox?.x ?? 0) + (viewerBox?.width ?? 0)).toBeLessThanOrEqual(320);

    await page.goto("/");
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();
    const footerWidth = await footer.evaluate((element) => ({ client: element.clientWidth, scroll: element.scrollWidth }));
    expect(footerWidth.scroll).toBeLessThanOrEqual(footerWidth.client);
  });
});
