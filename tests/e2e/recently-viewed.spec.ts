import { expect, test } from "@playwright/test";

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
  await expect(section.locator("article").nth(0).getByRole("link", { name: "Bluetooth Speaker", exact: true })).toBeVisible();
  await expect(section.locator("article").nth(1).getByRole("link", { name: "Cotton Panjabi", exact: true })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "Recently viewed" })).toBeVisible();
  await expect(page.getByText("Products you view will appear here for an easy return.")).toBeVisible();

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
