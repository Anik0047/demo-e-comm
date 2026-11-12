import { expect, test } from "@playwright/test";

test("all internal footer destinations load their storefront routes", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  const destinations = await footer.getByRole("link").evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).getAttribute("href")).filter((href): href is string => Boolean(href?.startsWith("/"))));
  expect(destinations.length).toBeGreaterThan(0);
  for (const destination of [...new Set(destinations)]) {
    expect(destination).not.toBe("#");
    await page.goto(destination);
    await expect(page.locator("body")).not.toContainText("404");
  }
  await expect(footer.getByRole("link", { name: "Facebook" })).toHaveAttribute("href", "https://www.facebook.com/");
  await expect(footer.getByRole("link", { name: "Instagram" })).toHaveAttribute("href", "https://www.instagram.com/");
  await expect(footer.getByRole("link", { name: "YouTube" })).toHaveAttribute("href", "https://www.youtube.com/");
  await expect(footer.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", "https://www.linkedin.com/");
});

test("footer newsletter validates locally, retains invalid input, then clears valid input", async ({ page }) => {
  await page.goto("/");
  const email = page.getByRole("textbox", { name: "Get deals and new arrivals in your inbox" });
  await email.fill("not-an-email");
  await page.getByRole("button", { name: "Subscribe" }).click();
  await expect(email).toHaveValue("not-an-email");
  await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
  await email.fill("shopper@example.test");
  await page.getByRole("button", { name: "Subscribe" }).click();
  await expect(page.getByText("Thanks for subscribing!")).toBeVisible();
  await expect(email).toHaveValue("");
});
