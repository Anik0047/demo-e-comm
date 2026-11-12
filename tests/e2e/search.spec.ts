import { expect, test, type Page } from "@playwright/test";

function navbarSearch(page: Page) {
  return page.getByRole("combobox", { name: "Search products" }).filter({ visible: true });
}

function searchSuggestions(page: Page) {
  return page.getByRole("listbox", { name: "Search suggestions" }).filter({ visible: true }).getByRole("option");
}

function searchSuggestion(page: Page, name: string) {
  return page.getByRole("listbox", { name: "Search suggestions" }).filter({ visible: true }).getByRole("option", { name, exact: true });
}

test("product suggestions open the matching PDP on desktop and mobile", async ({ page }) => {
  await page.goto("/");
  const search = navbarSearch(page);
  await search.fill("wireless earbuds");
  const suggestion = searchSuggestions(page).filter({ hasText: "Wireless Earbuds Pro" }).first();
  await expect(suggestion).toBeVisible();
  await suggestion.click();
  await expect(page).toHaveURL(/\/products\/wireless-earbuds-pro$/);
  await expect(page.getByRole("heading", { name: "Wireless Earbuds Pro" })).toBeVisible();
});

test("keyboard navigation selects suggestions, submits queries, and Escape dismisses", async ({ page }) => {
  await page.goto("/");
  const search = navbarSearch(page);
  await search.fill("wireless earbuds");
  const options = searchSuggestions(page);
  await expect(options.first()).toBeVisible();
  await search.press("ArrowDown");
  await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");
  await search.press("ArrowDown");
  await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
  await search.press("ArrowUp");
  await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/products\/wireless-earbuds-pro$/);

  await page.goto("/");
  const querySearch = navbarSearch(page);
  await querySearch.fill("  cOtToN   panjabi  ");
  await querySearch.press("Escape");
  await expect(page.getByRole("listbox", { name: "Search suggestions" }).filter({ visible: true })).toHaveCount(0);
  await expect(querySearch).toBeFocused();
  await querySearch.press("Enter");
  await expect.poll(() => new URL(page.url()).searchParams.get("search")).toBe("cOtToN panjabi");
  await expect(page.getByRole("heading", { name: /Search results for “cOtToN panjabi”/ })).toBeVisible();
  // The mixed-case query still matches the canonical title, proving search is case-insensitive.
  await expect(page.getByRole("link", { name: "View Cotton Panjabi" })).toBeVisible();
});

test("search button submits, empty and whitespace input omit search, unknown terms announce no matches", async ({ page }) => {
  await page.goto("/");
  const search = navbarSearch(page);
  await search.fill("bluetooth speaker");
  await page.getByRole("button", { name: "Search", exact: true }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/products\?search=bluetooth\+speaker$/);
  await expect(page.getByRole("link", { name: "View Bluetooth Speaker" })).toBeVisible();

  await page.goto("/");
  await navbarSearch(page).fill("   ");
  await page.getByRole("button", { name: "Search", exact: true }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByRole("heading", { name: "All products" })).toBeVisible();

  await page.goto("/");
  const liveSearch = navbarSearch(page);
  await liveSearch.fill("zzqv-no-such-product-9281");
  await expect(page.getByRole("status").filter({ hasText: "No matching suggestions" })).toBeVisible();
  await liveSearch.fill("bluetooth speaker");
  await expect(searchSuggestion(page, "Bluetooth Speaker Audio & headphones")).toBeVisible();
  await expect(searchSuggestion(page, "View all results for “bluetooth speaker”")).toBeVisible();
  await expect(searchSuggestions(page).filter({ hasText: "zzqv-no-such-product" })).toHaveCount(0);
  await liveSearch.fill("");
  await expect(page.getByRole("listbox", { name: "Popular searches" })).toBeVisible();

  await liveSearch.fill("zzqv-no-such-product-9281");
  await liveSearch.press("Enter");
  await expect(page).toHaveURL(/search=zzqv-no-such-product-9281/);
  await expect(page.getByRole("heading", { name: /Search results for/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No products found" })).toBeVisible();

  await page.goto("/");
  await navbarSearch(page).fill("special &+ term");
  await navbarSearch(page).press("Enter");
  await expect.poll(() => new URL(page.url()).searchParams.get("search")).toBe("special &+ term");
});

test("search URL is refreshable, history navigates, and sorting retains the query", async ({ page }) => {
  await page.goto("/products?search=wireless%20earbuds");
  await expect(page.getByRole("heading", { name: /Search results for “wireless earbuds”/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: "View Wireless Earbuds Pro" })).toBeVisible();

  await page.goto("/products");
  const search = navbarSearch(page);
  await search.fill("wireless earbuds");
  await search.locator("xpath=ancestor::form").getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/search=wireless\+earbuds/);
  await page.goBack();
  await expect(page).toHaveURL(/\/products$/);
  await page.goForward();
  await expect(page).toHaveURL(/search=wireless\+earbuds/);
  await page.locator("main select").last().selectOption("price-asc");
  await expect(page).toHaveURL(/search=wireless\+earbuds.*sort=price-asc|sort=price-asc.*search=wireless\+earbuds/);
});

test("search remains applied when availability, sorting, and pagination change", async ({ page }) => {
  await page.goto("/products?search=a");
  if (test.info().project.name === "chromium-mobile") {
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    const filters = page.getByRole("dialog", { name: "Filters" });
    await filters.getByLabel("Availability").selectOption("in-stock");
    await filters.getByRole("button", { name: "Apply filters" }).click();
  } else {
    const filters = page.getByRole("complementary", { name: "Product filters" });
    await filters.getByLabel("Availability").selectOption("in-stock");
  }
  await expect(page).toHaveURL(/search=a.*availability=in-stock|availability=in-stock.*search=a/);
  await page.locator("main select").last().selectOption("price-desc");
  await expect(page).toHaveURL(/search=a.*sort=price-desc|sort=price-desc.*search=a/);

  const pageTwo = page.getByRole("navigation", { name: "Pagination" }).getByRole("link", { name: "Page 2" });
  await expect(pageTwo).toBeVisible();
  await pageTwo.click();
  await expect(page).toHaveURL(/search=a.*page=2|page=2.*search=a/);
  await expect(page.getByRole("navigation", { name: "Pagination" }).getByRole("link", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
});
