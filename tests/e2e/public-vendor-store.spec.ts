import { expect, test, type Locator, type Page } from "@playwright/test";

const mobileProject = (page: Page) => page.viewportSize()!.width < 1024;

function productCards(page: Page): Locator {
  return page.getByRole("list", { name: "Products" }).locator(":scope > li[data-product-id]");
}

async function productIds(page: Page): Promise<(string | null)[]> {
  const cards = productCards(page);
  await expect(cards.first()).toBeVisible();
  return cards.evaluateAll((items) => items.map((card) => card.getAttribute("data-product-id")));
}

async function openFilters(page: Page): Promise<Locator> {
  if (mobileProject(page)) await page.getByRole("button", { name: "Filters", exact: true }).click();
  return mobileProject(page)
    ? page.getByRole("dialog", { name: "Filters" })
    : page.getByRole("complementary", { name: "Product filters" });
}

test("public TechHaven store shows only its active catalog and opens canonical products", async ({ page }) => {
  const response = await page.goto("/vendor/tech-haven");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "TechHaven", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Products from TechHaven" })).toBeVisible();
  expect(await productIds(page)).toEqual([
    "prod-wireless-earbuds-pro",
    "prod-smart-watch-series-5",
    "prod-wireless-gaming-mouse",
    "prod-power-bank-10000",
    "prod-gaming-laptop-15",
  ]);
  const earbudsCard = productCards(page).filter({ has: page.getByRole("link", { name: "View Wireless Earbuds Pro" }) });
  await expect(earbudsCard.getByRole("button", { name: "Add Wireless Earbuds Pro to wishlist" })).toBeVisible();
  await productCards(page).getByRole("link", { name: "View Wireless Earbuds Pro" }).click();
  await expect(page).toHaveURL(/\/products\/wireless-earbuds-pro$/);
  await expect(page.getByRole("link", { name: "TechHaven", exact: true })).toHaveAttribute("href", "/vendor/tech-haven");
});

test("vendor store filters and sorts stay scoped, and vendor query cannot change route identity", async ({ page }) => {
  await page.goto("/vendor/tech-haven?vendor=urban-fit&search=earbuds");
  await expect(page).toHaveURL(/\/vendor\/tech-haven\?search=earbuds$/);
  await expect(productCards(page)).toHaveCount(1);
  await expect(productCards(page)).toHaveAttribute("data-product-id", "prod-wireless-earbuds-pro");
  await expect(page.getByRole("combobox", { name: "Vendor", exact: true })).toHaveCount(0);

  await page.goto("/vendor/tech-haven");
  const filters = await openFilters(page);
  await filters.getByRole("combobox", { name: "Category", exact: true }).selectOption("electronics");
  if (mobileProject(page)) await filters.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/category=electronics/);
  expect(await productIds(page)).toEqual([
    "prod-wireless-earbuds-pro",
    "prod-smart-watch-series-5",
    "prod-wireless-gaming-mouse",
    "prod-power-bank-10000",
    "prod-gaming-laptop-15",
  ]);
  await page.getByLabel("Sort by").selectOption("price-asc");
  await expect(page).toHaveURL(/sort=price-asc/);
  expect(await productIds(page)).toEqual([
    "prod-wireless-gaming-mouse",
    "prod-power-bank-10000",
    "prod-wireless-earbuds-pro",
    "prod-smart-watch-series-5",
    "prod-gaming-laptop-15",
  ]);

  await page.goto("/vendor/tech-haven?minPrice=1000&maxPrice=2000&availability=in-stock");
  await expect(productCards(page)).toHaveCount(2);
  expect(await productIds(page)).toEqual(["prod-wireless-gaming-mouse", "prod-power-bank-10000"]);
});

test("out-of-stock products remain visible in the owning public store", async ({ page }) => {
  await page.goto("/vendor/dhaka-bazaar?availability=out-of-stock");
  expect(await productIds(page)).toEqual(["prod-double-door-refrigerator"]);
  await expect(productCards(page).getByText("Out of stock", { exact: true })).toBeVisible();
  await expect(productCards(page).getByRole("link", { name: "View 255L Frost-free Double-door Refrigerator" })).toHaveAttribute("href", "/products/double-door-refrigerator");
});

test("vendor store empty search can be reset without leaving the store", async ({ page }) => {
  await page.goto("/vendor/tech-haven?search=zzqv-no-match-927");
  await expect(page.getByRole("heading", { name: "No products found" })).toBeVisible();
  await expect(productCards(page)).toHaveCount(0);
  const listingSearch = page.getByRole("search").filter({ has: page.getByPlaceholder("Search products") });
  await listingSearch.getByPlaceholder("Search products").fill("");
  await listingSearch.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL("/vendor/tech-haven");
  await expect(page.getByRole("heading", { level: 1, name: "TechHaven", exact: true })).toBeVisible();
  await expect(productCards(page)).toHaveCount(5);
});

test("store navigation supports Back, Forward, refresh, and keeps the dashboard route separate", async ({ page }) => {
  await page.goto("/vendor/tech-haven");
  await productCards(page).getByRole("link", { name: "View Wireless Earbuds Pro" }).click();
  await expect(page).toHaveURL(/\/products\/wireless-earbuds-pro$/);
  await page.getByRole("link", { name: "TechHaven", exact: true }).click();
  await expect(page).toHaveURL("/vendor/tech-haven");
  await page.goBack();
  await expect(page).toHaveURL(/\/products\/wireless-earbuds-pro$/);
  await page.goForward();
  await expect(page).toHaveURL("/vendor/tech-haven");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "TechHaven", exact: true })).toBeVisible();

  await page.goto("/vendor/tech-haven/dashboard");
  await expect(page.getByRole("heading", { name: /vendor dashboard/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "TechHaven", exact: true })).toHaveCount(0);
});

test("vendor storefront cards retain wishlist access and canonical product navigation", async ({ page }) => {
  const missing = await page.goto("/vendor/this-store-does-not-exist");
  expect([200, 404]).toContain(missing?.status());
  await expect(page.getByRole("heading", { name: "Store not found" })).toBeVisible();

  await page.goto("/vendor/tech-haven");
  await expect(productCards(page)).toHaveCount(5);
  const earbuds = productCards(page).filter({ has: page.getByRole("link", { name: "View Wireless Earbuds Pro" }) });
  await expect(earbuds.getByRole("button", { name: "Add Wireless Earbuds Pro to cart" })).toHaveCount(0);
  await expect(earbuds.getByRole("button", { name: "Compare Wireless Earbuds Pro" })).toHaveCount(0);
  const wishlist = earbuds.getByRole("button", { name: "Add Wireless Earbuds Pro to wishlist" });
  await wishlist.click();
  await expect(earbuds.getByRole("button", { name: "Remove Wireless Earbuds Pro from wishlist" })).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/\/vendor\/tech-haven$/);
  await earbuds.getByRole("link", { name: "View Wireless Earbuds Pro" }).click();
  await expect(page).toHaveURL(/\/products\/wireless-earbuds-pro$/);
  await expect(page.getByRole("button", { name: "Compare Wireless Earbuds Pro" })).toBeVisible();
});

test("public store has no horizontal overflow at the active desktop or mobile viewport", async ({ page }) => {
  await page.goto("/vendor/tech-haven");
  await expect(page.getByRole("heading", { level: 1, name: "TechHaven", exact: true })).toBeVisible();
  for (const width of [360, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 });
    const dimensions = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  }
});
