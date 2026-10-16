import { test } from "node:test";
import { strict as assert } from "node:assert";
import { productCardSizes, productDetailSizes, productThumbnailSizes } from "../../components/commerce/product-image-sizes";

const widths = [320, 375, 380, 381, 650, 651, 768, 900, 901, 1024, 1232, 1233, 1440];
function advertisedWidth(sizes: string, width: number) {
  const clause = sizes.split(", ").find((part) => {
    const media = part.match(/^\(max-width: (\d+)px\)/);
    return !media || width <= Number(media[1]);
  })!;
  const value = clause.replace(/^\(max-width: \d+px\) /, "");
  const calculated = value.match(/^calc\((\d+(?:\.\d+)?)vw - (\d+(?:\.\d+)?)px\)$/);
  if (calculated) return Number(calculated[1]) * width / 100 - Number(calculated[2]);
  assert.match(value, /^\d+(?:\.\d+)?px$/);
  return Number(value.slice(0, -2));
}

test("product card sizes match container, columns, gaps and borders at layout boundaries", () => {
  for (const width of widths) {
    const columns = width <= 650 ? 2 : width <= 900 ? 3 : 4;
    const gap = width <= 380 ? 7 : width <= 650 ? 10 : 18;
    const rendered = (Math.min(width - 32, 1200) - gap * (columns - 1)) / columns - 2;
    assert.ok(Math.abs(advertisedWidth(productCardSizes, width) - rendered) < 0.001, `card at ${width}px`);
  }
});

test("detail sizes match full-width mobile and half-container desktop at layout boundaries", () => {
  for (const width of widths) {
    const container = Math.min(width - 32, 1200);
    const rendered = (width <= 650 ? container : (container - 40) / 2) - 2;
    assert.equal(advertisedWidth(productDetailSizes, width), rendered, `detail at ${width}px`);
    assert.ok(advertisedWidth(productDetailSizes, width) > advertisedWidth(productCardSizes, width));
  }
});

test("thumbnail sizes match four-column detail gallery without main-image overfetch", () => {
  for (const width of widths) {
    const container = Math.min(width - 32, 1200);
    const gallery = width <= 650 ? container : (container - 40) / 2;
    const rendered = (gallery - 30) / 4 - 2;
    assert.equal(advertisedWidth(productThumbnailSizes, width), rendered, `thumbnail at ${width}px`);
    assert.ok(advertisedWidth(productThumbnailSizes, width) < advertisedWidth(productDetailSizes, width) / 4);
  }
});
