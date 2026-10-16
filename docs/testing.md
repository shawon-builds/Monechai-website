# Local verification (goal 09)

Latest recorded local release checks,2026-10-16: strict127/127 with0skips and production E2E37/37 passed, including inline category creation with unsaved product fields retained, photo preview/rejection, inventory/report routes and8admin screens at320/768/1440px with Axe/overflow checks. Actual owner login/MFA dashboard access was separately observed before the API switch. Real product/photo/order/provider/recovery/session and manual screen-reader/native-zoom checks remain open. The built-in browser is unavailable in the current API environment; automated Playwright fixture checks do not provide its private owner session.

Tests must **never** point at production or a shared database. `npm test` ignores inherited `DATABASE_URL` and runs its DB cases only when `TEST_DATABASE_URL` is set; `npm run test:e2e` requires it. Both runners require a PostgreSQL URL on localhost with database path `/monechai_test`. The E2E suite inserts/deletes its own category, products, shipping zone and order; keep this database disposable and do not run tests concurrently against it. The runner does not provision migrations.

Example with Docker and an unused local port (test-only credentials; not for production):

```bash
docker run -d --name monechai-goal09-db -e POSTGRES_PASSWORD=test-only -e POSTGRES_DB=monechai_test -p 127.0.0.1:55439:5432 postgres:17
export TEST_DATABASE_URL='postgresql://postgres:test-only@127.0.0.1:55439/monechai_test'
export DATABASE_SSL=disable
DATABASE_URL="$TEST_DATABASE_URL" npm run db:migrate
npm run lint
npx next typegen
npm run typecheck
npm run test:ci
# Dummy build inputs for local SEO/image fixtures only.
export NEXT_PUBLIC_SITE_URL=https://store.example
export NEXT_PUBLIC_SUPABASE_URL=https://media.example
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_local_fixture_123
npm run build
E2E_PRODUCTION=1 npm run test:e2e
docker stop monechai-goal09-db && docker rm monechai-goal09-db
```

Use a **separate** disposable database for migrations; `db:migrate` still uses `DATABASE_URL` and does not have the test runner's safety guard. Do not commit credentials, export a production URL into the test shell, or run browser tests against a production server. If no database is available, `npm test` runs domain tests and explicitly skips DB cases; this is **not** a full passing integration run. Chromium full browser is required (`npx playwright install chromium` if missing); Playwright starts Next dev on 127.0.0.1:3104 itself and refuses to reuse an existing server. Browser tests include home/shop/product across 390/800/1280 px, locale switch, keyboard shop/cart/checkout, invalid and tampered checkout, out-of-stock and DB-backed COD success. They do not yet constitute a screenshot pixel baseline or a live owner/admin flow.

Local public-storefront screenshots, keyboard journeys and accessibility scans have been executed in earlier dated runs, including stale-price reconfirmation in [`price-review.spec.ts`](../tests/e2e/price-review.spec.ts). Receipt-payment and cart-timeout browser regressions were added in batch01. Read [current task tracker](../STATS.MD) for executed commands/counts and [project record](PROJECT_RECORD.md) for dated evidence. Every changed release still needs its own complete run; old passes do not certify the current tree.

Goal09 remains blocked on real owner Storage/product-photo/order, remaining session/recovery and manual/external acceptance; initial owner login/MFA access is already recorded as successful. Local decoded-pixel adapters and simulated SQL identities do not prove all provider behavior. The obsolete prototype was removed on 2026-10-10; retrieve its design from Git history. The [immutable production-readiness audit](audits/2026-10-14-monechai-production-readiness-audit.md) retains original findings; [current remediation status](../STATS.MD) records later local fixes.

Start with a fresh disposable database whose state you verify; do not reuse an old container or URL solely because historical logs mention it.

## Strict verification and production release mode

Use Node22.23.3 (`.nvmrc`). `npm run test:ci` is the zero-skip gate: missing/remote TEST_DATABASE_URL is rejected before tests, and any skipped test fails. `npm run test:ops` runs the isolated app database + actual decoded-photo encrypted restore drill; it refuses an existing/original target and cleans only its own fixtures. Run unit/ops/browser suites sequentially against the same disposable database.

For approved-production SEO/image fixtures, build with dummy `NEXT_PUBLIC_SITE_URL=https://store.example`, `NEXT_PUBLIC_SUPABASE_URL=https://media.example` and public fixture key `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_local_fixture_123` and run the isolated production server with `SITE_INDEXING_APPROVED_ORIGIN=https://store.example` (the Playwright fixture configuration sets this deliberately). Leave approval unset in default-deny/staging cases. After `npm run build`, run `E2E_PRODUCTION=1 npm run test:e2e` for the actual standalone server. That mode verifies private/no-store/no-referrer receipts, explicit language URLs/metadata, separate guest carts/receipt data, stale-price reconfirmation, policy consent, response-loss recovery and WCAG2A/AA/2.1A/AA scans on the tested public/cart/login/recovery screens. Development Next pages override some cache headers; production is the release authority. Existing provider/image tests include real decoded pixels/local adapters and SQL identities/AAL claims; they do not prove a real owner session/bucket.

The quality workflow recorded in older sessions is absent from this transferred checkout. Historical hosted runs and their failing full-tooling gate are recorded in STATS.MD; reconcile and review the workflow before claiming current hosted coverage. Temporary braces3.0.3 string-pattern mitigation is checksum/version/layout guarded at postinstall; regression rejects malicious nesting while keeping normal glob expansion. The last recorded npm audit still flagged that package/version; recheck it rather than counting mitigation as zero advisories.

The strict suite includes dependency-free documentation checks for active local Markdown destinations/anchors, current runbook navigation and retained audit/archive bytes. Original audit/history files are immutable evidence, excluded as sources of current-status assertions. `docs/PROJECT_RECORD.md` preserves dated source bodies; its current introduction and `STATS.MD` govern resume decisions.

## Batch04 acceptance extension — 2026-10-15

Production E2E now includes the real inventory form/Server Actions with a signed-token provider-I/O fixture in a separately spawned loopback app. `tests/fixtures/auth-provider.mjs` is test-only and refuses nonlocal DB/host/port;no release import or live Supabase verification is implied. Tests cover actual membership/AAL2 decisions,stale inventory,metadata isolation,success announcement/confirmation/focus and five widths. Customer EN/BN shop/cart and home/product coverage uses320/375/768/1024/1440;2×/4× viewport/DPR simulations exercise reflow,not native browser UI zoom. Manual screen-reader/provider acceptance remains external. Optional DATABASE_SSL_CA runtime/preflight behavior is tested with actual client source and fixture I/O;real pooler certificate/role denials are separately recorded in the [access inventory](audits/2026-10-14-monechai-external-access-inventory.md).
