import { expect, test } from "@playwright/test";

test("desktop primary links and category mega menu navigate to canonical listings", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const header = page.getByRole("banner");
  await header.getByRole("link", { name: "Kenakata home" }).click();
  await expect(page).toHaveURL("/");

  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  await nav.getByRole("link", { name: "Products", exact: true }).click();
  await expect(page).toHaveURL("/products");
  await expect(page.getByRole("heading", { name: "All products" })).toBeVisible();

  const categoryTrigger = nav.getByRole("button", { name: "All categories" });
  await categoryTrigger.click();
  await expect(categoryTrigger).toHaveAttribute("aria-expanded", "true");
  const megaMenu = nav.locator("#category-mega-menu");
  const rootCategories = megaMenu.getByRole("list", { name: "Main categories" });
  await rootCategories.getByRole("link", { name: "Electronics", exact: true }).click();
  await expect(page).toHaveURL("/category/electronics");
  await expect(page.getByRole("heading", { name: "Electronics" })).toBeVisible();
  await expect(megaMenu).toBeHidden();
});

test("desktop nested category links open the expected child listing and route state follows history", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/products");
  await page.goto("/category/electronics/wearables/smart-watches");
  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  const trigger = nav.getByRole("button", { name: "All categories" });
  await trigger.focus();
  const megaMenu = nav.locator("#category-mega-menu");
  const rootCategories = megaMenu.getByRole("list", { name: "Main categories" });
  await expect(rootCategories.getByRole("link", { name: "Electronics", exact: true })).toHaveAttribute("aria-current", "location");
  await expect(page.getByRole("heading", { name: "Smart watches" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL("/products");
  await expect(nav.getByRole("link", { name: "Products", exact: true })).toHaveAttribute("aria-current", "page");
  await page.goForward();
  await expect(page).toHaveURL("/category/electronics/wearables/smart-watches");
  await expect(page.getByRole("heading", { name: "Smart watches" })).toBeVisible();
  await trigger.click();
  await expect(rootCategories.getByRole("link", { name: "Electronics", exact: true })).toHaveAttribute("aria-current", "location");
  await page.goto("/category/electronics/wearables/smart-watches");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Smart watches" })).toBeVisible();
});

test("mobile drawer exposes controls, expands canonical categories, and closes after navigation", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Open menu" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const drawer = page.getByRole("dialog", { name: "Mobile navigation" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Products", exact: true })).toHaveAttribute("href", "/products");
  await expect(drawer.getByRole("link", { name: "Wishlist", exact: true })).toHaveAttribute("href", "/wishlist");
  await expect(drawer.getByRole("link", { name: "Cart", exact: true })).toHaveAttribute("href", "/cart");

  await drawer.getByRole("button", { name: "Show Electronics subcategories" }).click();
  await expect(drawer.getByRole("button", { name: "Hide Electronics subcategories" })).toHaveAttribute("aria-expanded", "true");
  await drawer.getByRole("link", { name: "Smart watches", exact: true }).click();
  await expect(page).toHaveURL("/category/electronics/wearables/smart-watches");
  await expect(page.getByRole("heading", { name: "Smart watches" })).toBeVisible();
  await expect(drawer).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("mobile drawer closes on Escape and restores trigger focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Open menu" });
  await trigger.click();
  const drawer = page.getByRole("dialog", { name: "Mobile navigation" });
  await expect(drawer).toBeVisible();
  const closeButton = drawer.getByRole("button", { name: "Close menu" });
  const closeButtonBox = await closeButton.boundingBox();
  expect(closeButtonBox?.width).toBeGreaterThanOrEqual(44);
  expect(closeButtonBox?.height).toBeGreaterThanOrEqual(44);
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("mobile header controls remain available and key widths do not overflow", async ({ page }) => {
  for (const width of [360, 375, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/");
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: "Kenakata home" })).toBeVisible();
    await expect(header.getByRole("link", { name: /Wishlist/ })).toHaveAttribute("href", "/wishlist");
    await expect(header.getByRole("link", { name: /Cart,/ })).toHaveAttribute("href", "/cart");
    const accountLink = header.getByRole("link", { name: /My account:|Account:|Login/ });
    await expect(accountLink).toHaveAttribute("href", "/account");
    await expect(header.getByRole("combobox", { name: "Search products" })).toBeVisible();
    if (width < 1024) {
      await expect(header.getByRole("button", { name: "Open menu" })).toBeVisible();
    } else {
      await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Products", exact: true })).toBeVisible();
    }
    const widthState = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(widthState.scroll).toBeLessThanOrEqual(widthState.client);
  }

});

test("mobile navigation state stays closed across browser route changes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Open menu" });
  await trigger.click();
  const drawer = page.getByRole("dialog", { name: "Mobile navigation" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("link", { name: "Products", exact: true }).click();
  await expect(page).toHaveURL("/products");
  await expect(drawer).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(drawer).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL("/");
  await expect(drawer).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await page.goForward();
  await expect(page).toHaveURL("/products");
  await expect(drawer).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("navigation does not emit nonexistent category routes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  await nav.getByRole("button", { name: "All categories" }).click();
  const hrefs = await nav.locator("#category-mega-menu a").evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) expect(href).toMatch(/^\/category\/(electronics|fashion|home-living|beauty-health|groceries|mother-baby|sports-outdoor|books-stationery)(\/[^/?#]+){0,2}$/);
  expect(hrefs).not.toContain(null);

  // This request-time validation is inside a Suspense boundary. Next.js may
  // stream the shell with HTTP 200, so assert the rendered not-found boundary.
  await page.goto("/category/not-a-canonical-category");
  await expect(page.getByText("This page could not be found.", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Product catalog" })).toHaveCount(0);
  await expect(page.locator('main section[aria-label$=" products"]')).toHaveCount(0);

});
