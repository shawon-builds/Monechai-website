# Monechai production-readiness audit — 2026-10-14

## 1. Executive summary

**Verdict: hold public commerce launch.** Current application is a substantial single-owner, new-products-only COD storefront with credible transactional and authorization safeguards. It is not an accepted production service. Goals01–04 are completed local milestones;05–10 still require owner/provider/business/hosting acceptance. Online payments remain conditional Goal11 and are not implemented.

Strongest verified local results: lint/typecheck/build pass;35 unit/domain/utility tests pass with15 database cases explicitly skipped; production dependency audit has0 advisories. Complete dependency audit has5 high package entries tracing to one upstream braces advisory. Those entries are not five independent application vulnerabilities. Existing guarded mitigation test passes; advisory/release gate remains unresolved.

Most consequential source findings: stale admin variant forms can overwrite stock consumed by checkout (MON-001), and preflight requires migration-schema access explicitly denied to documented runtime credentials (MON-002). Resettable anonymous quota identities weaken abuse control unless the chosen ingress supplies a verified stronger budget (MON-003). No demonstrated authentication bypass, cross-customer PII leak, fake order success or client-controlled payment success was established. Source-only conclusions do not certify Supabase or deployed behavior.

Before real customers: resolve stock editing and preflight; accept real member/AAL2/recovery/Storage journeys; approve policies/rates/contact/courier/COD/refund procedures; configure/test SMTP and independent backups/alerts; select and verify hosting, DNS/HTTPS and release provenance; rerun isolated DB and production browser acceptance. Do not add online payment selectors before a selected merchant integration passes its separate controls. No numerical readiness score is assigned.

Unique controls: **258**. **PASS: 134**; **PARTIAL: 37**; **FAIL: 5**; **UNVERIFIED: 25**; **EXTERNAL ACCESS REQUIRED: 30**; **NOT APPLICABLE: 27**.

Findings:25 total — P0:0, P1:11, P2:12, P3:2. Priority applies to work and launch acceptance, not a claim that all findings are vulnerabilities. Confirmed source defects, partial controls and externally blocked verification are labeled individually below. No immediate critical exploit was demonstrated.

## 2. Audit scope and environment

Repository: /home/sami/Projects/Monechai-website. Project domain supplied by owner: monechai.com. Reviewed commit: d18cb132be5c5efac88f3111adf2aab1ccffd294, branch main. **Audit target is current dirty worktree**, including untracked hardening/new modules and deleted legacy/goal files; committed HEAD alone does not reproduce this target. Initial Git status saved by observation and219 existing source/document/config paths hashed outside repository before work. Existing edits preserved. Only this new report is intentionally written into repository; tracker/goals/AGENTS remain untouched under audit-only instruction.

Locked stack: Next16.3.8, React/ReactDOM19.3.0, TypeScript5.9.3, Drizzle ORM0.45.3/Kit0.31.11, postgres3.4.9, Supabase SSR0.12.7/JS2.117.2, Zod4.6.5, Sharp0.35.5, Nodemailer10.1.0, ESLint9.39.5, Playwright1.63.0, axe-playwright4.13.0. Lock integrity entries present. Node pin is22.23.3; available audit toolchain is22.23.1; ambient shell Node24.16.0 was not used for project checks. That patch-version mismatch limits release acceptance even though audited checks passed.

Skills read: security-audit (web protocol/auth, supply chain/release, data isolation/lifecycle, cloud/deployment, availability, reconnaissance, hunting, validation/reporting and schema guidance), web-design-guidelines, design-taste-frontend, browser-control, anti-slop-writing. Fresh Vercel interface guidelines fetched. Firecrawl-search instructions read for bounded external research; generic web retrieval used instead of installing tools or spending Firecrawl credits. Three focused source reviewers independently covered security, commerce and UI/SEO; stock/preflight/receipt/deadline findings received separate source rechecks. Skill redesign/image-generation steps were excluded by owner's audit-only instruction.

Execution: credential-free source copy outside repository; OS-enforced bwrap user/mount/PID/network isolation; no external network for target code; read-only source/toolchain/dependencies;2 GiB scratch tmpfs,2 CPU affinity,180-second CPU/240-second wall budget,2 GiB Node heap,4 GiB data segment/64 GiB virtual-address cap,2048 per-user process ceiling,512 file descriptors,256 MiB single-file limit. Virtual-address headroom supports Node/Wasm reservations and is not an observed memory measurement. Host already had over1100 user threads, so initial128/1024 process ceilings could not create namespace; limits adjusted before successful execution. No host credentials, socket or provider connection exposed. Registry audits used only copied package/lock files, empty npm configs and clean environment outside target-code sandbox; no install/lifecycle scripts.

Limitations: no isolated PostgreSQL provisioned; no migrations executed, including local ones. DB fixtures/restore/checkout mutations forbidden in this run. Chromium launched but crashed before page inspection in constrained sandbox; no current screenshots/manual keyboard/axe/visual/CWV pass claimed. Safe standalone HTTP checks used absent DB/Auth settings only. No live Supabase/dashboard/host/domain probes, real emails/orders/payment/refunds, active production attacks or deployment occurred. Historical50/50 and4/4 results in STATS are prior evidence, not today's passes. Screenshot images themselves were not attached; section13 covers every expanded textual recommendation and records original-image wording as unavailable.

Status semantics: PASS means reviewed source invariant or explicitly successful local check, with evidence scope stated; it never implies live-provider acceptance. PARTIAL means implemented with a stated gap. FAIL denotes verified missing/incorrect capability. UNVERIFIED denotes unavailable evidence. EXTERNAL ACCESS REQUIRED denotes a specific provider/business/host check. NOT APPLICABLE states current-scope reason. P1 external gates describe required acceptance work, not confirmed remote vulnerabilities.

## 3. Architecture inventory

One Next App Router modular monolith. Public routes are dynamic server components under /en and /bn; client widgets implement cart, checkout, language switch and admin forms. PostgreSQL accessed server-side through Drizzle/postgres-js; no separate backend API deployment. Supabase Auth supplies owner identity; admin_members supplies explicit authorization; every privileged operation requires current server-verified membership plus AAL2. Proxy refreshes cookies and normalizes locale/visitor headers; it does not replace operation authorization.

| Route surface | Actual behavior/boundary | Evidence |
|---|---|---|
| /en, /bn | Server-rendered homepage/catalog blocks and localized StoreShell | src/app/[locale]/page.tsx, layout.tsx |
| /[locale]/shop | URL-backed category/search/sort/page listing;48 maximum/page | shop/page.tsx; catalog/queries.ts:6–52 |
| /[locale]/products/[slug] | Published non-demo detail, live variants/photos, metadata/Product schema | products/[slug]/page.tsx; catalog/queries.ts:55–80 |
| /[locale]/checkout | Guest COD, server preview, explicit current policy consent; no buyer account | checkout/page.tsx; checkout-client.tsx |
| /[locale]/order/[publicToken]/success | Limited bearer receipt,64-hex token, no customer contact/address | success/page.tsx:17–29 |
| /[locale]/policies/{shipping,returns,privacy,terms} | Owner-approved revision display, unavailable state/noindex otherwise | policies/[kind]/page.tsx |
| /admin/login,/admin/recovery,/admin/security,/admin/unauthorized | Owner login/recovery/TOTP setup and denial | admin routes; account-actions/service.ts |
| /admin,/admin/products/{new,[id]},/admin/categories | AAL2 dashboard and catalog/media CRUD | admin pages; catalog/*-actions.ts |
| /admin/orders,[id],/admin/settings | Protected orders/status/cash/refund/tracking, settings/areas/policies | admin orders/settings pages/actions |
| POST /api/checkout,/api/checkout/preview | Same-origin, limited JSON, quotas; authoritative transaction or preview | api/checkout/route.ts |
| /api/checkout/session | HttpOnly retry-handle recovery/clear; no permanent browser customer data | api/checkout/session/route.ts |
| POST /api/internal/order-alerts | Secret-authenticated one-event SMTP outbox worker | route.ts; notifications.ts |
| GET /api/health | Read-only DB readiness200/503, no-store | health/route.ts |
| /robots.txt,/sitemap.xml,/icon.svg | Crawler rules, DB-backed localized URLs, SVG favicon | robots.ts,sitemap.ts,icon.svg |
| Old unprefixed routes and *.html | Locale307 and selected legacy301 redirects | proxy.ts; next.config.ts |
| Error/not-found | Source-defined generic retry/shop navigation | error.tsx,global-error.tsx,not-found.tsx |

Persistence:16 application tables,13 migrations0000–0012. Catalog:categories/products/product_variants/product_images. Private identity boundary:admin_members. Commerce:orders/order_items/order_status_history/order_payment_history/order_inventory_history. Configuration:shipping_zones/delivery_areas/site_settings/store_policies. Operations:request_limits/order_notifications. Constraints/immutable triggers preserve purchase snapshots and policy consent. Scoped runtime role sees application data but cannot bootstrap membership or access auth/storage/drizzle schemas; application authorization remains mandatory because runtime RLS policies are server-wide, not customer tenancy.

Checkout locks idempotency key and product/variant rows, reads settings/policies/shipping under shared locks, derives integer poisha totals, checks quote/policy version, inserts immutable snapshots and owner outbox, decrements stock conditionally and commits once. COD money collection/refund is an authorized manual record, not a money transfer. Cancellation/restock/payment history already exists. No coupons, live gateway, payment webhook, customer account/profile/address API, marketplace seller system, courier API or automatic customer email exists.

Media uses session-authorized Supabase public products bucket,5 MiB input limit and decoded/re-encoded WebP with randomized product-bound keys/hash verification. Public photos intentionally do not require signed URLs. Real owner upload/publish remains unaccepted. Notifications lease one queued event, retry with fencing/backoff and expose failure/retry to owner; SMTP is at least once, so a repeated alert after uncertain acknowledgement is possible without recreating order.

Deployment artifact: standalone Node and nonroot Docker UID1001; Nginx TLS/private logging template; optional Cloudflare documented but not proved integrated. CI YAML defines isolated Postgres17.10, strict tests/restore/build/production E2E/audits; no hosted run verified. Health/backup/order-alert systemd examples are not enabled services. Application backups encrypt a consistent public/drizzle export and referenced photo bytes; full Auth/bucket/role recovery and off-site storage require external procedures. Single-instance deployment fits current scale; no microservices/Redis/Kubernetes need established. Supabase handoff records separate project lmrdvenrchsnueztzcdi, Free/Nano Singapore PostgreSQL17.11 as observed2026-10-11; live state deliberately not rechecked during pause.

## 4. Master audit coverage matrix

Each row owns one deduplicated control. Source PASS means reviewed implementation invariant, not live-provider acceptance. Exact cross-cutting duplicates were merged under their owning row; stable IDs are grouped by originating checklist domain, so intentional gaps are not omitted checks. Section13 maps cross-cutting screenshot themes to these same rows. Detailed findings/commands qualify evidence and execution.

| ID | Domain | Requirement | Status | Evidence | Finding ID |
|---|---|---|---|---|---|
| A1-01 | Secrets/environment | Private database/mail/worker credentials isolated from client modules | PASS | src/lib/env.ts; src/db/client.ts:1–20; .gitignore; .dockerignore; Dockerfile:9–15; current Git/stat inspection | — |
| A1-02 | Secrets/environment | Environment files ignored, untracked and mode 600; exact env-path Git history empty | PASS | src/lib/env.ts; src/db/client.ts:1–20; .gitignore; .dockerignore; Dockerfile:9–15; current Git/stat inspection | — |
| A1-03 | Secrets/environment | Docker build context excludes real environment files; public build arguments only | PASS | src/lib/env.ts; src/db/client.ts:1–20; .gitignore; .dockerignore; Dockerfile:9–15; current Git/stat inspection | — |
| A1-04 | Secrets/environment | Normal Supabase config parser enforces public-key class as well as presence | PARTIAL | src/lib/env.ts; src/db/client.ts:1–20; .gitignore; .dockerignore; Dockerfile:9–15; current Git/stat inspection | MON-022 |
| A1-05 | Secrets/environment | Generated production client artifacts and source maps contain no secrets; credential-free build cannot prove configured release | UNVERIFIED | src/lib/env.ts; src/db/client.ts:1–20; .gitignore; .dockerignore; Dockerfile:9–15; current Git/stat inspection | MON-022 |
| A1-06 | Secrets/environment | Database environment validates URL protocol/TLS mode with value-free errors | PASS | src/lib/env.ts; src/db/client.ts:1–20; .gitignore; .dockerignore; Dockerfile:9–15; current Git/stat inspection | — |
| A1-07 | Secrets/environment | Reviewed application errors/loggers avoid passwords, URLs and customer request bodies | PASS | src/lib/env.ts; src/db/client.ts:1–20; .gitignore; .dockerignore; Dockerfile:9–15; current Git/stat inspection | — |
| A1-08 | Secrets/environment | Host/CDN/CI logs and deployed artifacts preserve secret redaction | EXTERNAL ACCESS REQUIRED | src/lib/env.ts; src/db/client.ts:1–20; .gitignore; .dockerignore; Dockerfile:9–15; current Git/stat inspection | MON-007 |
| A1-09 | Secrets/environment | Development, staging and production configuration separation | PARTIAL | src/lib/env.ts; src/db/client.ts:1–20; .gitignore; .dockerignore; Dockerfile:9–15; current Git/stat inspection | MON-007 |
| A1-10 | Secrets/environment | Secret rotation/revocation and independent backup-key custody strategy | PARTIAL | src/lib/env.ts; src/db/client.ts:1–20; .gitignore; .dockerignore; Dockerfile:9–15; current Git/stat inspection | MON-009 |
| A2-01 | Authentication/authorization | Server verifies Supabase user before explicit admin membership lookup | PASS | src/features/admin/auth.ts:9–24; membership.ts; account-service.ts; account-actions.ts; src/lib/supabase/server.ts; ops/supabase-runtime.sql; ops/supabase-storage.sql | — |
| A2-02 | Authentication/authorization | Each sensitive admin page/action rechecks membership and AAL2 | PASS | src/features/admin/auth.ts:9–24; membership.ts; account-service.ts; account-actions.ts; src/lib/supabase/server.ts; ops/supabase-runtime.sql; ops/supabase-storage.sql | — |
| A2-03 | Authentication/authorization | Browser cannot choose authoritative user ID or role for privileged mutations | PASS | src/features/admin/auth.ts:9–24; membership.ts; account-service.ts; account-actions.ts; src/lib/supabase/server.ts; ops/supabase-runtime.sql; ops/supabase-storage.sql | — |
| A2-04 | Authentication/authorization | Auth session cookies configured HttpOnly, SameSite=Lax and production Secure | PASS | src/features/admin/auth.ts:9–24; membership.ts; account-service.ts; account-actions.ts; src/lib/supabase/server.ts; ops/supabase-runtime.sql; ops/supabase-storage.sql | — |
| A2-05 | Authentication/authorization | Auth tokens and customer PII absent from persistent cart localStorage | PASS | src/features/admin/auth.ts:9–24; membership.ts; account-service.ts; account-actions.ts; src/lib/supabase/server.ts; ops/supabase-runtime.sql; ops/supabase-storage.sql | — |
| A2-06 | Authentication/authorization | Membership checked per operation rather than relying solely on layout/proxy | PASS | src/features/admin/auth.ts:9–24; membership.ts; account-service.ts; account-actions.ts; src/lib/supabase/server.ts; ops/supabase-runtime.sql; ops/supabase-storage.sql | — |
| A2-07 | Authentication/authorization | Recovery requires email proof, membership and enrolled second-factor assurance | PASS | src/features/admin/auth.ts:9–24; membership.ts; account-service.ts; account-actions.ts; src/lib/supabase/server.ts; ops/supabase-runtime.sql; ops/supabase-storage.sql | — |
| A2-08 | Authentication/authorization | Recovery request UI returns generic messages to limit email enumeration | PASS | src/features/admin/auth.ts:9–24; membership.ts; account-service.ts; account-actions.ts; src/lib/supabase/server.ts; ops/supabase-runtime.sql; ops/supabase-storage.sql | — |
| A2-09 | Authentication/authorization | Real owner identity, first-admin bootstrap and MFA enrollment/step-up | EXTERNAL ACCESS REQUIRED | src/features/admin/auth.ts:9–24; membership.ts; account-service.ts; account-actions.ts; src/lib/supabase/server.ts; ops/supabase-runtime.sql; ops/supabase-storage.sql | MON-004 |
| A2-10 | Authentication/authorization | Live cookies, session expiry, logout, global invalidation and membership revocation | EXTERNAL ACCESS REQUIRED | src/features/admin/auth.ts:9–24; membership.ts; account-service.ts; account-actions.ts; src/lib/supabase/server.ts; ops/supabase-runtime.sql; ops/supabase-storage.sql | MON-004 |
| A2-11 | Authentication/authorization | Provider password/email confirmation/signup/reset/OTP policy and delivery | EXTERNAL ACCESS REQUIRED | src/features/admin/auth.ts:9–24; membership.ts; account-service.ts; account-actions.ts; src/lib/supabase/server.ts; ops/supabase-runtime.sql; ops/supabase-storage.sql | MON-010 |
| A2-12 | Authentication/authorization | Authentication brute-force resistance beyond resettable visitor budgets | PARTIAL | src/features/admin/auth.ts:9–24; membership.ts; account-service.ts; account-actions.ts; src/lib/supabase/server.ts; ops/supabase-runtime.sql; ops/supabase-storage.sql | MON-003 |
| A2-13 | Authentication/authorization | Sensitive resource IDs constrained by admin authorization and product-bound variant/image queries | PASS | src/features/admin/auth.ts:9–24; membership.ts; account-service.ts; account-actions.ts; src/lib/supabase/server.ts; ops/supabase-runtime.sql; ops/supabase-storage.sql | — |
| A2-14 | Authentication/authorization | Public order receipt uses random capability and minimal data; no PII returned | PASS | src/features/admin/auth.ts:9–24; membership.ts; account-service.ts; account-actions.ts; src/lib/supabase/server.ts; ops/supabase-runtime.sql; ops/supabase-storage.sql; admin/order-actions.ts; admin/orders.ts:7–130; app/[locale]/order/[publicToken]/success/page.tsx:17–29; src/db/schema/orders.ts; admin/order-actions.ts; admin/orders.ts:7–130; app/[locale]/order/[publicToken]/success/page.tsx:17–29; src/db/schema/orders.ts | — |
| A2-15 | Authentication/authorization | Customer account/profile/address cross-user isolation: those systems do not exist; guest receipts assessed separately | NOT APPLICABLE | src/features/admin/auth.ts:9–24; membership.ts; account-service.ts; account-actions.ts; src/lib/supabase/server.ts; ops/supabase-runtime.sql; ops/supabase-storage.sql | — |
| A2-16 | Authentication/authorization | Marketplace seller/customer/admin role hierarchy: single-owner store | NOT APPLICABLE | src/features/admin/auth.ts:9–24; membership.ts; account-service.ts; account-actions.ts; src/lib/supabase/server.ts; ops/supabase-runtime.sql; ops/supabase-storage.sql | — |
| A2-18 | Authentication/authorization | SQL artifacts revoke client Data API access and constrain server membership writes | PASS | src/features/admin/auth.ts:9–24; membership.ts; account-service.ts; account-actions.ts; src/lib/supabase/server.ts; ops/supabase-runtime.sql; ops/supabase-storage.sql | — |
| A2-19 | Authentication/authorization | Provider/factor replacement/account recovery lifecycle behavior | EXTERNAL ACCESS REQUIRED | src/features/admin/auth.ts:9–24; membership.ts; account-service.ts; account-actions.ts; src/lib/supabase/server.ts; ops/supabase-runtime.sql; ops/supabase-storage.sql | MON-004 |
| A3-01 | API/input security | Strict server schemas validate checkout IDs, types, sizes, quantities and policy consent | PASS | src/app/api/checkout/route.ts; checkout/abuse.ts:6–61; checkout/domain.ts; admin/*-actions.ts; next.config.ts:6–28; src/features/catalog/structured-data.ts | — |
| A3-02 | API/input security | Admin actions whitelist parsed fields rather than arbitrary object assignment | PASS | src/app/api/checkout/route.ts; checkout/abuse.ts:6–61; checkout/domain.ts; admin/*-actions.ts; next.config.ts:6–28; src/features/catalog/structured-data.ts | — |
| A3-03 | API/input security | Reviewed SQL/ORM parameters avoid SQL injection; raw aggregate selector is private constant | PASS | src/app/api/checkout/route.ts; checkout/abuse.ts:6–61; checkout/domain.ts; admin/*-actions.ts; next.config.ts:6–28; src/features/catalog/structured-data.ts | — |
| A3-04 | API/input security | React text rendering and JSON-LD escaping prevent reviewed markup injection paths | PASS | src/app/api/checkout/route.ts; checkout/abuse.ts:6–61; checkout/domain.ts; admin/*-actions.ts; next.config.ts:6–28; src/features/catalog/structured-data.ts | — |
| A3-05 | API/input security | Checkout POST/preview/session mutations enforce same-origin request guards | PASS | src/app/api/checkout/route.ts; checkout/abuse.ts:6–61; checkout/domain.ts; admin/*-actions.ts; next.config.ts:6–28; src/features/catalog/structured-data.ts | — |
| A3-06 | API/input security | Actual proxy Host/protocol normalization and server-action Origin protection | EXTERNAL ACCESS REQUIRED | src/app/api/checkout/route.ts; checkout/abuse.ts:6–61; checkout/domain.ts; admin/*-actions.ts; next.config.ts:6–28; src/features/catalog/structured-data.ts | MON-007 |
| A3-07 | API/input security | Contact/media/site URLs and locale redirect paths are constrained | PASS | src/app/api/checkout/route.ts; checkout/abuse.ts:6–61; checkout/domain.ts; admin/*-actions.ts; next.config.ts:6–28; src/features/catalog/structured-data.ts | — |
| A3-08 | API/input security | 8 KiB streamed API body cap, unsupported encoding rejection and five-second deadline | PASS | src/app/api/checkout/route.ts; checkout/abuse.ts:6–61; checkout/domain.ts; admin/*-actions.ts; next.config.ts:6–28; src/features/catalog/structured-data.ts | — |
| A3-09 | API/input security | Server-action upload cap and upstream example body cap | PASS | src/app/api/checkout/route.ts; checkout/abuse.ts:6–61; checkout/domain.ts; admin/*-actions.ts; next.config.ts:6–28; src/features/catalog/structured-data.ts | — |
| A3-10 | API/input security | Atomic shared database quotas applied to catalog/preview/checkout/login/recovery | PASS | src/app/api/checkout/route.ts; checkout/abuse.ts:6–61; checkout/domain.ts; admin/*-actions.ts; next.config.ts:6–28; src/features/catalog/structured-data.ts | — |
| A3-11 | API/input security | Quota identity resists cookie rotation and spoofed trusted IP | PARTIAL | src/app/api/checkout/route.ts; checkout/abuse.ts:6–61; checkout/domain.ts; admin/*-actions.ts; next.config.ts:6–28; src/features/catalog/structured-data.ts | MON-003 |
| A3-12 | API/input security | Public API errors avoid raw stack/database/provider disclosure | PASS | src/app/api/checkout/route.ts; checkout/abuse.ts:6–61; checkout/domain.ts; admin/*-actions.ts; next.config.ts:6–28; src/features/catalog/structured-data.ts | — |
| A3-13 | API/input security | Frame, MIME, referrer, permission and private-route header configuration | PASS | src/app/api/checkout/route.ts; checkout/abuse.ts:6–61; checkout/domain.ts; admin/*-actions.ts; next.config.ts:6–28; src/features/catalog/structured-data.ts | — |
| A3-14 | API/input security | CSP script execution protection | PARTIAL | src/app/api/checkout/route.ts; checkout/abuse.ts:6–61; checkout/domain.ts; admin/*-actions.ts; next.config.ts:6–28; src/features/catalog/structured-data.ts | MON-023 |
| A3-15 | API/input security | No permissive cross-origin API CORS configuration found in reviewed source | PASS | src/app/api/checkout/route.ts; checkout/abuse.ts:6–61; checkout/domain.ts; admin/*-actions.ts; next.config.ts:6–28; src/features/catalog/structured-data.ts | — |
| A3-16 | API/input security | Actual CORS/preflight behavior and ingress header overrides | EXTERNAL ACCESS REQUIRED | src/app/api/checkout/route.ts; checkout/abuse.ts:6–61; checkout/domain.ts; admin/*-actions.ts; next.config.ts:6–28; src/features/catalog/structured-data.ts | MON-007 |
| A3-17 | API/input security | Host file permissions, process identity, firewall and service limits | EXTERNAL ACCESS REQUIRED | src/app/api/checkout/route.ts; checkout/abuse.ts:6–61; checkout/domain.ts; admin/*-actions.ts; next.config.ts:6–28; src/features/catalog/structured-data.ts | MON-007 |
| A3-18 | API/input security | Internal mail-worker bearer authorization uses constant-time comparison and configured minimum secret length | PASS | src/app/api/checkout/route.ts; checkout/abuse.ts:6–61; checkout/domain.ts; admin/*-actions.ts; next.config.ts:6–28; src/features/catalog/structured-data.ts | — |
| A4-01 | Database/storage security | Database constraints enforce foreign keys, uniqueness, nonnegative money/stock and status values | PASS | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs | — |
| A4-03 | Database/storage security | Purchase snapshots and policy revisions protected by immutable-record triggers | PASS | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs | — |
| A4-04 | Database/storage security | Migration SQL/journal checked in separately from runtime data access | PASS | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs | — |
| A4-05 | Database/storage security | Release preflight compatible with least-privilege migration-schema restrictions | FAIL | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs | MON-002 |
| A4-06 | Database/storage security | Server role definition denies membership edits and Auth/Storage/migration access | PASS | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs | — |
| A4-07 | Database/storage security | Actual provider/database ownership, RLS policies and role grants | EXTERNAL ACCESS REQUIRED | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs; src/features/admin/auth.ts:9–24; membership.ts; account-service.ts; account-actions.ts; src/lib/supabase/server.ts; ops/supabase-runtime.sql; ops/supabase-storage.sql | MON-004 |
| A4-08 | Database/storage security | Product upload actions require owner membership and MFA | PASS | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs | — |
| A4-09 | Database/storage security | Storage SQL restrictive guards deny anonymous/nonmember/AAL1 writes and overwrites | PASS | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs | — |
| A4-10 | Database/storage security | Applied public bucket visibility, allowed WebP MIME, size cap and policies | EXTERNAL ACCESS REQUIRED | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs | MON-004 |
| A4-11 | Database/storage security | Upload verifies declared MIME, magic bytes, real decode, 16 MP cap and one-page image | PASS | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs | — |
| A4-12 | Database/storage security | Uploads re-encode metadata-free bounded WebP, random product-owned key | PASS | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs | — |
| A4-13 | Database/storage security | Image key validation prevents traversal/cross-product writes | PASS | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs | — |
| A4-14 | Database/storage security | Publishing requires active variant and owned verified primary image hash/bytes | PASS | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs | — |
| A4-15 | Database/storage security | Primary-image deletion unpublishes first; cleanup failures recorded | PASS | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs | — |
| A4-16 | Database/storage security | Private file signed URLs: products bucket intentionally public; no private document subsystem | NOT APPLICABLE | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs | — |
| A4-17 | Database/storage security | Media orphan/deletion/retention process across backups | PARTIAL | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs | MON-009 |
| A4-18 | Database/storage security | Application backup encryption/authentication and rejected-plaintext cleanup: local unit test | PASS | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs | — |
| A4-19 | Database/storage security | Restore tooling refuses original/populated/remote targets in source | PASS | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs | — |
| A4-20 | Database/storage security | Scheduled encrypted off-site database and object backups with transfer/retention proof | EXTERNAL ACCESS REQUIRED | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs | MON-006 |
| A4-21 | Database/storage security | Full provider/DB/photo/vendor-outage recovery, measured RPO/RTO and restore/cutover smoke acceptance | EXTERNAL ACCESS REQUIRED | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs; ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | MON-006 |
| A4-22 | Database/storage security | Current isolated database/photo restore roundtrip: no safe database/tooling in this run | UNVERIFIED | src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs; package.json; scripts/run-tests.mjs; playwright.config.ts; tests/e2e; src/**/*.test.*; .github/workflows/quality.yml; Dockerfile; docs/testing.md; current command log | MON-020 |
| A5-01 | External integrations | Payment/courier webhooks authenticate signatures: no live webhook integration | NOT APPLICABLE | src/app/api/internal/order-alerts/route.ts; admin/notifications.ts; admin/order-mail.ts; scripts/order-alert-worker.mjs; no payment/webhook routes in src/app; src/db/schema/orders.ts; checkout/domain.ts; admin/orders.ts:53–125; docs/PROJECT_RECORD.md#goal-11 | — |
| A5-02 | External integrations | Webhook timestamp/replay checks: no webhook consumer | NOT APPLICABLE | src/app/api/internal/order-alerts/route.ts; admin/notifications.ts; admin/order-mail.ts; scripts/order-alert-worker.mjs; no payment/webhook routes in src/app | — |
| A5-03 | External integrations | Webhook event idempotency/duplicate-event handling: no webhook consumer | NOT APPLICABLE | src/app/api/internal/order-alerts/route.ts; admin/notifications.ts; admin/order-mail.ts; scripts/order-alert-worker.mjs; no payment/webhook routes in src/app | — |
| A5-04 | External integrations | Webhook unauthorized state changes: no webhook state mutation path | NOT APPLICABLE | src/app/api/internal/order-alerts/route.ts; admin/notifications.ts; admin/order-mail.ts; scripts/order-alert-worker.mjs; no payment/webhook routes in src/app | — |
| A5-05 | External integrations | Internal order-alert scheduler authenticates bearer secret; not a payment webhook | PASS | src/app/api/internal/order-alerts/route.ts; admin/notifications.ts; admin/order-mail.ts; scripts/order-alert-worker.mjs; no payment/webhook routes in src/app | — |
| A5-06 | External integrations | Owner-alert outbox unique per order; leased, fenced, bounded retry processing | PASS | src/app/api/internal/order-alerts/route.ts; admin/notifications.ts; admin/order-mail.ts; scripts/order-alert-worker.mjs; no payment/webhook routes in src/app | — |
| A5-07 | External integrations | Auth/media/SMTP/external worker requests use bounded timeouts | PASS | src/app/api/internal/order-alerts/route.ts; admin/notifications.ts; admin/order-mail.ts; scripts/order-alert-worker.mjs; no payment/webhook routes in src/app | — |
| A5-08 | External integrations | SMTP credentials server-only, TLS required and file/URL mail access disabled | PASS | src/app/api/internal/order-alerts/route.ts; admin/notifications.ts; admin/order-mail.ts; scripts/order-alert-worker.mjs; no payment/webhook routes in src/app | — |
| A5-09 | External integrations | Email at-least-once duplicate acceptance documented; real delivery/recovery not accepted | PARTIAL | src/app/api/internal/order-alerts/route.ts; admin/notifications.ts; admin/order-mail.ts; scripts/order-alert-worker.mjs; no payment/webhook routes in src/app | MON-010 |
| A6-01 | Supply chain | Current production dependency audit reports zero advisories; full advisory gate separately A6-02 | PASS | package.json/package-lock.json; scripts/patch-braces.mjs; src/lib/tooling-security.test.mjs; .github/workflows/quality.yml; fresh npm registry audit; package.json; scripts/run-tests.mjs; playwright.config.ts; tests/e2e; src/**/*.test.*; .github/workflows/quality.yml; Dockerfile; docs/testing.md; current command log | — |
| A6-02 | Supply chain | Current complete dependency audit reports five high entries from one braces advisory | FAIL | package.json/package-lock.json; scripts/patch-braces.mjs; src/lib/tooling-security.test.mjs; .github/workflows/quality.yml; fresh npm registry audit | MON-008 |
| A6-03 | Supply chain | Lockfile pins resolved versions/integrity and CI uses npm ci | PASS | package.json/package-lock.json; scripts/patch-braces.mjs; src/lib/tooling-security.test.mjs; .github/workflows/quality.yml; fresh npm registry audit | — |
| A6-04 | Supply chain | Guarded braces string-pattern mitigation passes local regression; upstream advisory remains | PASS | package.json/package-lock.json; scripts/patch-braces.mjs; src/lib/tooling-security.test.mjs; .github/workflows/quality.yml; fresh npm registry audit | — |
| A6-05 | Supply chain | Routine dependency maintenance and supported update path | PARTIAL | package.json/package-lock.json; scripts/patch-braces.mjs; src/lib/tooling-security.test.mjs; .github/workflows/quality.yml; fresh npm registry audit | MON-024 |
| A6-06 | Supply chain | Reviewed build/deployment scripts separate fixture seeding and migrations from runtime | PASS | package.json/package-lock.json; scripts/patch-braces.mjs; src/lib/tooling-security.test.mjs; .github/workflows/quality.yml; fresh npm registry audit | — |
| A6-07 | Supply chain | CI uses read-only contents permissions, ordinary PR events and isolated test credentials | PASS | package.json/package-lock.json; scripts/patch-braces.mjs; src/lib/tooling-security.test.mjs; .github/workflows/quality.yml; fresh npm registry audit | — |
| A6-08 | Supply chain | Real CI secret handling, required checks, branch protection and environment permissions | EXTERNAL ACCESS REQUIRED | package.json/package-lock.json; scripts/patch-braces.mjs; src/lib/tooling-security.test.mjs; .github/workflows/quality.yml; fresh npm registry audit | MON-007 |
| A6-09 | Supply chain | Dependency/secret scanning readiness and third-party action/image immutable pinning | PARTIAL | package.json/package-lock.json; scripts/patch-braces.mjs; src/lib/tooling-security.test.mjs; .github/workflows/quality.yml; fresh npm registry audit | MON-024 |
| B1-01 | Catalog integrity | Published non-demo server records are authoritative | PASS | src/features/catalog/queries.ts:6–80; admin/catalog/products.ts; categories.ts; src/db/schema/catalog.ts | — |
| B1-02 | Catalog integrity | Product/variant money, quantities and attributes validated server-side | PASS | src/features/catalog/queries.ts:6–80; admin/catalog/products.ts; categories.ts; src/db/schema/catalog.ts | — |
| B1-03 | Catalog integrity | Category foreign keys and populated-category deletion guard | PASS | src/features/catalog/queries.ts:6–80; admin/catalog/products.ts; categories.ts; src/db/schema/catalog.ts | — |
| B1-04 | Catalog integrity | Unique product and variant SKUs/slugs enforced | PASS | src/features/catalog/queries.ts:6–80; admin/catalog/products.ts; categories.ts; src/db/schema/catalog.ts | — |
| B1-05 | Catalog integrity | Draft/unpublish/active-variant visibility and invalid-state handling | PASS | src/features/catalog/queries.ts:6–80; admin/catalog/products.ts; categories.ts; src/db/schema/catalog.ts | — |
| B1-06 | Catalog integrity | Integer money, compare-at validation and actual purchasable price ranges | PASS | src/features/catalog/queries.ts:6–80; admin/catalog/products.ts; categories.ts; src/db/schema/catalog.ts; src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | — |
| B1-07 | Catalog integrity | Tracked inventory edits preserve concurrent checkout changes | FAIL | src/features/catalog/queries.ts:6–80; admin/catalog/products.ts; categories.ts; src/db/schema/catalog.ts | MON-001 |
| B1-08 | Catalog integrity | Verified real product photo gating and image order/primary management | PASS | src/features/catalog/queries.ts:6–80; admin/catalog/products.ts; categories.ts; src/db/schema/catalog.ts | — |
| B1-09 | Catalog integrity | Bounded escaped search, category filtering, stable sorting and pagination in source | PASS | src/features/catalog/queries.ts:6–80; admin/catalog/products.ts; categories.ts; src/db/schema/catalog.ts | — |
| B1-10 | Catalog integrity | Current database-backed search/filter/sort/page behavior | UNVERIFIED | src/features/catalog/queries.ts:6–80; admin/catalog/products.ts; categories.ts; src/db/schema/catalog.ts | MON-020 |
| B1-11 | Catalog integrity | Real catalog prices, stock, specifications, claims, translations and photo rights | EXTERNAL ACCESS REQUIRED | src/features/catalog/queries.ts:6–80; admin/catalog/products.ts; categories.ts; src/db/schema/catalog.ts | MON-005 |
| B2-01 | Cart/checkout integrity | Server recalculates item prices, shipping and authoritative final total | PASS | checkout/orders.ts:18–85; domain.ts:4–51; preview.ts; quote.ts; session.ts; cart/storage.ts; admin/orders.ts:66–115 | — |
| B2-02 | Cart/checkout integrity | Client prices, discounts, shipping zone and arbitrary payment methods rejected | PASS | checkout/orders.ts:18–85; domain.ts:4–51; preview.ts; quote.ts; session.ts; cart/storage.ts; admin/orders.ts:66–115 | — |
| B2-03 | Cart/checkout integrity | Coupon validation/abuse: no coupons accepted; discount is zero | NOT APPLICABLE | checkout/orders.ts:18–85; domain.ts:4–51; preview.ts; quote.ts; session.ts; cart/storage.ts; admin/orders.ts:66–115 | — |
| B2-04 | Cart/checkout integrity | Checkout reloads active published records and revalidates stock | PASS | checkout/orders.ts:18–85; domain.ts:4–51; preview.ts; quote.ts; session.ts; cart/storage.ts; admin/orders.ts:66–115 | — |
| B2-05 | Cart/checkout integrity | Per-line, line-count and aggregate item quantity limits | PASS | checkout/orders.ts:18–85; domain.ts:4–51; preview.ts; quote.ts; session.ts; cart/storage.ts; admin/orders.ts:66–115 | — |
| B2-06 | Cart/checkout integrity | Product/variant row locking and conditional decrement prevent concurrent checkout oversell in source | PASS | checkout/orders.ts:18–85; domain.ts:4–51; preview.ts; quote.ts; session.ts; cart/storage.ts; admin/orders.ts:66–115 | — |
| B2-07 | Cart/checkout integrity | Transactional order creation includes immutable snapshots, policy consent, initial history, owner outbox and stock updates | PASS | checkout/orders.ts:18–85; domain.ts:4–51; preview.ts; quote.ts; session.ts; cart/storage.ts; admin/orders.ts:66–115; src/db/schema; src/db/migrations/0006_server_table_security.sql; 0008_inventory_and_returns.sql; ops/supabase-runtime.sql; ops/supabase-storage.sql; catalog/storage/image-file.ts:6–24; scripts/backup*.mjs; scripts/restore-drill.mjs | — |
| B2-08 | Cart/checkout integrity | Advisory lock, unique idempotency key and request hash prevent duplicate/changed replay | PASS | checkout/orders.ts:18–85; domain.ts:4–51; preview.ts; quote.ts; session.ts; cart/storage.ts; admin/orders.ts:66–115 | — |
| B2-09 | Cart/checkout integrity | Stale quote/policy requires explicit reconfirmation | PASS | checkout/orders.ts:18–85; domain.ts:4–51; preview.ts; quote.ts; session.ts; cart/storage.ts; admin/orders.ts:66–115 | — |
| B2-10 | Cart/checkout integrity | Response-loss recovery uses HttpOnly retry handle and existing committed order lookup | PASS | checkout/orders.ts:18–85; domain.ts:4–51; preview.ts; quote.ts; session.ts; cart/storage.ts; admin/orders.ts:66–115 | — |
| B2-11 | Cart/checkout integrity | Cart abandonment before submission does not reserve stock or create order | PASS | checkout/orders.ts:18–85; domain.ts:4–51; preview.ts; quote.ts; session.ts; cart/storage.ts; admin/orders.ts:66–115 | — |
| B2-12 | Cart/checkout integrity | Pending COD stock-hold review/release policy and false-order abuse protection | PARTIAL | checkout/orders.ts:18–85; domain.ts:4–51; preview.ts; quote.ts; session.ts; cart/storage.ts; admin/orders.ts:66–115 | MON-003 |
| B2-13 | Cart/checkout integrity | Cancellation releases stock exactly once; received-return restock requires explicit confirmation | PASS | checkout/orders.ts:18–85; domain.ts:4–51; preview.ts; quote.ts; session.ts; cart/storage.ts; admin/orders.ts:66–115 | — |
| B2-14 | Cart/checkout integrity | Browser never produces success from failed order response | PASS | checkout/orders.ts:18–85; domain.ts:4–51; preview.ts; quote.ts; session.ts; cart/storage.ts; admin/orders.ts:66–115 | — |
| B2-15 | Cart/checkout integrity | Applicable VAT/tax/fees treatment: totals have no separate tax component; business applicability unknown | EXTERNAL ACCESS REQUIRED | checkout/orders.ts:18–85; domain.ts:4–51; preview.ts; quote.ts; session.ts; cart/storage.ts; admin/orders.ts:66–115 | MON-009 |
| B2-16 | Cart/checkout integrity | Current DB transaction/rollback/race/idempotency fixture execution | UNVERIFIED | checkout/orders.ts:18–85; domain.ts:4–51; preview.ts; quote.ts; session.ts; cart/storage.ts; admin/orders.ts:66–115 | MON-020 |
| B3-01 | Payments | Only COD enabled; no fake bKash/Nagad/card selector | PASS | src/db/schema/orders.ts; checkout/domain.ts; admin/orders.ts:53–125; docs/PROJECT_RECORD.md#goal-11 | — |
| B3-02 | Payments | COD cash state is server/admin-derived and allowed only after delivery | PASS | src/db/schema/orders.ts; checkout/domain.ts; admin/orders.ts:53–125; docs/PROJECT_RECORD.md#goal-11 | — |
| B3-03 | Payments | Once-only COD collection/refund status history; refund records actual manual refund acknowledgement | PASS | src/db/schema/orders.ts; checkout/domain.ts; admin/orders.ts:53–125; docs/PROJECT_RECORD.md#goal-11 | — |
| B3-04 | Payments | Courier settlement/cash and refund reconciliation operating procedure | PARTIAL | src/db/schema/orders.ts; checkout/domain.ts; admin/orders.ts:53–125; docs/PROJECT_RECORD.md#goal-11 | MON-005 |
| B3-05 | Payments | Gateway amount/currency/server confirmation: no live gateway; mandatory if Goal11 retained | NOT APPLICABLE | src/db/schema/orders.ts; checkout/domain.ts; admin/orders.ts:53–125; docs/PROJECT_RECORD.md#goal-11 | — |
| B3-06 | Payments | Gateway duplicate-charge, asynchronous payment and provider-outage recovery: no gateway | NOT APPLICABLE | src/db/schema/orders.ts; checkout/domain.ts; admin/orders.ts:53–125; docs/PROJECT_RECORD.md#goal-11 | — |
| B3-08 | Payments | Provider refund/double-payment/reconciliation tests: no gateway | NOT APPLICABLE | src/db/schema/orders.ts; checkout/domain.ts; admin/orders.ts:53–125; docs/PROJECT_RECORD.md#goal-11; package.json; scripts/run-tests.mjs; playwright.config.ts; tests/e2e; src/**/*.test.*; .github/workflows/quality.yml; Dockerfile; docs/testing.md; current command log | — |
| B3-09 | Payments | Future online gateway capability and sandbox acceptance not built/verified | UNVERIFIED | src/db/schema/orders.ts; checkout/domain.ts; admin/orders.ts:53–125; docs/PROJECT_RECORD.md#goal-11 | MON-020 |
| B4-02 | Orders/admin integrity | Sensitive order list/detail/actions require authorized AAL2 owner | PASS | admin/order-actions.ts; admin/orders.ts:7–130; app/[locale]/order/[publicToken]/success/page.tsx:17–29; src/db/schema/orders.ts | — |
| B4-03 | Orders/admin integrity | Status graph disallows arbitrary/terminal transitions | PASS | admin/order-actions.ts; admin/orders.ts:7–130; app/[locale]/order/[publicToken]/success/page.tsx:17–29; src/db/schema/orders.ts | — |
| B4-04 | Orders/admin integrity | Cancellation/returns/refund/stock updates locked, validated and actor-history recorded | PASS | admin/order-actions.ts; admin/orders.ts:7–130; app/[locale]/order/[publicToken]/success/page.tsx:17–29; src/db/schema/orders.ts | — |
| B4-05 | Orders/admin integrity | Courier/tracking/catalog/settings operational audit trail | PARTIAL | admin/order-actions.ts; admin/orders.ts:7–130; app/[locale]/order/[publicToken]/success/page.tsx:17–29; src/db/schema/orders.ts | MON-018 |
| B4-06 | Orders/admin integrity | Customer-facing payment state distinct from fulfillment state | PARTIAL | admin/order-actions.ts; admin/orders.ts:7–130; app/[locale]/order/[publicToken]/success/page.tsx:17–29; src/db/schema/orders.ts; src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | MON-011 |
| B4-08 | Orders/admin integrity | Actual owner/customer/order/contact/courier business acceptance | EXTERNAL ACCESS REQUIRED | admin/order-actions.ts; admin/orders.ts:7–130; app/[locale]/order/[publicToken]/success/page.tsx:17–29; src/db/schema/orders.ts | MON-005 |
| C-01 | Architecture/engineering | Single Next modular monolith fits current single-owner store | PASS | ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | — |
| C-02 | Architecture/engineering | Server/client component boundaries and server-only data modules | PASS | ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | — |
| C-03 | Architecture/engineering | Catalog/cart/checkout/admin modules separate business concerns | PASS | ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | — |
| C-04 | Architecture/engineering | Central validation/money/shared business logic avoids client authority duplication | PASS | ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | — |
| C-05 | Architecture/engineering | Small same-origin HTTP APIs and server actions; no separate API/admin service needed | PASS | ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | — |
| C-06 | Architecture/engineering | PostgreSQL relational schema/migrations and product-object storage boundaries | PASS | ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | — |
| C-07 | Architecture/engineering | Provider Auth versus application membership/assurance responsibilities explicit | PASS | ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | — |
| C-08 | Architecture/engineering | Actual chosen hosting architecture and production/staging environment configuration | EXTERNAL ACCESS REQUIRED | ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml; package.json; scripts/run-tests.mjs; playwright.config.ts; tests/e2e; src/**/*.test.*; .github/workflows/quality.yml; Dockerfile; docs/testing.md; current command log | MON-007 |
| C-11 | Architecture/engineering | Single-instance cache strategy and private-response no-store exclusions | PASS | ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml; src/db/client.ts; catalog/queries.ts; components/commerce/product.tsx; globals.css; server components; next.config.ts; ops; current build | — |
| C-16 | Architecture/engineering | Public page-size cap and stable sort; reviewed list operations bounded | PASS | ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | — |
| C-19 | Architecture/engineering | Legacy static runtime removed from active worktree; historical fixture drafts retained | PASS | ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | — |
| C-22 | Architecture/engineering | Microservices/Kubernetes/queue cluster/distributed cache: no demonstrated need | NOT APPLICABLE | ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | — |
| C-23 | Architecture/engineering | Marketplace tenancy/commissions/payouts: outside confirmed owner scope | NOT APPLICABLE | ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | — |
| D1-01 | Crawling/indexing | Robots route defines public crawler policy and private-path exclusions in source | PASS | src/app/robots.ts; sitemap.ts; src/lib/site-url.ts:2–15; app/layout.tsx:7–16; src/i18n/routing.ts; next.config.ts; isolated production HTTP robots.txt200 with exact private exclusions | — |
| D1-02 | Crawling/indexing | Sitemap source includes localized published non-demo products and alternates | PASS | src/app/robots.ts; sitemap.ts; src/lib/site-url.ts:2–15; app/layout.tsx:7–16; src/i18n/routing.ts; next.config.ts | — |
| D1-03 | Crawling/indexing | Product sitemap lastModified derives from updatedAt | PASS | src/app/robots.ts; sitemap.ts; src/lib/site-url.ts:2–15; app/layout.tsx:7–16; src/i18n/routing.ts; next.config.ts | — |
| D1-04 | Crawling/indexing | Generated sitemap actual URLs/freshness with isolated real records | UNVERIFIED | src/app/robots.ts; sitemap.ts; src/lib/site-url.ts:2–15; app/layout.tsx:7–16; src/i18n/routing.ts; next.config.ts | MON-020 |
| D1-05 | Crawling/indexing | Actual search/AI crawler access, canonical domain and DNS/HTTPS | EXTERNAL ACCESS REQUIRED | src/app/robots.ts; sitemap.ts; src/lib/site-url.ts:2–15; app/layout.tsx:7–16; src/i18n/routing.ts; next.config.ts | MON-007 |
| D1-06 | Crawling/indexing | Explicit HTTPS staging-versus-production indexing guard | PARTIAL | src/app/robots.ts; sitemap.ts; src/lib/site-url.ts:2–15; app/layout.tsx:7–16; src/i18n/routing.ts; next.config.ts | MON-012 |
| D1-07 | Crawling/indexing | Home/product canonical/hreflang source generation | PASS | src/app/robots.ts; sitemap.ts; src/lib/site-url.ts:2–15; app/layout.tsx:7–16; src/i18n/routing.ts; next.config.ts | — |
| D1-08 | Crawling/indexing | Shop pagination/faceted duplicate-content canonical policy | PARTIAL | src/app/robots.ts; sitemap.ts; src/lib/site-url.ts:2–15; app/layout.tsx:7–16; src/i18n/routing.ts; next.config.ts; app/[locale]/products/[slug]/page.tsx; shop/page.tsx; page.tsx; policies/[kind]/page.tsx; components/commerce/product.tsx; i18n/routing.ts | MON-013 |
| D1-09 | Crawling/indexing | Admin/checkout/receipt noindex metadata/header definitions | PASS | src/app/robots.ts; sitemap.ts; src/lib/site-url.ts:2–15; app/layout.tsx:7–16; src/i18n/routing.ts; next.config.ts | — |
| D1-10 | Crawling/indexing | Legacy HTML permanent redirects and locale redirects in source | PASS | src/app/robots.ts; sitemap.ts; src/lib/site-url.ts:2–15; app/layout.tsx:7–16; src/i18n/routing.ts; next.config.ts | — |
| D1-11 | Crawling/indexing | Current database-backed product 200/404 and complete broken-link traversal | UNVERIFIED | src/app/robots.ts; sitemap.ts; src/lib/site-url.ts:2–15; app/layout.tsx:7–16; src/i18n/routing.ts; next.config.ts | MON-020 |
| D1-12 | Crawling/indexing | Blind blanket AI crawler allow rule required: intentional crawler policy is owner decision | NOT APPLICABLE | src/app/robots.ts; sitemap.ts; src/lib/site-url.ts:2–15; app/layout.tsx:7–16; src/i18n/routing.ts; next.config.ts | — |
| D2-01 | On-page SEO | Product-specific title/description/canonical/share metadata | PASS | app/[locale]/products/[slug]/page.tsx; shop/page.tsx; page.tsx; policies/[kind]/page.tsx; components/commerce/product.tsx; i18n/routing.ts | — |
| D2-02 | On-page SEO | Unique category/policy/listing metadata and category explanations | PARTIAL | app/[locale]/products/[slug]/page.tsx; shop/page.tsx; page.tsx; policies/[kind]/page.tsx; components/commerce/product.tsx; i18n/routing.ts | MON-025 |
| D2-03 | On-page SEO | Server-rendered public names/prices/descriptions and readable product slugs | PASS | app/[locale]/products/[slug]/page.tsx; shop/page.tsx; page.tsx; policies/[kind]/page.tsx; components/commerce/product.tsx; i18n/routing.ts | — |
| D2-06 | On-page SEO | Visible product breadcrumb/internal navigation in source | PASS | app/[locale]/products/[slug]/page.tsx; shop/page.tsx; page.tsx; policies/[kind]/page.tsx; components/commerce/product.tsx; i18n/routing.ts | — |
| D2-08 | On-page SEO | Actual product copy/specifications/alt quality and unsupported claims | EXTERNAL ACCESS REQUIRED | app/[locale]/products/[slug]/page.tsx; shop/page.tsx; page.tsx; policies/[kind]/page.tsx; components/commerce/product.tsx; i18n/routing.ts | MON-005 |
| D2-10 | On-page SEO | Rendered crawlable HTML and metadata for database-backed public pages | UNVERIFIED | app/[locale]/products/[slug]/page.tsx; shop/page.tsx; page.tsx; policies/[kind]/page.tsx; components/commerce/product.tsx; i18n/routing.ts | MON-020 |
| D3-01 | Structured data | Product/Offer uses real effective price, BDT, current availability and NewCondition | PASS | catalog/structured-data.ts:11–29; product route:17–38; current source schema search | — |
| D3-02 | Structured data | JSON-LD serialization escapes script-closing input | PASS | catalog/structured-data.ts:11–29; product route:17–38; current source schema search | — |
| D3-03 | Structured data | AggregateRating/Review: no genuine review dataset; absent markup correct | NOT APPLICABLE | catalog/structured-data.ts:11–29; product route:17–38; current source schema search | — |
| D3-04 | Structured data | Organization/WebSite/BreadcrumbList structured data missing | FAIL | catalog/structured-data.ts:11–29; product route:17–38; current source schema search | MON-014 |
| D3-05 | Structured data | Verified MerchantReturnPolicy/ShippingDetails integration | PARTIAL | catalog/structured-data.ts:11–29; product route:17–38; current source schema search | MON-014 |
| D3-06 | Structured data | FAQPage schema: no dedicated authoritative FAQ content; no fabricated eligibility | NOT APPLICABLE | catalog/structured-data.ts:11–29; product route:17–38; current source schema search | — |
| D3-07 | Structured data | Rendered rich-result validation and visible-price/schema consistency on real records | UNVERIFIED | catalog/structured-data.ts:11–29; product route:17–38; current source schema search | MON-020 |
| D4-01 | Content/AI discovery | Useful product descriptions/specifications/customer FAQ answers; no dedicated FAQ content found | PARTIAL | catalog schema; product page; home blocks; policy pages; robots/sitemap; no analytics/Search Console integration found | MON-025 |
| D4-02 | Content/AI discovery | Unique category explanations and commercially useful internal links | PARTIAL | catalog schema; product page; home blocks; policy pages; robots/sitemap; no analytics/Search Console integration found | MON-025 |
| D4-03 | Content/AI discovery | Generic blog/author/editorial dates: no editorial publication system or demonstrated need | NOT APPLICABLE | catalog schema; product page; home blocks; policy pages; robots/sitemap; no analytics/Search Console integration found | — |
| D4-06 | Content/AI discovery | Search visibility monitoring and Search Console acceptance | PARTIAL | catalog schema; product page; home blocks; policy pages; robots/sitemap; no analytics/Search Console integration found | MON-025 |
| D4-07 | Content/AI discovery | Practical AI-search visibility observations; no placement guarantee | UNVERIFIED | catalog schema; product page; home blocks; policy pages; robots/sitemap; no analytics/Search Console integration found | MON-025 |
| D4-08 | Content/AI discovery | Guaranteed Google AI Overview/ChatGPT placement: unsupported requirement | NOT APPLICABLE | catalog schema; product page; home blocks; policy pages; robots/sitemap; no analytics/Search Console integration found | — |
| E-01 | Customer UX/conversion | Custom 404 with useful navigation and generic recoverable error boundaries | PASS | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css; src/db/client.ts; catalog/queries.ts; components/commerce/product.tsx; globals.css; server components; next.config.ts; ops; current build | — |
| E-02 | Customer UX/conversion | Empty catalog/shop/cart/loading/error states implemented; skeleton usefulness not verified | PARTIAL | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | MON-020 |
| E-03 | Customer UX/conversion | Homepage/shop/product primary actions and consistent navigation in source | PASS | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | — |
| E-04 | Customer UX/conversion | Actual above-fold hierarchy and image-based visual quality on populated pages | UNVERIFIED | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | MON-020 |
| E-05 | Customer UX/conversion | Responsive public/cart/checkout layout at 320,375,768,1024,1440 | UNVERIFIED | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | MON-020 |
| E-06 | Customer UX/conversion | Horizontal overflow, long names, clipped dialogs and grids with real content | UNVERIFIED | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | MON-020 |
| E-07 | Customer UX/conversion | Sticky mobile purchase CTA: not intrinsically required; evaluate benefit before adding | NOT APPLICABLE | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | — |
| E-08 | Customer UX/conversion | URL-backed search, filtering, sorting, pagination controls | PASS | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | — |
| E-10 | Customer UX/conversion | Cart edits/limits/storage failure and server preview supported | PASS | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | — |
| E-11 | Customer UX/conversion | Cart stalled-loading timeout/retry and superseded request cancellation | PARTIAL | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css; ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml; src/db/client.ts; catalog/queries.ts; components/commerce/product.tsx; globals.css; server components; next.config.ts; ops; current build | MON-017 |
| E-12 | Customer UX/conversion | Checkout field validation, focus first error, server quote and policy reconfirmation | PASS | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | — |
| E-13 | Customer UX/conversion | Pending submit, failure and genuine persisted-order confirmation flow | PASS | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | — |
| E-14 | Customer UX/conversion | Order reference, receipt items/totals/courier display | PASS | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | — |
| E-18 | Customer UX/conversion | Social previews for non-product route types and share image availability | PARTIAL | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | MON-014 |
| E-19 | Customer UX/conversion | Favicon SVG and brand assets included in standalone build | PASS | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | — |
| E-20 | Customer UX/conversion | PWA/app install manifest/additional device icons: no installable-app scope | NOT APPLICABLE | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | — |
| E-21 | Customer UX/conversion | Detail image responsive sizing reflects gallery layout; useful product specification content covered by D4-01 | PARTIAL | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css; src/db/client.ts; catalog/queries.ts; components/commerce/product.tsx; globals.css; server components; next.config.ts; ops; current build | MON-015 |
| E-22 | Customer UX/conversion | Image aspect ratio/dimensions reserve space; lazy/priority image options | PASS | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css; src/db/client.ts; catalog/queries.ts; components/commerce/product.tsx; globals.css; server components; next.config.ts; ops; current build | — |
| E-23 | Customer UX/conversion | Measured layout shifts and typography consistency at zoom | UNVERIFIED | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | MON-020 |
| E-25 | Customer UX/conversion | Generic thank-you replacement: existing persisted-order receipt is appropriate | NOT APPLICABLE | src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | — |
| F-01 | Accessibility WCAG2.2AA | Rendered text/UI color contrast with real records | UNVERIFIED | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e | MON-020 |
| F-02 | Accessibility WCAG2.2AA | Text readability, 200/400 percent zoom and reflow | UNVERIFIED | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e | MON-020 |
| F-03 | Accessibility WCAG2.2AA | Meaningful image alternatives and decorative empty alt pattern in source | PASS | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e; app/[locale]/products/[slug]/page.tsx; shop/page.tsx; page.tsx; policies/[kind]/page.tsx; components/commerce/product.tsx; i18n/routing.ts | — |
| F-04 | Accessibility WCAG2.2AA | Logical heading order across listing/product routes | PARTIAL | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e; app/[locale]/products/[slug]/page.tsx; shop/page.tsx; page.tsx; policies/[kind]/page.tsx; components/commerce/product.tsx; i18n/routing.ts | MON-020 |
| F-05 | Accessibility WCAG2.2AA | Semantic landmarks/actions/navigation preferred to ARIA simulation | PASS | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e; app/[locale]/products/[slug]/page.tsx; shop/page.tsx; page.tsx; policies/[kind]/page.tsx; components/commerce/product.tsx; i18n/routing.ts | — |
| F-06 | Accessibility WCAG2.2AA | Accessible names for reviewed buttons/links/dialog close | PASS | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e | — |
| F-07 | Accessibility WCAG2.2AA | Associated form labels/autocomplete/types and instructions: Bangladesh mobile label/example, required fields, optional note, COD/policy/quote guidance | PASS | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e | — |
| F-08 | Accessibility WCAG2.2AA | Checkout inline error identity, aria-invalid/describedby and first-error focus | PASS | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e | — |
| F-09 | Accessibility WCAG2.2AA | Async success/error announcements including add-to-cart success | PARTIAL | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e | MON-020 |
| F-10 | Accessibility WCAG2.2AA | Manual keyboard navigation/focus order on populated public/admin routes | UNVERIFIED | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e | MON-020 |
| F-11 | Accessibility WCAG2.2AA | Global visible focus indicators and skip link defined | PASS | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e | — |
| F-12 | Accessibility WCAG2.2AA | Native modal dialog/showModal semantics and accessible label | PASS | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e | — |
| F-13 | Accessibility WCAG2.2AA | Current Escape, focus trapping/return and focus-not-obscured behavior | UNVERIFIED | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e | MON-020 |
| F-14 | Accessibility WCAG2.2AA | Bangla pages annotate substantive English fallback passages | PARTIAL | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e | MON-016 |
| F-15 | Accessibility WCAG2.2AA | Screen-reader checkout, status announcements and ARIA behavior | UNVERIFIED | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e | MON-020 |
| F-16 | Accessibility WCAG2.2AA | 24 CSS-pixel minimum touch targets/exceptions and mobile interaction | UNVERIFIED | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e | MON-020 |
| F-17 | Accessibility WCAG2.2AA | Reduced-motion preference disables smooth scrolling | PASS | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e | — |
| F-18 | Accessibility WCAG2.2AA | No zoom-disabling viewport configuration found | PASS | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e | — |
| F-19 | Accessibility WCAG2.2AA | Accessibility automation exists with WCAG2/2.1 tags; full2.2/manual and current browser acceptance absent | PARTIAL | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e; package.json; scripts/run-tests.mjs; playwright.config.ts; tests/e2e; src/**/*.test.*; .github/workflows/quality.yml; Dockerfile; docs/testing.md; current command log | MON-020 |
| F-20 | Accessibility WCAG2.2AA | Video captions/transcripts, drag alternatives and autoplay controls: no such media/gestures | NOT APPLICABLE | src/app/globals.css:31–35,175; store-shell.tsx; checkout/checkout-client.tsx:83–158; cart/cart-drawer.tsx:35–49; product-options.tsx; tests/e2e | — |
| G-01 | Privacy/legal/business trust | Owner-managed shipping/returns/privacy/terms infrastructure, retained revisions | PASS | admin/policies.ts; policy-form.tsx; settings.ts; checkout/orders.ts:32–35,64–67; schema/orders.ts; store-shell.tsx; official sources in section11 | — |
| G-02 | Privacy/legal/business trust | Actual privacy policy substance and accurate processing disclosures | EXTERNAL ACCESS REQUIRED | admin/policies.ts; policy-form.tsx; settings.ts; checkout/orders.ts:32–35,64–67; schema/orders.ts; store-shell.tsx; official sources in section11 | MON-009 |
| G-03 | Privacy/legal/business trust | Actual terms, returns/refunds/cancellation and shipping/delivery obligations | EXTERNAL ACCESS REQUIRED | admin/policies.ts; policy-form.tsx; settings.ts; checkout/orders.ts:32–35,64–67; schema/orders.ts; store-shell.tsx; official sources in section11 | MON-005 |
| G-04 | Privacy/legal/business trust | Essential cookie/storage disclosure and retention/deletion process | PARTIAL | admin/policies.ts; policy-form.tsx; settings.ts; checkout/orders.ts:32–35,64–67; schema/orders.ts; store-shell.tsx; official sources in section11 | MON-009 |
| G-05 | Privacy/legal/business trust | Marketing cookie banner/analytics consent: no marketing trackers installed; reevaluate before adding | NOT APPLICABLE | admin/policies.ts; policy-form.tsx; settings.ts; checkout/orders.ts:32–35,64–67; schema/orders.ts; store-shell.tsx; official sources in section11 | — |
| G-06 | Privacy/legal/business trust | Explicit checkout policy-version consent stored transactionally | PASS | admin/policies.ts; policy-form.tsx; settings.ts; checkout/orders.ts:32–35,64–67; schema/orders.ts; store-shell.tsx; official sources in section11 | — |
| G-07 | Privacy/legal/business trust | Customer data minimization: no mandatory account/email; contact/address server-side only | PASS | admin/policies.ts; policy-form.tsx; settings.ts; checkout/orders.ts:32–35,64–67; schema/orders.ts; store-shell.tsx; official sources in section11 | — |
| G-08 | Privacy/legal/business trust | No third-party tracker/embed marketing integration found in reviewed source | PASS | admin/policies.ts; policy-form.tsx; settings.ts; checkout/orders.ts:32–35,64–67; schema/orders.ts; store-shell.tsx; official sources in section11 | — |
| G-09 | Privacy/legal/business trust | Image ownership/licenses and product claim substantiation | EXTERNAL ACCESS REQUIRED | admin/policies.ts; policy-form.tsx; settings.ts; checkout/orders.ts:32–35,64–67; schema/orders.ts; store-shell.tsx; official sources in section11; catalog schema; product page; home blocks; policy pages; robots/sitemap; no analytics/Search Console integration found | MON-005 |
| G-10 | Privacy/legal/business trust | No fabricated reviews/ratings/false payment integration in active source | PASS | admin/policies.ts; policy-form.tsx; settings.ts; checkout/orders.ts:32–35,64–67; schema/orders.ts; store-shell.tsx; official sources in section11; catalog schema; product page; home blocks; policy pages; robots/sitemap; no analytics/Search Console integration found | — |
| G-11 | Privacy/legal/business trust | Business contacts rendered only from configured settings | PASS | admin/policies.ts; policy-form.tsx; settings.ts; checkout/orders.ts:32–35,64–67; schema/orders.ts; store-shell.tsx; official sources in section11; src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | — |
| G-12 | Privacy/legal/business trust | Accurate contact, registered identity/status and consumer-support information | EXTERNAL ACCESS REQUIRED | admin/policies.ts; policy-form.tsx; settings.ts; checkout/orders.ts:32–35,64–67; schema/orders.ts; store-shell.tsx; official sources in section11; src/app/not-found.tsx; error.tsx; global-error.tsx; components/layout/store-shell.tsx; blocks/home.tsx; cart/cart-drawer.tsx; checkout/checkout-client.tsx; globals.css | MON-005 |
| G-13 | Privacy/legal/business trust | Applicable Bangladesh digital-commerce/consumer law and tax/registration review | EXTERNAL ACCESS REQUIRED | admin/policies.ts; policy-form.tsx; settings.ts; checkout/orders.ts:32–35,64–67; schema/orders.ts; store-shell.tsx; official sources in section11 | MON-009 |
| G-14 | Privacy/legal/business trust | Current personal-data law applicability, retention, rights, transfer and breach procedures | EXTERNAL ACCESS REQUIRED | admin/policies.ts; policy-form.tsx; settings.ts; checkout/orders.ts:32–35,64–67; schema/orders.ts; store-shell.tsx; official sources in section11 | MON-009 |
| G-15 | Privacy/legal/business trust | Documented retention schedule covers orders, logs, mail, backups and expired capabilities | PARTIAL | admin/policies.ts; policy-form.tsx; settings.ts; checkout/orders.ts:32–35,64–67; schema/orders.ts; store-shell.tsx; official sources in section11 | MON-009 |
| H-01 | Analytics/observability | Business analytics/conversion event integration absent | FAIL | src/lib/logger.ts; app/api/health/route.ts; admin/notifications.ts; scripts/health-check.mjs; ops-alert.mjs; ops/systemd; source/package scan | MON-025 |
| H-02 | Analytics/observability | Analytics consent/duplicate-event/data minimization implementation: no analytics integration | NOT APPLICABLE | src/lib/logger.ts; app/api/health/route.ts; admin/notifications.ts; scripts/health-check.mjs; ops-alert.mjs; ops/systemd; source/package scan | — |
| H-03 | Analytics/observability | Product-view/add-to-cart/checkout-start/purchase event semantics: conditional when analytics chosen | NOT APPLICABLE | src/lib/logger.ts; app/api/health/route.ts; admin/notifications.ts; scripts/health-check.mjs; ops-alert.mjs; ops/systemd; source/package scan | — |
| H-04 | Analytics/observability | Structured server event logging excludes bodies/PII in reviewed calls | PASS | src/lib/logger.ts; app/api/health/route.ts; admin/notifications.ts; scripts/health-check.mjs; ops-alert.mjs; ops/systemd; source/package scan | — |
| H-05 | Analytics/observability | API/client error diagnostics and operational coverage beyond health | PARTIAL | src/lib/logger.ts; app/api/health/route.ts; admin/notifications.ts; scripts/health-check.mjs; ops-alert.mjs; ops/systemd; source/package scan; ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | MON-019 |
| H-06 | Analytics/observability | Database health endpoint returns no-store200/503 without sensitive details | PASS | src/lib/logger.ts; app/api/health/route.ts; admin/notifications.ts; scripts/health-check.mjs; ops-alert.mjs; ops/systemd; source/package scan; src/db/client.ts; catalog/queries.ts; components/commerce/product.tsx; globals.css; server components; next.config.ts; ops; current build; isolated production HTTP health503/no-store/no-PII JSON | — |
| H-07 | Analytics/observability | Owner notification queue retains retry/failure state for owner review | PASS | src/lib/logger.ts; app/api/health/route.ts; admin/notifications.ts; scripts/health-check.mjs; ops-alert.mjs; ops/systemd; source/package scan | — |
| H-08 | Analytics/observability | Health/mail/backup scheduler and OnFailure examples exist | PASS | src/lib/logger.ts; app/api/health/route.ts; admin/notifications.ts; scripts/health-check.mjs; ops-alert.mjs; ops/systemd; source/package scan | — |
| H-09 | Analytics/observability | Actual uptime, DB/deployment alerts and backup failure delivery | EXTERNAL ACCESS REQUIRED | src/lib/logger.ts; app/api/health/route.ts; admin/notifications.ts; scripts/health-check.mjs; ops-alert.mjs; ops/systemd; source/package scan | MON-019 |
| H-10 | Analytics/observability | Independent monitoring of dead-host/mail outage and useful operator incident response | EXTERNAL ACCESS REQUIRED | src/lib/logger.ts; app/api/health/route.ts; admin/notifications.ts; scripts/health-check.mjs; ops-alert.mjs; ops/systemd; source/package scan | MON-019 |
| H-11 | Analytics/observability | Payment-provider failure monitoring: no gateway; COD/manual reconciliation assessed separately | NOT APPLICABLE | src/lib/logger.ts; app/api/health/route.ts; admin/notifications.ts; scripts/health-check.mjs; ops-alert.mjs; ops/systemd; source/package scan | — |
| H-12 | Analytics/observability | Deployed logs redaction/access/retention and alert recipients | EXTERNAL ACCESS REQUIRED | src/lib/logger.ts; app/api/health/route.ts; admin/notifications.ts; scripts/health-check.mjs; ops-alert.mjs; ops/systemd; source/package scan | MON-009 |
| I-01 | Performance/reliability | Field LCP/INP/CLS and representative lab performance | UNVERIFIED | src/db/client.ts; catalog/queries.ts; components/commerce/product.tsx; globals.css; server components; next.config.ts; ops; current build | MON-019 |
| I-04 | Performance/reliability | System-font fallback; no external runtime font download dependency found | PASS | src/db/client.ts; catalog/queries.ts; components/commerce/product.tsx; globals.css; server components; next.config.ts; ops; current build | — |
| I-05 | Performance/reliability | Production bundle bytes/client hydration cost and loading waterfall | UNVERIFIED | src/db/client.ts; catalog/queries.ts; components/commerce/product.tsx; globals.css; server components; next.config.ts; ops; current build | MON-019 |
| I-06 | Performance/reliability | Server-rendered storefront with small client cart/checkout/admin widgets | PASS | src/db/client.ts; catalog/queries.ts; components/commerce/product.tsx; globals.css; server components; next.config.ts; ops; current build | — |
| I-08 | Performance/reliability | Actual CDN/cache strategy and image delivery | EXTERNAL ACCESS REQUIRED | src/db/client.ts; catalog/queries.ts; components/commerce/product.tsx; globals.css; server components; next.config.ts; ops; current build; ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | MON-007 |
| I-09 | Performance/reliability | Database query plans/API response times at intended volume | UNVERIFIED | src/db/client.ts; catalog/queries.ts; components/commerce/product.tsx; globals.css; server components; next.config.ts; ops; current build; ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | MON-019 |
| I-10 | Performance/reliability | Sitemap scans all published rows; ILIKE/search-index fit at scale | PARTIAL | src/db/client.ts; catalog/queries.ts; components/commerce/product.tsx; globals.css; server components; next.config.ts; ops; current build; ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | MON-025 |
| I-12 | Performance/reliability | DB pool/connect/statement/lock/transaction budgets and Auth/media/SMTP/checkout network deadlines | PASS | src/db/client.ts; catalog/queries.ts; components/commerce/product.tsx; globals.css; server components; next.config.ts; ops; current build; ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | — |
| I-16 | Performance/reliability | Multi-instance distributed cache orchestration: documented single instance; revalidate if scaled | NOT APPLICABLE | src/db/client.ts; catalog/queries.ts; components/commerce/product.tsx; globals.css; server components; next.config.ts; ops; current build | — |
| J-01 | Testing/CI/deployment | Lint passed in isolated current source copy | PASS | package.json; scripts/run-tests.mjs; playwright.config.ts; tests/e2e; src/**/*.test.*; .github/workflows/quality.yml; Dockerfile; docs/testing.md; current command log | — |
| J-02 | Testing/CI/deployment | Type generation/typecheck passed in isolated current source copy | PASS | package.json; scripts/run-tests.mjs; playwright.config.ts; tests/e2e; src/**/*.test.*; .github/workflows/quality.yml; Dockerfile; docs/testing.md; current command log | — |
| J-03 | Testing/CI/deployment | Current unit suite35 passed15 skipped; not complete integration pass | PARTIAL | package.json; scripts/run-tests.mjs; playwright.config.ts; tests/e2e; src/**/*.test.*; .github/workflows/quality.yml; Dockerfile; docs/testing.md; current command log | MON-020 |
| J-04 | Testing/CI/deployment | Current database/API/authorization/RLS/checkout transaction integration execution | UNVERIFIED | package.json; scripts/run-tests.mjs; playwright.config.ts; tests/e2e; src/**/*.test.*; .github/workflows/quality.yml; Dockerfile; docs/testing.md; current command log | MON-020 |
| J-05 | Testing/CI/deployment | Authentication/MFA/recovery tests use pure/mocked identity plus external acceptance needed | PARTIAL | package.json; scripts/run-tests.mjs; playwright.config.ts; tests/e2e; src/**/*.test.*; .github/workflows/quality.yml; Dockerfile; docs/testing.md; current command log | MON-004 |
| J-07 | Testing/CI/deployment | Current production Playwright checkout and screenshot regression suites | UNVERIFIED | package.json; scripts/run-tests.mjs; playwright.config.ts; tests/e2e; src/**/*.test.*; .github/workflows/quality.yml; Dockerfile; docs/testing.md; current command log | MON-020 |
| J-09 | Testing/CI/deployment | Credential-free production build and standalone postbuild pass | PASS | package.json; scripts/run-tests.mjs; playwright.config.ts; tests/e2e; src/**/*.test.*; .github/workflows/quality.yml; Dockerfile; docs/testing.md; current command log; ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | — |
| J-10 | Testing/CI/deployment | Strict test/e2e guards reject absent isolated TEST_DATABASE_URL before mutation | PASS | package.json; scripts/run-tests.mjs; playwright.config.ts; tests/e2e; src/**/*.test.*; .github/workflows/quality.yml; Dockerfile; docs/testing.md; current command log | — |
| J-12 | Testing/CI/deployment | CI definition runs isolated DB/strict/ops/build/production E2E and security gates | PASS | package.json; scripts/run-tests.mjs; playwright.config.ts; tests/e2e; src/**/*.test.*; .github/workflows/quality.yml; Dockerfile; docs/testing.md; current command log | — |
| J-13 | Testing/CI/deployment | Reviewed source commit/artifact provenance and actual hosted CI/required-check acceptance | EXTERNAL ACCESS REQUIRED | package.json; scripts/run-tests.mjs; playwright.config.ts; tests/e2e; src/**/*.test.*; .github/workflows/quality.yml; Dockerfile; docs/testing.md; current command log; ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | MON-007 |
| J-15 | Testing/CI/deployment | Migration rollback/recovery and release rollback procedure accepted on real host | PARTIAL | package.json; scripts/run-tests.mjs; playwright.config.ts; tests/e2e; src/**/*.test.*; .github/workflows/quality.yml; Dockerfile; docs/testing.md; current command log | MON-006 |
| J-18 | Testing/CI/deployment | Documented runbook links and stale test-status claims | PARTIAL | package.json; scripts/run-tests.mjs; playwright.config.ts; tests/e2e; src/**/*.test.*; .github/workflows/quality.yml; Dockerfile; docs/testing.md; current command log; ARCHITECTURE.md; src/app; src/features; src/db/client.ts:12–20; catalog/queries.ts; scripts/preflight.mjs; ops; .github/workflows/quality.yml | MON-021 |

## 5. Detailed findings

Priorities reflect Monechai launch dependencies. Confirmed source defects may still need isolated runtime reproduction. External acceptance findings are unknowns with concrete checks, not invented vulnerabilities.

### MON-001 — Stale variant metadata save can restore stock already sold

**Finding ID:** MON-001  
**Domain:** Commerce/data integrity  
**Severity/priority:** P1  
**Status:** Confirmed source path; database reproduction pending

**Evidence:** src/features/admin/catalog/product-forms.tsx:43–55; product-actions.ts:72–80; products.ts:86–98; checkout/orders.ts:76–82; schema/catalog.ts:64–67.

**Problem:** Stock uses form-loaded defaultValue and is submitted on every variant save. Server locks latest rows then writes entire parsed input without expected stock/version. Sequence: load stock1, checkout commits stock0, save label with old stock1; authorized save restores stock1. Locks serialize writes but cannot distinguish stale form intent. Independent security reviewer found no stale-write trigger or alternative guard.

**Impact:** Owner can accidentally sell more units than physically held while editing a label. This is an authorized-operator concurrency bug, not an admin authentication bypass.

**Recommended fix:** Preserve stock in metadata saves. Separate deliberate inventory adjustment using audited delta or expected quantity/version under transaction; reject stale adjustments. Reuse existing inventory/history patterns.

**Dependencies:** Goal06; regression in Goal09; preserve Goal04 checkout locks.

**Verification criteria:** Disposable fixture: load stock1 editor, checkout consumes unit, submit stale label edit; stock remains0 or conflict returned. Confirm cancellation/restock/concurrent purchases and replenishment still correct.

**External access:** None for source fix; isolated database/browser needed for acceptance.

**Effort estimate:** Medium; small code change but stock lifecycle regression matters.

### MON-002 — Production preflight requires schema permission denied to runtime role

**Finding ID:** MON-002  
**Domain:** Deployment/database operations  
**Severity/priority:** P1  
**Status:** Confirmed source/configuration contradiction; runtime reproduction pending

**Evidence:** scripts/preflight.mjs:30–41; ops/supabase-runtime.sql:3,35–36; docs/SUPABASE_SETUP_HANDOFF.md:28–29,115–116.

**Problem:** Preflight opens DATABASE_URL then queries drizzle.__drizzle_migrations. Documented runtime connection has no drizzle schema access and NOINHERIT. DIRECT_URL exists separately but preflight never uses it. Local permissive test role can conceal contradiction.

**Impact:** Intended release readiness gate cannot pass with intended least-privilege runtime credentials. Switching app DATABASE_URL to privileged migration credentials would undermine isolation.

**Recommended fix:** Split runtime readiness from operator-only migration-history check; use separately injected appropriately scoped operator connection. Keep application credentials restricted. Minimal explicitly approved read-only migration metadata grant is alternative only if required.

**Dependencies:** Goal10; review Goal01/05 grants without broadening app authority.

**Verification criteria:** Run preflight with intended isolated runtime role; verify appropriate readiness checks pass and forbidden auth/membership/migration mutations remain denied. Separate history check detects journal mismatch using operator permission.

**External access:** Exact Supabase scoped/operator role acceptance later; do not change live grants in audit.

**Effort estimate:** Small–Medium.

### MON-003 — Visitor-cookie quotas alone cannot bound hostile COD stock holds

**Finding ID:** MON-003  
**Domain:** Abuse/commerce availability  
**Severity/priority:** P1  
**Status:** Partially verified; source fallback limitation confirmed, deployed defenses unknown

**Evidence:** src/proxy.ts:19–23; checkout/abuse.ts:6–13; api/checkout/route.ts:19; checkout/orders.ts:62–82; .env.example:15; admin/orders.ts:71–106.

**Problem:** Fallback budget identity is client-changeable UUID cookie. New UUID obtains fresh counter. Submitted COD orders immediately reserve/decrement stock until manual cancellation; no approved pending-order expiry/review process evidenced. Trusted-IP mode is optional and requires correct ingress.

**Impact:** False COD requests could tie up saleable inventory and owner review time under fallback mode. Login/recovery budgets are similarly weakened; provider limits/MFA remain additional controls. No production exhaustion/brute-force success demonstrated.

**Recommended fix:** Verify trusted ingress IP overwrite and private Node port, then enable appropriate trusted-IP budget. Approve bounded pending-order review/cancellation procedure. Reuse durable counters and manual owner workflow; add CAPTCHA/OTP only if actual risk justifies it.

**Dependencies:** Goals04/07/08/10; approved stock-release policy first.

**Verification criteria:** Isolated tests: cookie rotation cannot evade selected production budget, spoofed IP cannot alter identity at reachable ingress, counters expire safely, stale pending orders handled audibly without double stock release.

**External access:** Host/CDN/firewall and Supabase auth-throttle settings.

**Effort estimate:** Medium; topology and business policy determine solution.

### MON-004 — Real owner Auth/MFA/RLS/Storage acceptance remains incomplete

**Finding ID:** MON-004  
**Domain:** Security/provider acceptance  
**Severity/priority:** P1  
**Status:** Requires further verification; documented acceptance gate

**Evidence:** STATS.MD:15–24; docs/SUPABASE_SETUP_HANDOFF.md:16–35,65–79; admin/auth.ts:9–24; ops/supabase-runtime.sql; ops/supabase-storage.sql.

**Problem:** Code and SQL define strong controls; handoff says designated owner email/identity/MFA and actual session/upload acceptance remain pending. Dashboard state, applied policies and real provider JWT behavior were not rechecked in this paused audit.

**Impact:** Owner could be unable to administer store or recover access; source intent cannot prove real denials or upload permissions. No claim that currently applied RLS is wrong.

**Recommended fix:** Resume existing Goal05 only when owner requests live setup; verify exact project access, designated Auth identity/bootstrap, personal TOTP, member/nonmember/AAL1/AAL2/revocation. Goal06 follows with real photo upload/publish/unpublish/delete journey.

**Dependencies:** Goal05 before06/07/provider09 acceptance; preserve existing project/data and separate Lead backend.

**Verification criteria:** Record owner-controlled fixture denials/access, cookie attributes/expiry/revocation and storage policy outcomes. Authorized member-AAL2 uploads verified photo; outsiders and AAL1 deny; revocation immediately removes application membership permission.

**External access:** Supabase project lmrdvenrchsnueztzcdi dashboard/admin read access and owner personally authenticating; no password/MFA seed in report.

**Effort estimate:** Medium; access and personal owner steps uncertain.

### MON-005 — Live business policies/catalog/fulfillment/cash procedures unaccepted

**Finding ID:** MON-005  
**Domain:** Business/legal/commerce  
**Severity/priority:** P1  
**Status:** Requires further verification; documented business gate

**Evidence:** handoff:93–103; admin/policies.ts:7–27; checkout/orders.ts:30–35,54–67; admin/orders.ts:53–125; fixtures/demo-catalog.json.

**Problem:** Four-policy publication/consent, shipping configuration, returns/restock/refund code exist. Actual approved stock/photos/claims/contact/rates/coverage/ETA/refund-cancellation/courier/COD settlement inputs and customer support acceptance are pending. Preserved24 demo products are drafts, not live inventory.

**Impact:** Checkout fails closed before policies/rates; wrong owner data would create misleading promises or fulfillment/cash errors. Current source defaults must not be mistaken for approved business commitments.

**Recommended fix:** Approve concrete store identity/contact, new-product stock/photos/specs, image rights, delivery areas/fees/ETA, return/refund/cancellation eligibility and manual COD courier/cash reconciliation. Enter through existing protected forms; no source edits for products.

**Dependencies:** Goals06/07/08 after05; business/legal approval where needed.

**Verification criteria:** Owner-approved sample product/photo publishes correctly; policy/rate revision visible and consent snapshotted; controlled test order accepted/contacted/shipped/settled/returned/refunded in fixture and operating checklist.

**External access:** Owner business facts, supplier/photo evidence, courier process and qualified Bangladesh legal/tax review.

**Effort estimate:** Medium–Large; breadth of real catalog/policy inputs uncertain.

### MON-006 — Off-site backup and full backend disaster recovery are not accepted

**Finding ID:** MON-006  
**Domain:** Operations/reliability  
**Severity/priority:** P1  
**Status:** Requires further verification; source clearly documents missing external acceptance

**Evidence:** docs/backup-recovery.md:3–23; docs/OPERATIONS_CHECKS.md; scripts/backup.mjs:21–51; restore-drill.mjs:12–40; ops/systemd/monechai-backup.service.

**Problem:** Encrypted app DB/photo export and isolated restore tooling exist; this audit did not rerun DB/photo drill. No accepted independent upload/retention/schedule, key custody, complete Supabase identities/roles/bucket recovery or measured RPO/RTO exists in current handoff.

**Impact:** Host/project failure could lose orders, identities or images even if app export restores. Same-host encrypted archive alone is not disaster recovery.

**Recommended fix:** Select lowest-cost independent destination, least-privilege backup operator and separate encryption-key custody; test transfer/retention/restore/alert. Include full provider Auth/bucket/roles reconstruction and reconciliation of newer orders. Preserve existing app scripts.

**Dependencies:** Goal10 after accepted business/data/provider scope; backup before migrations/deployment.

**Verification criteria:** Actual dated last-success + off-site checksums; isolated full restore recreates identities/membership/catalog/orders/photos/policies/roles; measured approved RPO/RTO; deliberate failed backup alerts owner; cutover plan prevents overwriting newer orders.

**External access:** Backup destination, chosen host/provider backup settings and authorized isolated recovery project.

**Effort estimate:** Medium–Large; provider recovery and storage selection uncertain.

### MON-007 — No verified host/domain/release provenance or hosted CI acceptance

**Finding ID:** MON-007  
**Domain:** Deployment/engineering  
**Severity/priority:** P1  
**Status:** Requires further verification; current local artifact pass only

**Evidence:** Dockerfile:1–27; ops/nginx-monechai.conf; .github/workflows/quality.yml; docs/deployment.md; STATS.MD current pause; initial dirty Git status.

**Problem:** Standalone/nonroot image/proxy/CI artifacts exist, but actual hosting choice/deployment/DNS/certificate/renewal/CDN/private port/trusted headers/GitHub write-required checks and production smoke are unaccepted. Current hardening is largely uncommitted/untracked; HEAD differs from audit target.

**Impact:** Deploying HEAD can omit working security/commerce changes; wrong TLS/cache/proxy could break auth or expose private responses. No current live exposure asserted.

**Recommended fix:** Choose affordable single-instance host; review exact worktree into release branch/PR in later authorized session; run hosted CI, require gates, prepare immutable release artifact/rollback. Configure monechai.com canonical HTTPS, renewal/private origin/header trust and private cache exclusions.

**Dependencies:** Goal10;001/002/008/020 and owner inputs before launch.

**Verification criteria:** Recorded commit/artifact matches reviewed source; hosted CI green including approved advisory disposition; public assets/admin/private headers/health/HTTPS/redirect/crawler checks on intended host; rollback tested without DB rollback assumptions.

**External access:** GitHub repository/settings/write access; hosting; domain/DNS registrar; Cloudflare only if selected.

**Effort estimate:** Medium–Large; no provider selected/accepted.

### MON-008 — Full dependency security gate still fails on braces toolchain advisory

**Finding ID:** MON-008  
**Domain:** Supply chain/release  
**Severity/priority:** P1  
**Status:** Confirmed current registry result; exploitability in store runtime not established

**Evidence:** npm audit --json exit1:5 high entries; package-lock braces3.0.3; scripts/patch-braces.mjs; tooling-security.test.mjs current pass; .github/workflows/quality.yml full gate.

**Problem:** Fresh advisory GHSA-vfj7-8cjw-p6xm marks deeply nested patterns vulnerable through Next ESLint/fast-glob/micromatch/braces chain. Production audit0. Guarded string-pattern mitigation does not alter vendor version/advisory and full CI gate intentionally remains failing. Suggested npm fix downgrades eslint-config-next to14.2.35, inappropriate blindly for Next16.3.

**Impact:** Release cannot honestly claim all security gates green. Malicious unbounded tooling inputs remain a supply-chain maintenance question; no public request path to braces established.

**Recommended fix:** Track upstream compatible patch/update and review mitigation scope/integrity. Retain advisory transparency; do not force downgrade framework tooling or disable gate. Any temporary risk acceptance must be explicit, bounded and test-backed in implementation session.

**Dependencies:** Goal10/A18 existing work; compatible toolchain/version approval.

**Verification criteria:** Clean locked install under pinned runtime; hostile and ordinary glob regression; lint/types/build/migrations/browser gates; npm full audit resolved or documented owner-approved release disposition without false zero-advisory claim.

**External access:** Registry/upstream advisory only for research; GitHub to verify actual gate.

**Effort estimate:** Small–Medium; upstream availability uncertain.

### MON-009 — Retention, deletion and current Bangladesh data obligations need concrete policy

**Finding ID:** MON-009  
**Domain:** Privacy/legal/operations  
**Severity/priority:** P1  
**Status:** Partially verified; missing operational policy, legal applicability unverified

**Evidence:** src/db/schema/orders.ts customer fields/consent; backup/recovery runbook; request_limits expiry cleanup; policy revision retention; official2026 law links section11.

**Problem:** Rate counters expire and customer PII avoids browser storage, but no approved schedule/right-request workflow covers private orders, logs, notifications, receipt capabilities, backups and legal retention. Singapore provider region is historical handoff. Current law/regulations and transfer obligations need application-specific review.

**Impact:** Real buyer data may outlive justified purpose or deletion commitments; recovery backups can reintroduce removed data. This report does not assert a particular lawful retention period or blanket localization duty.

**Recommended fix:** Inventory data copies/providers; approve retention/legal basis/support request verification/deletion-anonymization/legal hold and breach/credential rotation process. Preserve immutable financial snapshots/necessary obligations; align privacy copy and backup retention. Review current law with qualified local adviser.

**Dependencies:** Goals07/08/10; business/legal facts before deletion code.

**Verification criteria:** Approved matrix lists each data class,purpose,access,retention,backup handling and verified request procedure; safe fixture rights/deletion flow preserves mandatory records and propagates policy to restore process.

**External access:** Owner/legal adviser, provider processing agreements/region, host/log/backup settings.

**Effort estimate:** Medium; legal deadlines/applicability uncertain.

### MON-010 — SMTP recovery and owner/operator notification delivery remain unverified

**Finding ID:** MON-010  
**Domain:** Auth/notifications/reliability  
**Severity/priority:** P1  
**Status:** Requires further verification; documented unconfigured delivery

**Evidence:** handoff:81–91; account-service.ts; admin/order-mail.ts:8–27; notifications.ts:9–33; OPERATIONS_CHECKS.md; systemd timers.

**Problem:** Supabase reset template requires custom SMTP and six-digit Token acceptance. App order/ops SMTP credentials/sender/recipients/worker secret and schedules are separate. No real recovery/owner alert inbox acceptance recorded. Queue code passes pure validation; DB leasing tests skipped today.

**Impact:** Owner can lose account recovery or fail to notice new COD orders/outages. SMTP acceptance alone does not establish inbox delivery.

**Recommended fix:** Configure verified sender and approved mailbox in Supabase and separate server-only app variables. Owner authorizes recovery/test alerts. Verify SPF/DKIM/DMARC and real delivery/retry/dead-letter; enable schedules only on chosen host. Keep email free of customer PII.

**Dependencies:** Goal05 recovery;07 alerts;10 scheduler/incident acceptance.

**Verification criteria:** Recovery code template/expiry and member+AAL2 path verified; owner alert received for fixture order; failure retains order/retry; independent monitoring catches host/mail outage; no raw secrets/PII in log or mail.

**External access:** SMTP provider, DNS sender records, recipient inbox and owner-controlled Supabase recovery.

**Effort estimate:** Medium; sender/provider deliverability unknown.

### MON-011 — Guest receipt omits actual COD payment status

**Finding ID:** MON-011  
**Domain:** Commerce/UX  
**Severity/priority:** P2  
**Status:** Confirmed source omission; runtime state rendering pending

**Evidence:** src/app/[locale]/order/[publicToken]/success/page.tsx:18–29; admin/orders.ts:53–63,75–80,118–125.

**Problem:** Receipt selects fulfillment/totals/tracking but not paymentStatus/paymentMethod. Admin pending→paid/failed/refunded histories already work in source.

**Impact:** Buyer cannot see whether cash was recorded/refunded through saved limited receipt; order receipt must not imply payment completion.

**Recommended fix:** Render localized server-derived payment status separately from fulfillment, preserving no-PII bearer receipt and privacy headers.

**Dependencies:** Goals07/08;09 fixtures; no gateway required.

**Verification criteria:** Pending/paid/failed/refunded fixture receipt displays exact state in both locales; totals/fulfillment remain correct and no contact data leaks.

**External access:** None for source change; isolated DB/browser.

**Effort estimate:** Small.

### MON-012 — HTTPS configuration alone enables crawling without explicit staging policy

**Finding ID:** MON-012  
**Domain:** SEO/configuration  
**Severity/priority:** P2  
**Status:** Confirmed source eligibility gap; actual staging exposure unknown

**Evidence:** src/lib/site-url.ts:2–15; app/layout.tsx:16; robots.ts:7–11; sitemap.ts:11–18; current local HTTP robots output.

**Problem:** Any configured HTTPS origin makes global metadata index-eligible and robots allow public pages. Current isolated https://store.example robots returned allow rules and its sitemap link. No explicit approved-production indexing flag exists.

**Impact:** Future HTTPS staging can publish draft/test public URLs unless host adds protections. No existing staging/public-index claim made.

**Recommended fix:** Use explicit default-deny environment indexing policy shared by metadata/robots/sitemap, or independently verified host access/noindex. Allow only approved production public pages; retain private exclusions.

**Dependencies:** Goals08/10; intended host/origin policy.

**Verification criteria:** HTTPS staging noindex/disallow-all/no sitemap URLs; accepted production emits expected canonical URLs; private routes remain noindex and authorized.

**External access:** Host/staging/DNS/CDN settings when present.

**Effort estimate:** Small.

### MON-013 — Shop pagination canonical collapses distinct product pages

**Finding ID:** MON-013  
**Domain:** SEO  
**Severity/priority:** P2  
**Status:** Confirmed source metadata mismatch; generated fixture HTML pending

**Evidence:** src/app/[locale]/shop/page.tsx:9–12,40–43; src/i18n/routing.ts:14–17.

**Problem:** generateMetadata ignores searchParams and canonicalizes every page/filter to base shop; page2 shows distinct products.

**Impact:** Search engines get conflicting pagination identity signals; filtered category landing pages lack deliberate index policy.

**Recommended fix:** Normalize self-canonical pagination, coordinate hreflang, separately decide category/search/sort facet indexability. Keep bounded query controls.

**Dependencies:** Goal08; fixture catalog with at least two pages under09.

**Verification criteria:** Page1/page2/BN canonical+alternates exact; invalid/repeated params normalize safely; search/sort/facet policy avoids duplicate index explosion.

**External access:** Search Console later for URL inspection; no credential needed for source.

**Effort estimate:** Small–Medium.

### MON-014 — Entity/breadcrumb merchant schema and route share coverage are incomplete

**Finding ID:** MON-014  
**Domain:** SEO/social metadata  
**Severity/priority:** P2  
**Status:** Confirmed missing schema types; business data acceptance pending

**Evidence:** catalog/structured-data.ts:11–24; product metadata route:17–30; app/layout.tsx; sitemap.ts.

**Problem:** Product/Offer exists; Organization/WebSite/BreadcrumbList absent. Verified shipping/returns schema absent; generic routes lack dedicated share imagery/policy descriptions. Genuine review schema correctly absent.

**Impact:** Search/share systems receive less context; merchant features cannot rely on policy data not yet approved. This is enhancement, not guarantee of rich/AI results.

**Recommended fix:** Add modest entity/breadcrumb markup using verified store data and visible links. Derive return/shipping schema from approved policies when representation correct. Configure useful non-product share preview and factual policy metadata.

**Dependencies:** Goal08 after005; no invented address/ratings/returns promises.

**Verification criteria:** Rendered schema validator passes; visible prices/stock/brand/policy match; product and shop/policy previews load correct absolute image/origin.

**External access:** Owner business/policy data; Search Console optional verification.

**Effort estimate:** Medium.

### MON-015 — Product detail images advertise card-sized layout to optimizer

**Finding ID:** MON-015  
**Domain:** UI/performance  
**Severity/priority:** P2  
**Status:** Confirmed source sizing mismatch; sharpness/LCP impact unmeasured

**Evidence:** components/commerce/product.tsx:13–17; product detail page:48–49; globals.css:117,173.

**Problem:** Shared sizes says50vw phone/33vw tablet/280px desktop; detail gallery is full-width mobile and roughly half1200px desktop container.

**Impact:** Browser may choose too-small images for product inspection; no measured performance or visual defect asserted.

**Recommended fix:** Pass context-specific sizes for detail versus card using existing Next Image, preserving lazy/priority/aspect-ratio and upload constraints.

**Dependencies:** Goal03/06/08; real/fixture images under09.

**Verification criteria:** At selected widths/DPRs inspect currentSrc/intrinsic versus displayed dimensions and sharpness; image payload proportionate; no CLS regression.

**External access:** None for source; photo fixtures/real photo acceptance later.

**Effort estimate:** Small.

### MON-016 — English fallback passages on Bangla pages lack language-of-parts annotation

**Finding ID:** MON-016  
**Domain:** Accessibility/i18n  
**Severity/priority:** P2  
**Status:** Confirmed substantive fallback source gap; screen-reader behavior unverified

**Evidence:** policies/[kind]/page.tsx:21–22; products/[slug]/page.tsx:40,54; dictionary.ts:38–39; app/layout.tsx:23.

**Problem:** Optional Bangla policy/description fields fall back to English under html lang=bn; warning exists but actual English text lacks lang=en.

**Impact:** Assistive technology may pronounce substantial policy/product text with wrong language voice; important purchase terms harder to understand.

**Recommended fix:** Annotate substantive fallback sections lang=en or publish approved Bangla translation. Do not flag proper product/brand names alone.

**Dependencies:** Goal08 after approved content;09 screen-reader acceptance.

**Verification criteria:** BN missing-translation fixture marks correct language; translated text remains bn; manual screen-reader reading verified.

**External access:** Owner translation approval where used.

**Effort estimate:** Small–Medium.

### MON-017 — Cart preview lacks request deadline and superseded-request cancellation

**Finding ID:** MON-017  
**Domain:** UX/reliability  
**Severity/priority:** P2  
**Status:** Confirmed source risk; stalled workflow not browser reproduced

**Evidence:** cart/cart-drawer.tsx:18–27,40–47; checkout/checkout-client.tsx:17–20.

**Problem:** Drawer fetch has no AbortSignal/time budget. Refresh ID avoids stale writes but does not cancel superseded requests; stalled fetch can remain Checking item until network fails. Checkout already has native bounded timeout pattern.

**Impact:** Buyer lacks predictable feedback under poor mobile network and repeated edits create unnecessary outstanding work.

**Recommended fix:** Reuse finite timeout/AbortController, cancel old/closed-dialog previews, preserve latest-response fence and retry feedback.

**Dependencies:** Goal03/04; browser09.

**Verification criteria:** Mock stalled/delayed preview produces error+retry within deadline; earlier result cannot overwrite latest quantities; close/reopen and checkout navigation remain usable.

**External access:** None.

**Effort estimate:** Small.

### MON-018 — Tracking/catalog/settings mutations lack proportionate actor history

**Finding ID:** MON-018  
**Domain:** Admin/observability  
**Severity/priority:** P2  
**Status:** Confirmed source omission; scope appropriate for one owner

**Evidence:** admin/order-actions.ts:62–69; admin/orders.ts:128–130; catalog/settings/policy actions; existing order history schemas.

**Problem:** Status/payment/inventory actor histories exist; courier/tracking overwrites discard actor and old value. Generic catalog/settings/policy operational changes lack comparable audit record.

**Impact:** Owner cannot easily reconstruct accidental stock/tracking/config changes or incident chronology. No unauthorized action alleged.

**Recommended fix:** Record actor/action/resource/time/outcome and appropriate previous/new non-PII values for material edits, particularly explicit stock adjustments/tracking/policy publication. Use small existing DB/log design, no event sourcing.

**Dependencies:** Goals06/07/08;001 inventory adjustment.

**Verification criteria:** Fixture change retains actor/time/old/new state; unauthorized mutations deny; no secrets/customer contact/receipt tokens in audit logs; immutable purchases preserved.

**External access:** Host retention/privacy settings for retained logs.

**Effort estimate:** Medium.

### MON-019 — Production monitoring and representative performance are not established

**Finding ID:** MON-019  
**Domain:** Operations/performance  
**Severity/priority:** P2  
**Status:** Partially verified; local health known, deployment metrics/alerts unknown

**Evidence:** lib/logger.ts; api/health/route.ts; scripts/health-check.mjs,ops-alert.mjs; systemd; no client error monitoring integration found.

**Problem:** Health and event logger/scheduler examples exist. No accepted independent uptime/backup-failure/DB/mail alerts, all-API/client diagnostics or representative LCP/INP/CLS/query metrics. Local absent-DB timings do not measure commerce performance.

**Impact:** Dead host cannot alert itself; silent frontend/API or notification failures can impede orders. Optimization without baseline can waste effort.

**Recommended fix:** Start with inexpensive independent uptime and actionable operator logs/alerts; cover checkout/queue/backup failures with redacted events. Measure realistic fixture catalog/photos and live field data when available before optimizing.

**Dependencies:** Goal10 after host/mail setup;09 fixture performance; no mandatory paid vendor.

**Verification criteria:** Deliberate safe test outage reaches owner; health503/500/queue failure distinguishable; logs noPII; representative lab traces and later field CWV recorded; query plan verified where slow.

**External access:** Chosen host/SMTP/monitor and optional error monitoring/Search Console field tools.

**Effort estimate:** Medium; monitoring service choice optional.

### MON-020 — Current release acceptance lacks DB/provider/browser/WCAG2.2 evidence

**Finding ID:** MON-020  
**Domain:** Testing/accessibility  
**Severity/priority:** P1  
**Status:** Confirmed verification gap; no assertion that skipped tests fail

**Evidence:** Current npm test50 total35 pass15 skip; strict/E2E exit1 missing TEST_DATABASE_URL; Chromium target crash; playwright.config.ts; docs/testing.md; tests/e2e.

**Problem:** Current source-copy checks do not execute SQL race/RLS/restore/photo lifecycle or real owner flows. Existing axe tests target WCAG2/2.1; full2.2/manual viewport/zoom/touch/screen-reader coverage absent. Historical50/50,4/4 remain prior reports.

**Impact:** Release may regress transactions/permissions/mobile accessibility without current evidence. Test existence/source checks do not establish correctness at persistence/render boundary.

**Recommended fix:** Later isolated authorized fixture environment with pinned22.23.3 and disposable local Postgres; run suites sequentially, then production server/browser. Add focused stale-stock/preflight/pagination/payment/lang/timeout regressions; manual2.2 checks and real owner acceptance.

**Dependencies:** Goals05/06/09/10; no hosted customer/test mutation inferred from audit.

**Verification criteria:** Strict zero skips, restore16-table/photo roundtrip, production E2E all passed, five widths/both locales/long names/200-400% zoom/native dialog Escape/focus/SR/touch inspected; remaining limitations recorded.

**External access:** Isolated Postgres/browser resources; exact owner Supabase later.

**Effort estimate:** Medium; provider access and sandbox browser resource issue uncertain.

### MON-021 — Runbook links and old status sentences contradict consolidated authority

**Finding ID:** MON-021  
**Domain:** Documentation  
**Severity/priority:** P2  
**Status:** Confirmed source documentation drift

**Evidence:** ARCHITECTURE.md:13,27; docs/testing.md:22; README.md; PROJECT_RECORD.md current index and preserved historical sources.

**Problem:** Some runbooks still link deleted PROJECT_AUDIT/old operating-checklist paths and say locale work open or price test unrun despite later history. Consolidated record deliberately preserves older bodies; current navigation should distinguish them.

**Impact:** Future agents can repeat already fixed work or use wrong acceptance/status assumptions.

**Recommended fix:** In later docs-authorized work fix current live links/status paragraphs to PROJECT_RECORD anchors and latest verified results. Preserve historic bodies/archive and user-directed consolidation; do not recreate docs/goals.

**Dependencies:** Goal10 docs; no code dependency.

**Verification criteria:** Check every current Markdown link/anchor and status authority; retain archive manifest/historical content; zero contradiction in resume instructions.

**External access:** None.

**Effort estimate:** Small.

### MON-022 — Public Supabase key-class validation occurs only in preflight

**Finding ID:** MON-022  
**Domain:** Secrets/configuration hardening  
**Severity/priority:** P2  
**Status:** Confirmed guard placement gap; actual secret exposure not established

**Evidence:** src/lib/supabase/config.ts:4–5; scripts/preflight.mjs:23–27; Dockerfile:9–15.

**Problem:** Normal config accepts nonempty key; privileged-key class rejection is only in preflight, which build does not invoke. That early preflight key check runs before the independent MON-002 migration-schema failure; the schema failure does not bypass key rejection. Ignored current key values were not printed. Build arguments are public by definition.

**Impact:** A future operator misconfiguration could place privileged key into a NEXT_PUBLIC value if build proceeds without preflight. No claim current configured key is privileged or leaked.

**Recommended fix:** Centralize public-key classification in shared safe config/build validation, reject sb_secret/service-role types without printing value; preserve supported publishable/anon forms and keep secret modules server-only.

**Dependencies:** Goals01/05/10;002 gate fix.

**Verification criteria:** Dummy privileged/public-key fixtures accepted/rejected correctly in config/build; actual configured release key class privately verified; client artifact scan finds no runtime secrets.

**External access:** Owner/private secure configured release environment for final verification only.

**Effort estimate:** Small.

### MON-023 — CSP defines object/frame/form boundaries but no script policy

**Finding ID:** MON-023  
**Domain:** Security hardening  
**Severity/priority:** P3  
**Status:** Confirmed limited header scope; no XSS exploit established

**Evidence:** next.config.ts:21; structured-data.ts:27–29; React text rendering.

**Problem:** CSP lacks script-src/default-src nonce/hash enforcement. Existing React escaping and safe JSON-LD are meaningful protections.

**Impact:** Additional defense would limit impact of future markup injection; absent header alone does not prove vulnerability.

**Recommended fix:** Evaluate narrow Next-compatible CSP/nonce/hash policy after runtime needs measured; preserve images/auth/navigation and caching. Avoid blanket policy that breaks working checkout.

**Dependencies:** Goal08/10 after provider/render acceptance.

**Verification criteria:** Report-only fixture first; approved script/image/auth paths work; injected dummy script blocked under enforced policy; no hydration/checkout/SEO regression.

**External access:** Host effective headers/CDN when deployed.

**Effort estimate:** Small–Medium; nonce/cache effects uncertain.

### MON-024 — Dependency maintenance and repository security scanning need ownership

**Finding ID:** MON-024  
**Domain:** Supply chain/governance  
**Severity/priority:** P2  
**Status:** Partially verified; local files incomplete, hosted settings unknown

**Evidence:** quality.yml actions use version tags; no dependabot/CodeQL config in current .github; Dockerfile image tags; lockfile integrity.

**Problem:** Lock/audits/guarded mitigation exist. No scheduled update owner/config or verified secret scanning/branch protections; action/image versions are mutable tags.

**Impact:** Tooling advisories like008 can remain open; unauthorized or unreviewed releases harder to prevent without hosted governance.

**Recommended fix:** Use GitHub-supported dependency alerts/update workflow and secret scanning where available; assign owner/review cadence, pin critical actions/image digests if maintainable; preserve narrow CI permissions and no production secrets in PR jobs.

**Dependencies:** Goal10;007 GitHub owner access.

**Verification criteria:** Actual settings/required checks observed; safe simulated advisory/secret fixture in isolated scanning workflow detected without publishing secrets; compatible updates pass full suite.

**External access:** GitHub settings/permissions; no paid product required automatically.

**Effort estimate:** Small–Medium.

### MON-025 — Useful product/search/analytics evidence should follow launch fundamentals

**Finding ID:** MON-025  
**Domain:** SEO/content/performance/business measurement  
**Severity/priority:** P3  
**Status:** Partially verified; optional capability gaps and scale risks

**Evidence:** product page omits variant attributes as specs; catalog category names only; no analytics integration; sitemap.ts:13–18 unbounded list; queries.ts:24–51 ILIKE vs schema search index.

**Problem:** No business analytics events/search visibility integration. Category copy/spec presentation limited; no dedicated customer FAQ content found. Existing approved policies and product content should answer actual delivery, returns and product questions before a separate FAQ page is considered. Sitemap collects all published rows; English/Bangla ILIKE leading-wildcard search does not use declared full-text GIN strategy. Current small catalog has no measured query slowness.

**Impact:** Owner may lack useful conversion visibility; product answers can be thin; eventual catalog growth needs measurement. None justifies a large content system/search cluster today.

**Recommended fix:** Prioritize actual descriptions/specs/category questions and Search Console. Optional minimal privacy-preserving conversion events with purchase deduplication only after owner chooses analytics. Measure query plan/catalog size; use existing DB indexes/query/sitemap batching only when thresholds justify.

**Dependencies:** Goals06/08/10;005 approved content;009 privacy before trackers.

**Verification criteria:** Real product answers complete; Search Console domain/sitemap inspected; any analytics fixture emits one purchase per order without PII; representative query/sitemap resource bounds measured at intended scale.

**External access:** Search Console; optional analytics service if chosen; real catalog evidence.

**Effort estimate:** Small–Medium; explicitly post-launch/proportionate.

## 6. Existing implementation inventory

Preserve these implemented behaviors; acceptance work should verify them rather than rebuild them.

| Subsystem | Implemented and evidenced now | Limit of verification |
|---|---|---|
| Framework/package | Current credential-free Next standalone compilation, TypeScript and asset postbuild pass | Node22.23.1 used; pinned22.23.3 release and real config still needed |
| Money/input | Integer poisha, bounded quantity/cart, normalized Bangladesh phone, strict server schemas, safe quote hash | Pure/domain tests pass; current SQL cases skipped |
| Checkout persistence | Transaction/idempotency advisory lock, request hash, unique key, live stock/price locks, conditional decrement, snapshots/outbox together | Complete source trace; current DB execution unavailable |
| Response-loss/cart | IDs/quantities only persistent browser cart, HttpOnly retry handle, existing-order recovery; cart limit errors | Pure storage tests pass; production response-loss E2E historical only |
| Cancellation/returns | Once-only stock release, explicit sellable-as-new return restock, manual full-COD refund acknowledgement, immutable snapshots/history | Source exists;15 DB cases skipped today; MON-001 remains stock-edit path |
| Admin | Verified user, membership and AAL2 per protected operation; controlled TOTP enrollment/recovery | Policy/mock tests pass; actual provider session/deny/revoke external |
| Media | Real decode, format/byte/pixel limits, metadata stripping, product-bound random WebP, integrity hash/publish gate, restrictive Storage guards | Decoder unit test passes; SQL/provider upload/delete external |
| Policies/shipping | Four-policy protected publication/revision, consent snapshot, approved area→fee calculation; no invented approved content | Input tests pass; approved live values/transaction tests pending |
| Order communication | Genuine limited bearer receipt with reference/items/totals/tracking; leased transactional owner outbox, bounded retries and secret worker | Receipt payment state omitted; mail delivery/DB lease acceptance pending |
| SEO/i18n | /en,/bn routing, product metadata/canonical/hreflang, safe real Product/Offer, private-route exclusions, truthful new-only/COD messaging | Current robots HTTP200; real sitemap/metadata/merchant/content acceptance pending |
| Accessibility foundation | Semantic elements, labels/error associations, native dialog, skip link/focus/reduced motion, meaningful/decorative alt patterns | Full current keyboard/axe/zoom/screen-reader/photo contrast not executed |
| Security/error boundaries | Server-only secrets, safe public errors, quotas/body deadlines, safe JSON-LD, DB resource budgets, private headers | Source/pure tests and selected HTTP headers verified; ingress/live session unknown |
| Operations | Nonroot Docker definition, health checks, structured event logger, encrypted backup utilities and safe isolated restore tooling | Crypto/health utility tests pass; host/full/off-site recovery unknown |
| CI | Isolated DB, zero-skip guard, build/ops/production E2E/security workflow defined | Strict/E2E correctly refuse missing DB; hosted run unknown; full audit5 high |

Partial: live identity/MFA/mail/provider acceptance; real product/policy/support/courier inputs; stock-edit concurrency; preflight permission compatibility; receipt payment display; staging/pagination/schema; fallback language and detail-image sizing; cart deadline; actor audit trail; privacy retention; hosted alerts/recovery/release; current DB/browser/WCAG2.2 evidence. None of these partial items authorizes an application change during this audit.

No coupon, gateway webhook, customer account/profile system, marketplace, automatic customer email or distributed architecture exists. Requirements for those absent systems are conditional or not applicable to current COD/guest/single-owner scope. Preserve24-product/nine-category fixture reference; never automatically publish demos as real stock.

## 7. Prioritized master TODO

Each checkbox owns one finding, avoiding duplicate feature tasks. Goal references point to existing consolidated record. Implementation remains future work.

**Stage0 — launch blockers; source correctness and release evidence**

- [ ] MON-001 (P1, Goal06/09): separate metadata saves from concurrency-safe stock adjustments; add stale-form/checkout regression.
- [ ] MON-002 (P1, Goal10): split migration metadata preflight from scoped runtime readiness; verify permissions with intended role.
- [ ] MON-008 (P1, Goal10/A18): resolve or explicitly approve bounded upstream tooling advisory disposition, with compatible clean-install/full-gate evidence.
- [ ] MON-020 (P1, Goal09): reproduce strict zero-skip database/restore/production browser tests under pinned runtime; complete manual WCAG2.2/five-width review.

**Stage1 — owner identity, business operations and privacy; launch blockers**

- [ ] MON-004 (P1, Goal05→06): verify exact project/owner/member/AAL2/revoke/Storage acceptance; preserve configured backend and existing catalog.
- [ ] MON-010 (P1, Goal05/07/10): accept custom recovery SMTP/template and separate owner/operator alert delivery/retry/schedules.
- [ ] MON-005 (P1, Goal06/07/08): approve real products/photos/contact/policies/rates/courier/COD/refund procedures and acceptance.
- [ ] MON-009 (P1, Goal08/10): approve current legal/data-retention/rights/transfer/breach/rotation policy before live buyer data.
- [ ] MON-003 (P1, Goal07/08/10): establish trusted ingress abuse identity and pending-COD review/release procedure; test rotating cookies/spoofed headers safely.

**Stage2 — infrastructure and recoverability; launch blockers**

- [ ] MON-006 (P1, Goal10): test independent encrypted DB/photo backup, full provider restore, alerts/key custody/retention/RPO/RTO and newer-order reconciliation.
- [ ] MON-007 (P1, Goal10): produce reviewed release commit/artifact, verified hosted CI/permissions, selected host/DNS/HTTPS/private origin/cache/rollback and final smoke evidence.

**Stage3 — targeted correctness, accessibility and diagnostics; preferably before launch**

- [ ] MON-011 (P2, Goal07/08): show server-derived COD payment state on limited receipt; preserve privacy.
- [ ] MON-017 (P2, Goal03/04): finite/cancelable cart preview with retry and stale-response regression.
- [ ] MON-016 (P2, Goal08): annotate English fallback or approve Bangla content; manually verify screen-reader language.
- [ ] MON-015 (P2, Goal03): detail-specific image sizes; verify photo quality/srcset/CLS across widths.
- [ ] MON-018 (P2, Goal06/07): proportionate actor history for material inventory/tracking/settings/policy changes.
- [ ] MON-022 (P2, Goal01/05/10): reject privileged key classes at normal config/build boundary with dummy-key tests.
- [ ] MON-019 (P2, Goal10): accept independent operational alerts and redacted diagnostics; collect realistic performance baseline. Essential alerts/health portions belong launch gate; broader telemetry can follow.

**Stage4 — discovery/governance/maintenance; after real content and environment accepted**

- [ ] MON-012 (P2, Goal08/10): explicit staging index policy before any public HTTPS staging; verify approved production crawler rules.
- [ ] MON-013 (P2, Goal08): pagination self-canonicals and deliberate facet policy with generated HTML checks.
- [ ] MON-014 (P2, Goal08): verified entity/breadcrumb/merchant schema and useful share metadata without invented facts.
- [ ] MON-024 (P2, Goal10): assign dependency/scanning owner and verify hosted security/governance settings; use existing GitHub features.
- [ ] MON-021 (P2, Goal10): repair current runbook links/status sentences while preserving historical bodies/archive.

**Stage5 — post-launch, justified improvements**

- [ ] MON-023 (P3, Goal08/10): evaluate compatible script CSP using report-only/fixture checks before enforcement.
- [ ] MON-025 (P3, Goal06/08/10): improve real product answers/specs/category content and Search Console evidence; choose optional minimal analytics; optimize DB/sitemap only from measured scale.

Online payments: if owner retains gateway for launch, Goal11 becomes sequential launch work with merchant sandbox, verified initiation/amount/currency, webhook signature/timestamp/replay, event idempotency, settlement/reconciliation/refund/outage and no-double-charge acceptance. Existing COD-only controls cannot certify it. No raw merchant keys, fake button or speculative provider selection is required by this audit.

## 8. External tools, services and access requirements

Use dashboards, least-privilege temporary permission or securely configured local/server environment variables. Do not paste passwords/tokens/live connection strings into chat or Markdown. Existing ignored credentials are evidence of configuration, not authorization to reopen paused setup. No dependency installation or external account changes performed.

| Tool/service | Purpose | Current evidence / integration state | Access needed | Exact verification or task | Priority | Blocker |
|---|---|---|---|---|---|---|
| Supabase exact Monechai project | Auth, managed PostgreSQL, Storage | Integrated source; handoff initial setup applied2026-10-11; current provider state unverified | Project dashboard/admin read access initially, designated owner personal authentication; later scoped setup permission | Verify project lmrdvenrchsnueztzcdi membership;16 RLS tables/13 migrations/runtime grants/client API denial; owner/member/AAL1/AAL2/revoke/OTP; public products5MiB WebP bucket/restrictive guards; backup plan | P1 | Yes, Goals05–09 acceptance |
| Supabase designated owner | Store-admin identity and recovery | Email/identity/MFA not accepted; no buyer account required | Actual approved admin email; owner personally sets password/TOTP; never disclose seeds/codes | Confirm auth.users identity then exact membership bootstrap; live login/recovery/session expiry/global logout/membership revocation; no guessed identity | P1 | Yes |
| PostgreSQL/operator connection | Migration history/readiness and release safety | Drizzle plus restricted runtime; preflight contradiction | Secure separate scoped runtime DATABASE_URL and appropriate operator DIRECT_URL/read-only migration metadata credentials | Verify002 with exact permissions; schema/constraint/index/no-drift/history checks read-only; later approved migration/backup only | P1 | Yes preflight; source fix independent |
| Isolated PostgreSQL fixture environment | Transaction/race/RLS/restore regression | TEST_DATABASE_URL guards; DB cases skipped today; existing tooling | Dedicated disposable local /monechai_test inside approved isolation; no shared/hosted store URL | Sequential strict tests, migrations only when future authorized, isolated restore and production browser; stale stock/race/policies/IDOR denials | P1 | Current verification blocker; no production access needed |
| Pinned Node/installed Playwright/Chromium | Release/build/render/WCAG2.2 | Node22.23.1 available vs22.23.3 pin; Chromium installed but sandbox target crash | Suitable bounded sandbox resources and pinned runtime; install only after separate permission if missing | Clean release gate and rendered five-width/zoom/SR/focus/error/axe checks; diagnose browser crash without weakening target isolation | P1 | Current release evidence blocker |
| GitHub repository/settings | CI/release provenance/governance/scanning | Workflow source exists; dirty hardening not deployed; old access note not refreshed | Read CI/settings; eventual owner write/PR/settings permission | Verify actual CI runs, required checks/protection/scanning/collaborators/intended visibility; reviewed commit matches audit source; protected secrets only in trusted deployment jobs | P1 | Yes actual release; no push authorized now |
| Hosting/VPS or approved managed host | Run one standalone app | Docker/Nginx/runbooks only; provider not accepted | Owner selects plan within cost budget; dashboard/SSH least privilege later | Nonroot runtime, private port, env file modes, trusted proxy, resource/disk limits, health, worker/backup timers, rollback, log access/retention | P1 | Yes deployment; no purchase/install now |
| Domain registrar/DNS (Spaceship recorded historically) | monechai.com canonical DNS, SMTP records | Domain user-supplied; handoff purchased domain; DNS not queried | DNS zone read/owner change authorization later | Verify actual owner, A/AAAA/CNAME, canonical apex/www/HTTPS, TLS renewal and SPF/DKIM/DMARC; avoid guessed records | P1 | Yes deployment/delivery |
| TLS/reverse proxy/CDN/WAF | Transport, IP trust/private cache/rate isolation | Nginx example; Cloudflare optional, not verified integrated | Chosen host/proxy and CDN dashboard if used | Exact Host/proto/X-Real-IP normalization, direct-origin firewall, current trusted provider IP ranges, no private cache, secure cookies/HSTS/cert renewal | P1 | Yes; WAF paid product not automatically required |
| SMTP provider + verified sender | Supabase recovery and app owner/ops alerts | Nodemailer/outbox code; custom provider/template/delivery pending | Dashboard SMTP config, approved sender, owner mailbox; secret credentials securely stored | Supabase six-digit Token template; TLS465/587; separate app worker config, retry/dead-letter/inbox proof, DNS sender authentication | P1 | Yes owner recovery/order awareness |
| Independent backup storage/operator | Durable off-site recovery | Encryption/export scripts; no accepted upload/retention/provider recovery | Restricted destination access, separate encryption-key custody, backup role | Snapshot+photo checksum/transfer/retention proof; full Auth/roles/bucket restore; timed drill and failure alert; reconciliation | P1 | Yes before live orders |
| Uptime/log monitoring | Detect dead-host/DB/mail/backup failures | Health/logger/systemd examples; external integration unverified | Monitor target/dashboard, operator recipient; choose free/low-cost where sufficient | Safe outage triggers independent alert; track health/5xx/queue/backup last-success without PII | P1 essential/P2 broader | Essential alerts before launch |
| Error tracking service | Client/API diagnostics | Not integrated; optional external service | Only if selected; secure DSN/settings and retention review | Redacted event capture incl failures without address/phone/token/body, consent/PII settings | P2 optional vendor | No mandatory paid service |
| Owner supplier/courier/support inputs | Accurate commercial operations | Protected forms exist; live values unaccepted | Real stock/price/photo rights/coverage/rates/ETA/cash settlement/refund/support data | Verify approved policies and controlled fixture order/manual call/WhatsApp/courier/COD/refund record lifecycle | P1 | Yes; no courier API required |
| Bangladesh legal/tax/business adviser and official portals | Specific obligations, privacy/rights/registration/tax | Policy infrastructure only; official current law researched | Actual legal entity/activity/thresholds/provider/data facts; qualified review | Current commerce/consumer/data law, DBID/trade/tax applicability, privacy/transfers/retention/complaints and policy wording | P1 | Business/legal acceptance; no invented registration/address |
| Payment merchant provider | Real online payments if retained | Not integrated, Goal11 conditional | Owner selects approved merchant; sandbox dashboard/credentials secure env, webhook config | Server verified amount/currency, signature/replay/idempotency, duplicate/outage/refund/reconciliation tests before production merchant enablement | P1 conditional | Only if gateway retained for launch; COD can launch without |
| Google Search Console | Search indexing/performance | Not verified/integrated | Domain property ownership; DNS verification authorized later | Submit correct sitemap, inspect product/page2/locale canonicals, coverage/rich results/field CWV and private-route exclusion | P2 | Search verification; no API key necessary |
| Analytics | Optional conversion measurement | Not integrated; no marketing tracking found | Owner chooses minimal tool and privacy policy/consent settings first | Product/cart/checkout/purchase events with idempotent purchase ID, no customer PII; no fabricated events | P3 | No launch blocker |
| Search/AI visibility review | Useful product discoverability | Crawlable source; no placement guarantee | Public approved content and manual search observations | Record dated query/source observations; distinguish established SEO from speculative AI tactics | P3 | Optional; no promise or mandatory paid tool |

Environment-name inventory for later setup (names only): server-secret DATABASE_URL, DIRECT_URL, SMTP_USER, SMTP_PASSWORD, ORDER_WORKER_SECRET, BACKUP_DATABASE_URL, BACKUP_ENCRYPTION_PASSWORD; public build-time NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; config DATABASE_SSL, CHECKOUT_TRUST_PROXY_IP_HEADER, SMTP_HOST, SMTP_PORT, EMAIL_FROM, ORDER_ALERT_EMAIL, OPS_ALERT_EMAIL, HEALTHCHECK_URL, BACKUP_OUTPUT_DIR, BACKUP_SUPABASE_URL, BACKUP_PG_IMAGE; isolated-only TEST_DATABASE_URL, RESTORE_TEST_DATABASE_URL, RESTORE_SNAPSHOT_DIR, RESTORE_PHOTO_DIR. Environment visibility is value-specific: email addresses/business identity can still be private even when not credentials. Supabase SMTP dashboard config does not populate app SMTP env automatically.

## 9. Recommended implementation order

Keep one active milestone. Existing [plan index](../PROJECT_RECORD.md#plan-index), [Goal05](../PROJECT_RECORD.md#goal-05) and owner-approved consolidated layout remain authority; do not recreate deleted docs/goals files. Audit adds checks/findings to that plan in a future authorized implementation session. Current live setup pause remains intact.

1. Address narrow independent source blockers001/002 and upstream008 in reviewed, independently tested batches. They belong06/10 but do not justify restarting foundation/catalog; document dependency exception when implementation resumes. Separate stock editing from auth/infrastructure changes.
2. Resume05 only after owner explicit live resume: exact account/project access, designated identity, MFA/recovery. Then06 actual product/photo publish and direct Storage denial/revocation. Business/policy/legal preparation can happen independently as non-code owner input collection.
3. Accept07/08 manual COD/courier/refund/consent/contact/rates and notification delivery. Fix011/017/016/015/018/022 in focused source batches. Shared orders/schema/checkout work should be sequential to avoid conflicting inventory/history semantics.
4. Run09 strict isolated current tests/restore/browser/visual/WCAG2.2 sequentially, with actual provider owner acceptance separate from local test database. Add only meaningful regressions for findings; do not mirror implementation or count mocks as provider evidence.
5. Finish10 host/GitHub/DNS/TLS/header/IP trust/off-site full restore/monitor/mail schedules and approved operating costs. Record exact source commit/artifact; no deploy approval requested by this audit. Final production smoke/rollback/backup acceptance follows authorized release.
6. Complete08 staging/canonical/schema/search checks using approved production catalog/domain. These can be independent UI metadata tasks after stable route/content contracts, but not simultaneously rewriting shared routing/config files.
7. Consider023/025 and optional analytics/query optimization after evidence warrants them. If live online payments retained,11 must be designed and sandbox-accepted before its launch; never bolt fake payment UI into COD.

Legal copy, provider access setup and independent monitoring/destination selection can proceed independently as owner tasks. Authentication, DB migrations/grants, checkout/inventory and shared Next/proxy config changes need coherent sequential review. No reason to introduce a second backend, queue cluster, mandatory paid analytics, customer account system or generic content factory.

## 10. Validation and acceptance criteria

| Work group | Required tests/security checks | Browser/runtime acceptance | Success/definition of done | Regression risks |
|---|---|---|---|---|
| Stock/catalog001 | Stale metadata/explicit adjustment vs checkout/cancel/restock; money/SKU/publish image integrity | Real owner draft→photo→publish/edit/unpublish both locales | Metadata cannot restore sold stock; audited deliberate changes conflict safely; real media lifecycle accepted | Overselling, double release, accidentally unpublished products |
| Preflight/credentials002/022 | Intended runtime role; operator migration-history mismatch; dummy public/private keys; forbidden schemas/membership writes | Read-only preflight under exact runtime config | Runtime readiness passes without privileged application credential; history check separate; build rejects privileged public keys | Broadening grants or leaking values in diagnostics |
| Auth/provider004/010 | Missing/member/nonmember/AAL1/AAL2/factor ownership/recovery/revocation matrix; provider limits/cookie/session/OTP settings | Owner-controlled login/TOTP/logout/recovery and direct Storage writes; mail inbox proof | No weak-factor bypass, proper denial/revocation, reliable documented recovery; full provider—not mock—evidence | Locking owner out, stale token authority, OTP mismatch |
| Checkout/orders003/005/011/018 | Strict SQL concurrency/rollback/idempotency/quote/policy/cancel/return/cash/full-refund/history; trusted-IP budget | Fixture guest→receipt→admin fulfillment/payment/refund; support workflow | One authoritative order/stock change; no false success/PII receipt; accurate pending/paid/refunded status; approved fulfillment operating checklist | Duplicate order/alert interpretation, refund recorded before money returned, pending stock release |
| Privacy/legal009 | Approved data-flow/retention/rights/breach/transfer/tax/legal matrix; deletion/restore propagation fixture | Truthful policy/consent/contacts, support rights channel, essential cookie disclosure | Approved wording matches actual integrations and business facts; no fabricated address/claims; retained snapshots legally justified | Breaking historical purchase records or restoring deleted data |
| Operations006/007/019 | Current pinned install/lint/types/zero-skip/restore/build/audits/CI; no-secret artifact scans; scoped roles; backup hashes/alerts | Host health/private headers/TLS/cert renewal/firewall/IP trust, independent outage alert, full restore/rollback | Reviewed artifact/commit live; independent backup proof; measured RPO/RTO; actual owner incident alert; no secret deployment drift | Releasing old HEAD, private CDN caching, DB rollback losing newer orders |
| SEO012/013/014 | Generated page1/page2/facet/locales metadata/robots/sitemap; schema validators with actual records | Canonical redirects, Search Console URL/sitemap/structured-data inspection | Approved production public URLs crawlable; staging/private blocked; real price/stock/policy schema consistent | Indexing test/private data, canonical collapse, fabricated schema |
| UX/accessibility015/016/017/020 | Axe2/2.1/2.2 tags where available plus long names/translation/timeout fixtures |320/375/768/1024/1440 both locales, keyboard/Tab/Escape/focus return, touch/zoom/reflow/SR and photo srcset | No blocking overflow/clipped dialog, field errors accessible, fallback language correct, timely cart feedback; scope limits recorded | Breaking native modal/focus, tiny touch targets, wrong currentSrc, lost checkout retry |
| Supply chain008/024 | Guarded mitigation plus current registry audits/compatible versions/action permissions/scanning/required CI | Actual hosted gate outcome | Advisory resolved or honest explicit bounded acceptance; no hidden forced downgrade or broadly disabled checks | Incompatible tooling, malicious PR secret exposure, stale vendor override |
| Documentation021 | Current local links/anchors/status checks and archive manifest preservation | Resume sequence understandable from authoritative tracker | Old bodies retained but current pointers correct; no retired goal recreation | Repeated migrations/incorrect readiness claims |
| Optional023/025 | CSP report-only dummy injection; privacy-first event dedup; representative query plan/size limits | Real public photo performance/search answers, later field CWV | Incremental measured benefit; no invented AI placement or unapproved trackers | Broken scripts/cache, unnecessary expense, collecting customer PII |

Loading-status UI exists; no dedicated skeleton system found in inspected public listing code. Assess whether a skeleton materially improves slow listing/checkout feedback under representative network delay; no current visual usefulness verdict or mandatory skeleton rewrite. Form source includes Bangladesh-mobile label/example, native required/length constraints, optional note, COD explanation and linked policy-consent guidance; comprehension and screen-reader instructions remain manual acceptance under MON-020.

A green build or pure suite is necessary evidence, never sufficient launch acceptance. P1 gates remain open until objective criteria and relevant external proof are recorded. Preserve every commerce/security invariant in AGENTS; tests must never target real store database or email customers.

## 11. Unverified assumptions and open questions

| Category | Specific unknown | Resolution needed |
|---|---|---|
| Missing verification | Current SQL transaction/race/RLS/media/restore tests and rendered provider/browser/WCAG2.2 | Isolated fixture setup + strict sequential commands and owner provider journey |
| Environment limitation | Node22.23.3 unavailable in audit;22.23.1 used; Chromium target crashed before newPage | Pinned toolchain/sandbox resources; diagnose crash without weakening isolation |
| Missing service access | Live Supabase owner membership/AAL2/session/bucket/RLS/role settings and backup plan | Exact project dashboard read acceptance on authorized resume |
| Missing configuration | SMTP/template/sender/recipient/schedule, approved policies/rates/host/DNS/monitor/off-site destination | Owner selections and secure settings; no raw credentials in report |
| Missing code | Concurrency-safe stock metadata save, receipt payment display, card/detail image sizes, cart deadline, substantive fallback lang, some schema/audit/analytics | Findings001/011/015/017/016/014/018; analytics optional025 |
| Missing documentation | Current runbook links/status, explicit approved stock hold/cash/retention/full-recovery plan | Findings003/005/009/021/006 |
| Business unknown | Who is designated admin, true legal entity/registration/contact, stock/rights, tax applicability, courier/refunds/ETA | Owner and qualified local adviser; no inferred physical office/status |
| Deployment unknown | Whether monechai.com currently serves anything, domain owner/DNS, staging existence, Cloudflare/host/HTTPS/CI runs | No live probes performed; selected provider/DNS/CI dashboards later |
| Payment scope | Does owner require real gateway at first launch or permit COD-only? | Existing conditional Goal11; merchant sandbox required if retained |
| Source screenshots | Exact text/images of five source screenshots | No images attached; expanded textual prompt covered; pixel/exact-word equivalence cannot be certified |
| Privacy/scanning unknown | Hosted repository visibility/protections, secret scanning, artifact/log policies | GitHub/provider settings; exact-path Git history checks are not all-history secret audit |

Current authoritative legal research matters: official Ministry of Law publishes **Personal Data Protection Act,2026 (Act63),10 April2026**. Section1(3) states most provisions deemed effective6 November2025, with sections23 and31–35 subject to later commencement mechanism. This supersedes an assumption that only a2025 draft is relevant; business-specific obligations, later gazette/rules and application to Monechai still require qualified review. Do not infer all data must be local or prescribe a deletion deadline from a search snippet. [Official current Act](https://bdlaws.minlaw.gov.bd/act-print-1692.html).

Digital-commerce guidelines2021 are listed in official July4,2021 Commerce gazette; text-specific service/refund/registration obligations should be checked against authoritative full text/current rules. Consumer Rights Protection Act2009 is available from official laws portal. The audit verifies these source publications, not Monechai legal compliance, registration/tax status or validity of unseen policy content. [Official Commerce gazette entry](https://www.dpp.gov.bd/bgpress/index.php/document/get_extraordinary/40432), [official Consumer Rights Protection Act](https://bdlaws.minlaw.gov.bd/act-print-1014.html).

Established SEO work is crawlable useful public content, canonical metadata, appropriate indexing and truthful schema. Any claimed AI-answer inclusion/position is speculative until observed; no technique guarantees Google AI Overview or ChatGPT answers. Analytics/cookie consent must match chosen tracking and current legal facts rather than an unrequested universal banner.

## 12. Audit methodology and command log

Evidence path: current instructions/status/handoff/consolidated plan → source subsystem mapping → entry-to-trusted-persistence traces → independent refutation → safe isolated checks → external-access ledger → deduplicated controls and findings. Source search used rg first, then bounded numbered reads. Three reviewers supplied source facts; root independently rechecked decisive stock/preflight/receipt/cart/index-policy traces. Prior memory guided startup only; current repository/commands outrank old results. No prior machine-schema security ledger available for this audit; prior preserved narrative audit A01–A21 reviewed without carrying its fixed labels as current-runtime proof.

Security skill's standalone multi-file vulnerability-report convention was adapted to owner's explicitly requested one Markdown deliverable. No exploit record is elevated from a missing header or unobserved provider setting. Its vulnerability/coverage JSON validators were not applied to this Markdown/P0–P3 control inventory; format and complete cross-references checked with a trusted report consistency script instead. Independent source rechecks are not claimed as exploit reproduction. Temporary clean copies/commands outside repository are not deliverable files.

| Command/action | Exit/result | Evidence interpretation |
|---|---|---|
| rg -n relevant memory registry keywords; current AGENTS/STATS/MIGRATION/handoff/PROJECT_RECORD reads |0 | Startup/pause/consolidation authority; no implementation resume |
| rg --files source/tests/scripts/ops/docs/.github; nested AGENTS search; bounded nl/sed/rg |0 | Only root applicable AGENTS found; source inventory/traces |
| git rev-parse HEAD; git status --short |0 | d18cb132…; extensive pre-existing edits/deletions/untracked modules |
| git ls-files .env*; git check-ignore .env.local .env.supabase.setup; git log --all exact env paths; file mode/name-only parser |0 | Only example tracked; two real files ignored/mode600; no exact-path history; values never output |
| Trusted baseline SHA256 inventory outside repo |0 |219 pre-existing nonsecret source/config/docs paths hashed; secret files excluded |
| bwrap capability probe /bin/true |0 | OS isolation available |
| Initial limited sandbox launch |1 |128 then1024 process limit below existing user threads; namespace resource error before project execution |
| First isolated npm run lint / npm test with dependency alias and virtual-memory limits |lint2/tests1 |Harness failures: module resolution from wrongly named mount and Wasm allocation; not application test failures; corrected and rerun |
| Corrected isolated npm run lint |0 |ESLint9.39.5 current code clean |
| Corrected isolated npm test |0 |50 tests,35 pass,0 fail,15 skip; DB not set. Tests include money, schemas, image decoding, recovery/mock assurance, cart, body timeout, schema serialization, encrypted backup utility, operator health and braces mitigation |
| Isolated node node_modules/next/dist/bin/next typegen |0 |Current route types generated only in scratch |
| Isolated npm run typecheck |0 |TypeScript current source passes |
| First isolated npm run build with symlink dependency alias |1 |Turbopack rejects out-of-root dependency symlink; harness issue |
| Normal read-only node_modules mount build, restrictive resource run |1 |Compilation/types pass, page worker SIGABRT; resource-specific, no app build-failure conclusion |
| Corrected affinity/resource isolated npm run build incl postbuild |0 |Next16.3.8 dynamic routes/7 static generation, standalone static/public assets prepared; no credentials or DB |
| Isolated npm run test:ci without TEST_DATABASE_URL |1 |Expected safe guard rejection before DB/test execution; not complete integration pass |
| Isolated npm run test:e2e without TEST_DATABASE_URL |1 |Expected dedicated-local-DB guard rejection before fixture actions/browser suite |
| Installed Chromium read-only browser harness on credential-free standalone |target crash; outer timeout124 |browser.newPage Target crashed before any page inspection; no axe/keyboard/viewport/screenshot result; isolated process tree destroyed |
| Credential-free standalone HTTP fetch harness using npm build/start, isolated loopback3115 |0 |Actual production-mode no-DB HTTP status/header behavior below; no mutation forms/POST/customer action |
| npm audit --omit=dev --json on clean copied package/lock, no lifecycle/auth config |0 |info/low/moderate/high/critical all0 |
| npm audit --json on same clean copied package/lock |1 |5 high entries; one GHSA braces chain; no install or upgrade |
| Registry harness initial empty npm config attempt |1 |npm rejected same /dev/null loaded as user+global config; distinct empty files fixed; final audit results above |
| Official web guidelines/current Bangladesh legal publication retrieval |successful |Bounded read-only research only; no deployed store/provider probes |
| git diff --check before/final report |0 |No whitespace errors; does not certify app/security |
| Report status/count/ID/path/cross-reference and secret-value/signature scan; original hash/Git preservation check |0 / PASS |13 sections;258 unique controls;25 findings;all IDs/TODOs/coverage consistent;no actual environment secret/private-key/DB-URL match;219 original source/config/docs paths byte-unchanged; report sole intended repository addition |

Selected production-mode HTTP observations (safe absent-DB/Auth configuration, https://store.example canonical build):

| GET route | Observed status | Relevant behavior |
|---|---|---|
| /en,/bn |500 |DB-dependent homepage cannot serve normal catalog; private/no-store response; outage result only |
| /en/shop |200 |Response produced despite unavailable catalog; HTML/status alone not a successful browsing workflow |
| /en/checkout |500 |Private no-store, noindex/nofollow, no-referrer retained; no checkout submission |
| /admin/login,/admin/recovery |200 |Unconfigured forms/pages available; private no-store/noindex/no-referrer; no auth submit |
| /admin/orders |307 to /admin/login |Unconfigured protected read redirects; not live member/AAL2 proof |
| /en/policies/privacy,/en/products/missing |500 |DB absence prevents policy/slug lookup; no claim missing product correctly404 with DB |
| /missing |404 |Custom unknown-route response observed |
| /robots.txt |200 |Public allow/private exclusions; sitemap https://store.example/sitemap.xml; proves HTTPS-only eligibility gap012 |
| /sitemap.xml |500 |No DB; generated catalog URLs not verified |
| /api/health |503 |No-store; only status/database unavailable JSON, no credential/PII |
| /icon.svg |200 |SVG app icon delivered |

HTTP elapsed observations5–298ms are local absent-DB/error timings, not representative storefront latency or Core Web Vitals. Browser crash root cause not conclusively diagnosed; no environment exception used to claim rendering passed. No genuine customer flow, order/payment/refund/email/remote migration/production mutation occurred.

Current dependency advisory reference: [GitHub reviewed GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Five package entries:braces,micromatch,fast-glob,@next/eslint-plugin-next,eslint-config-next. Suggested major downgrade is not an audit fix. Fresh interface review source: [Vercel Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). Automated scans/validators prove only their scope; no full accessibility or security certification.

## 13. Original screenshot coverage

Five screenshot images were not supplied. Their five named categories and every expanded textual recommendation are covered below and in section4. **Exact original-image wording, crops and additional unseen items remain UNVERIFIED.** This table maps supplied recommendations to stable deduplicated controls; it does not invent screenshot content. E-commerce B controls and additional H/I/J findings supplement screenshot themes.

| Source checklist | Supplied recommendations accounted for | Owning deduplicated control IDs |
|---|---|---|
| Screenshot1 — Security | Secrets/environment, committed/frontend/build/log credentials, configuration/rotation | A1-01, A1-02, A1-03, A1-04, A1-05, A1-06, A1-07, A1-08, A1-09, A1-10 |
| Screenshot1 — Security | Authentication/session/cookies/CSRF/expiry/recovery/enum/IDOR/roles/admin/MFA/RLS/least privilege | A2-01, A2-02, A2-03, A2-04, A2-05, A2-06, A2-07, A2-08, A2-09, A2-10, A2-11, A2-12, A2-13, A2-14, A2-15, A2-16, A2-18, A2-19, A4-07, A3-05, A3-06, A3-11, B4-02 |
| Screenshot1 — Security | API/input/SQL/XSS/URLs/assignment/body/rate/brute-force/errors/headers/CORS/permissions | A3-01, A3-02, A3-03, A3-04, A3-05, A3-06, A3-07, A3-08, A3-09, A3-10, A3-11, A3-12, A3-13, A3-14, A3-15, A3-16, A3-17, A3-18 |
| Screenshot1 — Security | Database transactions/constraints/migrations/backup/restore/ownership/RLS/uploads/type/size/content/path/visibility/deletion | A4-01, A4-03, A4-04, A4-05, A4-06, A4-07, A4-08, A4-09, A4-10, A4-11, A4-12, A4-13, A4-14, A4-15, A4-16, A4-17, A4-18, A4-19, A4-20, A4-21, A4-22, B2-07 |
| Screenshot1 — Security | Webhooks/signature/replay/idempotency/events/retries/timeouts/external auth/unauthorized state | A5-01, A5-02, A5-03, A5-04, A5-05, A5-06, A5-07, A5-08, A5-09, B3-05, B3-06, B3-08 |
| Screenshot1 — Security | Dependencies/lock/update/package/script/CI permissions/scanning/secrets | A6-01, A6-02, A6-03, A6-04, A6-05, A6-06, A6-07, A6-08, A6-09, J-13 |
| Screenshot2 — Engineering | All20 architecture areas, module boundaries/duplication/coupling/queries/cache/client-server/scalability/operations | C-01, C-02, C-03, C-04, C-05, C-06, C-07, C-08, C-11, C-16, C-19, C-22, C-23, J-09, J-13, I-08, H-05, I-12, E-11, I-10, I-09, J-18, A4-21 |
| Screenshot2 — Engineering | Analytics, event tracking, monitoring/error logging/PII/API/payment/DB/health/backup/deployment alerts and troubleshooting | H-01, H-02, H-03, H-04, H-05, H-06, H-07, H-08, H-09, H-10, H-11, H-12 |
| Screenshot2 — Engineering | CWV/LCP/INP/CLS/image/font/JS/SSR/cache/CDN/query/API/loading/resources/errors/timeouts/reliability/health/recovery | I-01, I-04, I-05, I-06, I-08, I-09, I-10, I-12, I-16, E-22, E-21, C-11, E-01, E-11, H-06, A4-21 |
| Screenshot2 — Engineering | Unit/API/DB/auth/authorization/checkout/payments/webhooks/E2E/accessibility/regression/build/types/lint/audits/CI/deployment/environment/rollback/restore/smoke/staging | J-01, J-02, J-03, J-04, J-05, J-07, J-09, J-10, J-12, J-13, J-15, J-18, F-19, A6-01, A6-02, C-08, A4-22, A4-21, B3-08 |
| Screenshot3 — SEO/AI | robots/sitemap/freshness/crawlers/canonicals/duplicates/noindex/indexing/redirects/staging/links/status | D1-01, D1-02, D1-03, D1-04, D1-05, D1-06, D1-07, D1-08, D1-09, D1-10, D1-11, D1-12 |
| Screenshot3 — SEO/AI | Titles/descriptions/headings/semantic/URLs/descriptions/category/breadcrumb/links/alt/SSR/crawlability/pagination/facets | D2-01, D2-02, D2-03, D2-06, D2-08, D2-10, F-05, F-04, F-03, D1-08 |
| Screenshot3 — SEO/AI | Organization/WebSite/Product/Offer/genuine ratings/reviews/Breadcrumb/returns/shipping/FAQ/rendered truth | D3-01, D3-02, D3-03, D3-04, D3-05, D3-06, D3-07 |
| Screenshot3 — SEO/AI | Product/customer answers/specs/categories/FAQs/original helpful content/claims/editorial dates/freshness/links/search and AI monitoring/no placement guarantees | D4-01, D4-02, D4-03, D4-06, D4-07, D4-08, G-09, G-10, G-01 |
| Screenshot4 — Completeness/UX | 404/empty/CTA/fold/responsive/five widths/sticky/nav/discovery/search/filter/sort/details/cart/checkout/loading/errors/forms/success/reference/payment/support/links/sharing/icon/visual/photos/CLS/pricing | E-01, E-02, E-03, E-04, E-05, E-06, E-07, E-08, E-10, E-11, E-12, E-13, E-14, E-18, E-19, E-20, E-21, E-22, E-23, E-25, B4-06, G-11, G-12, B1-06, D4-01 |
| Screenshot5 — Accessibility | WCAG2.2AA contrast/readability/alt/decorative/headings/semantic/names/labels/instructions/errors/announcements/keyboard/focus/dialog/Escape/SR/ARIA/touch/checkout/reduced motion/mobile/zoom | F-01, F-02, F-03, F-04, F-05, F-06, F-07, F-08, F-09, F-10, F-11, F-12, F-13, F-14, F-15, F-16, F-17, F-18, F-19, F-20 |
| Screenshot5 — Privacy/trust | Privacy/terms/returns/refund/cancel/shipping/cookies/consent/trackers/data minimization/forms/embeds/copyright/reviews/claims/contacts/support/Bangladesh commerce/data retention | G-01, G-02, G-03, G-04, G-05, G-06, G-07, G-08, G-09, G-10, G-11, G-12, G-13, G-14, G-15, A1-10 |
| Mandatory e-commerce supplement | Catalog/variants/categories/SKU/availability/prices/inventory/photos/search/page/visibility | B1-01, B1-02, B1-03, B1-04, B1-05, B1-06, B1-07, B1-08, B1-09, B1-10, B1-11 |
| Mandatory e-commerce supplement | Server totals/discount/shipping/coupon/stock/limits/oversell/tax/transaction/idempotency/retry/abandon/payment fail/states/reservations/races | B2-01, B2-02, B2-03, B2-04, B2-05, B2-06, B2-07, B2-08, B2-09, B2-10, B2-11, B2-12, B2-13, B2-14, B2-15, B2-16, B3-06, B4-03 |
| Mandatory e-commerce supplement | Real payment architecture/server verification/signatures/reconciliation/duplicate/refund/double charge/amount/currency/async/outage | B3-01, B3-02, B3-03, B3-04, B3-05, B3-06, B3-08, B3-09, A5-01, A5-02, A5-03, A5-04 |
| Mandatory e-commerce supplement | Customer order access/admin modification/refund/cancel/state audit/privacy/status | B4-02, B4-03, B4-04, B4-05, B4-06, B4-08, A2-14 |

Final trusted consistency check passed:13 sections,258 unique controls,25 findings with one TODO each, all matrix and screenshot references valid, no actual environment secret/private-key/DB-URL matches,219 pre-existing source/config/document paths byte-unchanged, git diff --check exit0.

Final consistency note: all finding IDs are unique; every actionable matrix row points to an existing finding; every finding has one master TODO, dependencies and verifiable acceptance criteria. Status/severity totals derive from inventory, not a readiness score. Current code/docs/Git baseline preserved, no secrets or customer data included. External access and unavailable rendered/DB checks remain open after this report; the audit deliverable is complete at that stated verification boundary.
