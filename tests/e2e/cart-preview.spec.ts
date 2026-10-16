import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { CART_PREVIEW_TIMEOUT_MS } from "../../src/features/cart/preview";

type PreviewRequest = { quantity: number; signal: AbortSignal; resolve: (name: string) => void };
declare global { interface Window { cartPreviewRequests: PreviewRequest[] } }

async function openCart(page: Page, locale = "en") {
  await page.addInitScript(() => {
    const variantId = "00000000-0000-4000-8000-000000000001";
    localStorage.setItem("monechai:cart:v1", JSON.stringify([{ variantId, quantity: 1 }]));
    window.cartPreviewRequests = [];
    const originalFetch = window.fetch;
    window.fetch = (input, options) => {
      if (input !== "/api/checkout/preview" || !document.querySelector<HTMLDialogElement>("dialog.cart-drawer")?.open) return originalFetch(input, options);
      const quantity = JSON.parse(String(options?.body)).items[0].quantity;
      // Deliberately ignore abort when resolving: tests verify the identity fence
      // as well as the AbortSignal sent to native fetch in production.
      return new Promise<Response>((resolve) => window.cartPreviewRequests.push({ quantity, signal: options!.signal as AbortSignal, resolve: (name) => resolve(Response.json({ lines: [{ variantId, name, label: "Server variant", available: true, unitPriceMinor: 12345 }] })) }));
    };
  });
  await page.goto(`/${locale}`);
  await page.getByRole("button", { name: locale === "en" ? "Cart" : "কার্ট", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.cartPreviewRequests.length)).toBe(1);
}

for (const locale of ["en", "bn"]) test(`cart preview deadline and explicit retry recover server pricing (${locale})`, async ({ page }, testInfo) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install(); await openCart(page, locale);
  await page.clock.fastForward(CART_PREVIEW_TIMEOUT_MS);
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByRole("alert")).toBeVisible();
  await expect(drawer).not.toContainText(locale === "en" ? "Checking item…" : "পণ্য যাচাই হচ্ছে…");
  expect(await page.evaluate(() => window.cartPreviewRequests[0].signal.aborted)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath(`cart-timeout-${locale}.png`) });
  await drawer.getByRole("button", { name: locale === "en" ? "Try again" : "আবার চেষ্টা করুন", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.cartPreviewRequests.length)).toBe(2);
  await page.evaluate(() => window.cartPreviewRequests[1].resolve("Server-priced item"));
  await expect(drawer).toContainText("Server-priced item");
  await expect(drawer.getByRole("alert")).toHaveCount(0);
  await page.evaluate(() => window.cartPreviewRequests[0].resolve("Stale timed-out item"));
  await page.clock.fastForward(CART_PREVIEW_TIMEOUT_MS);
  await expect(drawer).not.toContainText("Stale timed-out item");
  await expect(drawer).toContainText(locale === "en" ? "123.45" : "১২৩.৪৫");
  expect(await page.evaluate(() => window.cartPreviewRequests[1].signal.aborted)).toBe(false);
  expect(errors).toEqual([]);
});

test("rapid cart quantities cancel old previews and stale responses cannot overwrite latest server results", async ({ page }) => {
  await openCart(page);
  const drawer = page.getByRole("dialog"); const quantity = drawer.getByRole("spinbutton", { name: "Quantity" });
  await quantity.fill("2"); await quantity.fill("3");
  await expect.poll(() => page.evaluate(() => window.cartPreviewRequests.map((call) => [call.quantity, call.signal.aborted]))).toEqual([[1, true], [2, true], [3, false]]);
  // An unchanged edit must not create another preview.
  await quantity.fill("3");
  expect(await page.evaluate(() => window.cartPreviewRequests.length)).toBe(3);
  await page.evaluate(() => window.cartPreviewRequests[2].resolve("Latest server item"));
  await expect(drawer).toContainText("Latest server item");
  await page.evaluate(() => { window.cartPreviewRequests[0].resolve("Slow old item"); window.cartPreviewRequests[1].resolve("Another old item"); });
  await expect(drawer).toContainText("Latest server item"); await expect(drawer).not.toContainText("old item");
  await expect(quantity).toHaveValue("3");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("monechai:cart:v1")!)[0].quantity)).toBe(3);
});

test("cart close, Escape, reopen, checkout and component unmount cancel previews without late errors", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install(); await openCart(page);
  const drawer = page.getByRole("dialog"); const cart = page.getByRole("button", { name: "Cart", exact: true });
  await drawer.getByRole("button", { name: "Close cart" }).click();
  expect(await page.evaluate(() => window.cartPreviewRequests[0].signal.aborted)).toBe(true);
  await cart.click(); await expect.poll(() => page.evaluate(() => window.cartPreviewRequests.length)).toBe(2);
  await page.keyboard.press("Escape"); await expect(drawer).not.toBeVisible(); await expect(cart).toBeFocused();
  expect(await page.evaluate(() => window.cartPreviewRequests[1].signal.aborted)).toBe(true);
  await cart.click(); await expect.poll(() => page.evaluate(() => window.cartPreviewRequests.length)).toBe(3);
  await drawer.getByRole("link", { name: "Proceed to checkout" }).click(); await expect(page).toHaveURL(/\/en\/checkout$/);
  expect(await page.evaluate(() => window.cartPreviewRequests[2].signal.aborted)).toBe(true);
  await cart.click();
  const index = await page.evaluate(() => window.cartPreviewRequests.length - 1);
  // Next's locale navigation replaces the layout containing the open drawer;
  // force selects the control behind the modal without closing the dialog first.
  await page.getByRole("combobox", { name: "Language / ভাষা" }).selectOption("bn", { force: true });
  await expect(page).toHaveURL(/\/bn\/checkout$/);
  expect(await page.evaluate((requestIndex) => window.cartPreviewRequests[requestIndex].signal.aborted, index)).toBe(true);
  await page.evaluate(() => window.cartPreviewRequests.forEach((call) => call.resolve("Late cancelled item")));
  await page.clock.fastForward(CART_PREVIEW_TIMEOUT_MS);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveCount(0);
  expect(errors).toEqual([]);
});
