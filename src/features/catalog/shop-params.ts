export type ShopParams = { [key: string]: string | string[] | undefined };
export type ShopState = { q: string; category: string; sort: "newest" | "price-asc" | "price-desc"; page: number };
const first = (value: string | string[] | undefined) => typeof value === "string" ? value : "";

export function parseShopParams(raw: ShopParams): ShopState {
  const q = first(raw.q).trim().slice(0, 100);
  const category = first(raw.category);
  const sort = first(raw.sort);
  const page = first(raw.page);
  return {
    q, category: /^[a-z0-9]+(-[a-z0-9]+)*$/.test(category) && category.length <= 100 ? category : "",
    sort: sort === "price-asc" || sort === "price-desc" ? sort : "newest",
    page: /^[1-9]\d{0,3}$/.test(page) ? Number(page) : 1,
  };
}

export function shopHref(state: ShopState, page: number): string {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.category) params.set("category", state.category);
  if (state.sort !== "newest") params.set("sort", state.sort);
  if (page > 1) params.set("page", String(page));
  return `/shop${params.size ? `?${params}` : ""}`;
}

/** Only unfiltered, populated listing pages are indexing candidates. */
export function shopSeo(raw: ShopParams, total: number, pageSize: number) {
  const state = parseShopParams(raw);
  const clean = Object.keys(raw).every(key => ["q", "category", "sort", "page"].includes(key)) &&
    Object.values(raw).every(value => !Array.isArray(value)) &&
    (!raw.page || /^[1-9]\d{0,3}$/.test(raw.page as string)) &&
    (!raw.sort || raw.sort === "newest") && (!raw.category || state.category !== "");
  return {
    path: shopHref(state, state.page),
    index: clean && !state.q && !state.category && state.sort === "newest" &&
      total > 0 && state.page <= Math.ceil(total / pageSize),
  };
}
