import { expect, test } from "@playwright/test";

test("customer can edit and persist profile details from account pages", async ({ page }) => {
  await page.goto("/");
  const accountLink = page.getByRole("link", { name: /My account: Demo Customer/ });
  await expect(accountLink).toHaveAttribute("href", "/account");
  await accountLink.click();
  await expect(page.getByRole("heading", { name: "Account overview" })).toBeVisible();
  await expect(page.getByText("customer@kenakata.test")).toBeVisible();
  await expect(page.getByRole("link", { name: "Switch demo account" })).toHaveAttribute("href", "/login");

  await page.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Edit profile" })).toBeVisible();

  const name = page.getByRole("textbox", { name: "Full name" });
  const phone = page.getByRole("textbox", { name: "Phone number" });
  await name.fill("Samira Khan");
  await phone.fill("01112345678");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "valid Bangladesh mobile number" })).toBeVisible();
  await expect(name).toHaveValue("Samira Khan");

  await phone.fill("01712345678");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toHaveText("Profile updated.");

  const saved = await page.evaluate(() => JSON.parse(window.localStorage.getItem("kenakata:demo-state") ?? "null") as {
    data: { customers: Array<{ id: string; fullName: string; phone: string }>; accounts: Array<{ id: string; displayName: string }>; carts: unknown[]; wishlists: unknown[] };
  });
  expect(saved.data.customers.find(({ id }) => id === "customer-demo")).toMatchObject({ fullName: "Samira Khan", phone: "01712345678" });
  expect(saved.data.accounts.find(({ id }) => id === "account-customer-demo")?.displayName).toBe("Samira Khan");
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Full name" })).toHaveValue("Samira Khan");
});

test("non-customer accounts are restricted and the navbar opens the customer account", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /My account: Demo Customer/ })).toHaveAttribute("href", "/account");
  await page.getByRole("link", { name: /My account: Demo Customer/ }).click();
  await expect(page.getByRole("heading", { name: "Account overview" })).toBeVisible();

  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Admin Admin demo account" }).click();
  await page.goto("/account/profile");
  await expect(page.getByRole("heading", { name: "Customer account required" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Switch demo account" })).toHaveAttribute("href", "/login");
  await expect(page.getByRole("textbox", { name: "Full name" })).toHaveCount(0);
});
