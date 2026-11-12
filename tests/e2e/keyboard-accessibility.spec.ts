import { expect, test } from "@playwright/test";

test("keyboard can open and dismiss the responsive navigation without losing focus", async ({ page }) => {
  const mobile = test.info().project.name.includes("mobile");
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await page.goto("/");

  if (mobile) {
    const trigger = page.getByRole("button", { name: "Open menu" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const drawer = page.getByRole("dialog", { name: "Mobile navigation" });
    await expect(drawer).toBeVisible();
    const close = drawer.getByRole("button", { name: "Close menu" });
    await expect(close).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    const lastDrawerLink = drawer.getByRole("link", { name: "Become a vendor" });
    await expect(lastDrawerLink).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
    return;
  }

  const trigger = page.getByRole("navigation", { name: "Primary navigation" }).getByRole("button", { name: "All categories" });
  await trigger.focus();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("search suggestions stay out of the Tab sequence and retain combobox keyboard control", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("combobox", { name: "Search products" }).filter({ visible: true });
  await search.fill("wireless earbuds");
  const options = page.getByRole("listbox", { name: "Search suggestions" }).filter({ visible: true }).getByRole("option");
  await expect(options.first()).toHaveAttribute("tabindex", "-1");
  await search.press("ArrowDown");
  await expect(options.first()).toHaveAttribute("aria-selected", "true");
  await search.press("Tab");
  const submit = search.locator("xpath=ancestor::form").getByRole("button", { name: "Search", exact: true });
  await expect(submit).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(search).toBeFocused();
});

test("PDP wishlist and compare actions work from the keyboard without navigating through the card", async ({ page }) => {
  await page.goto("/products/wireless-earbuds-pro");
  await expect(page.getByRole("link", { name: /My account: Demo Customer/ })).toBeVisible();

  const wishlist = page.getByRole("button", { name: "Add Wireless Earbuds Pro to wishlist" });
  await expect(wishlist).toBeEnabled();
  await wishlist.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/products\/wireless-earbuds-pro$/);
  await expect(page.getByRole("button", { name: "Remove Wireless Earbuds Pro from wishlist" })).toBeFocused();
  await expect(page.getByRole("status").getByText("Wireless Earbuds Pro added to your wishlist.")).toBeVisible();

  const compare = page.getByRole("button", { name: "Compare Wireless Earbuds Pro" });
  await compare.focus();
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(/\/products\/wireless-earbuds-pro$/);
  const comparisonLink = page.getByRole("link", { name: "View comparison with 1 product" });
  await expect(comparisonLink).toBeVisible();
  await comparisonLink.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/compare$/);
  await expect(page.getByRole("region", { name: "Product comparison table" }).getByRole("button", { name: "Remove Wireless Earbuds Pro from comparison" })).toBeVisible();
});

test("PDP image viewer closes on Escape and restores focus to its trigger", async ({ page }) => {
  const mobile = test.info().project.name.includes("mobile");
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await page.goto("/products/bluetooth-speaker");
  const trigger = page.getByRole("button", { name: /Enlarge image 1 of/ }).filter({ visible: true }).first();
  await trigger.focus();
  await page.keyboard.press("Enter");
  const viewer = page.getByRole("dialog", { name: "Bluetooth Speaker — image viewer" });
  await expect(viewer).toBeVisible();
  await expect(viewer.getByRole("button", { name: "Close image viewer" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("customer reset alert dialog traps Tab, closes on Escape, and restores its trigger", async ({ page }) => {
  await page.goto("/account/preferences");
  const trigger = page.getByRole("button", { name: "Reset my demo data" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("alertdialog", { name: "Reset your customer demo data?" });
  const cancel = dialog.getByRole("button", { name: "Cancel" });
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Permanently reset my data" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Close reset dialog" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.press("Enter");
  await dialog.getByRole("button", { name: "Cancel" }).press(" ");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("checkout and customer profile controls remain keyboard-operable", async ({ page }) => {
  await page.goto("/products/cotton-panjabi");
  await page.getByLabel("Size").selectOption("M");
  const addToCart = page.getByRole("button", { name: "Add to cart" });
  await addToCart.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").getByText("Cotton Panjabi added to your cart.")).toBeVisible();
  await expect(addToCart).toBeFocused();

  await page.goto("/checkout");
  const coupon = page.getByRole("textbox", { name: "Coupon code" });
  await coupon.fill("WELCOME200");
  await coupon.press("Tab");
  const apply = page.getByRole("button", { name: "Apply" });
  await expect(apply).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#coupon-feedback")).toContainText("WELCOME200 is applied");

  await page.goto("/account/profile");
  const name = page.getByRole("textbox", { name: "Full name" });
  await name.focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox", { name: "Email address" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(name).toBeFocused();
});

test("review ratings use arrow-key radio navigation and address forms manage focus", async ({ page }) => {
  await page.goto("/products/wireless-earbuds-pro");
  const ratings = page.getByRole("radiogroup", { name: "Your rating" });
  const oneStar = ratings.getByRole("radio", { name: "1 star" });
  const twoStars = ratings.getByRole("radio", { name: "2 stars" });
  await oneStar.focus();
  await page.keyboard.press("ArrowRight");
  await expect(twoStars).toBeFocused();
  await expect(twoStars).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("End");
  const fiveStars = ratings.getByRole("radio", { name: "5 stars" });
  await expect(fiveStars).toBeFocused();
  await expect(fiveStars).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Space");
  await expect(fiveStars).toBeFocused();

  await page.goto("/account/addresses");
  const addAddress = page.getByRole("button", { name: "Add address" });
  await addAddress.focus();
  await page.keyboard.press("Enter");
  const addressLabel = page.getByLabel("Address label");
  await expect(addressLabel).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Recipient name")).toBeFocused();
  await page.getByRole("button", { name: "Cancel" }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Add address" })).toBeFocused();
});

test("recently viewed confirmation dismisses with Escape and returns focus", async ({ page }) => {
  await page.goto("/products/bluetooth-speaker");
  await expect(page.getByRole("link", { name: /My account: Demo Customer/ })).toBeVisible();
  await expect.poll(async () => page.evaluate(() => {
    const raw = localStorage.getItem("kenakata:demo-state");
    if (!raw) return [];
    const state = JSON.parse(raw) as { data?: { customers?: Array<{ id: string; recentlyViewedProductIds?: string[] }> } };
    return state.data?.customers?.find(({ id }) => id === "customer-demo")?.recentlyViewedProductIds ?? [];
  })).toContain("prod-bluetooth-speaker");
  await page.goto("/account/recently-viewed");
  const clearHistory = page.getByRole("button", { name: "Clear history" });
  await expect(clearHistory).toBeVisible();
  await clearHistory.focus();
  await page.keyboard.press("Enter");
  const confirmation = page.getByRole("alertdialog", { name: "Clear your recently viewed history?" });
  await expect(confirmation.getByRole("button", { name: "Keep history" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(confirmation).toHaveCount(0);
  await expect(clearHistory).toBeFocused();
});
