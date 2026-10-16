import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
async function check(url) {
  const child = spawn(process.execPath, ["scripts/health-check.mjs"], { env: { ...process.env, HEALTHCHECK_URL: url }, stdio: "ignore" });
  return new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", resolve); });
}
test("operator health command fails on outages, partial DB health, redirects and invalid endpoints", async () => {
  let mode = "ok";
  const server = createServer((_request, response) => {
    if (mode === "redirect") { response.writeHead(302, { Location: "/api/health" }); response.end(); return; }
    response.writeHead(mode === "outage" ? 503 : 200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ status: "ok", database: mode === "partial" ? "unavailable" : "ok" }));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    assert.equal(await check(`${origin}/api/health`), 0);
    for (mode of ["outage", "partial", "redirect"]) assert.equal(await check(`${origin}/api/health`), 1, mode);
    assert.equal(await check(`${origin}/admin`), 1);
    assert.equal(await check(`${origin}/api/health?token=private`), 1);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
