// Suitable for a scheduler/monitor. Exit failure triggers the operator's alert mechanism.
try {
  const target = new URL(process.env.HEALTHCHECK_URL || "");
  if (!/^https?:$/.test(target.protocol) || target.username || target.password || target.pathname !== "/api/health" || target.search || target.hash) throw new Error("Set HEALTHCHECK_URL to the app /api/health endpoint");
  const response = await fetch(target, { signal: AbortSignal.timeout(10000), redirect: "error", cache: "no-store" });
  if (!response.ok) throw new Error("Application health check failed");
  const body = await response.json();
  if (body.status !== "ok" || body.database !== "ok") throw new Error("Application database health check failed");
  console.log("Application health check passed.");
} catch { console.error("Application health check failed. Notify the configured operator."); process.exitCode = 1; }
