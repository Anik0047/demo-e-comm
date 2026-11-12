import { expect, test } from "@playwright/test";

function cardFor(page: import("@playwright/test").Page, name: string) {
  return page.locator("article").filter({ has: page.getByRole("link", { name: `View ${name}` }) }).first();
}

test("standard product cards show a minimal image, title, and price with wishlist access", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("link", { name: /My account: Demo Customer/ })).toBeVisible();
  const card = cardFor(page, "10000mAh Power Bank");
  await expect(card.getByRole("heading", { name: "10000mAh Power Bank" })).toBeVisible();
  await expect(card.getByText("৳1,590", { exact: true })).toBeVisible();
  await expect(card.locator("s")).toHaveCount(0);
  await expect(card.getByRole("button", { name: "Add 10000mAh Power Bank to cart" })).toHaveCount(0);
  await expect(card.getByRole("button", { name: "Compare 10000mAh Power Bank" })).toHaveCount(0);

  const wishlist = card.getByRole("button", { name: "Add 10000mAh Power Bank to wishlist" });
  await wishlist.click();
  await expect(card.getByRole("button", { name: "Remove 10000mAh Power Bank from wishlist" })).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/\/products$/);
});

test("card image remains square at mobile and desktop widths, and the card opens its canonical PDP", async ({ page }) => {
  await page.goto("/products");
  const card = cardFor(page, "Wireless Earbuds Pro");
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const imageBox = await card.locator(".aspect-square").boundingBox();
    expect(imageBox).not.toBeNull();
    expect(Math.abs((imageBox?.width ?? 0) - (imageBox?.height ?? 0))).toBeLessThanOrEqual(1);
    const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport);
  }
  await card.getByRole("link", { name: "View Wireless Earbuds Pro" }).click();
  await expect(page).toHaveURL(/\/products\/wireless-earbuds-pro$/);
  await expect(page.getByRole("button", { name: "Compare Wireless Earbuds Pro" })).toBeVisible();
});

test("genuine discounts show the original price and comparison is available on the PDP", async ({ page }) => {
  await page.goto("/");
  const discounted = cardFor(page, "Bluetooth Speaker");
  await expect(discounted.getByText("৳1,799", { exact: true })).toBeVisible();
  await expect(discounted.locator("s")).toBeVisible();
  await discounted.getByRole("link", { name: "View Bluetooth Speaker" }).click();
  await page.getByRole("button", { name: "Compare Bluetooth Speaker" }).click();
  await expect(page.getByRole("link", { name: "View comparison (1)" })).toBeVisible();
});
