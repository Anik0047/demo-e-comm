import { expect, test, type Locator, type Page } from "@playwright/test";

const mobileProject = (page: Page) => page.viewportSize()!.width < 1024;

async function openFilters(page: Page): Promise<Locator> {
  if (mobileProject(page)) await page.getByRole("button", { name: "Filters", exact: true }).click();
  return mobileProject(page)
    ? page.getByRole("dialog", { name: "Filters" })
    : page.getByRole("complementary", { name: "Product filters" });
}

function productCards(page: Page) {
  return page.getByRole("list", { name: "Products" }).locator(":scope > li[data-product-id]");
}

async function productIds(page: Page) {
  return productCards(page).evaluateAll((cards) => cards.map((card) => card.getAttribute("data-product-id")));
}

test("category and vendor filters update the URL, counts, and product identities", async ({ page }) => {
  await page.goto("/products");
  const filters = await openFilters(page);
  await filters.getByRole("combobox", { name: "Category", exact: true }).selectOption("fashion");
  if (mobileProject(page)) {
    await filters.getByRole("combobox", { name: "Vendor", exact: true }).selectOption("urban-fit");
    await filters.getByRole("button", { name: "Apply filters" }).click();
  } else {
    await expect(page).toHaveURL(/category=fashion/);
    await filters.getByRole("combobox", { name: "Vendor", exact: true }).selectOption("urban-fit");
  }
  await expect(page).toHaveURL(/category=fashion/);
  await expect(page).toHaveURL(/vendor=urban-fit/);
  await expect(page.getByRole("status")).toContainText(/of \d+ products/);
  const ids = await productIds(page);
  expect(ids).toEqual([
    "prod-cotton-panjabi",
    "prod-running-shoes",
    "prod-laptop-backpack",
    "prod-jamdani-cotton-saree",
    "prod-mens-oxford-shirt",
    "prod-womens-cotton-kurti",
  ]);
});

test("price bounds and stock filters change the actual product cards", async ({ page }) => {
  await page.goto("/products");
  const filters = await openFilters(page);
  await filters.getByLabel("Minimum price").fill("2450");
  await filters.getByLabel("Maximum price").fill("2450");
  if (mobileProject(page)) {
    await filters.getByRole("button", { name: "Apply filters" }).click();
  } else {
    await filters.getByRole("button", { name: "Apply price" }).click();
  }
  await expect(page).toHaveURL(/minPrice=2450/);
  await expect(page).toHaveURL(/maxPrice=2450/);
  await expect(productCards(page)).toHaveCount(1);
  await expect(productCards(page)).toHaveAttribute("data-product-id", "prod-wireless-earbuds-pro");

  await page.goto("/products?subcategory=home-appliances");
  const stockFilters = await openFilters(page);
  await stockFilters.getByRole("combobox", { name: "Availability" }).selectOption("out-of-stock");
  if (mobileProject(page)) await stockFilters.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/availability=out-of-stock/);
  await expect(productCards(page)).toHaveCount(1);
  await expect(productCards(page)).toHaveAttribute("data-product-id", "prod-double-door-refrigerator");
  await expect(productCards(page).getByText("Out of stock", { exact: true })).toBeVisible();
});

test("supported sort controls reorder the product cards", async ({ page }) => {
  await page.goto("/products");
  const sort = page.getByLabel("Sort by");
  await sort.selectOption("price-asc");
  await expect(page).toHaveURL(/sort=price-asc/);
  expect((await productIds(page)).slice(0, 4)).toEqual([
    "prod-hardcover-notebook-pack",
    "prod-butter-cookies-tin",
    "prod-bengali-short-story-collection",
    "prod-watercolor-paint-set",
  ]);
  await sort.selectOption("best-selling");
  await expect(page).toHaveURL(/sort=best-selling/);
  expect((await productIds(page)).slice(0, 3)).toEqual(["prod-basmati-rice-5kg", "prod-miniket-rice-5kg", "prod-power-bank-10000"]);
});

test("pagination keeps the active search and stock filters", async ({ page }) => {
  await page.goto("/products?search=a");
  const filters = await openFilters(page);
  await filters.getByRole("combobox", { name: "Availability" }).selectOption("in-stock");
  if (mobileProject(page)) await filters.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/search=a/);
  await expect(page).toHaveURL(/availability=in-stock/);
  const pageTwo = page.getByRole("navigation", { name: "Pagination" }).getByRole("link", { name: "Page 2" });
  await expect(pageTwo).toBeVisible();
  await pageTwo.click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page).toHaveURL(/search=a/);
  await expect(page).toHaveURL(/availability=in-stock/);
  await expect(page.getByRole("navigation", { name: "Pagination" }).getByRole("link", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
});

test("mobile filter Apply commits changes, while Cancel and close discard drafts and restore focus", async ({ page }) => {
  await page.goto("/products");
  const trigger = page.getByRole("button", { name: "Filters", exact: true });
  if (mobileProject(page)) {
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Filters" });
    await dialog.getByRole("combobox", { name: "Vendor", exact: true }).selectOption("urban-fit");
    await dialog.getByRole("button", { name: "Apply filters" }).click();
    await expect(page).toHaveURL(/vendor=urban-fit/);
    await expect(trigger).toBeFocused();

    await trigger.click();
    const cancelDialog = page.getByRole("dialog", { name: "Filters" });
    await cancelDialog.getByRole("combobox", { name: "Vendor", exact: true }).selectOption("sound-wave");
    await cancelDialog.getByRole("button", { name: "Cancel" }).click();
    await expect(page).toHaveURL(/vendor=urban-fit/);
    await expect(trigger).toBeFocused();

    await trigger.click();
    const closeDialog = page.getByRole("dialog", { name: "Filters" });
    await closeDialog.getByRole("combobox", { name: "Vendor", exact: true }).selectOption("sound-wave");
    await closeDialog.getByRole("button", { name: "Close filters" }).click();
    await expect(page).toHaveURL(/vendor=urban-fit/);
    await expect(trigger).toBeFocused();
  } else {
    await expect(trigger).toBeHidden();
    await expect(page.getByRole("dialog", { name: "Filters" })).toHaveCount(0);
  }
});

test("clear filters preserves unrelated search text and filtered cards", async ({ page }) => {
  await page.goto("/products?search=cotton");
  const filters = await openFilters(page);
  await filters.getByRole("combobox", { name: "Vendor", exact: true }).selectOption("home-nest");
  if (mobileProject(page)) await filters.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/search=cotton/);
  await expect(page).toHaveURL(/vendor=home-nest/);
  await expect(productCards(page)).toHaveCount(1);
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/search=cotton/);
  await expect(page).not.toHaveURL(/vendor=/);
  await expect(productCards(page)).toHaveCount(5);
});

test("combined filters show the correct empty count and empty state", async ({ page }) => {
  await page.goto("/products?search=zzqv-no-match-927&category=electronics&vendor=tech-haven&minPrice=90000&availability=in-stock&sort=price-desc");
  await expect(page.getByRole("heading", { name: "No products found" })).toBeVisible();
  await expect(page.getByText("0 products", { exact: true })).toBeVisible();
  await expect(productCards(page)).toHaveCount(0);
  await expect(page).toHaveURL(/search=zzqv-no-match-927/);
  await expect(page).toHaveURL(/category=electronics/);
  await expect(page).toHaveURL(/vendor=tech-haven/);
  await expect(page).toHaveURL(/minPrice=90000/);
  await expect(page).toHaveURL(/availability=in-stock/);
  await expect(page).toHaveURL(/sort=price-desc/);
});

test("corrected wearable and power bank categories follow their nested routes", async ({ page }) => {
  await page.goto("/category/electronics/wearables/smart-watches");
  await expect(page.getByRole("heading", { name: "Smart watches", exact: true })).toBeVisible();
  await expect(productCards(page)).toHaveCount(1);
  await expect(productCards(page)).toHaveAttribute("data-product-id", "prod-smart-watch-series-5");
  const watchBreadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(watchBreadcrumb.getByRole("link", { name: "Electronics", exact: true })).toHaveAttribute("href", "/category/electronics");
  await expect(watchBreadcrumb.getByRole("link", { name: "Wearables", exact: true })).toHaveAttribute("href", "/category/electronics/wearables");

  await page.goto("/category/electronics/mobile-accessories/power-banks");
  await expect(page.getByRole("heading", { name: "Power banks", exact: true })).toBeVisible();
  await expect(productCards(page)).toHaveCount(1);
  await expect(productCards(page)).toHaveAttribute("data-product-id", "prod-power-bank-10000");
  const powerBankBreadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(powerBankBreadcrumb.getByRole("link", { name: "Electronics", exact: true })).toHaveAttribute("href", "/category/electronics");
  await expect(powerBankBreadcrumb.getByRole("link", { name: "Mobile accessories", exact: true })).toHaveAttribute("href", "/category/electronics/mobile-accessories");

  await page.goto("/category/electronics/mobile-phones");
  await expect(page.getByRole("heading", { name: "Mobile Phones", exact: true })).toBeVisible();
  await expect(productCards(page).locator('[data-product-id="prod-smart-watch-series-5"]')).toHaveCount(0);
  await expect(productCards(page).locator('[data-product-id="prod-power-bank-10000"]')).toHaveCount(0);
});

test("corrected products remain searchable and their PDP category links resolve", async ({ page }) => {
  await page.goto("/products?search=Smart%20Watch%20Series%205");
  await expect(productCards(page)).toHaveCount(1);
  await expect(productCards(page)).toHaveAttribute("data-product-id", "prod-smart-watch-series-5");
  await page.getByRole("link", { name: "View Smart Watch Series 5" }).click();
  await expect(page).toHaveURL(/\/products\/smart-watch-series-5$/);
  await expect(page.getByRole("heading", { name: "Smart Watch Series 5", exact: true })).toBeVisible();
  const watchBreadcrumb = page.getByRole("navigation", { name: "Breadcrumb" }).last();
  await expect(watchBreadcrumb.getByRole("link", { name: "Smart watches", exact: true })).toHaveAttribute("href", "/category/electronics/wearables/smart-watches");

  await page.goto("/products?search=10000mAh%20Power%20Bank");
  await expect(productCards(page)).toHaveCount(1);
  await expect(productCards(page)).toHaveAttribute("data-product-id", "prod-power-bank-10000");
  await page.getByRole("link", { name: "View 10000mAh Power Bank" }).click();
  await expect(page).toHaveURL(/\/products\/power-bank-10000$/);
  await expect(page.getByRole("heading", { name: "10000mAh Power Bank", exact: true })).toBeVisible();
  const powerBankBreadcrumb = page.getByRole("navigation", { name: "Breadcrumb" }).last();
  await expect(powerBankBreadcrumb.getByRole("link", { name: "Power banks", exact: true })).toHaveAttribute("href", "/category/electronics/mobile-accessories/power-banks");
});

test("invalid nested category combinations return not found", async ({ page }) => {
  const response = await page.goto("/category/electronics/mobile-phones/power-banks");
  expect(response?.status()).toBe(404);
});
