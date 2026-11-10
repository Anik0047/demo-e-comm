import { expect, test } from "@playwright/test";

const seededAccounts = [
  { id: "account-admin-demo", name: "Demo Admin", role: "Admin", route: "/admin/dashboard" },
  { id: "account-vendor-tech-haven", name: "TechHaven seller", role: "Vendor", route: "/vendor/tech-haven/dashboard" },
  { id: "account-vendor-urban-fit", name: "UrbanFit seller", role: "Vendor", route: "/vendor/urban-fit/dashboard" },
  { id: "account-vendor-home-nest", name: "HomeNest seller", role: "Vendor", route: "/vendor/home-nest/dashboard" },
  { id: "account-customer-demo", name: "Demo Customer", role: "Customer", route: "/" },
];

test("login clearly explains credential sign-in and lists every seeded demo account", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Quick Demo Login" })).toBeVisible();
  await expect(page.getByText("Real email and password authentication is unavailable.")).toBeVisible();
  for (const account of seededAccounts) {
    await expect(page.getByRole("button", { name: `${account.name} ${account.role} demo account` })).toBeVisible();
  }
  await page.getByLabel("Email").fill("person@example.com");
  await page.getByLabel("Password").fill("not-a-real-password");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("status")).toContainText("isn’t available");
  await expect(page).toHaveURL(/\/login$/);
});

for (const account of seededAccounts) {
  test(`${account.role} demo login selects ${account.name}, persists, and routes correctly`, async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: `${account.name} ${account.role} demo account` }).click();
    await expect(page).toHaveURL(account.route);
    if (account.role === "Customer") {
      await expect(page.getByRole("link", { name: /Account: Demo Customer/ })).toBeVisible();
    } else {
      await expect(page.getByRole("heading", { name: `${account.role} dashboard` })).toBeVisible();
      await expect(page.getByText("Demo dashboard placeholder")).toBeVisible();
    }
    await page.reload();
    const preference = await page.evaluate(() => window.sessionStorage.getItem("kenakata:demo-account-id"));
    expect(preference).toBe(account.id);
    await page.goto("/login");
    await page.getByRole("button", { name: `${account.name} ${account.role} demo account` }).click();
    await expect(page).toHaveURL(account.route);
  });
}

test("navbar account affordance returns to login to switch accounts", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Account: Demo Customer/ }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("mobile demo login supports role selection and returns to the login page", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/login");
  await page.getByRole("button", { name: "TechHaven seller Vendor demo account" }).click();
  await expect(page).toHaveURL("/vendor/tech-haven/dashboard");
  await page.getByRole("link", { name: "Switch demo account" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("server markup does not expose the saved session account before hydration", async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem("kenakata:demo-account-id", "account-admin-demo"));
  const response = await page.goto("/");
  const markup = await response?.text();
  expect(markup).toContain("Login");
  expect(markup).not.toContain("Account: Demo Admin");
  await expect(page.getByRole("link", { name: /Account: Demo Admin/ })).toBeVisible();
});
