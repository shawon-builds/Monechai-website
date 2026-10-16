# This PC: configuration and key inventory — 2026-10-16

**New-session authority:** Follow the first [STATS.MD continuation section](../STATS.MD#continue-with-one-message) and [current readiness/remaining-work map](PROJECT_RECORD.md#current-readiness-and-next-session-plan). Next is Goal06 actual category/product/photo publication acceptance. Existing owner login/MFA, backend and connections are already verified; do not repeat bootstrap/migrations or treat the historical blank-page pause as current. Built-in browser is unavailable after the API switch; owner uses the normal browser for personal actions. SMTP recovery/session/revocation, real photo/order/business and operations acceptance remain pending. No new credential/setup request is needed merely to restart the existing loopback preview.

**Admin UI handoff:** Dedicated workspace, inline product-flow category creation, prominent photo preview/upload and existing media controls, inventory view and actual order/COD analytics now pass local validation (strict127/E2E37; lint/types/build). Actual owner-session overview/New product screens were inspected before the API switch. Built-in browser is now unavailable per owner; use the owner's normal browser for personal sign-in/MFA and real product/photo acceptance. Loopback3100 preview restarted with a90minute bound; health200/databaseok. No schema/provider/bootstrap/business-record changes were made for this UI task. Earlier setup-pending/old test-count descriptions remain history.

**Latest owner acceptance:** Owner privately completed authenticator verification; existing built-in tab now renders `/admin` with the actual dashboard and management links. Its server guard requires provider-verified identity, current admin membership and AAL2, so current-session access is verified. Prior setup-pending observations below are superseded; no historical blank-page root-cause claim. No credentials captured, agent enrollment, business mutation or new application test. SMTP recovery, logout/expiry/revocation and real photo/product/order acceptance remain pending.

Latest built-in browser check: signed-in owner reaches the normally rendered `/admin/security` page, which requires verified Auth identity and admin membership. Authenticator setup is pending; no available factor shown and verification disabled. Earlier blank page is not the current observed state; its root cause remains unknown. Owner privately completes setup/code; AAL2 dashboard and remaining provider acceptance are still unverified. Inspection only, no enrollment or credential action.

Owner resumed local setup/read-only discovery. Existing project [Monechai](https://supabase.com/dashboard/project/srlwuwytnktgynsffepu) / Shawon-DEV Free is accessible and Healthy in the built-in browser. Do not repeat bootstrap or migrations. Old machine private files did not transfer. Build/lint/typecheck pass; local app runs at http://127.0.0.1:3100/admin/login. Connected storefront now verified:health200/databaseok,EN/BN/shop/login200,anonymous admin307→login,browser shows normal empty catalog. Owner has now saved the main DB password privately. Read-only CA+hostname-verified operator connection PASS:17tables/17RLS/14migrations/1admin membership. Owner explicitly authorized resetting the lost restricted runtime password. New credential privately saved;actual monechai_runtime login with CA+hostname verification PASS and Auth/Storage/drizzle reads denied42501. Restricted app DATABASE_URL configured. Main/operator password and all role grants/flags/schema/business records unchanged. Old-PC runtime configuration now requires the new password.

| Variable/input | Purpose and where to get it | Current state/visibility |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Auth/Storage origin;Dashboard→Connect | Recovered/configured: https://srlwuwytnktgynsffepu.supabase.co;PUBLIC |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Browser Auth key;Dashboard→Connect/Project API keys | Recovered/configured;PUBLIC |
| NEXT_PUBLIC_SITE_URL | Local canonical origin | Configured http://127.0.0.1:3100;PUBLIC |
| DATABASE_URL | Restricted Node runtime PostgreSQL connection | Configured and verified using monechai_runtime. Password SECRET;owner/operator login excluded from app |
| DATABASE_SSL | Require encrypted remote connection | require;nonsecret |
| DATABASE_SSL_CA | Verify database certificate/hostname | Official dashboard-linked Root2021CA downloaded/validated and configured;nonsecret |
| SUPABASE_DB_PASSWORD | Existing main database password;original private setup file/password manager | Privately saved and connection verified in .env.supabase.setup. SECRET;not viewable in dashboard |
| SUPABASE_RUNTIME_PASSWORD | Existing monechai_runtime password;old private setup file | Reset with explicit owner approval;privately saved and actual login verified. Old PC needs updating. SECRET |
| DIRECT_URL | Separate operator connection for migrations/history/bootstrap | Privately derived/saved and read-only verified;SECRET;excluded from app/build |
| Owner password/TOTP | Actual admin sign-in/authenticator verification | Owner enters personally in local app;never send password/QR/seed/codes in chat |

Verified free session pooler: aws-0-ap-south-1.pooler.supabase.com:5432, database postgres, operator user postgres.srlwuwytnktgynsffepu;runtime user monechai_runtime.srlwuwytnktgynsffepu. Percent-encode passwords when constructing URLs. No Supabase service-role key or account access token is required by the current app.

For later mail/recovery acceptance:SMTP_HOST,SMTP_PORT(465/587),SMTP_USER,SMTP_PASSWORD,EMAIL_FROM,ORDER_ALERT_EMAIL,OPS_ALERT_EMAIL and a generated ORDER_WORKER_SECRET(32+characters). Obtain SMTP values from the selected mail provider;SMTP_PASSWORD/worker secret are SECRET,addresses/host are configuration. Supabase Auth needs separate dashboard SMTP configuration and its reset template containing {{ .Token }}. No provider credentials exist in this transferred checkout.

For later deployment/operations:approved HTTPS NEXT_PUBLIC_SITE_URL,host access and registrar/DNS access;CHECKOUT_TRUST_PROXY_IP_HEADER only after ingress verification;SITE_INDEXING_APPROVED_ORIGIN only after launch approval. Backup operator settings:BACKUP_DATABASE_URL,BACKUP_SUPABASE_URL,BACKUP_OUTPUT_DIR,BACKUP_ENCRYPTION_PASSWORD and optional BACKUP_PG_IMAGE;monitoring HEALTHCHECK_URL plus the SMTP alert settings above. Database/host/DNS credentials and encryption password are SECRET and must stay in separate private operator configuration. App backup tooling follows docs/backup-recovery.md and needs an approved independent destination. No hosting/DNS/payment keys are needed just to build locally. Online-payment credentials depend on a future selected merchant provider;COD needs none.

Local startup on this PC with the cached pinned runtime: `HOSTNAME=127.0.0.1 PORT=3100 npm exec --offline --yes --package=node@22.23.3 -- node --env-file=.env.local .next/standalone/server.js`. Standalone output does not copy the root env files;this explicitly loads only runtime config. Rebuild first after changes to public variables. Existing listener must be stopped before starting another on3100. Current build/server smoke does not establish real Auth/MFA,mail,Storage or checkout acceptance. Latest tests/audit/next actions are in [STATS.MD](../STATS.MD).

Historical handoff follows;its old PC credential-presence/running-preview statements do not describe this machine.

# Current destination update — 2026-10-15

**PAUSED at owner request — 2026-10-15: blank page after attempted owner sign-in.** Owner reports entering the selected email/password at http://127.0.0.1:3104/admin/login and receiving a completely blank page. Agent viewed the supplied screenshot; it shows a white viewport with no visible error or dashboard. Screenshot: `/home/sami/Pictures/Screenshots/Screenshot_২০২৬১০১৫_০১১১২৬.png`. Root cause and password-authentication outcome are unverified. Prior health200/anonymous307 checks do not establish successful sign-in. Last read-only MFA check remains0verified TOTP factors/0AAL2 session rows;no new provider check performed at this pause. Owner identity and one admin membership were already verified;do not recreate user/membership or reset credentials blindly.

**Resume next session:** Say “Continue Monechai from STATS.MD — diagnose blank admin login.” First check/restart the bounded private local preview if expired,using the new target `srlwuwytnktgynsffepu` and restricted runtime configuration;operator credentials stay separate. Diagnose the actual blank-page response/navigation and redacted browser/server errors before asking owner to retry sign-in. Never capture passwords,QR codes,TOTP seeds/codes or session tokens. Then owner privately completes login/TOTP,and agent verifies protected admin access plus provider assurance metadata. Keep existing17RLS tables/14migrations/Storage/Auth setup and old projects intact. SMTP/recovery,real photo acceptance,hosting and other recorded external gates remain pending. No live actions,code fixes or new application tests in this pause task;previous125strict/37E2E fixture results remain historical and do not certify this real owner journey. Preview was last confirmed running on loopback only with a90minute lifetime;availability next session is not guaranteed. No paid action,push,deployment or DNS change. Pause takes precedence over older “next”/running-preview instructions below.

**Current MFA handoff:** Exact owner now whitelisted and actual application membership verified. Runtime-only private local preview http://127.0.0.1:3104/admin/login running (bounded90min container);health200/anonymous307 verified. Last metadata check0verified TOTP/0AAL2 sessions;owner must complete Monechai app sign-in/enrollment,not only Supabase dashboard. Keep QR/seeds/codes private. Prior disposable fixture cleanup remains complete;this separate onboarding preview is intentionally live.

**Latest owner bootstrap:** Owner personally created selected Auth user/password. Exact active dashboard-confirmed identity whitelisted idempotently;one matching admin row and actual application owner/nonmember checks verified. No password/MFA/provider mail or business changes by agent. Selected email/UUID private. Next local owner login/TOTP and real session/Storage/recovery acceptance. Actual getDb/read-only operator preflight plus complete17policies/136privileges/14hashes/9Storage policies confirmed;no duplicate migration/role provisioning.

Owner explicitly chose and created **Monechai `srlwuwytnktgynsffepu`** in **Shawon-DEV `twpdzmeeerdtlfypawsw` (Free)** and resumed free-only setup. This section supersedes the former target/pause below; historical setup is preserved. Verified new destination empty:0public tables/0Auth users/0Storage buckets, PostgreSQL17.11, ensure_rls enabled. Applied reviewed exact migrations0000–0013 with Drizzle-compatible hashes/timestamps after separate fresh isolated PostgreSQL17.10 validation. Live result **17 public tables,17 RLS tables,14 migrations**. Metadata history also has RLS/revokes; postgres automatic public API grants tightened. Current destination now has verified products bucket (public,5,242,880bytes,image/webp),9reviewed Storage policies,0direct public API table grants,0postgres future-table API grants,9audit triggers and0migration hash/timestamp mismatches. Runtime LOGIN is now enabled with a privately generated separate credential, no elevated role flags. Actual operator/runtime certificate+hostname verified connections to free session pooler pass; actual runtime Auth/Storage/drizzle reads deny42501, membership/audit writes ungranted. Scoped new `.env.local` and separate operator `.env.supabase.setup` include official CA; old private files preserved in dated ignored backups. Public signup/manual linking/anonymous signin disabled, email confirmation/secure changes enabled,minimum12character password,6digit/600second OTP and TOTP support verified. No real owner identity/MFA/SMTP acceptance yet. No customer/product/photo/Auth import, publication or old-backend deletion. Old target/Lead remain untouched. No trial/upgrade/purchase. Detailed current evidence: [external inventory](audits/2026-10-14-monechai-external-access-inventory.md).

**Old-source verification,2026-10-15:** Preserved old Monechai operator credentials allowed a certificate-verified read-only check.0catalog/order/member/Auth/photo/policy/shipping/history/notification/request-limit records;one settings row matches new target excluding timestamps,and old empty bucket matches public/5MiB/WebP. No records/files needed transfer. Old backend and credentials unchanged;Lead not queried.

**Acceptance boundary,2026-10-15:** Actual anonymous products/orders/admin_members/site_settings API reads with limit0 return401/42501. No real owner Auth user/member,personal MFA,SMTP recovery or photo upload/publish accepted. Free dashboard confirms no project backups;off-site/full backend recovery remains unconfigured. Current local code verifiedstrict125/125/E2E37/37 against isolated fixtures,not a deployed/live-owner journey. Before deployment,rebuild approved new public values with operator secrets excluded;do not serve stale primary-checkout artifacts.

---

# Supabase setup handoff — Monechai

Last updated: 2026-10-11. **Live work is paused at the user's request.** Continue after the user signs into the friend's intended Supabase account and asks to resume. The owner/admin email is not known yet and will be added later. Do not invent an email, create a guessed owner identity, or ask for account passwords or authenticator secrets.

## Which backend we are using

| Item | Current value / state |
|---|---|
| Organization | [Sami's org](https://supabase.com/dashboard/org/lpbdravwzduphzmfnlsj), ID `lpbdravwzduphzmfnlsj` |
| Store project | [Monechai dashboard](https://supabase.com/dashboard/project/lmrdvenrchsnueztzcdi), ID `lmrdvenrchsnueztzcdi` |
| Public API origin | `https://lmrdvenrchsnueztzcdi.supabase.co` |
| Plan / compute | FREE / NANO; no paid upgrade selected |
| Region | Singapore, `ap-southeast-1` |
| Database version observed | PostgreSQL 17.11 |
| Dashboard status observed | Healthy |
| Separate existing project | `syzifxmdbfsfistwapkq` contains the needed Lead app. Preserve it. No SQL, settings, policies, or credentials were changed/copied there. |

The new project was created in the organization the user selected. Signing into a different Gmail does not itself move this project or give that account access. After switching accounts, first check that the friend's Supabase account can see **this exact organization and project**. If it cannot, the current organization owner must grant the appropriate membership, or the user must explicitly choose another project/transfer route. Do not silently create another backend or rerun the setup elsewhere.

## Completed live setup

- [x] Created a separate Monechai project in the selected organization.
- [x] Inspected before migration: no public application tables, zero Auth users, and zero Storage buckets.
- [x] Kept the Data API enabled, disabled automatic exposure/grants for newly created tables, and enabled automatic RLS.
- [x] Applied the reviewed repository migrations `0000` through `0012` using Drizzle and the SSL session-pooler connection displayed in the dashboard. Live migration history has **13 entries**.
- [x] Verified **all 16 application tables have RLS enabled**.
- [x] Verified `anon`, `authenticated`, and `service_role` have no direct SELECT/INSERT/UPDATE/DELETE grants on these application tables. The Node application serves store data through its own checked server boundary.
- [x] Created the scoped `monechai_runtime` database login and applied [runtime permissions](../ops/supabase-runtime.sql). It has no superuser, database creation, role creation, inheritance, or RLS bypass privileges.
- [x] Verified an actual connection as `monechai_runtime` succeeds. It can read store tables and membership, but cannot write `admin_members`, read `auth.users`, write `storage.objects`, or access the migration schema.
- [x] Applied [reviewed Storage policies](../ops/supabase-storage.sql): public product-photo reads, approved owner plus AAL2/MFA for uploads/deletion, immutable random file keys, and restrictive guards against broad write policies.
- [x] Created the `products` Storage bucket. Verified `public=true`, **5 MiB / 5,242,880 bytes** maximum, and allowed MIME **`image/webp`**.
- [x] Disabled public signup, anonymous sign-ins, and manual account linking; retained email confirmation and email login.
- [x] Configured the email provider with a **12-character minimum password**, secure password change, **six-digit email OTP**, and **600-second expiry**, matching the application's recovery flow. Secure email change remains enabled. Requiring the current password for recovery was not enabled.
- [x] Verified TOTP/app authenticator support is enabled; SMS MFA is disabled.
- [x] Saved real project URL/public key and scoped runtime connection privately in ignored `.env.local`, mode `600`. Owner/migration credentials are separate in ignored `.env.supabase.setup`, mode `600`. No service-role or Supabase account access token was needed.
- [x] Production build and standalone asset preparation passed with the new local environment on Node 22.23.3. This is a build check, not an actual authenticated customer/admin acceptance test.

## Tables and what they contain

The fields, constraints, indexes, and triggers are already in the applied migrations. Product entry uses the app's admin forms rather than editing source code or manually creating tables.

| Table | Purpose / main fields |
|---|---|
| `categories` | Slug, English/Bangla name, display order |
| `products` | Slug, SKU, category, English/Bangla name/description, integer prices in paisa, comparison price, draft/publish/featured/demo flags |
| `product_variants` | Product, SKU, English/Bangla option label, attributes, optional price override, inventory tracking, quantity, active flag |
| `product_images` | Product, Storage key, translated alt text, order, primary photo, verification time and content hash |
| `admin_members` | Whitelisted owner Auth user IDs; membership is granted with the owner/migration connection after confirming the real Auth identity |
| `shipping_zones` | Zone, actual delivery fee and optional free-shipping threshold |
| `delivery_areas` | Actual area/district, translated name, zone mapping, availability |
| `site_settings` | Store name, support/WhatsApp/hotline/address, COD switch; singleton row created by migration |
| `store_policies` | Retained English/Bangla shipping, returns, privacy and terms revisions; one active revision |
| `orders` | Private customer contact/address, delivery details, authoritative totals, idempotency, limited public receipt token, COD/payment/order status, policy consent, courier/tracking |
| `order_items` | Immutable purchased name/SKU/options/prices/quantity snapshots and inventory reservation |
| `order_status_history` | Status transition, actor and time |
| `order_payment_history` | Audited COD payment-status transitions, actor and time |
| `order_inventory_history` | Inventory releases for cancellation/return, quantity and actor |
| `order_notifications` | Transactional owner-alert queue, attempts, retry/lease state, redacted error |
| `request_limits` | Server-side abuse/login/recovery attempt budgets and expiry |

No live product seed, placeholder-photo import, new customer order, or owner Auth user was created. The existing 24-product/nine-category reference catalog remains preserved locally in `fixtures/demo-catalog.json`; it is not silently published as real live stock. The local demo seed deliberately rejects remote databases.

## What still needs to be done

### 1. Friend's account access and the real owner login

- [ ] User signs into the intended friend's account and then Supabase. Gmail sign-in alone is not Supabase authorization.
- [ ] Confirm the exact project above is visible and the account has the necessary organization/project permissions.
- [ ] Provide the **designated store-admin email**. User says it is unknown and must be added later; do not assume the browser account's email is the store-admin identity.
- [ ] Owner personally creates/sets the real Auth user's password through the appropriate dashboard/account flow. No guessed passwords or email invitations are sent automatically.
- [ ] Confirm the user in `auth.users`, then bootstrap that exact ID into `admin_members` using [admin bootstrap instructions](admin-bootstrap.md).
- [ ] Owner signs into `/admin/login` and personally enrolls/verifies their authenticator in `/admin/security`. Keep passwords, QR codes, MFA seeds and codes out of chat and logs.
- [ ] Verify login, logout, nonmember denial, AAL1 denial of admin operations, AAL2 access, membership revocation, recovery and session revocation on the real provider.

### 2. SMTP and recovery template — actual external blocker

The dashboard explicitly says **custom SMTP is required to edit email subject/body**. Its default reset template has not been replaced. Six-digit OTP settings alone do not finish the app's email-code recovery flow.

- [ ] Choose/configure a mail provider and verified sender. Supply SMTP host, port, username and secret password privately in **Supabase Authentication → Emails → SMTP settings**.
- [ ] Set the Reset password template to display `{{ .Token }}` for the six-digit code used by `/admin/recovery`; template instructions are in [admin-bootstrap.md](admin-bootstrap.md).
- [ ] Set/test the real recipient mailbox and recovery delivery after authorization. No actual email has been sent in this setup.
- [ ] If enabling app order/operator alerts, also configure server `SMTP_HOST`, `SMTP_PORT` (465/587), `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`, `ORDER_ALERT_EMAIL`, `OPS_ALERT_EMAIL`, and a random `ORDER_WORKER_SECRET` of at least 32 characters. Supabase SMTP settings do not automatically configure the app worker.

### 3. Domain and app URL

- [ ] Provide the exact purchased Spaceship hostname and hosting choice/access.
- [ ] Configure `NEXT_PUBLIC_SITE_URL` to the real canonical HTTPS origin and rebuild/deploy under the later authorized deployment step. Current local value is `http://localhost:3000` only.
- [ ] Review Supabase Auth Site URL and allowed redirect URLs for the actual host and supported auth flows. Production URL configuration has not been completed; no guessed domain or broad wildcard was added.
- [ ] Verify HTTPS, cookie/session behavior, callback/recovery behavior and admin routing on that host.

### 4. Store data, products and real photos

- [ ] Owner supplies actual public contact details, delivery areas/fees/times and approved shipping/returns/privacy/terms. Do not invent fees or business promises.
- [ ] Publish the four required policies in admin and configure delivery settings before accepting new orders.
- [ ] Add real product/category/variant/SKU/price/stock data through admin. Existing local placeholders stay preserved for reference.
- [ ] Upload real photos through admin. App accepts JPEG/PNG/WebP up to 5 MiB, validates/normalizes them to WebP and stores verified metadata.
- [ ] Test draft → photo upload → primary/order → publish → real storefront; test missing/tampered photo rejection and primary-photo deletion/unpublish.
- [ ] Verify public photo reads, anonymous/nonmember/AAL1 upload/delete denials, AAL2 owner upload/delete, overwrite denial and immediate membership revocation on actual Storage.

### 5. Real customer/order and operations acceptance

- [ ] Run the local application against this backend and verify health/storefront/auth routes. No running-app HTTP smoke was completed after the new environment build.
- [ ] Verify guest COD checkout with approved rates/policies/real stock, authoritative totals, duplicate-submission protection, inventory changes and limited receipt privacy, then owner order/status/payment operations.
- [ ] Verify alert queue delivery, retries/dead-letter and operator failure alerts once real mail/scheduling is configured.
- [ ] Configure independent encrypted backup destination, retention, recovery material and monitoring. Test live DB/photos and full Supabase Auth/Storage/roles recovery scope; the previous local restore drill does not prove live recovery.
- [ ] Select COD-only launch or a real online gateway. Online merchant integration remains goal 11, blocked on provider/merchant choice; no fake wallet/card payments are active.
- [ ] Complete host/DNS/CI/deployment acceptance and the separately documented upstream tooling issues before claiming production readiness.

## Credentials already available versus still needed

| Name / input | Status | Visibility |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Configured in local app and private setup env | PUBLIC |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Configured; its value need not be recopied into this document | PUBLIC |
| `DATABASE_URL`, `DATABASE_SSL` | Configured with scoped runtime role and SSL | Connection password SECRET |
| `DIRECT_URL` | Configured in separate setup env for reviewed migrations/bootstrap | SECRET, privileged; not an app-runtime credential |
| `SUPABASE_DB_PASSWORD`, `SUPABASE_RUNTIME_PASSWORD` | Newly generated and privately saved in setup env | SECRET; no values in Markdown/chat |
| Confirmed store-admin email/user | **PENDING — add later after friend's login** | Identity/configuration; owner chooses |
| Owner password / MFA | Owner sets/enrolls personally; no agent capture | SECRET; never request in chat |
| Supabase SMTP / app SMTP / sender and recipients | PENDING | SMTP password and worker secret SECRET |
| Actual HTTPS site origin / host / domain | PENDING | Origin PUBLIC; host credentials SECRET |
| Actual fees, policies, contacts, products/photos | PENDING | Approved business data |
| Off-site backups/monitoring and optional merchant access | PENDING | Scope-specific credentials, privately configured |

The local credential files are not committed and need an owner-approved private deployment/backup arrangement later. Never paste them into a repository, chat, screenshot, or browser console.

## Resume procedure

Send **“Continue Monechai from STATS.MD”** when ready. [STATS.MD's resume section](../STATS.MD#continue-with-one-message) names goal05 as next and provides the ordered actions; use this file for detailed setup facts. That message resumes the pause without requiring the user to repeat the project context.

1. Read `AGENTS.md`, `STATS.MD`, `MIGRATION_STATUS.md`, this file, then [the current index](PROJECT_RECORD.md#plan-index) and [goal 05](PROJECT_RECORD.md#goal-05) in the consolidated project record. The old separate goal files were merged with full preservation; do not recreate them.
2. User signs into the friend's intended account and explicitly resumes work. Re-select the correct browser tab/session and verify project ID `lmrdvenrchsnueztzcdi` before actions.
3. Check current provider state against this handoff. Migrations, role and bucket are **already applied**; do not duplicate the project or reset/drop tables. Preserve the separate Lead project.
4. Complete real owner identity/bootstrap/MFA and SMTP recovery dependencies, then perform the actual Auth/Storage/customer/admin acceptance checks.
5. Update the tracker after each completed task. Move to the later hosting/domain/operations/payment milestones only when their inputs are available.

No further live action is authorized during this pause. Browser group **Monechai setup** stays open until the user asks to close it. The website is not deployed and the migration is not complete.
