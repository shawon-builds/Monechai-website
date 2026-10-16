import { test, expect } from "@playwright/test";
import postgres from "postgres";
import sharp from "sharp";
import AxeBuilder from "@axe-core/playwright";
import { productCardSizes, productDetailSizes, productThumbnailSizes } from "../../src/components/commerce/product-image-sizes";

const sql = postgres(process.env.TEST_DATABASE_URL!, { ssl: false, max: 1 });
const slug = `image-${crypto.randomUUID()}`;
const categorySlug = `images-${crypto.randomUUID()}`;
let categoryId = "";

// Synthetic high-contrast fixture, no customer images or remote Storage requests.
const fixture = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048" viewBox="0 0 2048 2048"><rect width="2048" height="2048" fill="#faf9f7"/><path d="M0 0H1024V1024H0Z M1024 1024H2048V2048H1024Z" fill="#242322"/><circle cx="1024" cy="1024" r="512" fill="#c99a61"/><path d="M0 1024H2048M1024 0V2048" stroke="#ffffff" stroke-width="8"/></svg>`);

test.beforeAll(async () => {
  [{ id: categoryId }] = await sql`insert into categories (slug,name_en,name_bn) values (${categorySlug}, 'Image fixtures', 'ছবি পরীক্ষা') returning id`;
  const [{ id: productId }] = await sql`insert into products (slug,sku,category_id,name_en,name_bn,price_minor,is_published) values (${slug}, ${crypto.randomUUID()}, ${categoryId}, 'Image fixture', 'ছবি পরীক্ষা', 10000, true) returning id`;
  await sql`insert into product_variants (product_id,sku,stock_quantity) values (${productId}, ${crypto.randomUUID()}, 1)`;
  for (const index of [0, 1]) {
    await sql`insert into product_images (product_id,storage_key,alt_en,alt_bn,sort_order,is_primary,verified_at) values (${productId}, ${`fixtures/image-${index}.jpg`}, ${`Image fixture ${index}`}, ${`ছবি পরীক্ষা ${index}`}, ${index}, ${index === 0}, now())`;
  }
});

test.afterAll(async () => {
  if (categoryId) {
    await sql`delete from products where category_id=${categoryId}`;
    await sql`delete from categories where id=${categoryId}`;
  }
  await sql.end();
});

for (const width of [320, 375, 768, 1024, 1440]) {
  for (const dpr of [1, 2]) {
    test(`product image sizing at ${width}px DPR ${dpr}`, async ({ browser }, testInfo) => {
      const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: dpr });
      const page = await context.newPage();
      let releaseImages!: () => void;
      const imageGate = new Promise<void>((resolve) => { releaseImages = resolve; });
      const requestedWidths: number[] = [];
      await context.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (url.origin !== "http://127.0.0.1:3104") return route.abort();
        if (url.pathname !== "/_next/image") return route.continue();
        const source = new URL(url.searchParams.get("url")!);
        expect(source.protocol).toBe("https:");
        expect(source.pathname).toMatch(/^\/storage\/v1\/object\/public\/products\/fixtures\/image-[01]\.jpg$/);
        const imageWidth = Number(url.searchParams.get("w"));
        expect(imageWidth).toBeGreaterThan(0);
        expect(imageWidth).toBeLessThanOrEqual(2048);
        requestedWidths.push(imageWidth);
        await imageGate;
        const body = await sharp(fixture).resize(imageWidth, imageWidth).jpeg({ quality: 75 }).toBuffer();
        await route.fulfill({ status: 200, contentType: "image/jpeg", body });
      });
      await page.addInitScript(() => {
        const state = window as unknown as Window & { imageLayoutShift: number };
        state.imageLayoutShift = 0;
        new PerformanceObserver((entries) => {
          for (const item of entries.getEntries()) {
            const entry = item as PerformanceEntry & { hadRecentInput: boolean; value: number; sources?: { node?: Node }[] };
            if (!entry.hadRecentInput && entry.sources?.some(({ node }) => node instanceof Element && node.closest(".detail-gallery"))) state.imageLayoutShift += entry.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      try {
        await page.goto(`http://127.0.0.1:3104/en/products/${slug}`, { waitUntil: "domcontentloaded" });
        const main = page.locator(".detail-gallery > .product-image > img");
        await expect(main).toHaveAttribute("sizes", productDetailSizes);
        const before = await main.boundingBox();
        expect(before).not.toBeNull();
        releaseImages();
        const images = [main, page.locator(".gallery-thumbs .product-image > img").first()];
        for (const [index, image] of images.entries()) {
          await image.scrollIntoViewIfNeeded();
          await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
          await expect(image).toHaveAttribute("sizes", index === 0 ? productDetailSizes : productThumbnailSizes);
          const metrics = await image.evaluate(async (img: HTMLImageElement) => {
            const rect = img.getBoundingClientRect();
            const candidates = img.srcset.split(",").map((part) => Number(part.trim().match(/ (\d+)w$/)?.[1])).filter(Boolean);
            const selectedWidth = Number(new URL(img.currentSrc).searchParams.get("w"));
            const bitmap = await createImageBitmap(await (await fetch(img.currentSrc)).blob());
            const clause = img.sizes.split(",").map((part) => part.trim()).find((part) => !part.startsWith("(") || matchMedia(part.slice(0, part.indexOf(")") + 1)).matches)!;
            const probe = document.createElement("div");
            probe.style.cssText = "position:absolute;visibility:hidden;height:0";
            probe.style.width = clause.startsWith("(") ? clause.slice(clause.indexOf(")") + 1).trim() : clause;
            document.body.append(probe);
            const advertisedWidth = probe.getBoundingClientRect().width;
            probe.remove();
            const result = { width: rect.width, height: rect.height, sizes: img.sizes, srcset: img.srcset, currentSrc: img.currentSrc, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, intrinsicWidth: bitmap.width, intrinsicHeight: bitmap.height, dpr: devicePixelRatio, selectedWidth, candidates, advertisedWidth, loading: img.loading };
            bitmap.close();
            return result;
          });
          console.log(`IMAGE ${width}px DPR${dpr} ${index === 0 ? "detail" : "thumbnail"}: displayed=${metrics.width} selected=${metrics.selectedWidth} intrinsic=${metrics.intrinsicWidth} natural=${metrics.naturalWidth} loading=${metrics.loading || "eager"}`);
          expect(metrics.dpr).toBe(dpr);
          expect(metrics.srcset).toContain("w");
          expect(metrics.width).toBeCloseTo(metrics.height, 1);
          expect(Math.abs(metrics.width - metrics.advertisedWidth)).toBeLessThan(0.1);
          expect(metrics.intrinsicWidth).toBe(metrics.selectedWidth);
          expect(metrics.intrinsicHeight).toBe(metrics.selectedWidth);
          expect(metrics.selectedWidth).toBeGreaterThanOrEqual(Math.floor(metrics.width * dpr));
          const sufficient = metrics.candidates.filter((candidate) => candidate >= metrics.advertisedWidth * dpr);
          expect(metrics.selectedWidth).toBe(Math.min(...sufficient));
          expect(metrics.loading === "lazy").toBe(index !== 0);
          await testInfo.attach(index === 0 ? "detail-image-metrics" : "thumbnail-image-metrics", { body: JSON.stringify(metrics, null, 2), contentType: "application/json" });
        }
        const after = await main.boundingBox();
        expect(after?.width).toBeCloseTo(before!.width, 1);
        expect(after?.height).toBeCloseTo(before!.height, 1);
        expect(await page.evaluate(() => (window as unknown as Window & { imageLayoutShift: number }).imageLayoutShift)).toBe(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
        if (width === 375 && dpr === 1) expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations).toEqual([]);
        await page.screenshot({ path: testInfo.outputPath(`detail-${width}-dpr${dpr}.png`), fullPage: true });
        await page.goto(`http://127.0.0.1:3104/bn/products/${slug}`);
        await expect(page.locator(".detail-gallery > .product-image > img")).toHaveAttribute("sizes", productDetailSizes);
        await expect(page.locator(".detail-gallery > .product-image > img")).toHaveAttribute("alt", "ছবি পরীক্ষা 0");
        await page.goto(`http://127.0.0.1:3104/en/shop?category=${categorySlug}`);
        const card = page.locator(".product-card .product-image > img");
        await expect(card).toHaveAttribute("sizes", productCardSizes);
        await expect(card).toHaveAttribute("loading", "lazy");
        const cardMetrics = await card.evaluate((img: HTMLImageElement) => ({ width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height, currentSrc: img.currentSrc, sizes: img.sizes }));
        expect(cardMetrics.width).toBeCloseTo(cardMetrics.height, 1);
        expect(cardMetrics.width).toBeLessThan(before!.width);
        await testInfo.attach("card-image-metrics", { body: JSON.stringify(cardMetrics, null, 2), contentType: "application/json" });
        expect(Math.max(...requestedWidths)).toBeLessThanOrEqual(1200);
      } finally {
        releaseImages();
        await context.close();
      }
    });
  }
}
