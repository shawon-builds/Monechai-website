import { test } from "node:test";
import assert from "node:assert/strict";
import { breadcrumbStructuredData, productStructuredData, safeJsonLd, storeStructuredData } from "./structured-data";
import { publicSiteOrigin, siteOrigin } from "@/lib/site-url";
import { storefrontSharing } from "@/lib/storefront-metadata";

test("entity schema contains only verified identity and stable cross-references", () => {
  const data = storeStructuredData("Monechai", "https://store.example");
  assert.equal(data["@context"], "https://schema.org");
  const [organization, website] = data["@graph"];
  assert.equal(organization["@type"], "Organization");
  assert.equal(website["@type"], "WebSite");
  assert.equal(website.publisher?.["@id"], organization["@id"]);
  assert.deepEqual(Object.keys(organization).sort(), ["@type", "@id", "name", "url", "logo"].sort());
  assert.doesNotMatch(JSON.stringify(data), /address|telephone|email|sameAs|rating|review|ReturnPolicy|shippingDetails|legalName/);
});

test("breadcrumb vocabulary, positions and localized absolute URLs match visible trail", () => {
  for (const locale of ["en", "bn"]) {
    const data = breadcrumbStructuredData([{ name: "Home", path: `/${locale}` }, { name: "Shop", path: `/${locale}/shop?page=2` }], "https://store.example");
    assert.equal(data["@type"], "BreadcrumbList");
    assert.deepEqual(data.itemListElement, [{ "@type": "ListItem", position: 1, name: "Home", item: `https://store.example/${locale}` }, { "@type": "ListItem", position: 2, name: "Shop", item: `https://store.example/${locale}/shop?page=2` }]);
  }
});

test("Product/Offer preserves effective BDT price, stock, condition and escaped content", () => {
  const product = { slug: "fixture", nameEn: "English", nameBn: "বাংলা", descriptionEn: "</script><script>bad &", priceMinor: 12005, variants: [{ available: true }], images: [] };
  for (const locale of ["en", "bn"] as const) {
    const data = productStructuredData(product, "https://store.example", locale);
    assert.equal(data.name, locale === "en" ? "English" : "বাংলা");
    assert.equal(data.offers.price, "120.05"); assert.equal(data.offers.priceCurrency, "BDT");
    assert.equal(data.offers.itemCondition, "https://schema.org/NewCondition");
    assert.equal(data.offers.availability, "https://schema.org/InStock");
    assert.equal(data.offers.url, `https://store.example/${locale}/products/fixture`);
    assert.equal(productStructuredData({ ...product, variants: [{ available: false }] }, "https://store.example").offers.availability, "https://schema.org/OutOfStock");
    const serialized = safeJsonLd(data); assert.doesNotMatch(serialized, /[<>&]/); assert.deepEqual(JSON.parse(serialized), JSON.parse(JSON.stringify(data)));
    assert.doesNotMatch(serialized, /AggregateRating|review|shippingDetails|MerchantReturnPolicy/);
  }
});

test("sharing metadata uses configured canonical origin and approved raster logo only", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    for (const locale of ["en", "bn"] as const) {
      process.env.NEXT_PUBLIC_SITE_URL = "https://store.example";
      const data = storefrontSharing(locale, "/shop?page=2", "Shop", "Browse products");
      assert.equal(data.openGraph && "url" in data.openGraph && data.openGraph.url, `https://store.example/${locale}/shop?page=2`);
      assert.match(JSON.stringify(data), /https:\/\/store.example\/social-logo.png/);
      assert.match(JSON.stringify(data.twitter), /summary_large_image/);
    }
    for (const value of [undefined, "https://example.test/unsafe", "https://user:secret@example.test", "bad"]) {
      if (value === undefined) delete process.env.NEXT_PUBLIC_SITE_URL; else process.env.NEXT_PUBLIC_SITE_URL = value;
      const data = storefrontSharing("bn", "/", "Monechai", "Browse");
      assert.doesNotMatch(JSON.stringify(data), /social-logo|localhost|secret/);
    }
  } finally { if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL; else process.env.NEXT_PUBLIC_SITE_URL = previous; }
});

test("only a clean HTTPS production origin is published", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/";
    assert.equal(siteOrigin(), "https://example.com");
    assert.equal(publicSiteOrigin(), "https://example.com");
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    assert.equal(publicSiteOrigin(), null);
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/path";
    assert.equal(siteOrigin(), null);
  } finally { if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL; else process.env.NEXT_PUBLIC_SITE_URL = previous; }
});

test("Product JSON-LD uses real price and stock without fabricated reviews", () => {
  const data = productStructuredData({ slug: "test-item", nameEn: "</script><script>alert(1)</script>", descriptionEn: null, priceMinor: 12345, variants: [{ available: false }], images: [] }, "https://example.com");
  const json = safeJsonLd(data);
  assert.equal(json.includes("</script>"), false);
  assert.equal(JSON.parse(json).offers.price, "123.45");
  assert.equal(JSON.parse(json).offers.availability, "https://schema.org/OutOfStock");
  assert.equal(json.includes("aggregateRating"), false);
});
