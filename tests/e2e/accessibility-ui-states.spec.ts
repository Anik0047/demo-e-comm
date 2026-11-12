import { expect, test } from "@playwright/test";

const customerRoutes = [
  "/",
  "/products",
  "/products?search=zzqv-no-match-927",
  "/categories",
  "/category/electronics",
  "/vendor/tech-haven",
  "/products/bluetooth-speaker",
  "/compare",
  "/cart",
  "/wishlist",
  "/checkout",
  "/account",
  "/account/profile",
  "/account/orders",
  "/account/addresses",
  "/account/preferences",
  "/account/reviews",
  "/account/recently-viewed",
];

test("customer storefront routes expose one main landmark, one page heading, and named controls", async ({ browser }) => {
  const mobile = test.info().project.name.includes("mobile");
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 } });

  for (const route of customerRoutes) {
    const page = await context.newPage();
    await page.goto(route);
    await expect(page.locator("main"), route).toHaveCount(1);
    await expect(page.locator("main h1"), route).toHaveCount(1);
    await expect(page.locator("main h1"), route).toBeVisible();

    const audit = await page.evaluate(() => {
      const visible = (element: HTMLElement) => {
        const style = getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden" && !element.closest("[aria-hidden='true'], [inert]");
      };
      const controls = Array.from(document.querySelectorAll<HTMLElement>("button, a[href], input:not([type='hidden']), select, textarea"))
        .filter(visible)
        .filter((element) => !element.hasAttribute("disabled"));
      const unnamed = controls.filter((element) => {
        const labelledBy = element.getAttribute("aria-labelledby")?.split(/\s+/).filter(Boolean) ?? [];
        const labelledText = labelledBy.map((id) => document.getElementById(id)?.textContent?.trim() ?? "").join(" ");
        const labels = element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement
          ? Array.from(element.labels ?? []).map((label) => label.textContent?.trim() ?? "").join(" ")
          : "";
        return !(element.getAttribute("aria-label")?.trim() || labelledText || labels || element.textContent?.trim() || element.getAttribute("title")?.trim());
      }).map((element) => `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}`);
      const allIds = Array.from(document.querySelectorAll<HTMLElement>("[id]"));
      const duplicateIds = Array.from(new Set(allIds.map(({ id }) => id)))
        .filter((id) => allIds.filter((element) => element.id === id).length > 1)
        .map((id) => ({ id, elements: allIds.filter((element) => element.id === id).map((element) => element.outerHTML.slice(0, 160)) }));
      const brokenDescriptions = Array.from(document.querySelectorAll<HTMLElement>("[aria-describedby], [aria-labelledby]"))
        .flatMap((element) => ["aria-describedby", "aria-labelledby"].flatMap((attribute) => (element.getAttribute(attribute) ?? "").split(/\s+/).filter(Boolean)))
        .filter((id) => !document.getElementById(id));
      const imagesWithoutAlt = Array.from(document.querySelectorAll<HTMLImageElement>("img:not([alt])")).map((image) => image.outerHTML.slice(0, 160));
      return { unnamed, duplicateIds, brokenDescriptions, imagesWithoutAlt };
    });

    expect(audit.unnamed, `${route} has unnamed interactive controls`).toEqual([]);
    expect(audit.duplicateIds, `${route} has duplicate IDs`).toEqual([]);
    expect(audit.brokenDescriptions, `${route} has broken label references`).toEqual([]);
    expect(audit.imagesWithoutAlt, `${route} has images without alt attributes`).toEqual([]);
    await page.close();
  }
  await context.close();
});

test("no-results and invalid-profile states provide a next action and associated errors", async ({ page }) => {
  const mobile = test.info().project.name.includes("mobile");
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await page.goto("/products?search=zzqv-no-match-927");
  await expect(page.getByRole("heading", { name: "No products found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Clear filters" })).toHaveAttribute("href", "/products");
  await expect(page.getByRole("searchbox", { name: "Edit search" })).toHaveValue("zzqv-no-match-927");

  await page.goto("/account/profile");
  const phone = page.getByRole("textbox", { name: "Phone number" });
  await phone.fill("invalid");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(phone).toHaveAttribute("aria-invalid", "true");
  const errorId = await phone.getAttribute("aria-describedby");
  expect(errorId).toBeTruthy();
  await expect(page.locator(`#${errorId}`)).toHaveAttribute("role", "alert");
  await expect(page.locator(`#${errorId}`)).toHaveText(/Bangladesh mobile number/);
});

test("a failed product image gives a polite, readable fallback", async ({ page }) => {
  const mobile = test.info().project.name.includes("mobile");
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await page.route("**/_next/image**", (route) => route.abort());
  await page.goto("/products/bluetooth-speaker");
  await expect(page.getByRole("region", { name: "Bluetooth Speaker images" }).getByRole("status").filter({ hasText: "Image unavailable" }).filter({ visible: true })).toHaveText("Image unavailable");
});

test("comparison and cart changes announce the affected item once with useful context", async ({ page }) => {
  const mobile = test.info().project.name.includes("mobile");
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await page.goto("/products/wireless-earbuds-pro");
  await page.getByRole("button", { name: "Compare Wireless Earbuds Pro" }).click();
  await expect(page.getByRole("status").getByText("Wireless Earbuds Pro added to comparison.")).toBeVisible();
  await page.goto("/compare");
  await expect(page.getByRole("status").filter({ hasText: "1 of 3 products selected" })).toBeVisible();

  await page.goto("/products/cotton-panjabi");
  await page.getByLabel("Size").selectOption("M");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("status").getByText("Cotton Panjabi added to your cart.")).toBeVisible();
  await page.goto("/cart");
  const quantity = page.getByRole("group", { name: "Quantity for Cotton Panjabi" });
  await quantity.getByRole("button", { name: "Increase quantity" }).click();
  await expect(page.getByRole("status").getByText("Cotton Panjabi quantity updated to 2.")).toBeVisible();
  await expect(quantity.locator("span")).toHaveText("2");
});

test("keyboard focus remains visible on form controls and small-text status colors meet contrast", async ({ page }) => {
  const mobile = test.info().project.name.includes("mobile");
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await page.goto("/account/profile");
  const name = page.getByRole("textbox", { name: "Full name" });
  await name.focus();
  const outline = await name.evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(outline).not.toBe("none");

  await page.goto("/products");
  const contrast = await page.evaluate(() => {
    const rgb = (value: string) => value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
    const luminance = (value: string) => {
      const [r = 0, g = 0, b = 0] = rgb(value).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (foreground: string, background: string) => {
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      return ((values[0] ?? 0) + 0.05) / ((values[1] ?? 0) + 0.05);
    };
    const fixtures = [
      ["span", "contrast-sale-badge", "badge badge-sale", "Sale badge"],
      ["button", "contrast-sale-button", "btn btn-sale", "Sale button"],
      ["p", "contrast-sale-error", "bg-blush text-sale-strong", "Validation error"],
      ["span", "contrast-brand-text", "bg-brand-strong text-white text-xs", "Small brand label"],
      ["span", "contrast-info-text", "bg-info-strong text-white text-xs", "Small seller label"],
    ] as const;
    const container = document.createElement("div");
    container.className = "fixed left-0 top-0";
    for (const [tag, id, classes, text] of fixtures) {
      const element = document.createElement(tag);
      element.id = id;
      element.className = classes;
      element.textContent = text;
      container.append(element);
    }
    document.body.append(container);
    const targets = ["#contrast-sale-badge", "#contrast-sale-button", "#contrast-sale-error", "#contrast-brand-text", "#contrast-info-text"];
    return targets.flatMap((selector) => Array.from(document.querySelectorAll<HTMLElement>(selector)).map((element) => {
      const style = getComputedStyle(element);
      return { selector, text: element.textContent?.trim(), contrast: ratio(style.color, style.backgroundColor) };
    }));
  });
  for (const item of contrast) expect(item.contrast, `${item.selector} contrast for ${item.text}`).toBeGreaterThanOrEqual(4.5);
});
