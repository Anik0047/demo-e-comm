import { expect, test } from "@playwright/test";

test("customer can validate, add, edit, default, delete, and persist saved addresses", async ({ page }) => {
  await page.goto("/account");
  await page.getByRole("link", { name: "Manage addresses" }).click();
  await expect(page.getByRole("heading", { name: "Saved addresses" })).toBeVisible();
  await expect(page.getByText("Add your first delivery address")).toBeVisible();
  await page.getByRole("button", { name: "Add an address" }).click();

  await page.getByLabel("Recipient name").fill("Samira Khan");
  await page.getByLabel("Mobile number").fill("02112345678");
  await page.getByLabel("Division").fill("Dhaka");
  await page.getByLabel("District / city").fill("Dhaka");
  await page.getByLabel("Area / upazila").fill("Gulshan");
  await page.getByLabel("House, road, and street address").fill("House 12, Road 5");
  await page.getByRole("button", { name: "Add address", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "valid Bangladesh mobile number" })).toBeVisible();
  await page.getByLabel("Mobile number").fill("01712345678");
  await page.getByRole("button", { name: "Add address", exact: true }).click();
  await expect(page.getByRole("article", { name: "Home address" })).toContainText("Samira Khan");
  await expect(page.getByText("Default address")).toBeVisible();

  await page.getByRole("button", { name: "Add address", exact: true }).click();
  await page.getByLabel("Address label").selectOption("Work");
  await page.getByLabel("Recipient name").fill("Samira Khan");
  await page.getByLabel("Mobile number").fill("01712345678");
  await page.getByLabel("Division").fill("Dhaka");
  await page.getByLabel("District / city").fill("Dhaka");
  await page.getByLabel("Area / upazila").fill("Motijheel");
  await page.getByLabel("House, road, and street address").fill("House 5, Road 2");
  await page.getByRole("button", { name: "Add address", exact: true }).click();
  await page.getByRole("button", { name: "Make default" }).click();
  await expect(page.getByRole("article", { name: "Work address" })).toContainText("Default address");

  await page.getByRole("button", { name: "Edit Home address" }).click();
  await page.getByLabel("Area / upazila").fill("Dhanmondi");
  await page.getByLabel("Set as default delivery address").check();
  await page.getByRole("button", { name: "Save address" }).click();
  await expect(page.getByRole("article", { name: "Home address" })).toContainText("Dhanmondi");
  await expect(page.getByRole("article", { name: "Home address" })).toContainText("Default address");

  await page.getByRole("button", { name: "Delete Home address" }).click();
  await expect(page.getByRole("article", { name: "Work address" })).toContainText("Default address");
  await page.getByRole("button", { name: "Delete Work address" }).click();
  await expect(page.getByText("Add your first delivery address")).toBeVisible();

  const addresses = await page.evaluate(() => JSON.parse(window.localStorage.getItem("kenakata:demo-state") ?? "null") as {
    data: { customers: Array<{ id: string; addresses: unknown[] }> };
  });
  expect(addresses.data.customers.find(({ id }) => id === "customer-demo")?.addresses).toEqual([]);
});

test("saved address layout has no horizontal overflow on mobile widths", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/account/addresses");
  await expect(page.getByRole("heading", { name: "Saved addresses" })).toBeVisible();
  await page.getByRole("button", { name: "Add an address" }).click();
  const dimensions = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
});

test("admin demo accounts cannot manage customer addresses", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Admin Admin demo account" }).click();
  await page.goto("/account/addresses");
  await expect(page.getByRole("heading", { name: "Customer account required" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Saved addresses" })).toHaveCount(0);
});
