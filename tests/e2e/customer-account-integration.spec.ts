import { expect, test } from "@playwright/test";

test("customer account navigation, profile data, saved state, and role switching stay isolated", async ({ page }) => {
  await page.goto("/account/profile");
  await expect(page.getByRole("heading", { name: "Edit profile" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Customer account" }).getByRole("link", { name: "Profile" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("textbox", { name: "Email address" })).toHaveValue("customer@kenakata.test");

  await page.getByRole("textbox", { name: "Full name" }).fill("Samira Khan");
  await page.getByRole("textbox", { name: "Phone number" }).fill("01712345678");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toHaveText("Profile updated.");

  const accountNavigation = page.getByRole("navigation", { name: "Customer account" });
  await accountNavigation.getByRole("link", { name: "Saved addresses" }).click();
  await expect(page).toHaveURL("/account/addresses");
  await expect(page.getByRole("heading", { name: "Saved addresses" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Saved addresses" })).toBeVisible();
  await expect(accountNavigation.getByRole("link", { name: "Saved addresses" })).toHaveAttribute("aria-current", "page");

  await page.getByRole("button", { name: "Add an address" }).click();
  await page.getByLabel("Address label").selectOption("Home");
  await page.getByLabel("Recipient name").fill("Samira Khan");
  await page.getByLabel("Mobile number").fill("01712345678");
  await page.getByLabel("Division").fill("Dhaka");
  await page.getByLabel("District / city").fill("Dhaka");
  await page.getByLabel("Area / upazila").fill("Dhanmondi");
  await page.getByLabel("House, road, and street address").fill("House 12, Road 5");
  await page.getByRole("button", { name: "Add address", exact: true }).click();
  await expect(page.getByRole("article", { name: "Home address" })).toContainText("Default address");
  await expect(page.getByRole("article", { name: "Home address" })).toContainText("Dhanmondi");

  await page.getByRole("link", { name: "Preferences", exact: true }).click();
  await expect(page).toHaveURL("/account/preferences");
  await expect(page.getByRole("heading", { name: "Account preferences" })).toBeVisible();
  await page.getByRole("checkbox", { name: /Save my opt-in choice/ }).check();
  await page.getByRole("radio", { name: "Compact grid" }).check();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("status")).toHaveText("Preferences saved in this browser.");

  for (const path of ["/products", "/products?search=wireless", "/category/electronics", "/vendor/tech-haven"]) {
    await page.goto(path);
    await expect(page.getByRole("list", { name: "Products" })).toHaveAttribute("data-density", "compact");
  }

  await page.goto("/products/bluetooth-speaker");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Bluetooth Speaker added to your cart." })).toBeVisible();
  await page.getByRole("button", { name: "Add Bluetooth Speaker to wishlist" }).click();
  await expect(page.getByRole("button", { name: "Remove Bluetooth Speaker from wishlist" })).toHaveAttribute("aria-pressed", "true");

  const beforeSwitch = await page.evaluate(() => JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null") as {
    data: {
      accounts: Array<{ id: string; email: string; displayName: string; customerId: string | null }>;
      customers: Array<{ id: string; accountId: string; fullName: string; phone: string; addresses: Array<{ id: string; isDefault: boolean }>; preferences: { promotionalUpdates: boolean; productGridDensity: string } }>;
      carts: Array<{ customerId: string; items: Array<{ productId: string }> }>;
      wishlists: Array<{ customerId: string; productIds: string[] }>;
    };
  });
  expect(beforeSwitch.data.accounts.find(({ id }) => id === "account-customer-demo")).toMatchObject({ id: "account-customer-demo", email: "customer@kenakata.test", displayName: "Samira Khan", customerId: "customer-demo" });
  expect(beforeSwitch.data.customers.find(({ id }) => id === "customer-demo")).toMatchObject({ id: "customer-demo", accountId: "account-customer-demo", fullName: "Samira Khan", phone: "01712345678", addresses: [{ isDefault: true }], preferences: { promotionalUpdates: true, productGridDensity: "compact" } });
  expect(beforeSwitch.data.carts.find(({ customerId }) => customerId === "customer-demo")?.items).toContainEqual(expect.objectContaining({ productId: "prod-bluetooth-speaker" }));
  expect(beforeSwitch.data.wishlists.find(({ customerId }) => customerId === "customer-demo")?.productIds).toContain("prod-bluetooth-speaker");

  await page.getByRole("link", { name: /My account: Samira Khan/ }).click();
  await expect(page).toHaveURL("/account");
  await expect(page.getByRole("heading", { name: "Hello, Samira Khan" })).toBeVisible();
  await page.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Full name" })).toHaveValue("Samira Khan");
  await page.goBack();
  await expect(page).toHaveURL("/account");
  await page.goForward();
  await expect(page).toHaveURL("/account/profile");

  for (const accountName of ["Demo Admin Admin demo account", "TechHaven seller Vendor demo account"]) {
    await page.goto("/login");
    await page.getByRole("button", { name: accountName }).click();
    for (const path of ["/account/profile", "/account/addresses", "/account/preferences"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: "Customer account required" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Edit profile" })).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Saved addresses" })).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Account preferences" })).toHaveCount(0);
    }
    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: "Your cart is private" })).toBeVisible();
    await expect(page.getByText("Bluetooth Speaker", { exact: true })).toHaveCount(0);
    await page.goto("/wishlist");
    await expect(page.getByRole("heading", { name: "Your wishlist is private" })).toBeVisible();
    await expect(page.getByText("Bluetooth Speaker", { exact: true })).toHaveCount(0);
  }

  await page.goto("/login");
  await page.getByRole("button", { name: "Samira Khan Customer demo account" }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/account/profile");
  await expect(page.getByRole("textbox", { name: "Full name" })).toHaveValue("Samira Khan");
  await expect(page.getByRole("textbox", { name: "Email address" })).toHaveValue("customer@kenakata.test");
  await page.goto("/account/addresses");
  await expect(page.getByRole("article", { name: "Home address" })).toContainText("Default address");
  await page.goto("/account/preferences");
  await expect(page.getByRole("checkbox", { name: /Save my opt-in choice/ })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Compact grid" })).toBeChecked();
  await page.goto("/cart");
  await expect(page.getByRole("list", { name: "Cart items" })).toContainText("Bluetooth Speaker");
  await page.goto("/wishlist");
  await expect(page.getByRole("list", { name: "Wishlist items" }).getByText("Bluetooth Speaker", { exact: true })).toBeVisible();
});

test("account pages and address form fit narrow, tablet, and desktop widths", async ({ page }) => {
  for (const width of [320, 360, 390, 640, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/account/addresses");
    await expect(page.getByRole("heading", { name: "Saved addresses" })).toBeVisible();
    await page.getByRole("button", { name: "Add an address" }).click();
    const dimensions = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: document.documentElement.clientWidth }));
    expect(dimensions.body, `address form at ${width}px`).toBeLessThanOrEqual(dimensions.viewport);
  }
});
