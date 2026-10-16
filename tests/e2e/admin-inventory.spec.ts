import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import { resolve } from "node:path";
import postgres from "postgres";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";

test("local provider fixture exercises production inventory form, stale stock, membership and AAL2 gates", async ({ page, browser }, testInfo) => {
  test.setTimeout(180000);
  const sql = postgres(process.env.TEST_DATABASE_URL!, { ssl: false, max: 2 });
  const actor = crypto.randomUUID(), slug = `browser-stock-${crypto.randomUUID()}`;
  let category = "", product = "", variant = "", inlineCategory = "";
  const errors: string[] = [], diagnostics: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") diagnostics.push(message.text()); });
  page.on("requestfailed", request => diagnostics.push(`${request.method()} ${new URL(request.url()).pathname}: ${request.failure()?.errorText}`));
  const app = spawn(process.execPath, ["--import", resolve("tests/fixtures/auth-provider.mjs"), resolve(".next/standalone/server.js")], {
    env: { ...process.env, NODE_ENV: "production", DATABASE_URL: process.env.TEST_DATABASE_URL, E2E_AUTH_PROVIDER_FIXTURE: "local-only", E2E_FIXTURE_USER: actor, HOSTNAME: "127.0.0.1", PORT: "3106" }, stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  for (const stream of [app.stdout, app.stderr]) stream.on("data", chunk => { output = (output + chunk).slice(-20000); });
  const origin = "http://127.0.0.1:3106";
  const session = async (aal: string) => {
    const expires = Math.floor(Date.now()/1000) + 3600;
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: actor, exp: expires, iat: expires-3600, iss: "local-fixture", aud: "authenticated", role: "authenticated", aal, session_id: crypto.randomUUID() })).toString("base64url");
    const access = `${header}.${payload}.${createHmac("sha256", "monechai-isolated-fixture-only").update(`${header}.${payload}`).digest("base64url")}`;
    const value = `base64-${Buffer.from(JSON.stringify({ access_token: access, refresh_token: "local-fixture-only", expires_at: expires, token_type: "bearer", user: { id: actor, factors: [] } })).toString("base64url")}`;
    await page.context().addCookies([{ name: "sb-media-auth-token", value, domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
  };
  try {
    await expect.poll(async () => { try { return (await fetch(`${origin}/api/health`)).status; } catch { return 0; } }, { timeout: 20000, message: "Local fixture app readiness" }).toBe(200);
    await sql`insert into admin_members(user_id) values(${actor})`;
    [{ id: category }] = await sql`insert into categories(slug,name_en) values(${slug},'Browser inventory fixture') returning id`;
    [{ id: product }] = await sql`insert into products(slug,sku,category_id,name_en,price_minor) values(${slug},${slug},${category},'Inventory browser fixture',1000) returning id`;
    [{ id: variant }] = await sql`insert into product_variants(product_id,sku,label,stock_quantity) values(${product},${slug},'Default',2) returning id`;
    const path = `${origin}/admin/products/${product}`;
    await page.goto(path); await expect(page).toHaveURL(/\/admin\/login/);
    await session("aal1"); await page.goto(path); await expect(page).toHaveURL(/\/admin\/security/);
    await session("aal2");
    await page.goto(`${origin}/admin`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your store, at a glance.");
    await expect(page.getByRole("navigation", { name: "Admin navigation" }).getByRole("link")).toHaveCount(7);
    await expect(page.getByRole("link", { name: "Manage product photos", exact: true })).toBeVisible();
    await page.goto(`${origin}/admin/inventory?stock=low`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Inventory");
    await expect(page.getByRole("link", { name: "Inventory browser fixture", exact: true })).toBeVisible();
    await page.goto(`${origin}/admin/analytics?days=7`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sales & order analytics");
    await expect(page.getByRole("combobox", { name: "Reporting period" })).toHaveValue("7");
    await expect(page.getByText("Net recorded collections", { exact: true })).toBeVisible();
    await page.goto(`${origin}/admin/products/new`);
    const draftForm = page.locator("form").filter({ has: page.getByRole("heading", { name: "Product details", exact: true }) });
    await draftForm.getByRole("textbox", { name: "English name", exact: true }).fill("Unsaved product fixture");
    const categoryDetails = page.locator("details.admin-inline-category");
    await categoryDetails.locator("summary").click();
    const inlineSlug = `inline-${crypto.randomUUID()}`;
    await categoryDetails.getByRole("textbox", { name: "Slug", exact: true }).fill(inlineSlug);
    await categoryDetails.getByRole("textbox", { name: "English name", exact: true }).fill("Inline category fixture");
    await categoryDetails.getByRole("button", { name: "Save category", exact: true }).click();
    await expect(categoryDetails.getByRole("status")).toHaveText("Category saved.");
    [{ id: inlineCategory }] = await sql`select id from categories where slug=${inlineSlug}`;
    await expect(page.getByRole("combobox", { name: "Category", exact: true }).getByRole("option", { name: "Inline category fixture", exact: true })).toHaveCount(1);
    await expect(draftForm.getByRole("textbox", { name: "English name", exact: true })).toHaveValue("Unsaved product fixture");
    await page.goto(path);
    const upload = page.locator("form.admin-photo-upload");
    const pixels = await sharp({ create: { width: 32, height: 32, channels: 3, background: "#b99d70" } }).png().toBuffer();
    await upload.locator('input[type="file"]').setInputFiles({ name: "preview-fixture.png", mimeType: "image/png", buffer: pixels });
    await expect(upload.getByRole("img", { name: "Selected photo preview" })).toBeVisible();
    await expect(upload.getByRole("button", { name: "Upload photo", exact: true })).toBeEnabled();
    await upload.locator('input[type="file"]').setInputFiles({ name: "unsupported.txt", mimeType: "text/plain", buffer: Buffer.from("fixture") });
    await expect(upload.getByRole("alert")).toContainText("no larger than 5 MB");
    await expect(upload.getByRole("button", { name: "Upload photo", exact: true })).toBeDisabled();
    await page.reload();
    for (const route of ["/admin", "/admin/products", "/admin/products/new", "/admin/inventory", "/admin/analytics?days=7", "/admin/orders", "/admin/settings", "/admin/categories"]) {
      for (const width of [320, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 }); await page.goto(`${origin}${route}`);
        await expect(page.getByRole("navigation", { name: "Admin navigation" })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth), `${route} at ${width}px`).toBeLessThanOrEqual(width + 1);
        expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze()).violations, `${route} at ${width}px`).toEqual([]);
        await page.screenshot({ path: testInfo.outputPath(`workspace-${route.replace(/[^a-z0-9]/gi, "-")}-${width}.png`), fullPage: true });
      }
    }
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 }); await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Inventory browser fixture");
      await page.screenshot({path:testInfo.outputPath(`admin-inventory-${width}.png`),fullPage:true});
      const overflow = await page.evaluate(() => Array.from(document.querySelectorAll("body *")).filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(el=>({tag:el.tagName,class:el.className,width:el.getBoundingClientRect().width})));
      expect(await page.evaluate(() => document.documentElement.scrollWidth),JSON.stringify(overflow)).toBeLessThanOrEqual(width+1);
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    }
    for (const scale of [2,4]) {
      // Zoom-equivalent viewport/DPR simulation preserves responsive breakpoints;
      // native browser UI zoom remains a separate manual acceptance check.
      const zoomContext=await browser.newContext({viewport:{width:1280/scale,height:Math.floor(900/scale)},deviceScaleFactor:scale});
      try {
        await zoomContext.addCookies(await page.context().cookies());
        const zoomPage=await zoomContext.newPage(); await zoomPage.goto(path);
        expect(await zoomPage.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280/scale+1);
        await zoomPage.getByRole("heading",{name:"Inventory: Default",exact:true}).scrollIntoViewIfNeeded();
        await zoomPage.screenshot({path:testInfo.outputPath(`admin-inventory-reflow-${scale}.png`),fullPage:false});
      } finally {await zoomContext.close();}
    }
    await page.reload();
    const inventory = page.locator("form").filter({has:page.getByRole("heading",{name:"Inventory: Default",exact:true})});
    const quantity = inventory.getByRole("spinbutton");
    await quantity.fill("3"); await quantity.press("Tab");
    await expect(inventory.getByRole("checkbox",{name:"I intend to adjust inventory to these values"})).toBeFocused();
    await page.keyboard.press("Space"); await page.keyboard.press("Tab");
    await expect(inventory.getByRole("button",{name:"Adjust inventory",exact:true})).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(inventory.getByRole("status")).toHaveText("Inventory adjusted.");
    await expect(inventory.getByRole("checkbox",{name:"I intend to adjust inventory to these values"})).not.toBeChecked();
    await expect(inventory.getByRole("button",{name:"Adjust inventory",exact:true})).toBeFocused();
    expect((await sql`select stock_quantity from product_variants where id=${variant}`)[0].stock_quantity).toBe(3);
    await page.reload();
    // Emulate a concurrent committed stock change after form load. Domain checkout
    // races and once-only cancellation execute separately in strict DB regressions.
    await sql`update product_variants set stock_quantity=2 where id=${variant}`;
    await inventory.getByRole("spinbutton").fill("9");
    await inventory.getByRole("checkbox",{name:"I intend to adjust inventory to these values"}).check();
    await inventory.getByRole("button",{name:"Adjust inventory",exact:true}).click();
    await expect(inventory.getByRole("status")).toContainText("Inventory changed");
    expect((await sql`select stock_quantity from product_variants where id=${variant}`)[0].stock_quantity).toBe(2);
    await page.reload();
    const metadata = page.locator("form").filter({has:page.locator(`input[name="sku"][value="${slug}"]`)}).filter({has:page.getByRole("button",{name:"Save variant",exact:true})});
    await metadata.getByRole("textbox",{name:"Label",exact:true}).fill("Edited");
    await metadata.getByRole("button",{name:"Save variant",exact:true}).click();
    await expect(metadata.getByRole("status")).toHaveText("Variant saved.");
    expect((await sql`select stock_quantity from product_variants where id=${variant}`)[0].stock_quantity).toBe(2);
    await sql`delete from admin_members where user_id=${actor}`;
    await page.goto(path); await expect(page).toHaveURL(/\/admin\/unauthorized/);
    expect(errors).toEqual([]);
    testInfo.annotations.push({type:"environment",description:"LOCAL_VERIFIED: actual production app/SSR/Server Actions/DB; Supabase Auth I/O replaced by isolated signed-token fixture. Not live provider/MFA acceptance."});
    await testInfo.attach("browser-diagnostics",{body:JSON.stringify(diagnostics),contentType:"application/json"});
  } catch (error) { throw new Error(`${String(error)}\nFixture server diagnostics: ${output}`); }
  finally {
    app.kill("SIGTERM");
    if (app.exitCode === null) await new Promise<void>(resolveExit => { const timer=setTimeout(()=>{app.kill("SIGKILL");resolveExit();},5000);app.once("exit",()=>{clearTimeout(timer);resolveExit();}); });
    await sql`delete from admin_mutation_history where actor_user_id=${actor}`;
    if(product) await sql`delete from products where id=${product}`;
    if(category) await sql`delete from categories where id=${category}`;
    if(inlineCategory) await sql`delete from categories where id=${inlineCategory}`;
    await sql`delete from admin_members where user_id=${actor}`; await sql.end();
  }
});
