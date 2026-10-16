import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { allowRequest, checkoutRateKey } from "@/features/checkout/abuse";
import { getDb } from "@/db/client";
import { getPublishedProduct, listCategories, listPublishedProducts, type CatalogFilters } from "./queries";

const guardCatalog = cache(async () => {
  const h = await headers();
  if (!await allowRequest("catalog", checkoutRateKey(new Request("http://localhost", { headers: h })), 240, 60_000)) throw new Error("Catalog request limit reached");
});
export const getCatalogCategories = async () => { await guardCatalog(); return listCategories(getDb()); };
export const getCatalogProducts = async (filters: CatalogFilters = {}) => { await guardCatalog(); return listPublishedProducts(getDb(), filters); };
export const getCatalogProduct = cache(async (slug: string) => { await guardCatalog(); return getPublishedProduct(getDb(), slug); });
