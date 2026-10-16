try {
  const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || ""), secret = process.env.ORDER_WORKER_SECRET;
  if (origin.protocol !== "https:" || origin.pathname !== "/" || origin.username || origin.password || origin.search || origin.hash || !secret || secret.length < 32) throw new Error("Configure canonical HTTPS origin and worker secret");
  const response = await fetch(new URL("/api/internal/order-alerts", origin), { method: "POST", headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(30000), redirect: "error" });
  if (!response.ok) throw new Error("Order alert delivery pending; review admin queue");
  console.log("Order alert worker completed.");
} catch { console.error("Order alert worker failed; review configured operator alerts and admin queue."); process.exitCode = 1; }
