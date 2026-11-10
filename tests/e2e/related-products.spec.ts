import { expect, test } from "@playwright/test";

const relatedSection = (page: import("@playwright/test").Page) => page.getByRole("region", { name: "Related Products" });

test("PDP recommendations exclude the current product, link to PDPs, and support back navigation", async ({ page }) => {
  await page.goto("/products/wireless-earbuds-pro");
  const section = relatedSection(page);
  await expect(section).toBeVisible();
  await expect(section.getByRole("heading", { name: "Related Products", level: 2 })).toBeVisible();
  await expect(section.getByRole("link", { name: "View Wireless Earbuds Pro" })).toHaveCount(0);

  const links = section.getByRole("link", { name: /^View / });
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    const href = await links.nth(index).getAttribute("href");
    expect(href).toMatch(/^\/products\/[\w-]+$/);
  }

  const targetHref = await links.first().getAttribute("href");
  const targetLabel = await links.first().getAttribute("aria-label");
  expect(targetHref).toBeTruthy();
  expect(targetLabel).toMatch(/^View .+/);
  const targetName = targetLabel?.slice("View ".length) ?? "";
  await links.first().click();
  await expect(page).toHaveURL(new RegExp(`${targetHref}$`));
  const targetHeading = page.getByRole("heading", { level: 1, name: targetName, exact: true });
  await expect(targetHeading).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Wireless Earbuds Pro", exact: true })).not.toBeVisible();
  const destinationSection = relatedSection(page);
  await expect(destinationSection).toBeVisible();
  await expect(destinationSection.getByRole("link", { name: `View ${targetName}` })).toHaveCount(0);

  await page.goBack();
  await expect(page).toHaveURL(/\/products\/wireless-earbuds-pro$/);
  await expect(page.getByRole("heading", { level: 1, name: "Wireless Earbuds Pro", exact: true })).toBeVisible();
  await expect(targetHeading).not.toBeVisible();
  const restoredSection = relatedSection(page);
  await expect(restoredSection).toBeVisible();
  await expect(restoredSection.getByRole("link", { name: "View Wireless Earbuds Pro" })).toHaveCount(0);
});

test("related product cards use the PDP effective flash deal price", async ({ page }) => {
  await page.goto("/products/wireless-earbuds-pro");
  const section = relatedSection(page);
  const headphones = section.locator("article").first();
  const headphonesLink = headphones.getByRole("link", { name: "View Noise-isolating Over-ear Headphones" });
  await expect(headphonesLink).toHaveAttribute("href", "/products/over-ear-headphones");
  await expect(headphones).toContainText("৳2,790");
  await expect(headphones).toContainText("৳3,250");
  await headphonesLink.click();
  const productDetails = page.getByRole("article", { name: "Noise-isolating Over-ear Headphones" });
  await expect(productDetails.getByText("Price: ৳2,790", { exact: true })).toBeVisible();
  await expect(productDetails.getByText("Original price: ৳3,250", { exact: true })).toBeVisible();
});

test("variant recommendations keep variant selection required for purchase", async ({ page }) => {
  await page.goto("/products/womens-cotton-kurti");
  const section = relatedSection(page);
  const panjabiLink = section.getByRole("link", { name: "View Cotton Panjabi" });
  await expect(panjabiLink).toBeVisible();
  await panjabiLink.click();
  await expect(page).toHaveURL(/\/products\/cotton-panjabi$/);
  await expect(page.getByLabel("Size")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to cart" })).toBeDisabled();
});

test("wishlist and cart controls on related cards remain functional", async ({ page }) => {
  await page.goto("/products/wireless-earbuds-pro");
  await expect(page.getByRole("link", { name: /Account: Demo Customer/ })).toBeVisible();
  const section = relatedSection(page);
  const card = section.locator("article").first();
  const productLink = card.getByRole("link", { name: /^View / });
  await expect(productLink).toBeVisible();
  const productLabel = await productLink.getAttribute("aria-label");
  expect(productLabel).toMatch(/^View .+/);
  const productName = productLabel?.slice("View ".length) ?? "";
  const addToWishlist = card.getByRole("button", { name: `Add ${productName} to wishlist`, exact: true });
  await expect(addToWishlist).toBeEnabled();
  await addToWishlist.click();
  await expect(card.getByRole("button", { name: `Remove ${productName} from wishlist`, exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(card.getByRole("status").getByText(`${productName} added to your wishlist.`, { exact: true })).toBeVisible();

  const addToCart = card.getByRole("button", { name: `Add ${productName} to cart`, exact: true });
  await expect(addToCart).toBeEnabled();
  await addToCart.click();
  await expect(card.getByRole("status").getByText(`${productName} added to your cart.`, { exact: true })).toBeVisible();
  await expect(page.locator("header").getByRole("link", { name: /Cart, 1 item/ })).toBeVisible();
});

test("related product grids remain usable on mobile and desktop", async ({ page }) => {
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/products/wireless-earbuds-pro");
    const section = relatedSection(page);
    await expect(section).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
    await expect(section.getByRole("link", { name: /^View / }).first()).toBeVisible();
  }
});

test("invalid product routes never render recommendation content", async ({ page }) => {
  const response = await page.goto("/products/not-a-canonical-product");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Product not found" })).toBeVisible();
  await expect(relatedSection(page)).toHaveCount(0);
});
