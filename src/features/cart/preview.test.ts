import { test } from "node:test";
import assert from "node:assert/strict";
import { CART_PREVIEW_TIMEOUT_MS, createCartPreview, type CartLine } from "./preview";

const items = [{ variantId: "00000000-0000-4000-8000-000000000001", quantity: 1 }];
const lines: CartLine[] = [{ variantId: items[0].variantId, name: "Server item", label: "Default", available: true, unitPriceMinor: 12345 }];
const response = () => Response.json({ lines });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

test("cart preview uses server data and clears the completed request deadline", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let signal!: AbortSignal;
  t.mock.method(globalThis, "fetch", async (_url: RequestInfo | URL, options?: RequestInit) => { assert.ok(options?.signal); signal = options.signal; assert.equal(options.cache, "no-store"); assert.deepEqual(JSON.parse(String(options.body)), { items }); return response(); });
  const received: CartLine[][] = []; let errors = 0;
  await createCartPreview().refresh(items, (value) => received.push(value), () => errors++);
  t.mock.timers.tick(CART_PREVIEW_TIMEOUT_MS);
  assert.deepEqual(received, [lines]); assert.equal(errors, 0); assert.equal(signal.aborted, false);
});

test("stalled cart preview reaches its deadline, aborts and reports one retryable error", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let signal!: AbortSignal;
  t.mock.method(globalThis, "fetch", (_url: RequestInfo | URL, options?: RequestInit) => { assert.ok(options?.signal); signal = options.signal; return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true })); });
  let errors = 0; const preview = createCartPreview();
  const pending = preview.refresh(items, () => assert.fail("stalled request succeeded"), () => errors++);
  t.mock.timers.tick(CART_PREVIEW_TIMEOUT_MS - 1); assert.equal(errors, 0);
  t.mock.timers.tick(1); await pending;
  assert.equal(signal.aborted, true); assert.equal(errors, 1);
  t.mock.timers.tick(CART_PREVIEW_TIMEOUT_MS); assert.equal(errors, 1);
});

test("cart preview can explicitly retry after network, HTTP and response-body failures", async (t) => {
  for (const failure of [async () => { throw new Error("offline"); }, async () => new Response("", { status: 503 }), async () => new Response("invalid JSON")]) {
    const fetch = t.mock.method(globalThis, "fetch", failure);
    let errors = 0; const received: CartLine[][] = []; const preview = createCartPreview();
    await preview.refresh(items, (value) => received.push(value), () => errors++);
    fetch.mock.mockImplementation(async () => response());
    await preview.refresh(items, (value) => received.push(value), () => errors++);
    assert.equal(errors, 1); assert.deepEqual(received, [lines]); fetch.mock.restore();
  }
});

test("rapid quantity edits abort each superseded request and a slow earlier response cannot overwrite the latest", async (t) => {
  const calls: { signal: AbortSignal; pending: ReturnType<typeof deferred<Response>>; quantity: number }[] = [];
  t.mock.method(globalThis, "fetch", (_url: RequestInfo | URL, options?: RequestInit) => { assert.ok(options?.signal); const pending = deferred<Response>(); calls.push({ pending, signal: options.signal, quantity: JSON.parse(String(options.body)).items[0].quantity }); return pending.promise; });
  const received: CartLine[][] = []; let errors = 0; const preview = createCartPreview();
  const pending = [1, 2, 3].map((quantity) => preview.refresh([{ ...items[0], quantity }], (value) => received.push(value), () => errors++));
  assert.deepEqual(calls.map((call) => call.quantity), [1, 2, 3]);
  assert.deepEqual(calls.map((call) => call.signal.aborted), [true, true, false]);
  calls[2].pending.resolve(response()); await pending[2];
  calls[0].pending.resolve(Response.json({ lines: [{ ...lines[0], name: "Stale item" }] }));
  calls[1].pending.resolve(response()); await Promise.all(pending);
  assert.deepEqual(received, [lines]); assert.equal(errors, 0);
});

test("cancellation fences a pending response body and clears its deadline", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const body = deferred<{ lines: CartLine[] }>(); let signal!: AbortSignal;
  t.mock.method(globalThis, "fetch", async (_url: RequestInfo | URL, options?: RequestInit) => { assert.ok(options?.signal); signal = options.signal; return { ok: true, json: () => body.promise }; });
  let callbacks = 0; const preview = createCartPreview();
  const pending = preview.refresh(items, () => callbacks++, () => callbacks++);
  await Promise.resolve(); preview.cancel(); preview.cancel();
  body.resolve({ lines }); await pending; t.mock.timers.tick(CART_PREVIEW_TIMEOUT_MS);
  assert.equal(signal.aborted, true); assert.equal(callbacks, 0);
});

test("removing the final cart item cancels outstanding work without another request", async (t) => {
  const late = deferred<Response>(); let signal!: AbortSignal;
  const fetch = t.mock.method(globalThis, "fetch", (_url: RequestInfo | URL, options?: RequestInit) => { assert.ok(options?.signal); signal = options.signal; return late.promise; });
  const preview = createCartPreview(); let callbacks = 0;
  const pending = preview.refresh(items, () => callbacks++, () => callbacks++);
  await preview.refresh([], () => callbacks++, () => callbacks++);
  late.resolve(response()); await pending;
  assert.equal(signal.aborted, true); assert.equal(fetch.mock.callCount(), 1); assert.equal(callbacks, 0);
});

test("timed-out transport that ignores abort cannot later publish data; retry remains current", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const late = deferred<Response>(); const fetch = t.mock.method(globalThis, "fetch", () => late.promise);
  let errors = 0; const received: CartLine[][] = []; const preview = createCartPreview();
  const pending = preview.refresh(items, (value) => received.push(value), () => errors++);
  t.mock.timers.tick(CART_PREVIEW_TIMEOUT_MS);
  fetch.mock.mockImplementation(async () => response());
  await preview.refresh(items, (value) => received.push(value), () => errors++);
  late.resolve(Response.json({ lines: [] })); await pending;
  assert.equal(errors, 1); assert.deepEqual(received, [lines]);
});

test("cart preview deadline also bounds a stalled response body", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const body = deferred<{ lines: CartLine[] }>(); let signal!: AbortSignal;
  t.mock.method(globalThis, "fetch", async (_url: RequestInfo | URL, options?: RequestInit) => { assert.ok(options?.signal); signal = options.signal; return { ok: true, json: () => body.promise }; });
  let errors = 0; let successes = 0; const preview = createCartPreview();
  const pending = preview.refresh(items, () => successes++, () => errors++);
  await Promise.resolve(); t.mock.timers.tick(CART_PREVIEW_TIMEOUT_MS);
  assert.equal(errors, 1); assert.equal(signal.aborted, true);
  body.resolve({ lines }); await pending;
  assert.equal(successes, 0); assert.equal(errors, 1);
});

test("manual drawer lifecycle cancellation handles AbortError without error feedback or leftover deadline", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  t.mock.method(globalThis, "fetch", (_url: RequestInfo | URL, options?: RequestInit) => { assert.ok(options?.signal); const signal = options.signal; return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true })); });
  let callbacks = 0; const preview = createCartPreview();
  const pending = preview.refresh(items, () => callbacks++, () => callbacks++);
  preview.cancel(); await pending; t.mock.timers.tick(CART_PREVIEW_TIMEOUT_MS);
  assert.equal(callbacks, 0);
});
