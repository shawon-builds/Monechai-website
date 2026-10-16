import { test } from "node:test";
import assert from "node:assert/strict";
import { languageAlternates, localePath, pathLocale } from "@/i18n/routing";
import { productStructuredData } from "@/features/catalog/structured-data";

test("locale URLs preserve queries and anchors, avoid doubled prefixes and keep canonical alternatives", () => {
  assert.equal(localePath("bn", "/en/shop?q=lamp&page=2#filters"), "/bn/shop?q=lamp&page=2#filters");
  assert.equal(localePath("en", "/"), "/en");
  assert.equal(localePath("en", "/bn"), "/en");
  assert.equal(pathLocale("/bng/shop"), null);
  assert.equal(pathLocale("/bn/shop"), "bn");
  assert.throws(() => localePath("en", "//external.test"));
  assert.deepEqual(languageAlternates("bn", "/products/lamp"), { canonical: "/bn/products/lamp", languages: { "en-BD": "/en/products/lamp", "bn-BD": "/bn/products/lamp", "x-default": "/en/products/lamp" } });
});
test("product structured data uses the current language URL, approved text and effective price", () => {
  const data = productStructuredData({ slug: "lamp", nameEn: "Lamp", nameBn: "বাতি", descriptionEn: "Lamp details", descriptionBn: "বাতির বিবরণ", priceMinor: 12500, variants: [{ available: true }], images: [] }, "https://example.com", "bn");
  assert.equal(data.name, "বাতি"); assert.equal(data.description, "বাতির বিবরণ");
  assert.equal(data.offers.url, "https://example.com/bn/products/lamp"); assert.equal(data.offers.price, "125.00");
});
