import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import ts from "typescript";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import { adminMembers, adminMutationHistory, categories, orders, productImages, products, productVariants, shippingZones, storePolicies } from "@/db/schema";
import * as productService from "./catalog/products";
import * as categoryService from "./catalog/categories";
import * as imageService from "./catalog/images";
import * as orderService from "./orders";
import * as settingsService from "./settings";
import * as policyService from "./policies";
import { adminDecision } from "./policy";
import { assuranceAllowsAdmin } from "./account-domain";
import type { getDb } from "@/db/client";
import * as historyService from "./mutation-history";
import * as mediaFiles from "@/features/catalog/storage/image-file";

const url = process.env.DATABASE_URL;
const require = createRequire(import.meta.url);
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const form = (values: Record<string, string>) => { const f = new FormData(); for (const [key, value] of Object.entries(values)) f.set(key, value); return f; };
type Db = ReturnType<typeof getDb>;

/** Compile the actual Server Action/auth sources; replace only provider/framework I/O.
 * Real requireAdmin -> membership/AAL2 decisions -> real services -> PostgreSQL triggers.
 * This is not live Supabase JWT/MFA acceptance. */
function compile(path: string, modules: Record<string, unknown>): Record<string, (...args: unknown[]) => Promise<{ message: string }>> {
  const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new Function("require", "exports", code)((name: string) => name in modules ? modules[name] : require(name), exports);
  return exports;
}
function actions(db: Db, actor: string, state: { user?: string | null; aal?: string; error?: boolean } = {}) {
  const redirect = (path: string) => { throw new Error(`AUTH_REDIRECT:${path}`); };
  const auth = compile("src/features/admin/auth.ts", {
    "server-only": {}, "next/navigation": { redirect },
    "@/lib/supabase/server": { createSupabaseServerClient: async () => ({ auth: {
      getUser: async () => ({ data: { user: state.user === null ? null : { id: state.user ?? actor, email: "fixture@example.test" } }, error: state.error ? new Error("revoked") : null }),
      mfa: { getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: state.aal ?? "aal2" }, error: null }) },
    } }) }, "./policy": { adminDecision }, "./account-domain": { assuranceAllowsAdmin },
    "./membership": { isAdminMember: async (id: string) => (await db.select().from(adminMembers).where(eq(adminMembers.userId, id))).length === 1 },
  });
  const modules = {
    "@/db/client": { getDb: () => db }, "@/features/admin/auth": auth, "./auth": auth,
    "@/features/admin/mutation-history": historyService, "./mutation-history": historyService,
    "next/cache": { revalidatePath: () => {} }, "next/navigation": { redirect }, "@/lib/logger": { logEvent: () => {} },
    "@/features/catalog/storage/supabase": { getImageStorage: async () => ({ exists: async () => true }) },
    "@/features/catalog/storage/image-file": mediaFiles,
    "./products": productService, "./categories": categoryService, "./images": imageService,
    "./orders": orderService, "./notifications": { retryFailedAlert: async () => [] }, "./settings": settingsService, "./policies": policyService,
  };
  return Object.assign({}, ...["catalog/product-actions", "catalog/category-actions", "catalog/image-actions", "order-actions", "settings-actions", "policy-actions"].map(path => compile(`src/features/admin/${path}.ts`, modules)));
}
async function fixture(run: (f: Awaited<ReturnType<typeof createFixture>>) => Promise<void>) {
  const f = await createFixture();
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://auth.example.test";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fixture";
  try { await run(f); } finally {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
    await f.client`delete from admin_mutation_history where actor_user_id=${f.actor}`;
    await f.client`delete from order_status_history where order_id=${f.order.id}`;
    await f.client`delete from order_payment_history where order_id=${f.order.id}`;
    await f.client`delete from orders where id=${f.order.id}`;
    await f.client`delete from products where id=${f.product.id}`;
    await f.client`delete from categories where id=${f.category.id}`;
    await f.client`delete from shipping_zones where code='inside-dhaka'`;
    await f.client`delete from store_policies where id=${f.policy.id} or shipping_en like ${`${f.marker}%`}`;
    await f.client`delete from admin_members where user_id=${f.actor}`;
    await f.client`update site_settings set store_name='Monechai',cod_enabled=true,hotline=null,contact_address=null,support_email=null,whatsapp_number=null where id=1`;
    await f.client.end();
  }
}
async function createFixture() {
  const actor = crypto.randomUUID(), marker = `audit-${crypto.randomUUID()}`;
  const client = postgres(url!, { ssl: false, max: 8, onnotice: () => {} });
  const db = drizzle({ client });
  try { return await db.transaction(async tx => {
  await tx.insert(adminMembers).values({ userId: actor });
  const [category] = await tx.insert(categories).values({ slug: marker, nameEn: "Fixture" }).returning();
  const [product] = await tx.insert(products).values({ slug: marker, sku: marker, categoryId: category.id, nameEn: "Fixture", priceMinor: 1000 }).returning();
  const [variant] = await tx.insert(productVariants).values({ productId: product.id, sku: marker, stockQuantity: 2 }).returning();
  await tx.insert(shippingZones).values({ code: "inside-dhaka", name: "Fixture", feeMinor: 100 });
  const [policy] = await tx.insert(storePolicies).values({ shippingEn: `${marker} shipping fixture only`, returnsEn: "Returns test fixture only", privacyEn: "Privacy test fixture only", termsEn: "Terms test fixture only" }).returning();
  const [order] = await tx.insert(orders).values({ publicToken: "a".repeat(32) + crypto.randomUUID().replaceAll("-", ""), orderNumber: `MC-${crypto.randomUUID().replaceAll("-", "").slice(0,16).toUpperCase()}`, idempotencyKey: crypto.randomUUID(), requestHash: "fixture", customerName: "Sensitive fixture customer", phone: "+8801712345678", address: "Sensitive fixture address", area: "Private area", shippingZoneCode: "inside-dhaka", shippingZoneName: "Fixture", subtotalMinor: 1000, shippingMinor: 100, totalMinor: 1100 }).returning();
  const history = () => db.select().from(adminMutationHistory).where(eq(adminMutationHistory.actorUserId, actor)).orderBy(adminMutationHistory.occurredAt, adminMutationHistory.id);
  return { actor, marker, client, db, category, product, variant, policy, order, history };
  }); } catch (error) { await client.end(); throw error; }
}
const inventoryForm = (stock: number, expected = 2) => form({ confirmInventory: "yes", trackInventory: "yes", expectedStockQuantity: String(expected), stockQuantity: String(stock), actorUserId: crypto.randomUUID() });

test("authorized actual inventory action commits actor/time/exact values; identical and stale edits add no history", { skip: !url }, async () => fixture(async f => {
  const action = actions(f.db, f.actor).adjustVariantInventoryAction;
  assert.equal((await action(f.product.id, f.variant.id, {}, inventoryForm(5))).message, "Inventory adjusted.");
  const [record] = await f.history();
  assert.equal(record.actorUserId, f.actor); assert.equal(record.resourceId, f.variant.id); assert.equal(record.resourceType, "product_variants"); assert.equal(record.action, "update");
  assert.deepEqual(record.changes, { stock_quantity: { previous: 2, next: 5 } }); assert.ok(record.occurredAt instanceof Date);
  await action(f.product.id, f.variant.id, {}, inventoryForm(5, 5));
  assert.match((await action(f.product.id, f.variant.id, {}, inventoryForm(9))).message, /Inventory changed/);
  assert.equal((await f.history()).length, 1);
  assert.equal((await f.client`select nullif(current_setting('monechai.admin_actor',true),'') as actor`)[0].actor, null, "transaction-local identity cannot leak");
}));

test("every supported material action denies anonymous/nonmember/revoked/AAL1 before mutation", { skip: !url }, async () => fixture(async f => {
  const calls: [string, unknown[]][] = [
    ["adjustVariantInventoryAction", [f.product.id, f.variant.id, {}, inventoryForm(7)]],
    ["saveProductAction", [f.product.id, {}, new FormData()]], ["saveVariantAction", [f.product.id, f.variant.id, {}, new FormData()]], ["archiveProductAction", [f.product.id, {}, new FormData()]],
    ["saveCategoryAction", [f.category.id, {}, new FormData()]], ["deleteCategoryAction", [f.category.id, {}, new FormData()]],
    ["uploadImageAction", [f.product.id, {}, new FormData()]], ["changeImageAction", [f.product.id, crypto.randomUUID(), {}, new FormData()]],
    ["saveTrackingAction", [f.order.id, {}, new FormData()]], ["saveSettingsAction", [{}, new FormData()]], ["saveZoneAction", [{}, new FormData()]], ["saveDeliveryAreaAction", [{}, new FormData()]], ["publishPoliciesAction", [{}, new FormData()]],
  ];
  for (const state of [{ user: null }, { user: crypto.randomUUID() }, { error: true }, { aal: "aal1" }, { aal: "unknown" }]) {
    const denied = actions(f.db, f.actor, state);
    for (const [name, args] of calls) await assert.rejects(denied[name](...args), /AUTH_REDIRECT:/, name);
  }
  assert.equal((await f.history()).length, 0);
  assert.equal((await f.db.select().from(productVariants).where(eq(productVariants.id, f.variant.id)))[0].stockQuantity, 2);
}));

test("catalog/category actions capture exact numeric changes and fingerprint text; archive retains old data", { skip: !url }, async () => fixture(async f => {
  const a = actions(f.db, f.actor);
  await a.saveCategoryAction(f.category.id, {}, form({ slug: f.marker, nameEn: "Edited", nameBn: "", sortOrder: "3" }));
  await a.saveProductAction(f.product.id, {}, form({ slug: f.marker, sku: f.marker, categoryId: f.category.id, nameEn: "Edited", nameBn: "", descriptionEn: "PRIVATE_SECRET_MARKER 01712345678", descriptionBn: "", priceMinor: "12.05", compareAtMinor: "" }));
  await a.saveVariantAction(f.product.id, f.variant.id, {}, form({ sku: f.marker, label: "Edited", labelBn: "", priceMinor: "", isActive: "on", stockQuantity: "99", trackInventory: "yes" }));
  let history = await f.history();
  const product = history.find(r => r.resourceType === "products")!;
  assert.deepEqual(product.changes.price_minor, { previous: 1000, next: 1205 });
  assert.deepEqual(product.changes.description_en, { previous: null, next: hash("PRIVATE_SECRET_MARKER 01712345678") });
  assert.equal(history.find(r => r.resourceType === "categories")!.changes.sort_order.next, 3);
  assert.equal(history.find(r => r.resourceType === "product_variants")!.changes.stock_quantity, undefined);
  await f.db.update(products).set({ isPublished: true }).where(eq(products.id, f.product.id));
  await a.archiveProductAction(f.product.id, {}, new FormData());
  history = await f.history();
  assert.deepEqual(history.findLast(r => r.resourceType === "products")!.changes.is_published, { previous: true, next: false });
  assert.doesNotMatch(JSON.stringify(history), /PRIVATE_SECRET_MARKER|01712345678/);
}));

test("tracking actions retain correct fingerprints including clears and serialize concurrent overwrites", { skip: !url }, async () => fixture(async f => {
  const a = actions(f.db, f.actor).saveTrackingAction;
  await a(f.order.id, {}, form({ courierName: "Fixture Courier", trackingReference: "PRIVATE_RECEIPT_TOKEN", actorUserId: crypto.randomUUID() }));
  const [first] = await f.history();
  assert.deepEqual(first.changes, { courier_name: { previous: null, next: hash("Fixture Courier") }, tracking_reference: { previous: null, next: hash("PRIVATE_RECEIPT_TOKEN") } });
  await a(f.order.id, {}, form({ courierName: "Fixture Courier", trackingReference: "PRIVATE_RECEIPT_TOKEN" }));
  assert.equal((await f.history()).length, 1);
  await Promise.all(["A", "B"].map(trackingReference => a(f.order.id, {}, form({ courierName: "Fixture Courier", trackingReference }))));
  const rows = await f.history(); assert.equal(rows.length, 3);
  const changes = rows.slice(1).map(r => r.changes.tracking_reference);
  assert.equal(changes.filter(c => c.previous === hash("PRIVATE_RECEIPT_TOKEN")).length, 1);
  assert.ok(changes.some(c => changes.some(other => other !== c && c.next === other.previous)));
  await a(f.order.id, {}, form({ courierName: "", trackingReference: "" }));
  assert.ok((await f.history()).some(r => r.changes.tracking_reference?.next === null));
  assert.doesNotMatch(JSON.stringify(await f.history()), /PRIVATE_RECEIPT_TOKEN|Sensitive fixture|01712345678|public_token|address|customer_name/);
}));

test("settings/rates/delivery/policy actions retain revisions and redact contacts; duplicate policy publish is a no-op", { skip: !url }, async () => fixture(async f => {
  const a = actions(f.db, f.actor);
  await a.saveSettingsAction({}, form({ storeName: "Fixture Store", whatsappNumber: "8801712345678", hotline: "SECRET_MARKER", supportEmail: "private@example.test", contactAddress: "PRIVATE_ADDRESS" }));
  await a.saveZoneAction({}, form({ code: "inside-dhaka", feeMinor: "2.00", freeAboveMinor: "5.00" }));
  await a.saveDeliveryAreaAction({}, form({ code: f.marker, nameEn: "Fixture area", nameBn: "", district: "Fixture", shippingZoneCode: "inside-dhaka", isActive: "yes" }));
  const policy = form({ shippingEn: `${f.marker} published shipping fixture only`, shippingBn: "", returnsEn: "Published returns fixture only", returnsBn: "", privacyEn: "Published privacy fixture only", privacyBn: "", termsEn: "Published terms fixture only", termsBn: "" });
  await a.publishPoliciesAction({}, policy);
  const revision = await policyService.getActivePolicies(f.db);
  const before = await f.history();
  await a.publishPoliciesAction({}, policy);
  assert.equal((await policyService.getActivePolicies(f.db))!.id, revision!.id);
  assert.equal((await f.history()).length, before.length);
  assert.deepEqual(before.find(r => r.resourceType === "shipping_zones")!.changes.fee_minor, { previous: 100, next: 200 });
  assert.deepEqual(before.find(r => r.resourceType === "site_settings")!.changes.hotline, { previous: "redacted", next: "redacted" });
  assert.equal(before.filter(r => r.resourceType === "store_policies").length, 2);
  assert.equal(before.find(r => r.resourceId === f.policy.id)!.changes.is_active.next, false);
  assert.equal(before.find(r => r.resourceId === revision!.id)!.changes.shipping_en.next, hash(policy.get("shippingEn")));
  assert.doesNotMatch(JSON.stringify(before), /SECRET_MARKER|PRIVATE_ADDRESS|private@example|8801712345678|published shipping fixture/);
  await f.client`delete from delivery_areas where code=${f.marker}`;
}));

test("concurrent authorized inventory corrections commit one exact history and preserve stale-stock guard", { skip: !url }, async () => fixture(async f => {
  const a = actions(f.db, f.actor).adjustVariantInventoryAction;
  const results = await Promise.all([7,9].map(stock => a(f.product.id, f.variant.id, {}, inventoryForm(stock))));
  assert.equal(results.filter(r => r.message === "Inventory adjusted.").length, 1);
  const [row] = await f.history(); assert.equal((await f.history()).length, 1);
  assert.equal(row.changes.stock_quantity.previous, 2); assert.ok([7,9].includes(row.changes.stock_quantity.next as number));
}));

test("mutation/trigger failure and outer rollback remove changes and history together", { skip: !url }, async () => fixture(async f => {
  await assert.rejects(f.db.transaction(async tx => {
    await historyService.withAdminMutation(tx, f.actor, inner => productService.adjustVariantInventory(inner, f.product.id, f.variant.id, { expectedStockQuantity: 2, stockQuantity: 7, trackInventory: true }));
    assert.equal((await tx.select().from(adminMutationHistory)).length, 1);
    throw new Error("rollback mutation");
  }), /rollback mutation/);
  assert.equal((await f.history()).length, 0);
  assert.equal((await f.client`select stock_quantity from product_variants where id=${f.variant.id}`)[0].stock_quantity, 2);
  // Force audit insertion failure with a temporary constraint, rolled back automatically.
  await assert.rejects(f.db.transaction(async tx => {
    await tx.execute(sql`alter table public.admin_mutation_history add constraint fixture_audit_failure check (false) not valid`);
    await historyService.withAdminMutation(tx, f.actor, inner => productService.adjustVariantInventory(inner, f.product.id, f.variant.id, { expectedStockQuantity: 2, stockQuantity: 7, trackInventory: true }));
  }));
  assert.equal((await f.history()).length, 0);
  assert.equal((await f.client`select stock_quantity from product_variants where id=${f.variant.id}`)[0].stock_quantity, 2);
  await assert.rejects(historyService.withAdminMutation(f.db, crypto.randomUUID(), tx => productService.archiveProduct(tx, f.product.id)), /membership/);
}));

test("media metadata history commits before external removal and failure cannot remove a referenced photo", { skip: !url }, async () => fixture(async f => {
  const bytes = new Uint8Array([1,2,3]); const files = new Set<string>(); let removedAfterCommit = false;
  const storage = { upload: async (key: string) => { files.add(key); }, exists: async (key: string) => files.has(key), remove: async (key: string) => {
    removedAfterCommit = (await f.client`select id from product_images where storage_key=${key}`).length === 0;
    files.delete(key);
  } };
  const image = await imageService.uploadProductImage(f.db, storage, f.product.id, bytes, { altEn: "Fixture", altBn: null }, f.actor);
  assert.equal((await f.history()).filter(r => r.resourceType === "product_images").length, 1);
  await imageService.changeProductImage(f.db, storage, f.product.id, image.id, "primary", f.actor);
  await imageService.changeProductImage(f.db, storage, f.product.id, image.id, "up", f.actor);
  assert.equal((await f.history()).length, 1, "identical primary and boundary move leave no phantom changes");
  await f.db.update(products).set({ isPublished: true }).where(eq(products.id, f.product.id));
  await imageService.changeProductImage(f.db, storage, f.product.id, image.id, "remove", f.actor);
  assert.ok(removedAfterCommit); assert.equal(files.size, 0);
  const rows = await f.history(); assert.ok(rows.some(r => r.resourceType === "products" && r.changes.is_published?.next === false));
  assert.ok(rows.some(r => r.resourceId === image.id && r.action === "delete"));
  assert.doesNotMatch(JSON.stringify(rows), /\.webp/);
  assert.equal((await f.db.select().from(productImages)).length, 0);
}));

test("existing order status/payment histories remain sole records and keep exact server actor", { skip: !url }, async () => fixture(async f => {
  const a = actions(f.db, f.actor);
  for (const status of ["confirmed", "packed", "shipped", "delivered"]) await a.changeOrderStatusAction(f.order.id, {}, form({ status, actorUserId: crypto.randomUUID() }));
  await a.recordCodPaymentAction(f.order.id, {}, form({ cashReceived: "yes" }));
  const status = await f.client`select actor_user_id from order_status_history where order_id=${f.order.id}`;
  assert.equal(status.length, 4); assert.ok(status.every(row => row.actor_user_id === f.actor));
  assert.equal((await f.client`select actor_user_id from order_payment_history where order_id=${f.order.id}`)[0].actor_user_id, f.actor);
  assert.equal((await f.history()).length, 0, "no duplicated order status/payment history");
}));

test("real restricted runtime can trigger/read audit but cannot forge/edit/delete; API roles lack grants and RLS denies", { skip: !url }, async () => fixture(async f => {
  const role = `audit_runtime_${crypto.randomUUID().replaceAll("-", "")}`;
  await assert.rejects(f.client.begin(async tx => {
    await tx.unsafe(`create role ${role} nosuperuser nocreatedb nocreaterole noinherit nobypassrls`);
    for (const name of ["auth", "storage"]) await tx.unsafe(`create schema if not exists ${name}`);
    await tx.unsafe(readFileSync("ops/supabase-runtime.sql", "utf8").replaceAll("monechai_runtime", role).replace("GRANT CONNECT ON DATABASE postgres", "GRANT CONNECT ON DATABASE monechai_test"));
    await tx.unsafe(`set local role ${role}`);
    await tx`select user_id from admin_members where user_id=${f.actor}`;
    await tx`select set_config('monechai.admin_actor',${f.actor},true)`;
    await tx`update product_variants set stock_quantity=3 where id=${f.variant.id}`;
    const [record] = await tx`select * from admin_mutation_history where actor_user_id=${f.actor}`;
    assert.equal(record.actor_user_id, f.actor); assert.equal(record.changes.stock_quantity.next, 3);
    for (const statement of ["update admin_mutation_history set action='delete'", "delete from admin_mutation_history", `insert into admin_mutation_history(actor_user_id,action,resource_type,resource_id,changes) values('${f.actor}','update','products','fixture','{"x":1}')`])
      await assert.rejects(tx.savepoint(sp => sp.unsafe(statement)), (e: { code: string }) => e.code === "42501");
    await tx`select set_config('monechai.admin_actor',${crypto.randomUUID()},true)`;
    await assert.rejects(tx.savepoint(sp => sp`update product_variants set stock_quantity=4 where id=${f.variant.id}`), (e: { code: string }) => e.code === "42501");
    await tx.unsafe("reset role");
    for (const apiRole of ["anon", "authenticated", "service_role"]) {
      if (!(await tx`select 1 from pg_roles where rolname=${apiRole}`).length) await tx.unsafe(`create role ${apiRole} nosuperuser nobypassrls`);
      await tx.unsafe(`grant all on public.admin_mutation_history to ${apiRole}`);
    }
    // Exercise the actual migration's conditional revokes against provisioned API role fixtures.
    const migration = readFileSync("src/db/migrations/0013_admin_mutation_history.sql", "utf8");
    await tx.unsafe(migration.split("--> statement-breakpoint").find(statement => statement.includes("DO $$ DECLARE r text"))!);
    for (const apiRole of ["anon", "authenticated", "service_role"]) {
      assert.equal((await tx`select has_table_privilege(${apiRole},'public.admin_mutation_history','SELECT,INSERT,UPDATE,DELETE') as allowed`)[0].allowed, false);
      await tx.unsafe(`set local role ${apiRole}`);
      await assert.rejects(tx.savepoint(sp => sp`select * from public.admin_mutation_history`), (e: { code: string }) => e.code === "42501");
      await tx.unsafe("reset role");
    }
    const api = `${role}_api`; await tx.unsafe(`create role ${api} nosuperuser nobypassrls`);
    await tx.unsafe(`grant select,insert,update,delete on public.admin_mutation_history to ${api}; set local role ${api}`);
    assert.equal((await tx`select * from admin_mutation_history`).length, 0);
    assert.equal((await tx`update admin_mutation_history set action='delete' returning *`).length, 0);
    assert.equal((await tx`delete from admin_mutation_history returning *`).length, 0);
    await assert.rejects(tx.savepoint(sp => sp`insert into admin_mutation_history(actor_user_id,action,resource_type,resource_id,changes) values(${f.actor},'update','products','fixture','{"x":1}')`), /row-level security/);
    throw new Error("rollback role fixture");
  }), /rollback role fixture/);
  for (const role of ["anon", "authenticated", "service_role"]) {
    const rows = await f.client`select has_table_privilege(oid,'public.admin_mutation_history','SELECT,INSERT,UPDATE,DELETE') as allowed from pg_roles where rolname=${role}`;
    assert.ok(rows.every(row => !row.allowed));
  }
}));
