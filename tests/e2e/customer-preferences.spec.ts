import { expect, test, type Page } from "@playwright/test";

interface GridMeasurement {
  columns: number;
  cardWidth: number;
  gridWidth: number;
  viewportWidth: number;
  pageWidth: number;
}

async function measureGrid(page: Page): Promise<GridMeasurement> {
  return page.getByRole("list", { name: "Products" }).evaluate((grid) => {
    const card = grid.querySelector<HTMLElement>("[data-product-id]");
    if (!card) throw new Error("The product grid has no rendered cards.");
    return {
      columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
      cardWidth: card.getBoundingClientRect().width,
      gridWidth: grid.getBoundingClientRect().width,
      viewportWidth: document.documentElement.clientWidth,
      pageWidth: document.documentElement.scrollWidth,
    };
  });
}

async function saveDensity(page: Page, density: "standard" | "compact") {
  await page.goto("/account/preferences");
  await expect(page.getByRole("heading", { name: "Account preferences" })).toBeVisible();
  await page.getByRole("radio", { name: density === "standard" ? "Standard grid" : "Compact grid" }).check();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("status")).toHaveText("Preferences saved in this browser.");
}

test("standard and compact settings change rendered desktop grid density", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  await saveDensity(page, "standard");
  await page.goto("/products");
  const standard = await measureGrid(page);
  expect(standard.columns).toBe(4);
  expect(standard.pageWidth).toBeLessThanOrEqual(standard.viewportWidth);
  await page.screenshot({ path: "test-results/grid-density/standard-desktop.png", fullPage: true });

  await saveDensity(page, "compact");
  await page.goto("/products");
  const compact = await measureGrid(page);
  expect(compact.columns).toBe(5);
  expect(compact.pageWidth).toBeLessThanOrEqual(compact.viewportWidth);
  expect(compact.columns > standard.columns || compact.cardWidth < standard.cardWidth).toBe(true);
  await page.screenshot({ path: "test-results/grid-density/compact-desktop.png", fullPage: true });

  console.info(`Grid density at 1280px: standard ${standard.columns} columns / ${standard.cardWidth.toFixed(1)}px cards; compact ${compact.columns} columns / ${compact.cardWidth.toFixed(1)}px cards.`);

  await page.reload();
  expect(await measureGrid(page)).toMatchObject({ columns: compact.columns, cardWidth: compact.cardWidth });
});

test("both grid modes stay readable and avoid horizontal overflow on tablet and mobile", async ({ page }) => {
  for (const width of [768, 360]) {
    await page.setViewportSize({ width, height: 850 });
    for (const density of ["standard", "compact"] as const) {
      await saveDensity(page, density);
      await page.goto("/products");
      const measurement = await measureGrid(page);
      expect(measurement.columns).toBe(width === 360 ? 2 : 3);
      expect(measurement.cardWidth).toBeGreaterThanOrEqual(width === 360 ? 140 : 180);
      expect(measurement.pageWidth).toBeLessThanOrEqual(measurement.viewportWidth);
      console.info(`Grid density at ${width}px: ${density} ${measurement.columns} columns / ${measurement.cardWidth.toFixed(1)}px cards.`);
    }
  }
});

test("promotional updates opt-in and opt-out persist independently", async ({ page }) => {
  await page.goto("/account/preferences");
  const promotions = page.getByRole("checkbox", { name: /Opt in to promotional updates/ });
  await expect(promotions).not.toBeChecked();
  await promotions.check();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("status")).toHaveText("Preferences saved in this browser.");
  await page.reload();
  await expect(page.getByRole("checkbox", { name: /Opt in to promotional updates/ })).toBeChecked();

  await page.getByRole("checkbox", { name: /Opt in to promotional updates/ }).uncheck();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("status")).toHaveText("Preferences saved in this browser.");
  await page.reload();
  await expect(page.getByRole("checkbox", { name: /Opt in to promotional updates/ })).not.toBeChecked();
});

test("failed preference persistence exposes accessible error feedback", async ({ page }) => {
  await page.goto("/account/preferences");
  await page.getByRole("radio", { name: "Compact grid" }).check();
  await page.evaluate(() => {
    Object.defineProperty(window.localStorage, "setItem", {
      configurable: true,
      value: () => { throw new DOMException("Storage unavailable", "QuotaExceededError"); },
    });
  });
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Preferences couldn’t be saved" })).toHaveText("Preferences couldn’t be saved because browser storage is unavailable. Your saved choices are unchanged.");
});

test("grid and promotional choices persist independently for each customer account", async ({ page }) => {
  await page.goto("/account");
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null");
    const now = new Date().toISOString();
    state.data.accounts.push({ id: "account-customer-second", email: "second@example.test", displayName: "Second Customer", role: "customer", customerId: "customer-second", vendorId: null, createdAt: now });
    state.data.customers.push({ id: "customer-second", accountId: "account-customer-second", fullName: "Second Customer", phone: "00000000001", addresses: [], preferences: { promotionalUpdates: false, productGridDensity: "standard" }, hiddenOrderIds: [], recentlyViewedProductIds: [], createdAt: now, updatedAt: now });
    state.data.carts.push({ id: "cart-customer-second", customerId: "customer-second", items: [], updatedAt: now });
    state.data.wishlists.push({ id: "wishlist-customer-second", customerId: "customer-second", productIds: [], updatedAt: now });
    localStorage.setItem("kenakata:demo-state", JSON.stringify(state));
    sessionStorage.setItem("kenakata:demo-account-id", "account-customer-second");
  });
  await page.reload();
  await saveDensity(page, "compact");
  await page.goto("/products");
  await expect(page.getByRole("list", { name: "Products" })).toHaveAttribute("data-density", "compact");

  await page.evaluate(() => sessionStorage.setItem("kenakata:demo-account-id", "account-customer-demo"));
  await page.reload();
  await page.goto("/products");
  await expect(page.getByRole("list", { name: "Products" })).toHaveAttribute("data-density", "standard");

  await page.evaluate(() => sessionStorage.setItem("kenakata:demo-account-id", "account-customer-second"));
  await page.reload();
  await page.goto("/products");
  await expect(page.getByRole("list", { name: "Products" })).toHaveAttribute("data-density", "compact");
});

test("non-customer demo roles cannot access customer preferences", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Admin Admin demo account" }).click();
  await page.goto("/account/preferences");
  await expect(page.getByRole("heading", { name: "Customer account required" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Account preferences" })).toHaveCount(0);
});
