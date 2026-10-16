import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (path) => readFileSync(resolve(root, path), "utf8");
const documents = [
  ...readdirSync(root).filter((name) => /\.md$/i.test(name)),
  ...readdirSync(resolve(root, "docs")).filter((name) => /\.md$/i.test(name)).map((name) => `docs/${name}`),
];
const prose = (text) => text.replace(/^\s*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\s*\1\s*$/gm, "");

function anchors(text) {
  const ids = new Set([...text.matchAll(/<a\s+[^>]*id=["']([^"']+)["']/g)].map((match) => match[1]));
  const counts = new Map();
  for (const match of prose(text).matchAll(/^#{1,6}\s+(.+?)\s*#*$/gm)) {
    const slug = match[1].replace(/<[^>]+>/g, "").toLowerCase().replace(/[^\p{L}\p{M}\p{N}_\-\s]/gu, "").replace(/ /g, "-");
    const duplicate = counts.get(slug) ?? 0;
    counts.set(slug, duplicate + 1);
    ids.add(duplicate ? `${slug}-${duplicate}` : slug);
  }
  return ids;
}

test("MON-021 active Markdown links and anchors resolve, including consolidated history navigation", (t) => {
  const failures = [];
  let checked = 0;
  for (const document of documents) {
    const text = prose(read(document));
    const destinations = [
      ...text.matchAll(/!?\[[^\]\n]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+["'][^\n]*["'])?\s*\)/g),
      ...text.matchAll(/^\s*\[[^\]]+\]:\s*(<[^>]+>|[^\s]+)(?:\s|$)/gm),
    ].map((match) => match[1].replace(/^<|>$/g, ""));
    for (const destination of destinations) {
      if (/^[a-z][a-z\d+.-]*:/i.test(destination) || destination.startsWith("//")) continue;
      checked++;
      const [path, fragment] = destination.split("#", 2).map(decodeURIComponent);
      const target = path ? resolve(root, dirname(document), path) : resolve(root, document);
      if (!existsSync(target)) failures.push(`${document}: missing ${destination}`);
      else if (fragment && /\.md$/i.test(target) && !anchors(readFileSync(target, "utf8")).has(fragment)) {
        failures.push(`${document}: missing anchor ${destination}`);
      }
    }
  }
  assert.ok(checked > 100, "Scan must include current trackers and consolidated record links");
  assert.deepEqual(failures, []);
  t.diagnostic(`${documents.length} active Markdown files; ${checked} local destinations and anchors checked`);
});

test("MON-021 current runbooks use authoritative navigation and retain external release blockers", () => {
  for (const document of ["README.md", "ARCHITECTURE.md", "docs/testing.md", "docs/deployment.md", "docs/admin-bootstrap.md", "docs/product-images.md", "docs/OPERATIONS_CHECKS.md", ".env.example"]) {
    assert.doesNotMatch(read(document), /(?:PROJECT_AUDIT|OWNER_SETUP_CHECKLIST|STORE_OPERATING_PLAN|PRODUCTION_SERVICES)\.md|docs\/goals\//, document);
  }
  assert.match(read("README.md"), /\[current task tracker\]\(STATS\.MD\)/);
  assert.match(read("docs/testing.md"), /\[current task tracker\]\(\.\.\/STATS\.MD\)/);
  assert.doesNotMatch(read("docs/testing.md"), /price-review\.spec\.ts` is saved and has not been run|restart that container/);
  assert.doesNotMatch(read("ARCHITECTURE.md"), /Crawlable locale URLs, policy pages and configured store-name branding remain open/);
  assert.doesNotMatch(read("README.md"), /no provider selection, purchase or account setup has occurred/);
  assert.match(read("docs/OPERATIONS_CHECKS.md"), /Full security audit remains deliberately failing/);
  assert.match(read("README.md"), /actual Supabase\/host\/mail\/DNS\/off-site\/full-backend acceptance is outstanding/);
  assert.ok(!existsSync(resolve(root, "docs/goals")), "Do not recreate retired goal documents");
});

test("MON-021 original production audit and exact documentation archive remain immutable", () => {
  const preserved = {
    "docs/audits/2026-10-14-monechai-production-readiness-audit.md": "cb36d0ce6927998fad2df0ab09c9917fa12f196c58da9a08abbda987a34c5b72",
    "docs/history/planning-before-consolidation-2026-10-11.tar.gz": "0d64bb83eaba65337d51fb92be35ddbb918bf56007884b48c4743887208ae0a8",
    "docs/history/planning-before-consolidation-2026-10-11.json": "8adcd151352d9e062af5e69a5091dbcbfa89a6356b8a9525c098e20e58b9b808",
  };
  for (const [path, expected] of Object.entries(preserved)) {
    assert.equal(createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex"), expected, path);
  }
});
