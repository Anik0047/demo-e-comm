import { expect, test, type Locator, type Page } from "@playwright/test";

async function controlledMegaMenu(nav: Locator, trigger: Locator) {
  const menuId = await trigger.getAttribute("aria-controls");
  expect(menuId).toBeTruthy();
  return nav.locator(`[id="${menuId}"]`);
}

function productCards(page: Page) {
  return page.getByRole("list", { name: "Products" }).locator(":scope > li[data-product-id]");
}

async function expectFilteredTechHavenProducts(page: Page) {
  const cards = productCards(page);
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toHaveAttribute("data-product-id", "prod-wireless-gaming-mouse");
  await expect(cards.nth(1)).toHaveAttribute("data-product-id", "prod-power-bank-10000");
  await expect(cards.locator('[data-product-id="prod-wireless-earbuds-pro"]')).toHaveCount(0);
}

async function openElectronicsFromHomepage(page: Page) {
  await page.goto("/");
  if ((page.viewportSize()?.width ?? 1280) < 1024) {
    const trigger = page.getByRole("button", { name: "Open menu" });
    await trigger.click();
    await page.getByRole("dialog", { name: "Mobile navigation" }).getByRole("link", { name: "Electronics", exact: true }).click();
  } else {
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    await nav.getByRole("button", { name: "All categories" }).click();
    await (await controlledMegaMenu(nav, nav.getByRole("button", { name: "All categories" }))).getByRole("list", { name: "Main categories" })
      .getByRole("link", { name: "Electronics", exact: true }).click();
  }
  await expect(page).toHaveURL("/category/electronics");
  await expect(page.getByRole("heading", { level: 1, name: "Electronics", exact: true })).toBeVisible();
}

test("Journey A: category discovery opens a product, its vendor, and another canonical product", async ({ page }) => {
  await openElectronicsFromHomepage(page);
  await page.getByRole("link", { name: "View Wireless Earbuds Pro" }).click();
  await expect(page).toHaveURL("/products/wireless-earbuds-pro");
  await expect(page.getByRole("heading", { level: 1, name: "Wireless Earbuds Pro" })).toBeVisible();
  const vendorLink = page.getByRole("link", { name: "TechHaven", exact: true });
  await expect(vendorLink).toHaveAttribute("href", "/vendor/tech-haven");
  await vendorLink.click();
  await expect(page).toHaveURL("/vendor/tech-haven");
  await expect(page.getByRole("heading", { level: 1, name: "TechHaven", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Products from TechHaven" })).toBeVisible();
  await expect(productCards(page)).toHaveCount(5);
  const ids = await productCards(page).evaluateAll((cards) => cards.map((card) => card.getAttribute("data-product-id")));
  expect(ids).toEqual([
    "prod-wireless-earbuds-pro",
    "prod-smart-watch-series-5",
    "prod-wireless-gaming-mouse",
    "prod-power-bank-10000",
    "prod-gaming-laptop-15",
  ]);
  await page.getByRole("link", { name: "View Smart Watch Series 5" }).click();
  await expect(page).toHaveURL("/products/smart-watch-series-5");
  await expect(page.getByRole("heading", { level: 1, name: "Smart Watch Series 5" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL("/vendor/tech-haven");
  await expect(page.getByRole("heading", { level: 1, name: "TechHaven", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL("/products/wireless-earbuds-pro");
  await expect(page.getByRole("heading", { level: 1, name: "Wireless Earbuds Pro" })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL("/vendor/tech-haven");
  await expect(page.getByRole("heading", { level: 1, name: "TechHaven", exact: true })).toBeVisible();
});

test("Journey B: shared search selects a variant and a persisted cart line", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("combobox", { name: "Search products" }).filter({ visible: true });
  await search.fill("Cotton Panjabi");
  await page.getByRole("listbox", { name: "Search suggestions" }).filter({ visible: true })
    .getByRole("option", { name: /View all results for “Cotton Panjabi”/ }).click();
  await expect(page).toHaveURL(/\/products\?search=Cotton\+Panjabi$/);
  await expect(page.getByRole("heading", { name: "Search results for “Cotton Panjabi”" })).toBeVisible();
  await page.getByRole("link", { name: "View Cotton Panjabi" }).click();
  await expect(page).toHaveURL("/products/cotton-panjabi");
  await expect(page.getByRole("heading", { level: 1, name: "Cotton Panjabi" })).toBeVisible();
  await page.getByLabel("Size").selectOption("XL");
  const unitPrice = await page.getByRole("article").locator("p.font-head.text-3xl").textContent();
  const quantity = page.getByRole("group", { name: "Quantity" });
  await quantity.getByRole("button", { name: "Increase quantity" }).click();
  await quantity.getByRole("button", { name: "Increase quantity" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Cotton Panjabi added to your cart." })).toBeVisible();
  const cartLink = page.getByRole("link", { name: /Cart, 3 items/ });
  await cartLink.click();
  await expect(page).toHaveURL("/cart");
  await expect(page.getByRole("heading", { level: 1, name: "Your cart" })).toBeVisible();
  const line = page.getByRole("list", { name: "Cart items" }).getByRole("listitem");
  await expect(line).toContainText("Cotton Panjabi");
  await expect(line).toContainText("Size: XL");
  await expect(line.getByRole("group", { name: "Quantity for Cotton Panjabi" }).getByText("3", { exact: true })).toBeVisible();
  expect(unitPrice).toBeTruthy();
  const expectedUnitPrice = Number((unitPrice ?? "").replace(/[^\d]/gu, ""));
  await expect(line).toContainText(`৳${(expectedUnitPrice * 3).toLocaleString("en-US")}`);
  const saved = await page.evaluate(() => JSON.parse(window.localStorage.getItem("kenakata:demo-state") ?? "null") as {
    data: { carts: Array<{ customerId: string; items: Array<{ productId: string; variantId: string | null; quantity: number }> }> };
  });
  expect(saved.data.carts.find(({ customerId }) => customerId === "customer-demo")?.items)
    .toContainEqual(expect.objectContaining({ productId: "prod-cotton-panjabi", variantId: "var-panjabi-xl", quantity: 3 }));
  await page.reload();
  await expect(line).toContainText("Size: XL");
  await expect(line.getByRole("group", { name: "Quantity for Cotton Panjabi" }).getByText("3", { exact: true })).toBeVisible();
});

test("Journey C: vendor-scoped filters preserve ownership through wishlist refresh and history", async ({ page }) => {
  await page.goto("/vendor/tech-haven?minPrice=1000&maxPrice=2000&availability=in-stock&sort=price-asc");
  await expect(page.getByRole("heading", { level: 1, name: "TechHaven", exact: true })).toBeVisible();
  await expectFilteredTechHavenProducts(page);
  await page.getByRole("link", { name: "View Wireless Gaming Mouse" }).click();
  await expect(page).toHaveURL("/products/wireless-gaming-mouse");
  await expect(page.getByRole("heading", { level: 1, name: "Wireless Gaming Mouse" })).toBeVisible();
  await page.getByRole("button", { name: "Add Wireless Gaming Mouse to wishlist" }).click();
  await expect(page.getByRole("button", { name: "Remove Wireless Gaming Mouse from wishlist" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: /Wishlist/ }).click();
  await expect(page).toHaveURL("/wishlist");
  const wishlistItems = page.getByRole("list", { name: "Wishlist items" });
  await expect(wishlistItems.getByText("Wireless Gaming Mouse", { exact: true })).toBeVisible();
  await page.reload();
  await expect(wishlistItems.getByText("Wireless Gaming Mouse", { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL("/products/wireless-gaming-mouse");
  await page.goBack();
  await expect(page).toHaveURL(/\/vendor\/tech-haven\?/);
  await expect(page.getByRole("heading", { level: 1, name: "TechHaven", exact: true })).toBeVisible();
  await expectFilteredTechHavenProducts(page);
});

test("Journey D: restricted demo roles cannot read customer cart or wishlist, then customer state returns", async ({ page }) => {
  await page.goto("/products/bluetooth-speaker");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Bluetooth Speaker added to your cart." })).toBeVisible();
  await page.getByRole("button", { name: "Add Bluetooth Speaker to wishlist" }).click();
  await expect(page.getByRole("button", { name: "Remove Bluetooth Speaker from wishlist" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: /My account: Demo Customer/ }).click();
  await expect(page).toHaveURL("/account");
  await page.getByRole("link", { name: "Switch demo account" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("button", { name: "TechHaven seller Vendor demo account" }).click();
  await expect(page).toHaveURL("/vendor/tech-haven/dashboard");
  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Your cart is private" })).toBeVisible();
  await expect(page.getByText("Bluetooth Speaker", { exact: true })).toHaveCount(0);
  await page.goto("/wishlist");
  await expect(page.getByRole("heading", { name: "Your wishlist is private" })).toBeVisible();
  await expect(page.getByText("Bluetooth Speaker", { exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Switch demo account" }).click();
  await page.getByRole("button", { name: "Demo Customer Customer demo account" }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/cart");
  await expect(page.getByRole("list", { name: "Cart items" })).toContainText("Bluetooth Speaker");
  await page.goto("/wishlist");
  await expect(page.getByRole("list", { name: "Wishlist items" }).getByText("Bluetooth Speaker", { exact: true })).toBeVisible();
});

test("representative storefront routes fit the responsive viewport matrix", async ({ page }) => {
  const cases = [
    { width: 320, path: "/", heading: "Shop by category" },
    { width: 360, path: "/category/electronics/wearables/smart-watches", heading: "Smart watches" },
    { width: 390, path: "/products", heading: "All products" },
    { width: 390, path: "/products?search=10000mAh", heading: "Search results for “10000mAh”" },
    { width: 375, path: "/products?search=wireless", heading: "Search results for “wireless”" },
    { width: 768, path: "/products?search=wireless", heading: "Search results for “wireless”" },
    { width: 1024, path: "/products/bluetooth-speaker", heading: "Bluetooth Speaker" },
    { width: 1440, path: "/vendor/tech-haven", heading: "TechHaven" },
    { width: 320, path: "/cart", heading: "Your cart" },
    { width: 390, path: "/wishlist", heading: "Your wishlist" },
    { width: 390, path: "/products/over-ear-headphones", heading: "Noise-isolating Over-ear Headphones" },
    { width: 768, path: "/products/bluetooth-speaker", heading: "Bluetooth Speaker" },
    { width: 1440, path: "/products/bluetooth-speaker", heading: "Bluetooth Speaker" },
    { width: 1440, path: "/products/over-ear-headphones", heading: "Noise-isolating Over-ear Headphones" },
  ];
  for (const { width, path, heading } of cases) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    if (path === "/products?search=10000mAh") {
      await expect(productCards(page)).toHaveAttribute("data-product-id", "prod-power-bank-10000");
    }
    const dimensions = await page.evaluate(() => {
      const bounds = (element: Element | null) => {
        if (!element || !(element instanceof HTMLElement) || getComputedStyle(element).display === "none") return null;
        const rect = element.getBoundingClientRect();
        return { left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width), height: Math.round(rect.height) };
      };
      const computed = (element: Element | null) => {
        if (!element) return null;
        const style = getComputedStyle(element);
        return { gap: style.gap, minWidth: style.minWidth, flexShrink: style.flexShrink, paddingLeft: style.paddingLeft, paddingRight: style.paddingRight, fontSize: style.fontSize, position: style.position, right: style.right };
      };
      const header = document.querySelector("header");
      const headerRow = header?.firstElementChild ?? null;
      const logo = header?.querySelector('a[aria-label="Kenakata home"]') ?? null;
      const actions = header?.querySelector(".ml-auto") ?? null;
      const cartLink = header?.querySelector('a[href="/cart"]') ?? null;
      const visibleSearch = Array.from(header?.querySelectorAll('form[role="search"]') ?? [])
        .find((form) => form.getClientRects().length > 0);
      const searchButton = visibleSearch?.querySelector('button[type="submit"]') ?? null;
      const interactiveBounds = [
        ["menu", header?.querySelector("#open-drawer") ?? null],
        ["search", searchButton],
        ["wishlist", header?.querySelector('a[href="/wishlist"]') ?? null],
        ["account", header?.querySelector('a[href="/account"],a[href="/login"]') ?? null],
        ["cart", cartLink],
      ].flatMap(([label, element]) => {
        if (typeof label !== "string" || !element || !(element instanceof HTMLElement) || getComputedStyle(element).display === "none") return [];
        const rect = element.getBoundingClientRect();
        return [{ label, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height }];
      });
      const controls = {
        menu: bounds(header?.querySelector("#open-drawer") ?? null),
        logo: bounds(logo),
        search: Array.from(header?.querySelectorAll('form[role="search"]') ?? []).map(bounds),
        wishlist: bounds(header?.querySelector('a[href="/wishlist"]') ?? null),
        account: bounds(header?.querySelector('a[href="/account"],a[href="/login"]') ?? null),
        actions: bounds(actions),
        cart: bounds(cartLink),
        cartBadge: bounds(cartLink?.querySelector("span span") ?? null),
        interactiveBounds,
        computed: { headerRow: computed(headerRow), logo: computed(logo), actions: computed(actions), cart: computed(cartLink), badge: computed(cartLink?.querySelector("span span") ?? null) },
      };
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
        controls,
        overflowingElements: Array.from(document.body.querySelectorAll<HTMLElement>("*"))
          .flatMap((element) => {
            const rect = element.getBoundingClientRect();
            if (rect.width === 0 || rect.right <= document.documentElement.clientWidth + 0.5) return [];
            let ancestor = element.parentElement;
            while (ancestor && ancestor !== document.body) {
              if (["auto", "clip", "hidden", "scroll"].includes(getComputedStyle(ancestor).overflowX)) return [];
              ancestor = ancestor.parentElement;
            }
            const identity = `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${typeof element.className === "string" && element.className.trim() ? `.${element.className.trim().split(/\s+/u).join(".")}` : ""}`;
            return [{ identity: identity.slice(0, 160), left: Math.round(rect.left), right: Math.round(rect.right) }];
          })
          .slice(0, 12),
      };
    });
    expect(dimensions.documentWidth, `${path} at ${width}px; header controls: ${JSON.stringify(dimensions.controls)}; overflowing elements: ${JSON.stringify(dimensions.overflowingElements)}`)
      .toBeLessThanOrEqual(dimensions.viewportWidth);
    for (const control of dimensions.controls.interactiveBounds) {
      expect(control.left, `${control.label} left edge at ${width}px`).toBeGreaterThanOrEqual(0);
      expect(control.right, `${control.label} right edge at ${width}px`).toBeLessThanOrEqual(dimensions.viewportWidth);
      expect(control.width, `${control.label} width at ${width}px`).toBeGreaterThanOrEqual(44);
      expect(control.height, `${control.label} height at ${width}px`).toBeGreaterThanOrEqual(44);
    }
    for (let index = 0; index < dimensions.controls.interactiveBounds.length; index += 1) {
      const current = dimensions.controls.interactiveBounds[index];
      for (const other of dimensions.controls.interactiveBounds.slice(index + 1)) {
        const overlaps = current.left < other.right && current.right > other.left && current.top < other.bottom && current.bottom > other.top;
        expect(overlaps, `${current.label} overlaps ${other.label} at ${width}px`).toBe(false);
      }
    }
    const badge = dimensions.controls.cartBadge;
    if (badge) {
      expect(badge.left, `cart count badge left edge at ${width}px`).toBeGreaterThanOrEqual(0);
      expect(badge.right, `cart count badge right edge at ${width}px`).toBeLessThanOrEqual(dimensions.viewportWidth);
    }
    if (path === "/products/over-ear-headphones") {
      const imageParents = await page.locator('img[data-nimg="fill"]:visible').evaluateAll((images) => images.map((image) => ({
        src: image.getAttribute("src"),
        parentHeight: image.parentElement?.getBoundingClientRect().height ?? 0,
      })));
      expect(imageParents.length).toBeGreaterThan(0);
      for (const image of imageParents) expect(image.parentHeight, `visible fill image parent for ${image.src} at ${width}px`).toBeGreaterThan(0);
    }
  }
});
