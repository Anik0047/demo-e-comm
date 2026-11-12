import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

interface StoredWishlistSnapshot {
  data: {
    wishlists: Array<{ customerId: string; productIds: string[] }>;
  };
}

async function readSavedWishlist(page: Page) {
  const raw = await page.evaluate(() => window.localStorage.getItem("kenakata:demo-state"));
  return JSON.parse(raw ?? "null") as StoredWishlistSnapshot | null;
}

async function waitForCustomerAccount(page: Page) {
  await expect(page.getByRole("link", { name: /My account: Demo Customer/ })).toBeVisible();
}

function navbarWishlist(page: Page, count: number | null) {
  const name = count === null ? "Wishlist" : `Wishlist, ${count} ${count === 1 ? "item" : "items"}`;
  return page.locator(`header a[aria-label="${name}"]`);
}

function cardFor(page: Page, productName: string) {
  return page.locator("article").filter({ has: page.getByRole("link", { name: `View ${productName}` }) }).first();
}

test("product card and PDP wishlist controls stay synchronized by product ID", async ({ page }) => {
  await page.goto("/");
  await waitForCustomerAccount(page);
  const card = cardFor(page, "Wireless Earbuds Pro");
  const cardHeart = card.getByRole("button", { name: "Add Wireless Earbuds Pro to wishlist" });
  await expect(cardHeart).toHaveAttribute("aria-pressed", "false");
  await cardHeart.click();
  await expect(card.getByRole("button", { name: "Remove Wireless Earbuds Pro from wishlist" })).toHaveAttribute("aria-pressed", "true");

  await page.goto("/products/wireless-earbuds-pro");
  const pdpHeart = page.getByRole("button", { name: "Remove Wireless Earbuds Pro from wishlist" });
  await expect(pdpHeart).toHaveAttribute("aria-pressed", "true");
  await pdpHeart.click();
  await expect(page.getByRole("button", { name: "Add Wireless Earbuds Pro to wishlist" })).toHaveAttribute("aria-pressed", "false");
  await page.goto("/");
  await expect(cardFor(page, "Wireless Earbuds Pro").getByRole("button", { name: "Add Wireless Earbuds Pro to wishlist" })).toHaveAttribute("aria-pressed", "false");
});

test("PDP wishlist identity stays product-scoped when selecting variants", async ({ page }) => {
  await page.goto("/products/cotton-panjabi");
  await waitForCustomerAccount(page);
  await page.getByRole("button", { name: "Add Cotton Panjabi to wishlist" }).click();
  await expect(page.getByRole("button", { name: "Remove Cotton Panjabi from wishlist" })).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Size").selectOption("M");
  await expect(page.getByRole("button", { name: "Remove Cotton Panjabi from wishlist" })).toHaveAttribute("aria-pressed", "true");

  const wishlist = await readSavedWishlist(page);
  expect(wishlist?.data.wishlists.find(({ customerId }) => customerId === "customer-demo")?.productIds).toEqual(["prod-cotton-panjabi"]);
});

test("wishlist membership survives navigation and a page refresh", async ({ page }) => {
  await page.goto("/products/bluetooth-speaker");
  await waitForCustomerAccount(page);
  await page.getByRole("button", { name: "Add Bluetooth Speaker to wishlist" }).click();
  await expect(page.getByRole("button", { name: "Remove Bluetooth Speaker from wishlist" })).toHaveAttribute("aria-pressed", "true");
  await page.goto("/");
  await expect(cardFor(page, "Bluetooth Speaker").getByRole("button", { name: "Remove Bluetooth Speaker from wishlist" })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(cardFor(page, "Bluetooth Speaker").getByRole("button", { name: "Remove Bluetooth Speaker from wishlist" })).toHaveAttribute("aria-pressed", "true");
  const wishlist = await readSavedWishlist(page);
  expect(wishlist?.data.wishlists.find(({ customerId }) => customerId === "customer-demo")?.productIds).toContain("prod-bluetooth-speaker");
});

test("admin and vendor accounts cannot modify wishlists from product cards", async ({ page }) => {
  await page.goto("/");
  await waitForCustomerAccount(page);
  const card = cardFor(page, "Wireless Earbuds Pro");
  const heart = card.getByRole("button", { name: "Add Wireless Earbuds Pro to wishlist" });
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Admin Admin demo account" }).click();
  await page.goto("/");
  await expect(heart).toHaveAttribute("aria-pressed", "false");
  await expect(heart).toBeDisabled();

  await page.goto("/login");
  await page.getByRole("button", { name: "TechHaven seller Vendor demo account" }).click();
  await page.goto("/");
  await expect(card.getByRole("button", { name: "Add Wireless Earbuds Pro to wishlist" })).toBeDisabled();
  const wishlist = await readSavedWishlist(page);
  expect(wishlist?.data.wishlists.find(({ customerId }) => customerId === "customer-demo")?.productIds).toEqual([]);
});

test("out-of-stock products can be wishlisted and remain marked unavailable for purchase", async ({ page }) => {
  await page.goto("/products/double-door-refrigerator");
  await waitForCustomerAccount(page);
  const productName = "255L Frost-free Double-door Refrigerator";
  const addToWishlist = page.getByRole("button", { name: `Add ${productName} to wishlist` });
  await addToWishlist.click();
  const removeFromWishlist = page.getByRole("button", { name: `Remove ${productName} from wishlist` });
  await expect(removeFromWishlist).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("status").getByText(`${productName} added to your wishlist.`, { exact: true })).toBeVisible();
  await page.goto("/wishlist");
  const items = page.getByRole("list", { name: "Wishlist items" });
  await expect(items.getByText("Out of stock for purchase", { exact: true })).toBeVisible();
  await expect(items.getByRole("link", { name: "View product details" })).toHaveAttribute("href", "/products/double-door-refrigerator");
  await items.getByRole("button", { name: `Remove ${productName} from wishlist` }).click();
  await expect(page.getByRole("heading", { name: "Your wishlist is empty" })).toBeVisible();
});

test("navbar wishlist count updates live from product cards and the PDP", async ({ page }) => {
  await page.goto("/");
  await waitForCustomerAccount(page);
  await expect(navbarWishlist(page, 0)).toBeVisible();

  const earbudsCard = cardFor(page, "Wireless Earbuds Pro");
  await earbudsCard.getByRole("button", { name: "Add Wireless Earbuds Pro to wishlist" }).click();
  await expect(navbarWishlist(page, 1)).toBeVisible();

  await page.goto("/products/wireless-earbuds-pro");
  await expect(navbarWishlist(page, 1)).toBeVisible();
  await page.getByRole("button", { name: "Remove Wireless Earbuds Pro from wishlist" }).click();
  await expect(navbarWishlist(page, 0)).toBeVisible();
});

test("navbar wishlist count survives refresh", async ({ page }) => {
  await page.goto("/products/bluetooth-speaker");
  await waitForCustomerAccount(page);
  await expect(navbarWishlist(page, 0)).toBeVisible();
  await page.getByRole("button", { name: "Add Bluetooth Speaker to wishlist" }).click();
  await expect(navbarWishlist(page, 1)).toBeVisible();
  await page.reload();
  await waitForCustomerAccount(page);
  await expect(navbarWishlist(page, 1)).toBeVisible();
});

test("navbar wishlist count is isolated by customer account", async ({ page }) => {
  await page.goto("/");
  await waitForCustomerAccount(page);
  await cardFor(page, "Wireless Earbuds Pro").getByRole("button", { name: "Add Wireless Earbuds Pro to wishlist" }).click();
  await cardFor(page, "Bluetooth Speaker").getByRole("button", { name: "Add Bluetooth Speaker to wishlist" }).click();
  await expect(navbarWishlist(page, 2)).toBeVisible();

  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Admin Admin demo account" }).click();
  await page.goto("/");
  await expect(navbarWishlist(page, null)).toBeVisible();
  await expect(page.getByRole("link", { name: /Wishlist, \d+ items?/ })).toHaveCount(0);

  await page.goto("/login");
  await page.getByRole("button", { name: "TechHaven seller Vendor demo account" }).click();
  await page.goto("/");
  await expect(navbarWishlist(page, null)).toBeVisible();
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Customer Customer demo account" }).click();
  await page.goto("/");
  await expect(navbarWishlist(page, 2)).toBeVisible();
});

test("navbar hides its count until hydration and then shows the empty customer count", async ({ page }) => {
  const response = await page.goto("/");
  const serverMarkup = await response?.text();
  expect(serverMarkup).toContain('aria-label="Wishlist"');
  expect(serverMarkup).not.toContain('aria-label="Wishlist, 2 items"');

  await waitForCustomerAccount(page);
  await expect(navbarWishlist(page, 0)).toBeVisible();
});

test("navbar wishlist navigation opens customer products and removal clears the list", async ({ page }) => {
  await page.goto("/products/wireless-earbuds-pro");
  await waitForCustomerAccount(page);
  await page.getByRole("button", { name: "Add Wireless Earbuds Pro to wishlist" }).click();
  await page.getByRole("link", { name: "Wishlist, 1 item", exact: true }).click();

  await expect(page).toHaveURL(/\/wishlist$/);
  await expect(page.getByRole("heading", { name: "Your wishlist" })).toBeVisible();
  const items = page.getByRole("list", { name: "Wishlist items" });
  await expect(items.getByText("Wireless Earbuds Pro", { exact: true })).toBeVisible();
  await expect(items.getByText("৳3,770", { exact: true })).toBeVisible();
  await expect(items.getByRole("link", { name: "View product details" })).toHaveAttribute("href", "/products/wireless-earbuds-pro");

  await items.getByRole("button", { name: "Remove Wireless Earbuds Pro from wishlist" }).click();
  await expect(page.getByRole("status").getByText("Wireless Earbuds Pro removed from your wishlist.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your wishlist is empty" })).toBeVisible();
  await expect(navbarWishlist(page, 0)).toBeVisible();
});

test("empty wishlist offers product browsing and remains empty after refresh", async ({ page }) => {
  await page.goto("/wishlist");
  await waitForCustomerAccount(page);
  await expect(page.getByRole("heading", { name: "Your wishlist is empty" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse products" })).toHaveAttribute("href", "/products");
  await expect(navbarWishlist(page, 0)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Your wishlist is empty" })).toBeVisible();
});

test("wishlist adds available simple products to cart and routes variant products to their options", async ({ page }) => {
  await page.goto("/products/bluetooth-speaker");
  await page.getByRole("button", { name: "Add Bluetooth Speaker to wishlist" }).click();
  await page.goto("/wishlist");
  await page.getByRole("button", { name: "Add Bluetooth Speaker to cart" }).click();
  await expect(page.getByRole("status").getByText("Bluetooth Speaker added to your cart.", { exact: true })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null") as {
    data: { carts: Array<{ customerId: string; items: Array<{ productId: string }> }> };
  });
  expect(saved.data.carts.find(({ customerId }) => customerId === "customer-demo")?.items).toContainEqual(expect.objectContaining({ productId: "prod-bluetooth-speaker" }));

  await page.goto("/products/cotton-panjabi");
  await page.getByRole("button", { name: "Add Cotton Panjabi to wishlist" }).click();
  await page.goto("/wishlist");
  await page.getByRole("button", { name: "Add Cotton Panjabi to cart" }).click();
  await expect(page).toHaveURL("/products/cotton-panjabi");
  await expect(page.getByLabel("Size")).toBeVisible();
});

test("admin and vendor accounts cannot view customer wishlist contents", async ({ page }) => {
  await page.goto("/products/bluetooth-speaker");
  await waitForCustomerAccount(page);
  await page.getByRole("button", { name: "Add Bluetooth Speaker to wishlist" }).click();
  await page.getByRole("link", { name: "Wishlist, 1 item", exact: true }).click();
  await expect(page.getByRole("list", { name: "Wishlist items" }).getByText("Bluetooth Speaker", { exact: true })).toBeVisible();

  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Admin Admin demo account" }).click();
  await page.goto("/wishlist");
  await expect(page.getByRole("heading", { name: "Your wishlist is private" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Wishlist items" })).toHaveCount(0);

  await page.goto("/login");
  await page.getByRole("button", { name: "TechHaven seller Vendor demo account" }).click();
  await page.goto("/wishlist");
  await expect(page.getByRole("heading", { name: "Your wishlist is private" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Wishlist items" })).toHaveCount(0);
  await expect(navbarWishlist(page, null)).toBeVisible();
});
