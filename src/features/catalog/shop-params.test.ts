import { languageAlternates } from "@/i18n/routing";
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { parseShopParams, shopHref, shopSeo } from "./shop-params";

test("shop params validate hostile and repeated URL inputs", () => {
  assert.deepEqual(parseShopParams({ q: ["duplicate"], sort: "unknown", page: "-1", category: "../bad" }), { q: "", sort: "newest", page: 1, category: "" });
  assert.deepEqual(parseShopParams({ q: "  rc car  ", category: "rc-cars", sort: "price-asc", page: "2" }), { q: "rc car", category: "rc-cars", sort: "price-asc", page: 2 });
  assert.equal(parseShopParams({ page: "10000" }).page, 1);
});

test("pagination preserves encoded filters without retaining page 1", () => {
  const state = parseShopParams({ q: "a & b", category: "home-lighting", sort: "price-desc", page: "3" });
  assert.equal(shopHref(state, 1), "/shop?q=a+%26+b&category=home-lighting&sort=price-desc");
  assert.equal(shopHref(state, 4), "/shop?q=a+%26+b&category=home-lighting&sort=price-desc&page=4");
});

test("shop SEO self-canonicalizes first, second and later listing pages in both locales", () => {
  for (const page of [1, 2, 3]) {
    const seo = shopSeo({ page: String(page) }, 30, 12);
    assert.equal(seo.path, page === 1 ? "/shop" : `/shop?page=${page}`);
    assert.equal(seo.index, true);
    const alternates = languageAlternates("bn", seo.path);
    assert.equal(alternates.canonical, `/bn${seo.path}`);
    assert.equal(alternates.languages["en-BD"], `/en${seo.path}`);
    assert.equal(alternates.languages["bn-BD"], `/bn${seo.path}`);
  }
});

test("invalid and repeated pages normalize safely and remain noindex", () => {
  for (const page of ["-1", "0", "01", "2.5", "10000", "abc", ["2", "3"]]) {
    assert.deepEqual(shopSeo({ page }, 30, 12), { path: "/shop", index: false });
  }
  assert.equal(shopSeo({ page: "9999" }, 30, 12).index, false);
  assert.equal(shopSeo({}, 0, 12).index, false);
});

test("empty search and default filters normalize to the base canonical", () => {
  assert.deepEqual(shopSeo({ q: "  ", category: "", sort: "newest", page: "1" }, 30, 12), { path: "/shop", index: true });
});

test("search, sorting and category facets stay functional with normalized noindex canonicals", () => {
  for (const raw of [{ q: "rc car" }, { sort: "price-asc" }, { sort: "price-desc" }, { category: "rc-cars" }, { q: "rc car", category: "rc-cars", sort: "price-desc", page: "2" }]) {
    const state = parseShopParams(raw);
    assert.deepEqual(shopSeo(raw, 30, 12), { path: shopHref(state, state.page), index: false });
  }
  assert.equal(shopSeo({ category: "../bad" }, 30, 12).index, false);
  assert.equal(shopSeo({ sort: "unknown" }, 30, 12).index, false);
});

test("reordered queries share canonicals; repeated and unknown parameters are noindex", () => {
  assert.deepEqual(shopSeo({ page: "2", q: "a & b", category: "rc-cars" }, 30, 12), shopSeo({ category: "rc-cars", q: "a & b", page: "2" }, 30, 12));
  for (const raw of [{ q: ["", "car"] }, { category: ["rc-cars", "other"] }, { sort: ["newest", "price-asc"] }, { utm_source: "test", page: "2" }]) assert.equal(shopSeo(raw, 30, 12).index, false);
});
