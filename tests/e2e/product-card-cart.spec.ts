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

test("wishlist heart stays at the image top-right with responsive image proportions", async ({ page }) => {
  await page.goto("/products");
  const card = cardFor(page, "Wireless Earbuds Pro");
  const image = card.locator("a > div").first();
  const wishlist = card.getByRole("button", { name: "Add Wireless Earbuds Pro to wishlist" });
  for (const width of [360, 768, 1280] as const) {
    await page.setViewportSize({ width, height: 900 });
    const imageBox = await image.boundingBox();
    const heartBox = await wishlist.boundingBox();
    expect(imageBox).not.toBeNull();
    expect(heartBox).not.toBeNull();
    expect(Math.abs((imageBox?.width ?? 0) - (imageBox?.height ?? 0))).toBeLessThanOrEqual(1);
    expect((heartBox?.x ?? 0) + (heartBox?.width ?? 0)).toBeLessThanOrEqual((imageBox?.x ?? 0) + (imageBox?.width ?? 0) - 4);
    expect((heartBox?.y ?? 0)).toBeGreaterThanOrEqual(imageBox?.y ?? 0);
    expect(Math.abs((heartBox?.y ?? 0) - ((imageBox?.y ?? 0) + 8))).toBeLessThanOrEqual(1);
    const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport);
  }
});

test("card toast feedback is announced without changing card layout", async ({ page }) => {
  await page.goto("/products");
  const card = cardFor(page, "Wireless Earbuds Pro");
  const title = card.getByRole("heading", { name: "Wireless Earbuds Pro" });
  const titleBefore = await title.boundingBox();
  await card.getByRole("button", { name: "Add Wireless Earbuds Pro to wishlist" }).click();
  await expect(page.getByRole("status").getByText("Wireless Earbuds Pro added to your wishlist.")).toBeVisible();
  const titleAfter = await title.boundingBox();
  expect(titleAfter?.y).toBe(titleBefore?.y);
  await expect(page.getByRole("button", { name: "Dismiss notification" })).toBeVisible();
});

test("non-customer demo roles get wishlist guidance without changing customer data", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Admin Admin demo account" }).click();
  await page.goto("/products");

  const card = cardFor(page, "Wireless Earbuds Pro");
  const wishlist = card.getByRole("button", { name: "Add Wireless Earbuds Pro to wishlist" });
  await expect(wishlist).toBeEnabled();
  await wishlist.click();
  await expect(page.getByRole("status").getByText("Switch to a customer demo account to save products to your wishlist.")).toBeVisible();

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null") as {
    data: { wishlists: Array<{ customerId: string; productIds: string[] }> };
  });
  expect(stored.data.wishlists.find(({ customerId }) => customerId === "customer-demo")?.productIds).not.toContain("prod-wireless-earbuds-pro");
});

test("product card opens its canonical PDP", async ({ page }) => {
  await page.goto("/products");
  const card = cardFor(page, "Wireless Earbuds Pro");
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
  await expect(page.getByRole("link", { name: "View comparison with 1 product" })).toBeVisible();
});
