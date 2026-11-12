import { expect, test } from "@playwright/test";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";

test("recently viewed keeps newest unique visits, persists, isolates customers, and resets", async ({ page }) => {
  await page.goto("/products/bluetooth-speaker");
  await expect(page.locator("h1#product-name")).toHaveText("Bluetooth Speaker");
  await expect.poll(async () => page.evaluate(() => {
    const snapshot = JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null");
    return snapshot?.data.customers.find((customer: { id: string }) => customer.id === "customer-demo")?.recentlyViewedProductIds;
  })).toEqual(["prod-bluetooth-speaker"]);

  await page.goto("/products/cotton-panjabi");
  await expect(page.locator("h1#product-name")).toHaveText("Cotton Panjabi");
  await expect.poll(async () => page.evaluate(() => {
    const snapshot = JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null");
    return snapshot?.data.customers.find((customer: { id: string }) => customer.id === "customer-demo")?.recentlyViewedProductIds;
  })).toEqual(["prod-cotton-panjabi", "prod-bluetooth-speaker"]);
  await page.goto("/products/bluetooth-speaker");
  await expect.poll(async () => page.evaluate(() => {
    const snapshot = JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null");
    return snapshot?.data.customers.find((customer: { id: string }) => customer.id === "customer-demo")?.recentlyViewedProductIds;
  })).toEqual(["prod-bluetooth-speaker", "prod-cotton-panjabi"]);

  await page.goto("/");
  const section = page.getByRole("region", { name: "Recently viewed" });
  await expect.poll(() => section.evaluate((element) => element.previousElementSibling?.getAttribute("aria-label"))).toBe("Featured offers");
  await expect(section.getByRole("link", { name: "View all" })).toHaveAttribute("href", "/account/recently-viewed");
  await expect(section.locator("article").nth(0).getByRole("link", { name: "View Bluetooth Speaker", exact: true })).toBeVisible();
  await expect(section.locator("article").nth(1).getByRole("link", { name: "View Cotton Panjabi", exact: true })).toBeVisible();
  await expect(section.getByText("৳1,799", { exact: true })).toBeVisible();
  const dimensions = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
  await page.reload();
  await expect(section.locator("article")).toHaveCount(2);

  await page.evaluate(() => {
    const key = "kenakata:demo-state";
    const snapshot = JSON.parse(localStorage.getItem(key) ?? "null");
    const now = snapshot.savedAt;
    snapshot.data.accounts.push({ id: "account-customer-second", email: "second@example.test", displayName: "Second", role: "customer", customerId: "customer-second", vendorId: null, createdAt: now });
    snapshot.data.customers.push({ id: "customer-second", accountId: "account-customer-second", fullName: "Second", phone: "0", addresses: [], preferences: { promotionalUpdates: false, productGridDensity: "standard" }, hiddenOrderIds: [], recentlyViewedProductIds: [], createdAt: now, updatedAt: now });
    localStorage.setItem(key, JSON.stringify(snapshot));
    sessionStorage.setItem("kenakata:demo-account-id", "account-customer-second");
  });
  await page.reload();
  await expect(page.getByRole("region", { name: "Recently viewed" })).toHaveCount(0);
  await page.goto("/account/recently-viewed");
  await expect(page.getByRole("heading", { name: "Your history is empty" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Customer account" }).getByRole("link", { name: "Recently viewed" })).toHaveAttribute("aria-current", "page");

  await page.evaluate(() => sessionStorage.setItem("kenakata:demo-account-id", "account-customer-demo"));
  await page.goto("/account/preferences");
  await expect(page.getByRole("heading", { name: "Account preferences" })).toBeVisible();
  await page.getByRole("button", { name: "Reset my demo data" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Permanently reset my data" }).click();
  await expect(page.getByRole("status")).toHaveText("Your customer demo data has been reset in this browser.");
  const ids = await page.evaluate(() => {
    const snapshot = JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null");
    return snapshot?.data.customers.find((customer: { id: string }) => customer.id === "customer-demo")?.recentlyViewedProductIds;
  });
  expect(ids).toEqual([]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null").data.customers.find((customer: { id: string }) => customer.id === "customer-second")?.recentlyViewedProductIds)).toEqual([]);
});

test("homepage shows five and account shows twenty eligible products; remove, clear, and switch ownership safely", async ({ page }) => {
  const approvedVendorIds = new Set(vendors.filter(({ status }) => status === "approved").map(({ id }) => id));
  const ids = products.filter(({ status, vendorId }) => status === "active" && approvedVendorIds.has(vendorId)).slice(0, 20).map(({ id }) => id);
  expect(ids.length).toBe(20);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(localStorage.getItem("kenakata:demo-state")));
  await page.evaluate((productIds) => {
    const snapshot = JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null");
    snapshot.data.customers.find((customer: { id: string }) => customer.id === "customer-demo").recentlyViewedProductIds = productIds;
    localStorage.setItem("kenakata:demo-state", JSON.stringify(snapshot));
  }, ids);
  await page.reload();
  const homeSection = page.getByRole("region", { name: "Recently viewed" });
  await expect(homeSection.locator("article")).toHaveCount(5);
  const homeLayout = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(homeLayout.body).toBeLessThanOrEqual(homeLayout.viewport);

  await page.goto("/account/recently-viewed");
  await expect(page.getByRole("button", { name: "Clear history" })).toBeVisible();
  await expect(page.locator("article")).toHaveCount(20);
  const firstProductName = await page.locator("article h3").first().innerText();
  await page.getByRole("button", { name: `Remove ${firstProductName} from recently viewed` }).click();
  await expect(page.getByText(`${firstProductName} removed from recently viewed.`, { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null").data.customers.find((customer: { id: string }) => customer.id === "customer-demo").recentlyViewedProductIds.length)).toBe(19);
  await page.getByRole("button", { name: "Clear history" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("alertdialog").getByRole("button", { name: "Clear history" }).click();
  await expect(page.getByText("Your recently viewed history has been cleared.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your history is empty" })).toBeVisible();

  await page.evaluate((productIds) => {
    const key = "kenakata:demo-state";
    const snapshot = JSON.parse(localStorage.getItem(key) ?? "null");
    const now = snapshot.savedAt;
    snapshot.data.customers.find((customer: { id: string }) => customer.id === "customer-demo").recentlyViewedProductIds = productIds.slice(0, 1);
    snapshot.data.accounts.push({ id: "account-customer-second", email: "second@example.test", displayName: "Second", role: "customer", customerId: "customer-second", vendorId: null, createdAt: now });
    snapshot.data.customers.push({ id: "customer-second", accountId: "account-customer-second", fullName: "Second", phone: "0", addresses: [], preferences: { promotionalUpdates: false, productGridDensity: "standard" }, hiddenOrderIds: [], recentlyViewedProductIds: [], createdAt: now, updatedAt: now });
    localStorage.setItem(key, JSON.stringify(snapshot));
    sessionStorage.setItem("kenakata:demo-account-id", "account-customer-second");
  }, ids);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Your history is empty" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null").data.customers.find((customer: { id: string }) => customer.id === "customer-demo").recentlyViewedProductIds.length)).toBe(1);
});
