# Monechai storefront

**Pick up here:** [current task tracker](STATS.MD), [short current status](MIGRATION_STATUS.md), [Supabase setup and remaining steps](docs/SUPABASE_SETUP_HANDOFF.md), and [current readiness and next-session plan](docs/PROJECT_RECORD.md#current-readiness-and-next-session-plan). Owner login/MFA and the redesigned admin work locally; next is one real category/product/photo/publish journey under Goal06. The old separate goal/planning files were consolidated with full preservation and an exact archive; don't rebuild the project plan from scratch.

Next.js App Router + TypeScript storefront and admin, PostgreSQL/Drizzle catalog and inventory-safe COD checkout, Supabase Auth for explicit admin membership. This is an **owner-run store**, suitable as the foundation for selling products you source for resale. The owner confirmed only he sells; seller accounts, commissions and payouts are outside the project scope. The obsolete static storefront has been removed; its design reference remains in Git history. Migration is **not complete**: see [project audit](docs/PROJECT_RECORD.md#project-audit), [consolidated project record](docs/PROJECT_RECORD.md#plan-index), [live task tracker](STATS.MD) and [architecture](ARCHITECTURE.md). Do not take production orders until blocked goals and owner setup are resolved.

## Local start

Requires pinned Node22.23.3, npm and PostgreSQL. Copy `.env.example` to `.env.local` and configure a **local** `DATABASE_URL`; set `DATABASE_SSL=disable` only on local DB. `.env.local` is ignored by git. Do not use a production database for local testing.

For this already-configured checkout, resume using the existing preview/start instructions in STATS.MD. The commands below describe a new disposable development setup; do not migrate or seed the hosted store merely to restart the preview.

```sh
npm ci
# Export DATABASE_URL/DATABASE_SSL in your shell (Drizzle CLI reads process env)
npm run db:migrate
# Optional demo drafts for a disposable development DB only (never production)
npm run db:seed
npm run dev
```

Open http://localhost:3000; `/api/health` is 200 only when PostgreSQL connects and 503 otherwise. Demo products are deliberately unpublished and their external placeholder images cannot be published. On the current backend, [owner setup](docs/admin-bootstrap.md) is already applied and actual login/MFA dashboard access was verified. Use `/admin` to create a category/product draft, then follow [image acceptance](docs/product-images.md). Real Storage/photo/publication and remaining session/recovery acceptance are still required. Shipping fees and all four approved policies must be configured before checkout. No card/mobile-money integration exists: checkout is COD only.

`npm run build` also prepares the standalone public assets; `npm start` then serves the production app with its CSS, JavaScript and logos. Demo seed data lives in `fixtures/demo-catalog.json`, independent of the removed prototype.

Release gates: `npm run lint`, `npx next typegen`, `npm run typecheck`, `npm run test:ci`, `npm run build`, then `E2E_PRODUCTION=1 npm run test:e2e`. See [testing](docs/testing.md) for isolated DB/browser setup and skip behavior; don't interpret skipped DB tests as passed integration coverage. `npm run db:generate` is for reviewed schema changes; `npm run db:migrate` applies checked-in migrations. `npm run shipping:configure` dry-runs when `SHIPPING_INSIDE_DHAKA_MINOR` and `SHIPPING_OUTSIDE_DHAKA_MINOR` are set to approved integer poisha amounts (optional `SHIPPING_FREE_ABOVE_MINOR`); `npm run shipping:configure -- --apply` writes both zones. Inspect values before applying.

## Deployment and operations

Owner confirms the domain is already purchased and the target is full production readiness at the lowest viable recurring cost. See [production tools/services and hosting comparison](docs/PROJECT_RECORD.md#production-services) for dated free-plan research, VPS/managed/self-hosted options, credentials and launch acceptance gates. That comparison records research from 2026-10-11. A separate live Supabase baseline was provisioned that day; [the handoff](docs/SUPABASE_SETUP_HANDOFF.md) records its exact state. Hosting/domain/mail/off-site recovery and owner acceptance remain pending.

Read [VPS/Docker/Cloudflare runbook](docs/deployment.md), [backup and recovery](docs/backup-recovery.md), [admin setup](docs/admin-bootstrap.md), [current acceptance/input checklist](docs/PROJECT_RECORD.md#current-readiness-and-next-session-plan) and [architecture/invariants](ARCHITECTURE.md). Docker builds a standalone Node image and uses managed DB; sample Nginx TLS proxy is at [`ops/nginx-monechai.conf`](ops/nginx-monechai.conf). Actual owner access and restricted connections exist; real images/contact/policies/rates, recovery/session/provider and production operations acceptance remain. No production deployment or full provider restore has been verified.

## Local implementation and external acceptance

Guest buyers need no store account. Owner admin operations and direct product-Storage writes require membership plus authenticator AAL2; recovery uses email codes and existing TOTP. Public storefront routes are `/en` and `/bn`, including shop/products/checkout/policies; old unprefixed routes redirect to browser preference. Versioned owner policies and explicit consent are required for new orders. Owner alerts queue transactionally and use a configured, protected SMTP worker; no real mail has been sent. Existing products stay.

Read [store/account/product/privacy/payment plan](docs/PROJECT_RECORD.md#store-operating-plan), [one owner setup checklist](docs/PROJECT_RECORD.md#owner-setup-checklist), [executable operations checks](docs/OPERATIONS_CHECKS.md), [current audit](docs/PROJECT_RECORD.md#project-audit) and [consolidated project record](docs/PROJECT_RECORD.md#plan-index). Online gateway work is provider-gated goal11; COD remains the real implemented payment.

Node22.23.3 is pinned. Strict DB tests, production browser/WCAG checks and encrypted app-DB/photo restore tooling exist; actual Supabase/host/mail/DNS/off-site/full-backend acceptance is outstanding. Latest local strict127/E2E37 pass; the transferred checkout lacks the historically recorded quality workflow. Last recorded production dependency audit was0; full development audit had5high braces-chain entries despite a reviewed mitigation. Recheck compatible upstream fixes before release; do not force downgrade Next/Drizzle or disable checks to hide findings.

Public indexing requires owner approval through server-only `SITE_INDEXING_APPROVED_ORIGIN`; HTTPS configuration alone stays non-indexable. Leave approval unset for every staging/preview/test environment. Follow [search indexing approval](docs/deployment.md#search-indexing-approval) and verify the actual production origin after separately authorized deployment. Current local findings and executed check counts live in [STATS.MD](STATS.MD); earlier audit/test records remain dated evidence.
