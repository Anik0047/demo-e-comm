import { expect, test } from "@playwright/test";

test("customer can save local preferences and use the compact catalog grid setting", async ({ page }) => {
  await page.goto("/account");
  await page.getByRole("link", { name: "Manage preferences" }).click();
  await expect(page.getByRole("heading", { name: "Account preferences" })).toBeVisible();
  await expect(page.getByText("No emails, texts, or push notifications are sent.")).toBeVisible();

  await page.getByRole("checkbox", { name: /Save my opt-in choice/ }).check();
  await page.getByRole("radio", { name: "Compact grid" }).check();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("status")).toHaveText("Preferences saved in this browser.");

  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("kenakata:demo-state") ?? "null") as {
    data: { customers: Array<{ id: string; preferences: { promotionalUpdates: boolean; productGridDensity: string }; fullName: string; addresses: unknown[] }>; carts: unknown[]; wishlists: unknown[] };
  });
  expect(stored.data.customers.find(({ id }) => id === "customer-demo")?.preferences).toEqual({ promotionalUpdates: true, productGridDensity: "compact" });

  await page.goto("/products");
  await expect(page.getByRole("list", { name: "Products" })).toHaveAttribute("data-density", "compact");
});

test("customer preferences remain usable without horizontal page overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/account/preferences");
  await expect(page.getByRole("heading", { name: "Account preferences" })).toBeVisible();
  await page.getByRole("radio", { name: "Compact grid" }).check();
  const dimensions = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
});

test("non-customer demo roles cannot access customer preferences", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Admin Admin demo account" }).click();
  await page.goto("/account/preferences");
  await expect(page.getByRole("heading", { name: "Customer account required" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Account preferences" })).toHaveCount(0);
});
