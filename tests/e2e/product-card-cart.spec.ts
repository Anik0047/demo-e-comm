import { expect, test } from "@playwright/test";

function cardFor(page: import("@playwright/test").Page, name: string) {
  return page.locator("article").filter({ has: page.getByRole("link", { name: `View ${name}` }) }).first();
}

test("wishlist success feedback dismisses after three seconds and repeated actions restart it", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /My account: Demo Customer/ })).toBeVisible();
  const heart = cardFor(page, "Wireless Earbuds Pro").getByRole("button", { name: /Wireless Earbuds Pro.*wishlist/ });
  await heart.click();
  const feedback = page.getByRole("status").getByText("Wireless Earbuds Pro added to your wishlist.", { exact: true });
  await expect(feedback).toBeVisible();
  await page.waitForTimeout(2200);
  await heart.click();
  await expect(page.getByRole("status").getByText("Wireless Earbuds Pro removed from your wishlist.", { exact: true })).toBeVisible();
  await page.waitForTimeout(1200);
  await expect(page.getByRole("status").getByText("Wireless Earbuds Pro removed from your wishlist.", { exact: true })).toBeVisible();
  await expect(page.getByRole("status").getByText("Wireless Earbuds Pro removed from your wishlist.", { exact: true })).toHaveCount(0, { timeout: 2500 });
});

test("product cards add eligible products and synchronize navbar and cart", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /My account: Demo Customer/ })).toBeVisible();
  const card = cardFor(page, "Wireless Earbuds Pro");
  await card.getByRole("button", { name: "Add Wireless Earbuds Pro to cart" }).click();
  await expect(card.getByRole("status").getByText("Wireless Earbuds Pro added to your cart.", { exact: true })).toBeVisible();
  await expect(page.locator("header").getByRole("link", { name: /Cart, 1 item/ })).toBeVisible();
  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Your cart" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Cart items" }).getByText("Wireless Earbuds Pro", { exact: true })).toBeVisible();
});

test("variant products route to PDP and unavailable products report an error", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /My account: Demo Customer/ })).toBeVisible();
  const variantCard = cardFor(page, "Cotton Panjabi");
  await variantCard.getByRole("button", { name: "Add Cotton Panjabi to cart" }).click();
  await expect(page).toHaveURL(/\/products\/cotton-panjabi$/);
  await expect(page.getByLabel("Size")).toBeVisible();

  await page.goto("/products?availability=out-of-stock");
  const unavailableCard = cardFor(page, "255L Frost-free Double-door Refrigerator");
  await unavailableCard.getByRole("button", { name: "Add 255L Frost-free Double-door Refrigerator to cart" }).click();
  await expect(unavailableCard.getByRole("alert").getByText("This product is currently unavailable for purchase.", { exact: true })).toBeVisible();
});

test("non-customer accounts cannot add card products", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /My account: Demo Customer/ })).toBeVisible();
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Admin Admin demo account" }).click();
  await page.goto("/");
  const card = cardFor(page, "Wireless Earbuds Pro");
  await expect(card.getByRole("button", { name: "Add Wireless Earbuds Pro to cart" })).toBeDisabled();
});
