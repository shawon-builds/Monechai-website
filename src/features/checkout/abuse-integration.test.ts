import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { test } from "node:test";
import { createServer } from "node:http";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { allowRequest, checkoutRateKey } from "./abuse";

test("trusted identity survives rotated cookies, IP aliases and forged forwarded chains", async () => {
  const previous = process.env.CHECKOUT_TRUST_PROXY_IP_HEADER;
  const request = (ip: string, visitor = randomUUID()) => new Request("http://localhost", { headers: { "x-real-ip": ip, "x-monechai-visitor": visitor, "x-forwarded-for": randomUUID(), "cf-connecting-ip": "198.51.100.2" } });
  try {
    delete process.env.CHECKOUT_TRUST_PROXY_IP_HEADER;
    assert.notEqual(checkoutRateKey(request("192.0.2.1")), checkoutRateKey(request("192.0.2.1")), "Unconfigured cookie fallback remains resettable, not production protection");
    const visitor = randomUUID();
    assert.equal(checkoutRateKey(request("192.0.2.1", visitor)), checkoutRateKey(request("198.51.100.2", visitor)), "Unconfigured mode ignores forged IP headers");
    process.env.CHECKOUT_TRUST_PROXY_IP_HEADER = "true";
    for (const ip of ["", "unknown", "192.0.2.1, 198.51.100.1", "fe80::1%eth0", "[::1]", "192.0.2.1:80"]) assert.equal(checkoutRateKey(request(ip)), null);
    assert.equal(checkoutRateKey(new Request("http://localhost")), null);
    for (const ip of ["192.0.2.1", "::ffff:192.0.2.1", "0:0:0:0:0:FFFF:C000:0201"]) assert.equal(checkoutRateKey(request(ip)), "ip:192.0.2.1");
    for (const ip of ["2001:db8::a", "2001:0DB8:0000:0000:0000:0000:0000:000A"]) assert.equal(checkoutRateKey(request(ip)), "ip:2001:db8::a");
    // Model the documented direct ingress overwrite using a real loopback socket.
    const ingress = createServer((incoming, response) => {
      const headers = new Headers(incoming.headers as Record<string, string>);
      headers.set("x-real-ip", incoming.socket.remoteAddress!);
      response.end(checkoutRateKey(new Request("http://localhost", { headers })));
    });
    await new Promise<void>(resolve => ingress.listen(0, "127.0.0.1", resolve));
    try {
      const address = ingress.address() as { port: number };
      for (const ip of ["192.0.2.1", "198.51.100.2"]) {
        const result = await fetch(`http://127.0.0.1:${address.port}`, { headers: { "x-real-ip": ip, "x-forwarded-for": ip, "forwarded": `for=${ip}`, "cf-connecting-ip": ip, "cookie": `monechai-visitor=${randomUUID()}` } });
        assert.equal(await result.text(), "ip:127.0.0.1");
      }
    } finally { await new Promise<void>((resolve, reject) => ingress.close(error => error ? reject(error) : resolve())); }
  } finally {
    if (previous === undefined) delete process.env.CHECKOUT_TRUST_PROXY_IP_HEADER; else process.env.CHECKOUT_TRUST_PROXY_IP_HEADER = previous;
  }
});

test("rotating visitors share an atomic bounded trusted-IP quota and exact expiration", { skip: !process.env.DATABASE_URL }, async () => {
  const client = postgres(process.env.DATABASE_URL!, { ssl: false, max: 8 });
  const db = drizzle({ client });
  const scope = `mon003-${randomUUID()}`;
  const key = "ip:192.0.2.1";
  const digest = createHash("sha256").update(`${scope}:${key}`).digest("hex");
  const previous = process.env.CHECKOUT_TRUST_PROXY_IP_HEADER;
  const now = Date.now(), window = 600000;
  try {
    process.env.CHECKOUT_TRUST_PROXY_IP_HEADER = "true";
    const attempts = () => Promise.all(Array.from({ length: 32 }, () => {
      const request = new Request("http://localhost", { headers: { "x-real-ip": "192.0.2.1", "x-monechai-visitor": randomUUID(), "x-forwarded-for": randomUUID() } });
      return allowRequest(scope, checkoutRateKey(request), 5, window, db, now);
    }));
    assert.equal((await attempts()).filter(Boolean).length, 5);
    assert.equal((await attempts()).filter(Boolean).length, 0);
    const [row] = await client`select count,expires_at from request_limits where key=${digest}`;
    assert.equal(row.count, 5); assert.equal(new Date(row.expires_at).getTime(), now + window);
    assert.equal(await allowRequest(scope, key, 5, window, db, now + window - 1), false);
    assert.equal(await allowRequest(scope, key, 5, window, db, now + window), true);
    assert.equal((await client`select count from request_limits where key=${digest}`)[0].count, 1);
    assert.equal(await allowRequest(scope, null, 5, window, db), false);
    for (const [max, duration] of [[0, window], [1.5, window], [2147483648, window], [5, 0], [5, Infinity], [5, 86400001]]) await assert.rejects(allowRequest(scope, key, max, duration, db));
  } finally {
    if (previous === undefined) delete process.env.CHECKOUT_TRUST_PROXY_IP_HEADER; else process.env.CHECKOUT_TRUST_PROXY_IP_HEADER = previous;
    await client`delete from request_limits where key=${digest}`; await client.end();
  }
});
