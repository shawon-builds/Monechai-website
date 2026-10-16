import { createPolicyFixture } from "../../../tests/fixtures/policies";
import { storePolicies } from "@/db/schema/policies";
import { test } from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { categories, deliveryAreas, orderItems, orders, products, productVariants, shippingZones } from "@/db/schema";
import { createQuoteHash } from "../checkout/quote";
import { placeCodOrder } from "../checkout/orders";
import { changeOrderStatus, getOrderDetail, recordCodPayment, recordCodRefund, restockReturnedOrder } from "./orders";
const url = process.env.DATABASE_URL;
test("cancellation restores reservations once, returns require explicit restock, COD refunds are audited", { skip: !url }, async () => {
  const client = postgres(url!, { ssl: false, max: 1 }); const db = drizzle({ client });
  try {
    await assert.rejects(db.transaction(async tx => {
      const [category] = await tx.insert(categories).values({ slug: `inventory-${crypto.randomUUID()}`, nameEn: "Fixture" }).returning();
      const [product] = await tx.insert(products).values({ slug: `inventory-${crypto.randomUUID()}`, sku: crypto.randomUUID(), categoryId: category.id, nameEn: "Reserved item", priceMinor: 1000, isPublished: true }).returning();
      const [variant] = await tx.insert(productVariants).values({ productId: product.id, sku: crypto.randomUUID(), stockQuantity: 2 }).returning();
      await tx.insert(shippingZones).values({ code: "inside-dhaka", name: "Inventory fixture", feeMinor: 100 });
      await tx.insert(deliveryAreas).values({ code: "inventory-area", nameEn: "Fixture area", district: "Fixture", shippingZoneCode: "inside-dhaka" });
      const policy = await createPolicyFixture(tx);
      const make = async () => {
        const result = await placeCodOrder({ idempotencyKey: crypto.randomUUID(), quoteHash: createQuoteHash([{variantId:variant.id,quantity:1,unitPriceMinor:1000}],{subtotalMinor:1000,shippingMinor:100,totalMinor:1100},"inventory-area"), items: [{ variantId: variant.id, quantity: 1 }], deliveryAreaCode: "inventory-area", customerName: "Fixture Buyer", phone: "01712345678", address: "Fixture address 123", area: "Fixture area", paymentMethod: "cod", policyVersion: policy.id, acceptPolicies: true }, tx);
        return (await tx.select().from(orders).where(eq(orders.publicToken, result.publicToken)))[0];
      };
      const stock = async () => (await tx.select().from(productVariants).where(eq(productVariants.id, variant.id)))[0].stockQuantity;
      const actor = crypto.randomUUID();
      const first = await make(); assert.equal(await stock(), 1);
      assert.deepEqual(await changeOrderStatus(tx, first.id, "cancelled", actor), { status: "cancelled" });
      assert.equal(await stock(), 2);
      assert.ok("error" in await changeOrderStatus(tx, first.id, "cancelled", actor));
      assert.equal((await getOrderDetail(tx, first.id))?.inventoryHistory.length, 1);
      assert.equal((await getOrderDetail(tx, first.id))?.order.paymentStatus, "failed");
      await assert.rejects(tx.transaction(async sp => { await sp.update(orderItems).set({ productName: "Changed" }).where(eq(orderItems.orderId, first.id)); }), (error) => /immutable/.test((error as { cause?: { message?: string } }).cause?.message ?? ""));
      const second = await make();
      for (const status of ["confirmed", "packed", "shipped", "delivery_failed", "returned"] as const) assert.ok("status" in await changeOrderStatus(tx, second.id, status, actor));
      assert.equal(await stock(), 1); // Damaged/unconfirmed returns never restock automatically.
      assert.deepEqual(await restockReturnedOrder(tx, second.id, actor), { ok: true }); assert.equal(await stock(), 2);
      assert.ok("error" in await restockReturnedOrder(tx, second.id, actor)); assert.equal(await stock(), 2);
      assert.ok("error" in await recordCodRefund(tx, second.id, actor));
      const third = await make();
      for (const status of ["confirmed", "packed", "shipped", "delivered"] as const) await changeOrderStatus(tx, third.id, status, actor);
      await recordCodPayment(tx, third.id, actor);
      await changeOrderStatus(tx, third.id, "return_requested", actor); await changeOrderStatus(tx, third.id, "returned", actor);
      assert.equal(await stock(), 1);
      assert.deepEqual(await recordCodRefund(tx, third.id, actor), { ok: true });
      assert.ok("error" in await recordCodRefund(tx, third.id, actor));
      assert.equal((await getOrderDetail(tx, third.id))?.order.paymentStatus, "refunded");
      assert.equal((await getOrderDetail(tx, third.id))?.paymentHistory.length, 2);
      throw new Error("rollback inventory fixture");
    }), /rollback inventory fixture/);
  } finally { await client.end(); }
});

test("two concurrent cancellation requests restore the last unit exactly once", { skip: !url }, async () => {
  const client = postgres(url!, { ssl: false, max: 4 }); const db = drizzle({ client });
  const suffix = crypto.randomUUID(); let categoryId = "", productId = "", variantId = "", orderId = "", policyId = "";
  try {
    [{ id: categoryId }] = await client`insert into categories(slug,name_en) values(${`cancel-${suffix}`},'Cancel fixture') returning id`;
    [{ id: productId }] = await client`insert into products(slug,sku,category_id,name_en,price_minor,is_published) values(${`cancel-${suffix}`},${suffix},${categoryId},'Cancel item',1000,true) returning id`;
    [{ id: variantId }] = await client`insert into product_variants(product_id,sku,stock_quantity) values(${productId},${suffix},1) returning id`;
    await client`insert into shipping_zones(code,name,fee_minor) values('inside-dhaka','Cancel test zone',100)`;
    await client`insert into delivery_areas(code,name_en,district,shipping_zone_code) values('cancel-test-area','Cancel fixture','Test district','inside-dhaka')`;
    const policy = await createPolicyFixture(db); policyId = policy.id;
    const saved = await placeCodOrder({ idempotencyKey: crypto.randomUUID(), quoteHash: createQuoteHash([{variantId,quantity:1,unitPriceMinor:1000}],{subtotalMinor:1000,shippingMinor:100,totalMinor:1100},"cancel-test-area"), items: [{ variantId, quantity: 1 }], deliveryAreaCode: "cancel-test-area", customerName: "Cancel Customer", phone: "01712345678", address: "Test address 123", area: "Test district", paymentMethod: "cod", policyVersion: policy.id, acceptPolicies: true }, db);
    [{ id: orderId }] = await client`select id from orders where public_token=${saved.publicToken}`;
    const results = await Promise.all([changeOrderStatus(db, orderId, "cancelled", crypto.randomUUID()), changeOrderStatus(db, orderId, "cancelled", crypto.randomUUID())]);
    assert.equal(results.filter((r) => "status" in r).length, 1);
    assert.equal((await client`select stock_quantity from product_variants where id=${variantId}`)[0].stock_quantity, 1);
    assert.equal((await client`select id from order_inventory_history where order_id=${orderId}`).length, 1);
  } finally {
    if (orderId) {
      await client`delete from order_inventory_history where order_id=${orderId}`;
      await client`delete from order_payment_history where order_id=${orderId}`;
      await client`delete from order_status_history where order_id=${orderId}`;
      await client`delete from order_items where order_id=${orderId}`;
      await client`delete from orders where id=${orderId}`;
    }
    if (productId) await client`delete from products where id=${productId}`;
    if (categoryId) await client`delete from categories where id=${categoryId}`;
    await client`delete from delivery_areas where code='cancel-test-area'`;
    await client`delete from shipping_zones where code='inside-dhaka' and name='Cancel test zone'`;
    if (policyId) await db.delete(storePolicies).where(eq(storePolicies.id, policyId));
    await client.end();
  }
});
