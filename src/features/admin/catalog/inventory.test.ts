import { test } from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { adminMembers, adminMutationHistory, categories, deliveryAreas, orders, products, productVariants, shippingZones, storePolicies } from "@/db/schema";
import { withAdminMutation } from "../mutation-history";
import { createPolicyFixture } from "../../../../tests/fixtures/policies";
import { CheckoutError, placeCodOrder } from "../../checkout/orders";
import { createQuoteHash } from "../../checkout/quote";
import { changeOrderStatus, restockReturnedOrder } from "../orders";
import { adjustVariantInventory, CatalogMutationError, inventoryInput, saveVariant, variantMetadataInput } from "./products";

const url = process.env.DATABASE_URL;
const conflict = (error: unknown) => error instanceof CatalogMutationError && /Inventory changed/.test(error.message);

test("metadata input discards inventory and adjustment input rejects invalid stock", () => {
  const metadata = variantMetadataInput.parse({ sku: "s", label: "A", attributes: {}, priceMinor: "", isActive: true, trackInventory: false, stockQuantity: 99 });
  assert.equal(Object.hasOwn(metadata, "stockQuantity"), false);
  assert.equal(Object.hasOwn(metadata, "trackInventory"), false);
  for (const value of [-1, 0.5, 2147483648, NaN, "1", undefined]) {
    assert.equal(inventoryInput.safeParse({ expectedStockQuantity: value, trackInventory: true, stockQuantity: 1 }).success, false);
    assert.equal(inventoryInput.safeParse({ expectedStockQuantity: 1, trackInventory: true, stockQuantity: value }).success, false);
  }
  assert.equal(inventoryInput.safeParse({ expectedStockQuantity: 1, trackInventory: true, stockQuantity: null }).success, false);
  assert.equal(inventoryInput.safeParse({ expectedStockQuantity: 1, trackInventory: false, stockQuantity: 1 }).success, false);
});

async function fixture(run: (f: Awaited<ReturnType<typeof createFixture>>) => Promise<void>) {
  const f = await createFixture();
  try { await run(f); } finally {
    const saved = await f.client`select id from orders where idempotency_key = any(${f.keys})`;
    for (const { id } of saved) {
      await f.client`delete from order_inventory_history where order_id=${id}`;
      await f.client`delete from order_payment_history where order_id=${id}`;
      await f.client`delete from order_status_history where order_id=${id}`;
      await f.client`delete from order_items where order_id=${id}`;
      await f.client`delete from orders where id=${id}`;
    }
    await f.client`delete from products where id=${f.product.id}`;
    await f.client`delete from categories where id=${f.category.id}`;
    await f.client`delete from delivery_areas where code=${f.area}`;
    await f.client`delete from shipping_zones where code='inside-dhaka'`;
    await f.db.delete(storePolicies).where(eq(storePolicies.id, f.policy.id));
    await f.client.end();
  }
}
async function createFixture() {
  const name = `mon001-${crypto.randomUUID()}`;
  const client = postgres(url!, { ssl: false, max: 8, connection: { application_name: name, lock_timeout: 5000, statement_timeout: 10000 } });
  const db = drizzle({ client });
  const [category] = await db.insert(categories).values({ slug: name, nameEn: "Fixture" }).returning();
  const [product] = await db.insert(products).values({ slug: name, sku: name, categoryId: category.id, nameEn: "Fixture", priceMinor: 1000, isPublished: true }).returning();
  const [variant] = await db.insert(productVariants).values({ productId: product.id, sku: name, stockQuantity: 1 }).returning();
  await db.insert(shippingZones).values({ code: "inside-dhaka", name: "MON-001 fixture", feeMinor: 100 });
  const area = name;
  await db.insert(deliveryAreas).values({ code: area, nameEn: "Fixture", district: "Fixture", shippingZoneCode: "inside-dhaka" });
  const policy = await createPolicyFixture(db);
  const keys: string[] = [];
  const metadata = { sku: name, label: "Edited", labelBn: null, attributes: {}, priceMinor: null, isActive: true };
  const input = () => {
    const key = crypto.randomUUID(); keys.push(key);
    return { idempotencyKey: key, quoteHash: createQuoteHash([{ variantId: variant.id, quantity: 1, unitPriceMinor: 1000 }], { subtotalMinor: 1000, shippingMinor: 100, totalMinor: 1100 }, area), items: [{ variantId: variant.id, quantity: 1 }], customerName: "Fixture Buyer", phone: "01712345678", address: "Fixture address 123", area: "Fixture", deliveryAreaCode: area, paymentMethod: "cod", policyVersion: policy.id, acceptPolicies: true };
  };
  const stock = async () => (await db.select().from(productVariants).where(eq(productVariants.id, variant.id)))[0];
  const purchase = async () => {
    const receipt = await placeCodOrder(input(), db);
    return (await db.select().from(orders).where(eq(orders.publicToken, receipt.publicToken)))[0];
  };
  // Observe real PostgreSQL lock waits, rather than assuming Promise scheduling.
  const waitForLocks = async (count = 1) => {
    const deadline = Date.now() + 3000;
    do {
      const [row] = await client`select count(*)::int as n from pg_stat_activity where application_name=${name} and wait_event_type='Lock'`;
      if (row.n >= count) return;
      await new Promise(resolve => setTimeout(resolve, 10));
    } while (Date.now() < deadline);
    assert.fail(`Expected ${count} concurrent transaction(s) waiting on a row lock`);
  };
  return { client, db, category, product, variant, policy, area, keys, metadata, input, stock, purchase, waitForLocks };
}

test("MON-001 stale metadata save after committed checkout never restores sold stock", { skip: !url }, async () => {
  await fixture(async f => {
    const stale = { ...f.metadata, trackInventory: true, stockQuantity: 1 };
    const order = await f.purchase();
    assert.equal((await f.stock()).stockQuantity, 0);
    await saveVariant(f.db, f.product.id, stale, f.variant.id);
    assert.equal((await f.stock()).stockQuantity, 0);
    assert.equal((await f.stock()).label, "Edited");
    // Even old callers carrying changed tracking/stock cannot mutate inventory here.
    await saveVariant(f.db, f.product.id, { ...stale, trackInventory: false, stockQuantity: null }, f.variant.id);
    assert.equal((await f.stock()).trackInventory, true);
    await assert.rejects(placeCodOrder(f.input(), f.db), e => e instanceof CheckoutError && e.code === "OUT_OF_STOCK");
    const [item] = await f.client`select variant_label,quantity,inventory_reserved from order_items where order_id=${order.id}`;
    assert.equal(item.variant_label, "Default"); assert.equal(item.quantity, 1); assert.equal(item.inventory_reserved, true);
  });
});

test("simultaneous metadata edits preserve current stock and last-active unpublish behavior", { skip: !url }, async () => {
  await fixture(async f => {
    await f.purchase();
    const results = await Promise.all(["First", "Second"].map(label => saveVariant(f.db, f.product.id, { ...f.metadata, label, trackInventory: true, stockQuantity: 1 }, f.variant.id)));
    assert.ok(results.every(r => r?.id === f.variant.id));
    assert.equal((await f.stock()).stockQuantity, 0);
    await saveVariant(f.db, f.product.id, { ...f.metadata, isActive: false }, f.variant.id);
    assert.equal((await f.db.select().from(products).where(eq(products.id, f.product.id)))[0].isPublished, false);
  });
});

test("explicit replenishment/correction is bounded, product-bound and rejects stale resubmission", { skip: !url }, async () => {
  await fixture(async f => {
    const input = { expectedStockQuantity: 1, trackInventory: true, stockQuantity: 5 };
    assert.equal(await adjustVariantInventory(f.db, crypto.randomUUID(), f.variant.id, input), null);
    assert.equal(await adjustVariantInventory(f.db, f.product.id, crypto.randomUUID(), input), null);
    const result = await adjustVariantInventory(f.db, f.product.id, f.variant.id, input);
    assert.equal(result?.previousStockQuantity, 1); assert.equal(result?.stockQuantity, 5);
    await assert.rejects(adjustVariantInventory(f.db, f.product.id, f.variant.id, input), conflict);
    await adjustVariantInventory(f.db, f.product.id, f.variant.id, { expectedStockQuantity: 5, trackInventory: true, stockQuantity: 0 });
    assert.equal((await f.stock()).stockQuantity, 0);
    await assert.rejects(adjustVariantInventory(f.db, f.product.id, f.variant.id, { expectedStockQuantity: 0, trackInventory: true, stockQuantity: -1 }));
    assert.equal((await f.stock()).stockQuantity, 0);
  });
});

test("two simultaneous stock adjustments from one snapshot accept exactly one", { skip: !url }, async () => {
  await fixture(async f => {
    const outcomes = await Promise.allSettled([3, 5].map(stockQuantity => adjustVariantInventory(f.db, f.product.id, f.variant.id, { expectedStockQuantity: 1, trackInventory: true, stockQuantity })));
    assert.equal(outcomes.filter(r => r.status === "fulfilled").length, 1);
    assert.equal(outcomes.filter(r => r.status === "rejected" && conflict(r.reason)).length, 1);
    assert.ok([3, 5].includes((await f.stock()).stockQuantity!));
  });
});

test("checkout-first row-lock race preserves sale and rejects stale stock adjustment", { skip: !url }, async () => {
  await fixture(async f => {
    let pending: Promise<PromiseSettledResult<unknown>[]> | undefined;
    await f.db.transaction(async tx => {
      await placeCodOrder(f.input(), tx);
      pending = Promise.allSettled([
        adjustVariantInventory(f.db, f.product.id, f.variant.id, { expectedStockQuantity: 1, trackInventory: true, stockQuantity: 5 }),
        saveVariant(f.db, f.product.id, { ...f.metadata, trackInventory: true, stockQuantity: 1 }, f.variant.id),
      ]);
      await f.waitForLocks(2);
    });
    const outcomes = await pending!;
    assert.ok(outcomes[0].status === "rejected" && conflict(outcomes[0].reason));
    assert.equal(outcomes[1].status, "fulfilled");
    assert.equal((await f.stock()).stockQuantity, 0);
  });
});

test("replenishment-first row-lock race lets checkout consume only updated inventory", { skip: !url }, async () => {
  await fixture(async f => {
    let pending: Promise<unknown> | undefined;
    await f.db.transaction(async tx => {
      await adjustVariantInventory(tx, f.product.id, f.variant.id, { expectedStockQuantity: 1, trackInventory: true, stockQuantity: 3 });
      pending = placeCodOrder(f.input(), f.db);
      await f.waitForLocks();
    });
    await pending;
    assert.equal((await f.stock()).stockQuantity, 2);
  });
});

test("cancellation and explicit adjustment serialize without lost or double restock", { skip: !url }, async () => {
  await fixture(async f => {
    const order = await f.purchase(), actor = crypto.randomUUID();
    let pending: Promise<PromiseSettledResult<unknown>[]> | undefined;
    await f.db.transaction(async tx => {
      await changeOrderStatus(tx, order.id, "cancelled", actor);
      pending = Promise.allSettled([adjustVariantInventory(f.db, f.product.id, f.variant.id, { expectedStockQuantity: 0, trackInventory: true, stockQuantity: 4 })]);
      await f.waitForLocks();
    });
    const [outcome] = await pending!;
    assert.ok(outcome.status === "rejected" && conflict(outcome.reason));
    assert.equal((await f.stock()).stockQuantity, 1);
    assert.ok("error" in await changeOrderStatus(f.db, order.id, "cancelled", actor));
    await adjustVariantInventory(f.db, f.product.id, f.variant.id, { expectedStockQuantity: 1, trackInventory: true, stockQuantity: 4 });
    const second = await f.purchase();
    let cancellation: Promise<unknown> | undefined;
    await f.db.transaction(async tx => {
      await adjustVariantInventory(tx, f.product.id, f.variant.id, { expectedStockQuantity: 3, trackInventory: true, stockQuantity: 6 });
      cancellation = changeOrderStatus(f.db, second.id, "cancelled", actor);
      await f.waitForLocks();
    });
    await cancellation;
    assert.equal((await f.stock()).stockQuantity, 7);
  });
});

test("returned stock remains explicit, once-only and invalidates stale inventory adjustment", { skip: !url }, async () => {
  await fixture(async f => {
    const order = await f.purchase(), actor = crypto.randomUUID();
    for (const status of ["confirmed", "packed", "shipped", "delivery_failed", "returned"] as const)
      assert.ok("status" in await changeOrderStatus(f.db, order.id, status, actor));
    assert.equal((await f.stock()).stockQuantity, 0);
    let pending: Promise<PromiseSettledResult<unknown>[]> | undefined;
    await f.db.transaction(async tx => {
      assert.deepEqual(await restockReturnedOrder(tx, order.id, actor), { ok: true });
      pending = Promise.allSettled([adjustVariantInventory(f.db, f.product.id, f.variant.id, { expectedStockQuantity: 0, trackInventory: true, stockQuantity: 5 })]);
      await f.waitForLocks();
    });
    const [outcome] = await pending!;
    assert.ok(outcome.status === "rejected" && conflict(outcome.reason));
    assert.ok("error" in await restockReturnedOrder(f.db, order.id, actor));
    await saveVariant(f.db, f.product.id, { ...f.metadata, trackInventory: true, stockQuantity: 0 }, f.variant.id);
    assert.equal((await f.stock()).stockQuantity, 1);
    assert.equal((await f.client`select id from order_inventory_history where order_id=${order.id}`).length, 1);
  });
});

test("inventory tracking changes retain reservation guard and stale untracked forms cannot reset tracked stock", { skip: !url }, async () => {
  await fixture(async f => {
    const order = await f.purchase();
    await assert.rejects(adjustVariantInventory(f.db, f.product.id, f.variant.id, { expectedStockQuantity: 0, trackInventory: false, stockQuantity: null }), /unfulfilled orders/);
    assert.equal((await f.stock()).trackInventory, true);
    await changeOrderStatus(f.db, order.id, "cancelled", crypto.randomUUID());
    await adjustVariantInventory(f.db, f.product.id, f.variant.id, { expectedStockQuantity: 1, trackInventory: false, stockQuantity: null });
    await adjustVariantInventory(f.db, f.product.id, f.variant.id, { expectedStockQuantity: null, trackInventory: true, stockQuantity: 2 });
    await assert.rejects(adjustVariantInventory(f.db, f.product.id, f.variant.id, { expectedStockQuantity: null, trackInventory: true, stockQuantity: 9 }), conflict);
    assert.equal((await f.stock()).stockQuantity, 2);
  });
});

test("durable audited replenishment integrates with checkout and once-only cancellation history", { skip: !url }, async () => fixture(async f => {
  const actor = crypto.randomUUID();
  await f.db.insert(adminMembers).values({ userId: actor });
  try {
    await withAdminMutation(f.db, actor, tx => adjustVariantInventory(tx, f.product.id, f.variant.id, { expectedStockQuantity: 1, trackInventory: true, stockQuantity: 3 }));
    const order = await f.purchase();
    assert.equal((await f.stock()).stockQuantity, 2);
    await changeOrderStatus(f.db, order.id, "cancelled", actor);
    assert.equal((await f.stock()).stockQuantity, 3);
    const [history] = await f.db.select().from(adminMutationHistory).where(eq(adminMutationHistory.actorUserId, actor));
    assert.deepEqual(history.changes, { stock_quantity: { previous: 1, next: 3 } });
    assert.equal((await f.client`select id from admin_mutation_history where actor_user_id=${actor}`).length, 1);
    assert.equal((await f.client`select actor_user_id from order_inventory_history where order_id=${order.id}`)[0].actor_user_id, actor);
    await assert.rejects(withAdminMutation(f.db, actor, tx => adjustVariantInventory(tx, f.product.id, f.variant.id, { expectedStockQuantity: 1, trackInventory: true, stockQuantity: 4 })), conflict);
    assert.equal((await f.client`select id from admin_mutation_history where actor_user_id=${actor}`).length, 1);
  } finally {
    await f.db.delete(adminMutationHistory).where(eq(adminMutationHistory.actorUserId, actor));
    await f.db.delete(adminMembers).where(eq(adminMembers.userId, actor));
  }
}));
