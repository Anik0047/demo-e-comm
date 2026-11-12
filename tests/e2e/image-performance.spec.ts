import { expect, test } from "@playwright/test";

async function startMetrics(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const metrics: { lcp: Array<{ tag: string; src: string; size: number; startTime: number }>; cls: number } = { lcp: [], cls: 0 };
    Object.defineProperty(window, "__imageMetrics", { value: metrics });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { element?: Element; size: number }>) {
        const element = entry.element as HTMLImageElement | null;
        metrics.lcp.push({ tag: element?.tagName ?? "text", src: element?.currentSrc ?? "", size: entry.size, startTime: entry.startTime });
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
        if (!entry.hadRecentInput) metrics.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
}

async function readMetrics(page: import("@playwright/test").Page) {
  return page.evaluate(() => (window as unknown as { __imageMetrics: { lcp: Array<{ tag: string; src: string; size: number; startTime: number }>; cls: number } }).__imageMetrics);
}

test.describe("storefront image performance", () => {
  test("home product images stay lazy and reserve square card space", async ({ page }, testInfo) => {
    await startMetrics(page);
    await page.goto("/");
    await page.waitForTimeout(1200);

    const heroImages = await page.locator("#hero img").count();
    expect(heroImages).toBe(0);
    const eagerProductImages = await page.locator("article img[loading='eager']").count();
    expect(eagerProductImages).toBe(0);

    const metrics = await readMetrics(page);
    console.info(`[image-metrics] ${testInfo.project.name} ${JSON.stringify(metrics)}`);
    testInfo.annotations.push({ type: "observed-image-metrics", description: JSON.stringify(metrics) });
    expect(metrics.cls).toBeLessThanOrEqual(0.1);
  });

  test("catalog keeps below-fold product images lazy", async ({ page }, testInfo) => {
    await startMetrics(page);
    await page.goto("/products");
    await page.waitForTimeout(1200);
    const images = page.locator("ul[aria-label='Products'] img");
    await expect(images.first()).toHaveAttribute("loading", "lazy");
    await expect(images.first()).toHaveAttribute("fetchpriority", "auto");
    await expect(images.nth(1)).toHaveAttribute("loading", "lazy");
    await expect(images.nth(1)).toHaveAttribute("fetchpriority", "auto");
    await expect(images.nth(2)).toHaveAttribute("loading", "lazy");
    await expect(images.first()).toHaveAttribute("sizes", /calc\(/);

    const metrics = await readMetrics(page);
    console.info(`[image-metrics] ${testInfo.project.name} /products ${JSON.stringify(metrics)}`);

    const dimensions = await images.first().evaluate((image) => {
      const box = image.parentElement?.getBoundingClientRect();
      return box ? { width: box.width, height: box.height, top: box.top, bottom: box.bottom } : null;
    });
    expect(dimensions).not.toBeNull();
    expect(Math.abs((dimensions?.width ?? 0) - (dimensions?.height ?? 0))).toBeLessThanOrEqual(1);
    console.info(`[image-frame] ${testInfo.project.name} /products ${JSON.stringify(dimensions)}`);
    expect(dimensions?.top).toBeGreaterThan(await page.evaluate(() => window.innerHeight));
  });

  test("PDP gallery prioritizes the active image and defers the other gallery images", async ({ page }, testInfo) => {
    await startMetrics(page);
    const powerBankImageRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("JETech_Powerbank_10000mAh-5076.jpg")) powerBankImageRequests.push(request.url());
    });
    await page.goto("/products/power-bank-10000");
    await page.waitForTimeout(1200);
    const gallery = page.locator("[aria-label='10000mAh Power Bank images']");
    const images = gallery.locator("img");
    await expect(images.first()).toHaveAttribute("loading", "eager");
    await expect(images.first()).toHaveAttribute("fetchpriority", "high");
    const desktop = await page.evaluate(() => window.matchMedia("(min-width: 768px)").matches);
    await expect(images.nth(1)).toHaveAttribute("loading", "eager");
    await expect(images.nth(2)).toHaveAttribute("loading", desktop ? "eager" : "lazy");
    if (desktop) await expect(images.nth(2)).toHaveAttribute("fetchpriority", "auto");
    await expect(images.nth(3)).toHaveAttribute("loading", "lazy");
    expect(powerBankImageRequests.length).toBe(1);
    const metrics = await readMetrics(page);
    console.info(`[image-metrics] ${testInfo.project.name} /products/power-bank-10000 ${JSON.stringify(metrics)}`);
  });

  test("failed PDP images show the fallback without changing the square frame", async ({ page }) => {
    await page.route("**/_next/image**", (route) => route.abort());
    await page.goto("/products/bluetooth-speaker");
    const gallery = page.getByRole("region", { name: "Bluetooth Speaker images" });
    const frame = gallery.locator("button:visible").first();
    const before = await frame.boundingBox();
    await expect(gallery.getByRole("status").filter({ hasText: "Image unavailable" }).filter({ visible: true })).toHaveText("Image unavailable");
    const after = await frame.boundingBox();
    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(Math.abs((before?.width ?? 0) - (after?.width ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((before?.height ?? 0) - (after?.height ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((after?.width ?? 0) - (after?.height ?? 0))).toBeLessThanOrEqual(1);
  });
});
