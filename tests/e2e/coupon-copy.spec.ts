import { expect, test } from "@playwright/test";

test("home welcome coupon copies its code and reports success accessibly", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("button", { name: "Copy WELCOME200 coupon code" }).click();
  await expect(page.getByRole("status").getByText("WELCOME200 copied.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Dismiss notification" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("WELCOME200");
});
