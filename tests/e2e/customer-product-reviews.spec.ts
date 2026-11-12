import { expect, test } from "@playwright/test";

test("customer reviews submit, edit once, persist, isolate owners, and reset by owner", async ({ page }) => {
  await page.goto("/products/bluetooth-speaker");
  const reviews = page.getByRole("region", { name: "Customer reviews" });
  await expect(reviews.getByText("No customer reviews yet.")).toBeVisible();
  await expect(page.getByText(/catalog sample/)).toBeVisible();

  await reviews.getByRole("radio", { name: "4 stars" }).click();
  await reviews.getByLabel("Your review").fill("Sound stays clear on my commute and the case lasts through the week.");
  await reviews.getByRole("button", { name: "Submit review" }).click();
  await expect(reviews.getByRole("status")).toHaveText("Your review has been submitted.");
  await expect(reviews.getByText("Demo Customer", { exact: false })).toBeVisible();
  await expect(reviews.getByLabel("4.0 out of 5 from 1 customer reviews")).toBeVisible();
  await expect.poll(async () => page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null");
    return state?.data.productReviews?.length;
  })).toBe(1);

  await page.reload();
  const restoredReviews = page.getByRole("region", { name: "Customer reviews" });
  await expect(restoredReviews.getByRole("heading", { name: "Edit your review" })).toBeVisible();
  await expect(restoredReviews.getByLabel("Your review")).toHaveValue("Sound stays clear on my commute and the case lasts through the week.");
  await restoredReviews.getByRole("radio", { name: "5 stars" }).click();
  await restoredReviews.getByLabel("Your review").fill("Edited: sound stays clear, and the case lasts all week on one charge.");
  await restoredReviews.getByRole("button", { name: "Save changes" }).click();
  await expect(restoredReviews.getByRole("status")).toHaveText("Your review has been updated.");
  await expect.poll(async () => page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null");
    return state?.data.productReviews?.map((review: { customerId: string; body: string; rating: number }) => [review.customerId, review.body, review.rating]);
  })).toEqual([["customer-demo", "Edited: sound stays clear, and the case lasts all week on one charge.", 5]]);

  await page.evaluate(() => {
    const key = "kenakata:demo-state";
    const state = JSON.parse(localStorage.getItem(key) ?? "null");
    const now = new Date().toISOString();
    state.data.accounts.push({ id: "account-customer-second", email: "second@example.test", displayName: "Second Customer", role: "customer", customerId: "customer-second", vendorId: null, createdAt: now });
    state.data.customers.push({ id: "customer-second", accountId: "account-customer-second", fullName: "Second Customer", phone: "00000000001", addresses: [], preferences: { promotionalUpdates: false, productGridDensity: "standard" }, hiddenOrderIds: [], recentlyViewedProductIds: [], createdAt: now, updatedAt: now });
    state.data.carts.push({ id: "cart-customer-second", customerId: "customer-second", items: [], updatedAt: now });
    state.data.wishlists.push({ id: "wishlist-customer-second", customerId: "customer-second", productIds: [], updatedAt: now });
    localStorage.setItem(key, JSON.stringify(state));
    sessionStorage.setItem("kenakata:demo-account-id", "account-customer-second");
  });
  await page.reload();
  const secondCustomerReviews = page.getByRole("region", { name: "Customer reviews" });
  await expect(secondCustomerReviews.getByRole("heading", { name: "Write a review" })).toBeVisible();
  await secondCustomerReviews.getByRole("radio", { name: "3 stars" }).click();
  await secondCustomerReviews.getByLabel("Your review").fill("A different customer has a different experience.");
  await secondCustomerReviews.getByRole("button", { name: "Submit review" }).click();
  await expect(secondCustomerReviews.getByText("Second Customer", { exact: false })).toBeVisible();
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null").data.productReviews.length)).toBe(2);

  await page.evaluate(() => sessionStorage.setItem("kenakata:demo-account-id", "account-customer-demo"));
  await page.reload();
  const firstCustomerReviews = page.getByRole("region", { name: "Customer reviews" });
  await expect(firstCustomerReviews.getByRole("heading", { name: "Edit your review" })).toBeVisible();
  await expect(firstCustomerReviews.getByLabel("Your review")).toHaveValue("Edited: sound stays clear, and the case lasts all week on one charge.");

  const dimensions = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);

  await page.goto("/account/preferences");
  await page.getByRole("button", { name: "Reset my demo data" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Permanently reset my data" }).click();
  await expect(page.getByRole("status")).toHaveText("Your customer demo data has been reset in this browser.");
  const savedReviews = await page.evaluate(() => JSON.parse(localStorage.getItem("kenakata:demo-state") ?? "null").data.productReviews);
  expect(savedReviews).toHaveLength(1);
  expect(savedReviews[0]).toMatchObject({ customerId: "customer-second", body: "A different customer has a different experience." });
});
