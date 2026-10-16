<a id="current-readiness-and-next-session-plan"></a>
# Current readiness and next-session plan — 2026-10-16

This is the current interpretation of the audit and project milestones. The original October14 production-readiness audit and the archived source documents are immutable historical evidence. Their original checkboxes/counts are not a current defect count. Later findings below marked FIXED_LOCAL are repaired and regression-tested within the stated local scope; they do not certify every live service. Older pauses, unknown owner-email statements, old projects, browser sessions and test counts below are superseded by this section and the first section of STATS.MD.

## Verified state and limits

- Backend: `srlwuwytnktgynsffepu` in `twpdzmeeerdtlfypawsw`;17RLS application tables/14applied migrations, restricted product Storage, owner Auth/whitelist and separate restricted runtime/operator connections recorded as verified. Old Monechai/Lead stay untouched. No bootstrap or migration replay is needed to resume.
- Actual owner login and AAL2 dashboard access worked on October16. Recovery email, logout/expiry/global invalidation/member revocation and actual owner photo/Storage execution remain separate acceptance checks. The historical blank-page root cause is unknown, but it is not the default current blocker.
- Admin code now exposes Overview, Products, Categories, Inventory, Orders, Analytics and Store settings. Category creation is available while adding a product. Product photo selection/preview/upload, cover/order/remove, variants/stock and publishing gates exist. Settings cover contact details, delivery rates/areas, COD and versioned policies. Orders retain guarded status/payment/cancel/return/courier controls.
- Local analytics reports7/30/90-day orders, status/product quantities and actual recorded COD collection/refund events using Bangladesh dates. It is not visitor tracking, conversion measurement, profit accounting or an accounting ledger. The owner's broader “everything in admin” request is preserved: review concrete additional needs after the first real product/order journey; do not silently promise or add arbitrary platform features.
- Latest completed checks: pinnedNode22.23.3;127strict tests/0skip;37production browser tests; lint/typecheck; fixture and actual-config build/postbuild. Eight admin screens passed320/768/1440px Axe/overflow checks, with existing five-width inventory/keyboard/reflow/stock/authorization and public commerce regressions retained. These results precede the API transport switch; post-switch lint/types/docs and HTTP health/anonymous redirects also passed. Real photo/product/order/provider and manual screen-reader/native-zoom/performance acceptance is not established by fixture tests.
- Owner says built-in-browser access is unavailable after the API switch. Use available terminal/local automated tests and the owner's normal browser. Personal login/MFA stays with the owner. No Kimi workflow is authorized by default. Loopback3100 preview is bounded90minutes and may need restart; never assume an old process, tool session or screenshot is current.
- Local `main` is based on transferred checkpoint `b0e2172`; the admin/report/test/docs changes include uncommitted and untracked files. Preserve all of them. The historical October15 GitHub private-visibility/CI/push records do not prove this checkout is remotely published. `.github/workflows/quality.yml` is absent here. Dependabot update PR automation was removed at owner request; do not restore it silently.
- Public commerce launch remains on hold. No paid features/trials/purchases, push, deployment or DNS changes are authorized by this handoff. A roadmap entry is not permission to activate an external service, send mail, alter DNS or deploy.

## Current audit disposition

Statuses derive from later recorded work, not a new full security audit or fresh provider/registry inspection. The last recorded full dependency audit had5high entries in the development-tool braces chain, with production audit0; rerun the registry checks before deciding its next remediation. Do not describe those five entries as five independently demonstrated application exploits.

| Finding | Current disposition | Remaining acceptance or next action |
|---|---|---|
| MON-001 stock overwritten by stale forms | FIXED_LOCAL | Metadata/stock separation, locked expected-quantity adjustments and rendered fixture regressions pass. Confirm actual owner stock-edit/reload behavior with the acceptance product. |
| MON-002 preflight/runtime permission conflict | FIXED_LOCAL | Runtime/operator checks separated; actual scoped connections are verified. Final release preflight must use the intended artifact/host and separate operator environment. |
| MON-003 resettable quota/COD stock holds | PARTIAL | Trusted-IP handling/counters pass locally. Chosen ingress/private origin/spoof resistance and owner-approved pending-COD review/release rules remain. |
| MON-004 real Auth/MFA/RLS/Storage | PARTIAL | Owner identity/member/AAL2 dashboard and backend configuration verified. Real photo JWT operations, nonmember/AAL1/revocation/session/recovery acceptance remain. |
| MON-005 real catalog/business/fulfillment | OPEN_EXTERNAL | Approve products/photos/stock/contact, delivery rates/areas/ETA, four policies, courier/customer contact and COD collection/refund procedures; exercise them. |
| MON-006 backups/full recovery | OPEN_EXTERNAL | Choose independent encrypted backup destination/key custody/retention. Verify transfers, alerts and full Auth/roles/bucket/DB/photo restore, approved RPO/RTO and newer-order reconciliation. Local app restore tooling is not full provider recovery. |
| MON-007 hosting/release/CI | OPEN_EXTERNAL | Select host, reconcile transferred checkout/workflow with historical remote, review exact release, get required CI/security checks, then separately authorized HTTPS/DNS/private-cache/rollback/live smoke acceptance. |
| MON-008 tooling advisory | BLOCKED_UPSTREAM, last recorded | Recheck compatible upstream fix and full audit. Keep the gate visible; no forced downgrade, silent suppression or unapproved risk exception. |
| MON-009 privacy/retention/legal applicability | OPEN_EXTERNAL | Owner approves data purposes, retention/deletion/request verification, backups/logs/history, breach/rotation and applicable business/legal obligations with qualified advice where needed. Do not invent legal periods. |
| MON-010 SMTP/recovery/alerts | OPEN_EXTERNAL | Choose sender/provider/support and owner inbox; configure approved free scope/template and verify actual recovery/owner/operator mail, retry/failure/inbox and schedules. DNS/sending/schedule actions require their own authorization. |
| MON-011 receipt payment state | FIXED_LOCAL | Actual COD payment status rendered separately from fulfillment in EN/BN; preserve receipt privacy in final owner/order acceptance. |
| MON-012 explicit indexing approval | FIXED_LOCAL | Default-deny/approved-origin tests pass. Verify actual launch/staging origins, robots and sitemap after an authorized deployment. |
| MON-013 pagination/facet canonicals | FIXED_LOCAL | Rendered canonical/hreflang/normalized facet tests pass. Final real catalog/production-origin checks remain. |
| MON-014 entity/merchant/share metadata | PARTIAL | Entity/breadcrumb/localized sharing/logo checks pass. Approved shipping/return/business facts and actual merchant/share/search acceptance remain. |
| MON-015 image sizes | FIXED_LOCAL | Correct detail/card/thumb sizes pass width/DPR tests. Inspect actual owner photos and representative loading/CLS. |
| MON-016 English fallback language | FIXED_LOCAL | Semantic fallback language and rendered/Axe checks pass. Owner translation and manual screen-reader voice/language acceptance remain. |
| MON-017 cart preview deadlines | FIXED_LOCAL | Timeout/cancellation/stale-response/retry browser regressions pass. Retain in final checkout acceptance. |
| MON-018 material admin history | FIXED_LOCAL | Durable actor/change history and real applied0013 baseline verified. Approve access/retention/backup handling; do not claim a tamper-proof ledger or a new history-viewer feature. |
| MON-019 monitoring/performance | OPEN_EXTERNAL | Configure independent uptime/error/backup/mail alerts and test receipt of an incident. Measure representative product/checkout/query/CWV behavior on the selected host with real images. |
| MON-020 release/provider/manual tests | PARTIAL | Latest strict127/E2E37 and admin accessibility/responsive evidence pass. Real provider/customer/owner/photo/order/manual checks and exact final deployed release remain. |
| MON-021 contradictory documentation | FIXED_LOCAL | Current pointers/status/links are reconciled in this task, original history retained. Validate links/anchors and immutable hashes before handoff. |
| MON-022 public-key class validation | FIXED_LOCAL | Normal config/build validation and dummy-key/secret-marker tests pass; real public build values and final artifact exposure checks remain release requirements. |
| MON-023 script CSP | DEFERRED, P3 | Evaluate compatible report-only nonce/hash policy after functional/provider acceptance. No exploit or required blanket enforcement is claimed. |
| MON-024 dependency/scanning governance | PARTIAL | Prior pinning/config/CI work is recorded; actual current hosted protection/scanning/maintenance ownership needs review. Repository last recorded private; transferred workflow absent; automatic update PRs intentionally removed. No silent reactivation. |
| MON-025 content/search/measurement | PARTIAL, mostly later scope | Order/COD analytics now exists. Real specs/category/product answers, Search Console, optional visitor/conversion measurement and measured search/sitemap scale remain. Profit needs cost inputs and a separately scoped accounting model. |

All25MON findings are accounted for once:11FIXED_LOCAL,6PARTIAL,6OPEN_EXTERNAL,1recordedBLOCKED_UPSTREAM,1DEFERRED. This is a work map, not a readiness score. The older A01–A21 audit inside this record is historical; its local fixes/remaining business/provider requirements are covered by the current map and milestones. No earlier requirement is waived by the admin redesign.

## Ordered remaining work

1. **Goal06 — real product and photo acceptance, first next session.** Ask for one real category/product/price/variants/physical stock and an owner-supplied photo. Verify inline category creation without losing product fields, draft save, upload/normalization/cover/order, publish/unpublish and EN/BN storefront display. Keep test data isolated; agree on a safe hosted acceptance sample before any destructive lifecycle/revocation exercise. Record each actual result. Do not recreate the owner or backend.
2. **Goal07 — real store operations.** Obtain approved contact/support, courier service areas/fees/ETA, COD review/contact/release rules and four policy texts. Configure through existing admin forms. Verify an owner-approved controlled order appears in admin and all permitted confirmation/packing/shipping/delivery/payment/cancel/failed-delivery/return/refund paths against immutable snapshots and once-only stock release. Never fabricate collected cash or refunds. Validate real order/report behavior, including payment-event dates. No customer PII in logs/screenshots/public receipts.
3. **Goal05 remaining acceptance — recovery and sessions.** Owner chooses approved free SMTP/sender/inbox and personally handles credentials/MFA. Verify recovery template/code delivery, login/logout/expiry/global invalidation/member-revocation and live Storage denials/access. Keep this distinct from already successful sign-in/MFA. If product inputs block06, this can be the next independent authorized milestone; record the exception before switching.
4. **Goals08/09 — approved content, privacy and full acceptance.** Approve applicable privacy/retention/request/deletion/backup/history rules; real content/translation/contact/shipping/return claims; add merchant schema only from those facts. Complete actual customer/owner/provider checks, manual screen-reader/native browser zoom and mobile/desktop photo/checkout review. Re-run affected regressions on the exact changed code; do not repeat all tests merely because a new session begins.
5. **Goal10 — release, infrastructure and recovery.** Recheck the tooling advisory without suppressing it; reconcile the missing local workflow with recorded remote history and choose maintenance/scanning/required checks that respect the owner's disabled automation preference. Review/save exact code only when commit/push is authorized. Choose compatible free-first hosting, SMTP, off-site storage and independent monitoring; evaluate actual limits before committing. After separate authorization, verify HTTPS/DNS/private origin/cache/IP trust, scheduler/delivery, full encrypted off-site backend recovery/alerts/rollback, realistic performance and default full release preflight. No deployment or DNS action follows merely from this plan.
6. **Final launch decision.** Review all mandatory findings and requirement coverage against actual evidence; no launch while required acceptance is open. Run the final pinned lint/types/strict DB/browser/build/restore/production+full security/artifact checks appropriate to the final release. If prepaid payments are retained for launch, Goal11 must first obtain a selected merchant integration and verified amount/currency/webhook/idempotency/refund/reconciliation/outage acceptance. Otherwise explicitly record owner-approved COD-only launch scope.

## Inputs still needed, at their dependent steps

| Input | Needed for |
|---|---|
| One real category/product, price, SKU/options/stock and photo rights/file | Immediate Goal06 owner acceptance; no password or provider subscription needed merely to enter products. |
| Business/support identity, actual courier rates/coverage/ETA, approved policy/consent/retention/COD procedures | Real checkout/fulfillment/content/privacy acceptance; qualified business/legal input where needed. |
| SMTP provider/sender and approved support/owner/operator inboxes | Recovery and alerts. Secrets stay in private provider/server configuration; never ask for passwords/OTP seeds in chat. |
| Hosting choice, independent backup destination/key custody, monitoring recipient and operating responsibility | Production operations and real recovery/alerts; free eligibility is not presumed. |
| Current repository/CI governance and advisory disposition | Exact reviewed release/security checks. No automatic Dependabot, scanner, mail timer or deployment activation. |
| COD-only versus prepaid launch decision; concrete additional admin/analytics requirements | Conditional Goal11 and later visitor/conversion/cost/profit/content features; not silently marked delivered. |

## Current local setup — dated supporting evidence, 2026-10-16

**Admin workspace local result,2026-10-16:** Owner-requested dedicated responsive navigation/overview, inline category creation while adding products, discoverable photo preview/upload/cover/order/remove controls, inventory filters and actual order/COD analytics are complete locally. Final strict127/127 zero skips, production E2E37/37, lint/types/fixture+actual-config builds pass; expanded8-screen320/768/1440px Axe/overflow checks and prior inventory/commerce regressions pass. Fixed contrast and removed a new loading boundary that changed anonymous HTTP redirects before final rerun. Actual owner-session overview/New product visual inspection succeeded before the API switch; built-in browser is now unavailable per owner, so further interactive checks use the owner's normal browser. Preview restarted loopback3100 with90minute bound; health200/databaseok. No live business writes or release action. Goal06 remains blocked only for real owner product/photo acceptance and related external gates; shared Goal07 report work does not certify visitor/conversion/profit tracking. See current STATS.MD for exact scope/evidence/next action.

**Latest acceptance:** Owner privately completed authenticator verification. Built-in browser now renders the actual `/admin` dashboard, whose source calls `requireAdmin()` to verify current provider identity, membership and AAL2 before loading data. Owner dashboard/MFA access is verified for this session, superseding setup-pending/current blank-page descriptions below. Historical blank-page root cause remains unknown. No credentials captured, business mutations or new application tests. Goal05 remains BLOCKED for SMTP recovery/logout/expiry/revocation; Goal06/07 real photo/product/order acceptance remains pending.

Latest owner-requested built-in browser observation: `/admin/security` renders the owner two-step page normally behind verified-user/admin-membership checks. Empty authenticator selector and disabled verification show setup is pending. Current signed-in security-page access is verified; AAL2 dashboard access, enrollment/challenge and earlier blank-page root cause remain unverified. No enrollment/form submission or new application test; owner handles QR/code privately. This observation supersedes the earlier blanket “post-login unverified” description for reaching this security page only.

Local setup COMPLETE on transferred main checkpoint b0e2172. PinnedNode22.23.3/locked installation,lint,typecheck,production build/postbuild PASS. Existing Healthy Supabase srlwuwytnktgynsffepu/Shawon-DEV Free preserved. Owner privately supplied main DB password;read-only operator CA+hostname connection verifies17tables/17RLS/14migrations/1admin member. Owner explicitly authorized resetting lost existing monechai_runtime password;new actual restricted login/protected-schema denials PASS. Only that role password changed;main password,grants/flags/schema/business rows unchanged. New private credentials ignored/mode600,operator excluded from app,28client assets scanned without private credential matches. Old PC needs updated runtime password.

Loopback standalone preview at127.0.0.1:3100 explicitly loads root .env.local. Health200/databaseok,EN/BN/shop/login200,anonymous admin307→login;built-in browser shows normal styled homepage/empty catalog(actual0products/0categories). Prior blank post-login report remains unverified;Goal05 and real-owner/provider acceptance remain BLOCKED. Existing unit76pass/1fail/39DBskips(missing copied quality.yml link);tooling audit5high persists. No strict isolatedDB/E2E run,application/package/lock changes,seed,live order/photo/mail,paid action,push,deployment or DNS change. Next owner-selected issue work;do not repeat bootstrap. See [tracker](../STATS.MD) and [current key inventory](SUPABASE_SETUP_HANDOFF.md#this-pc-configuration-and-key-inventory--2026-10-16). Historical setup records follow.

# Batch04 — 2026-10-14

**PAUSED at owner request — 2026-10-15: blank page after attempted owner sign-in.** Owner reports entering the selected email/password at http://127.0.0.1:3104/admin/login and receiving a completely blank page. Agent viewed the supplied screenshot; it shows a white viewport with no visible error or dashboard. Screenshot: `/home/sami/Pictures/Screenshots/Screenshot_২০২৬১০১৫_০১১১২৬.png`. Root cause and password-authentication outcome are unverified. Prior health200/anonymous307 checks do not establish successful sign-in. Last read-only MFA check remains0verified TOTP factors/0AAL2 session rows;no new provider check performed at this pause. Owner identity and one admin membership were already verified;do not recreate user/membership or reset credentials blindly.

**Resume next session:** Say “Continue Monechai from STATS.MD — diagnose blank admin login.” First check/restart the bounded private local preview if expired,using the new target `srlwuwytnktgynsffepu` and restricted runtime configuration;operator credentials stay separate. Diagnose the actual blank-page response/navigation and redacted browser/server errors before asking owner to retry sign-in. Never capture passwords,QR codes,TOTP seeds/codes or session tokens. Then owner privately completes login/TOTP,and agent verifies protected admin access plus provider assurance metadata. Keep existing17RLS tables/14migrations/Storage/Auth setup and old projects intact. SMTP/recovery,real photo acceptance,hosting and other recorded external gates remain pending. No live actions,code fixes or new application tests in this pause task;previous125strict/37E2E fixture results remain historical and do not certify this real owner journey. Preview was last confirmed running on loopback only with a90minute lifetime;availability next session is not guaranteed. No paid action,push,deployment or DNS change. Pause takes precedence over older “next”/running-preview instructions below.

**Local owner onboarding preview verified — 2026-10-15:** Running private local snapshot at http://127.0.0.1:3104/admin/login in `monechai-owner-preview`,Node22.23.3,UID1000,read-only root/source/dependencies,2CPU/4GiB/256PIDs and temporary scratch. Host publishes127.0.0.1 only;separate local Docker network allows required outbound Supabase Auth/database traffic for owner onboarding. This is an operational preview with only the restricted runtime credential,not a fixture test or deployment;operator credentials/old backups/private source env files are excluded.90minute maximum lifetime. Actual health returns200/databaseok;anonymous /admin redirects307 to /admin/login. Initial scratch-directory permission issue corrected before login. Preview intentionally remains running for owner input;earlier disposable audit containers remain removed.

**MFA verification still pending:** Owner reported dashboard completion,but read-only backend check shows0verified TOTP factors/0AAL2 session rows,and controlled Monechai tab remained /admin/login. Account/confirmed identity/one membership verified;no MFA completion claimed. Clarified Supabase dashboard versus Monechai local app and requested owner finish password sign-in/authenticator enrollment privately. Agent does not capture QR/seeds/codes/session tokens. Next: owner completes app verification;then inspect only safe protected page/factor/session status. SMTP/recovery/storage-photo/revocation acceptance remains separate.

**Owner bootstrap completed — 2026-10-15:** Owner privately selected an existing Gmail and personally created the Auth password through Supabase dashboard. Operator matched exactly one active confirmed Auth identity,inserted only its admin_members row idempotently,and verified one matching membership. Actual application isAdminMember returns true for owner and false for a random nonmember. No password/MFA changes,mail,business-record updates,old-project access/changes or paid action. Owner email/UUID remain out of tracked documentation. Supabase dashboard auto-confirm is not inbox delivery verification.

**Continuation checklist reverified:**214implementation/config/test files checksum-match completed125strict/37E2E validation;no code rerun/inflation needed. Actual getDb source connects as restricted new-project role in read-only transaction;17RLS tables/public zero-row queries pass. All17runtime policies and136privilege decisions match reviewed SQL,0client API grants/role inheritance,14exact migration hashes/timestamps,9Storage policies/6restrictive guards and5MiBWebP bucket verified. Actual migrations-only preflight passes on pinnedNode22 using separate operator credential and CA/hostname verification. Full release preflight still requires real build/ingress/business acceptance. Local owner-login preview preparation next;real TOTP/session/recovery/photo acceptance pending.

**Old-source reconciliation:** Certificate-verified read-only old Monechai check found0catalog/order/history/notification/member/Auth/photo/policy/shipping/area/request-limit records,one default-settings row matching new target,and matching empty products bucket. No business records/photo bytes needed transfer;old backend not modified andLead not queried. Preserved SQL access resolved earlier dashboard-only source uncertainty.

**Cleanup:** Final documentation3/3 (15files/180local destinations+anchors),immutable audit/archive and diff checks pass.224baseline files unchanged/22intended modifications/7additions/0missing;230initial Git paths/HEAD retained. Own disposable containers/processes/source/toolchain/target outputs removed;private credentials/old backups preserved. No live data cleanup,schedule or publishing.

**Final authorized/local result,2026-10-15:** MON-003/004/020/024 PARTIAL with local/new-target configuration evidence and explicit owner/ingress/provider/remote blockers. New target17RLS/14exact migrations,restricted Storage/Auth,actual scoped/operator certificate-verified connections and API/runtime denials verified. Strict125/125 zero skips,production E2E37/37,lint/types/build/no-drift/preflight/DB-photo restore and secret checks pass. Known full audit5high/production0;no suppression. Inventory320px layout and persistent status/confirmation/focus fixed and browser verified. [Final evidence and owner actions](audits/2026-10-14-monechai-external-access-inventory.md#finding-status-and-acceptance--completed-authorized-batch). Existing Git/source/audit/catalog/old backends preserved;no paid or publishing action. Goal05 remains blocked on chosen owner identity/MFA/recovery,then06 real photo acceptance.

**2026-10-15 connection accepted:** New project runtime and separate operator connect through free session pooler using official dashboard CA/certificate+hostname verification. Actual runtime limited reads and Auth/Storage/history denials verified; old private configs preserved and new envs owner-only/ignored. No production data/Auth identity/upload/paid change. Optional server-only CA support in app/preflight now requires isolated validation. This checkpoint supersedes prior private-input waiting and old-target/pause wording below. Owner identity/MFA/mail/hosting/DNS acceptance remains open.

**Private input handoff:** Owner requested fully prepared local setup file; ignored mode600 `.env.supabase.new.setup` contains verified new-target settings with only database-password input required. Existing input preserved; no values recorded in documentation. No live action in this file-preparation task.

**Resumed, free only:** Latest owner instruction authorizes new Supabase/Spaceship setup without trials/upgrades/purchases. Destination `srlwuwytnktgynsffepu` in Shawon-DEV Free organization verified. Preserve old Monechai/Lead and local catalog; verify exact current schema/Auth/Storage before changes. Goal05/provider setup active; pending local batch checks remain required.

**Current checkpoint:** Owner requested wait until **go**; only later-choice documentation updated. Owner chose new Monechai project in Shawon-DEV org `twpdzmeeerdtlfypawsw` (creation/ID pending verification), with old backends preserved. Owner-reported GitHub CLI account/scopes supersede any implication that all GitHub access is READ-only; connector and CLI remain distinct. [Deferred service decisions](audits/2026-10-14-monechai-external-access-inventory.md#service-decisions-to-review-later) record hosting, SMTP, independent backup storage, uptime monitoring and optional mailbox/CDN/gateway/courier/analytics choices. No provider selection/purchase/external action/test run in this documentation-only update. Resume destination verification and unfinished batch04 validation only after **go**.

Authorized sequential MON-003/004/020/024 discovery/remediation/acceptance under existing Goals04/05/06/07/08/09/10. [Current inventory and plan](audits/2026-10-14-monechai-external-access-inventory.md) owns detailed coverage/results. Phase0 complete; exact backend blocked; independent local work IN_PROGRESS. Original audit and preserved historical bodies remain unchanged. No live mutation/commit/push/deploy.

# Monechai project record

Consolidated 2026-10-11; current navigation updated2026-10-14. Consolidation followed the user requested fewer Markdown files with all content preserved. This replaces the 12 separate goal/index files and five overlapping audit/plan/access/research documents. Requirements, milestone checklists, work logs, results and earlier decisions are retained below; completed milestones do not imply a production launch.

## Start here

- [Current task tracker](../STATS.MD#remediation-batch-04--external-discovery-and-acceptance-2026-10-14) — authoritative local remediation, verification and next action.
- [Live setup resume](../STATS.MD#continue-with-one-message) — separately paused Goal05 access/identity/MFA/SMTP acceptance.
- [Short resume status](../MIGRATION_STATUS.md) — project state at a glance.
- [Supabase setup handoff](SUPABASE_SETUP_HANDOFF.md) — exact live project, completed setup and remaining owner/mail/domain/acceptance steps.

**Historical setup checkpoint — 2026-10-15, superseded by the current plan:** New target `srlwuwytnktgynsffepu` / Shawon-DEV Free org `twpdzmeeerdtlfypawsw` has17RLS tables/14exact migrations,restricted product Storage and Auth baseline,certificate-verified separate runtime/operator connections. No owner Auth user/member yet; email/MFA/SMTP and real photo/customer/admin acceptance remain. Host/mail/DNS/off-site/monitoring choices remain deferred. Old projects preserved; no paid action, deployment or production-ready claim.

**Historical current state — 2026-10-11:** Live setup is paused at the user's request while they prepare the friend's intended account. The separate Monechai project `lmrdvenrchsnueztzcdi` is configured with13 migrations/16 RLS tables, scoped runtime role, protected product storage and initial Auth settings. Owner email/identity/MFA, custom SMTP/code template and real customer/admin/photo acceptance remain pending. Preserve the existing Lead project. No deployment or production-ready claim.

The current index below and the tracker/handoff govern next work. Older statements such as “no backend connected” or “implementation still needed” in retained historical sections describe the state when they were written; do not treat them as newer instructions or repeat completed work. Goal numbers still identify milestones, now as sections of this file. Do not recreate the removed files.

## Remediation batch 03 — 2026-10-14

MON-014 PARTIAL (entity/breadcrumb/sharing improvements locally validated; merchant shipping/return facts BLOCKED_EXTERNAL). MON-016/018 FIXED_LOCAL. Node22.23.3/disposable PostgreSQL17.10: strict121/121,0skip,exit0; production E2E36/36; lint/typegen/typecheck/build/postbuild/local full preflight17RLS/14migrations PASS.15 new strict+7 new browser cases; all prior regressions retained. Source/DOM Schema.org shape/range/allowlist validation, absolute OG/Twitter/1200x630approved-logo asset, EN/BN fallback/translated language inheritance/Axe and screenshots PASS. Manual screen-reader and actual provider/merchant/owner acceptance remain unverified. No online rich-result/share-fetch acceptance claimed.

Migration0013 adds append-only administrative history with server-verified transaction-local actor,9 allowlisted triggers, RLS/API revokes and SELECT-only runtime audit access. Catalog/variant/inventory/media/category/tracking/settings/shipping/area/policy changes commit with history; rollback/audit failure retains neither. Existing status/payment/inventory-release histories and immutable checkout snapshots/consent remain. Numbers/flags/UUID relationships retain exact values; free text retains fingerprints, contacts/Storage keys redact. Overwritten text cannot be reconstructed from hashes. Already-primary photo/identical policy publication produce no phantom history/revision. Live schema stays0012/13migrations/16tables; no production migration. [Database boundary/retention](database-security.md#administrative-mutation-history--mon-018) documents trusted credentials, operator access and owner-approved retention/backup/deletion acceptance still required under MON-009. Detailed files/commands/corrections/verification/preservation in [current tracker](../STATS.MD).

Prior MON-001/002/011/012/013/015/017/021/022 preserved; MON-008 BLOCKED_UPSTREAM unchanged, no audit rerun/dependency change/exception. Original audit/history/archive unchanged; all235 baseline Git paths retained,0missing; no commit/push/deploy/live access. Batch03 complete locally feasible scope; live05 remains paused. Next owner-selected local recommendation MON-003/023/024.

## Remediation batch 02 — 2026-10-14

**MON-012/013/015/021 FIXED_LOCAL.** Authorized local scope under Goals03/08/09/10 complete; [current tracker](../STATS.MD#remediation-batch-02--mon-012013015021-2026-10-14) contains deduplicated root causes, files, coverage, exact commands/results, corrections, preservation and remaining acceptance. Implemented explicit origin-approved/default-deny indexing; normalized pagination canonicals/hreflang and deliberate noindex facets; exact card/detail/thumbnail image sizes; authoritative current runbook/status navigation. Strict106/106 zero skips, production E2E29/29, lint/typegen/types/build/postbuild/preflight and affected accessibility/responsive/SEO checks passed locally. Original audit/archive unchanged; historical bodies remain dated records.

MON-001/002/011/017/022 preserved and passing. MON-008 BLOCKED_UPSTREAM; no tooling change/exception. Live Goal05 stays paused, actual owner/provider/business/release/production-origin acceptance remains external. Next local recommendation MON-014/016/018 awaits owner selection; no launch claim.

## Remediation batch 01 — 2026-10-14

Authorized local batch under existing Goals03/04/07/08/09/10 while live Goal05 remains paused. Current status/evidence below supersedes the earlier MON-001/MON-002-only next-action sentences; their original implementation history and external acceptance requirements remain preserved. Original production-readiness audit is unchanged.

- [x] MON-011 FIXED_LOCAL (Goals04/07/08): restricted server-only receipt query selects actual paymentStatus; fulfillment/payment rendered separately in EN/BN for pending/paid/failed/refunded. Pending explicitly says cash not recorded. Changed receipt page, dictionary, new checkout/receipt.ts and receipt.test.ts, new e2e/receipt-payment.spec.ts. Focused2 strict +4 production browser tests pass including real admin transitions, delivered+pending/returned+paid, malformed/unknown tokens, no PII/history exposure, unchanged totals/items/tracking and privacy headers. EN/BN screenshots reviewed. Live real owner/customer journey remains separate.
- [x] MON-017 FIXED_LOCAL (Goals03/04): new native cart/preview.ts bounds fetch headers/body to15s, aborts superseded/empty/closed/Escape/navigation/unmount work, clears timers and fences late completions. Drawer offers localized explicit retry; server pricing/cart limits/checkout remain authoritative. Changed drawer/dictionary, new preview helper/test and e2e/cart-preview.spec.ts. Focused9 deterministic +4 production browser tests pass across all requested timeout/race/retry/close/unmount/AbortError cases. Both-locale screenshots and affected Axe scans pass.
- [x] MON-022 FIXED_LOCAL (Goals01/05/08/10): shared public-key.mjs +d.mts classifier enforces publishable/legacy HS256 anon classes in normal config, Next configuration after dotenv load/before public bundling, and preflight. Rejects privileged/malformed canonical/alternate public Supabase key fields without logging values; optional missing config still permits credential-free storefront builds, Auth requires valid key. Changed config.ts/next.config.ts/preflight.mjs/preflight.test.mjs, new supabase-config.test.ts. Five classification/config/direct-build/dotenv tests plus new preflight key subtest pass; preflight suite9/9 preserves MON-002 separation. Dummy public production build and safe28-client-file/standalone private-marker scans pass. Docker RUN build uses the same Next guard. Actual configured provider/release verification remains separate; no real key inspected.
- [ ] MON-008 BLOCKED_UPSTREAM (Goal10/A18): Node22.23.3 full registry audit5 high entries from [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), latest braces3.0.3/no patched release. Chain eslint-config-next16.3.8 → @next/eslint-plugin-next16.3.8 → fast-glob3.3.1 → micromatch4.0.8 → braces3.0.3. No compatible patch/upgrade established; suggested14.2.35 downgrade not applied. Existing reviewed128-depth parser/SHA/version/layout mitigation unchanged; does not guard externally supplied ASTs or resolve vendor advisory. Added3 ordinary-consumer/all-string-entrypoint/integrity regressions (tooling4/4 PASS). Clean pinned npm ci --ignore-scripts passes with identical lock SHA; no unreviewed lifecycle execution or new dependencies. Production audit0; full audit5 high remains intentional failing release gate. No owner exception approved.

Final integrated validation: Node22.23.3/fresh disposable network-none PostgreSQL17.10 with zero initial public tables and unchanged migrations0000–0012. Strict88/88,0 skips;20 new strict+8 new browser=28 new regressions. Lint/typegen/typecheck/build/postbuild PASS; production E2E12/12 and final screenshot3/3 PASS;3 navigation stream-closed diagnostics, no assertion failures. Actual local artifact full preflight16RLS/13migrations PASS. Existing MON-001 regressions pass and source stays unchanged; MON-002 scoped-role/credential-separation regression now9/9. Fixes remain local, not production accepted.

Validation corrections retained honestly: initial scratch baseline omitted the new shared helper and did not complete; first integrated85/86 exposed existing notification eligibility fixture precision race (PostgreSQL microsecond NOW vs JS milliseconds). Explicitly elapsed fixture nextAttemptAt fixes determinism; focused2/2 and final full suite pass, dispatch source unchanged. New mock TypeScript annotations corrected. Initial browser launch failures required scratch-only installed libraries/loader/fonts, repository Playwright/Docker configuration unchanged. Final DB checks run sequentially on a freshly reset disposable target; interrupted/incomplete attempts are not counted as passing. No production access/migration/credentials/commit/push/deploy/reset/clean/stash.

Final preservation:210/222 baseline files byte-unchanged,12 planned modifications +9 additions, no baseline file removed or initial Git path lost.18 final implementation/test files match executed source; original audit/dependencies/mitigation/MON-001/permission SQL/migrations/archive preserved. Final diff check PASS; disposable sandbox/DB/browser/build removed.

Remaining acceptance: MON-001 authenticated owner inventory form; MON-002 exact live runtime/operator identities/grants/TLS/same-project/release artifact; actual owner Auth/MFA/Storage/SMTP/business/host/recovery. Local batch adds no required external credentials. Recommended next independent local batch MON-012/013/015/021; await owner choice. Detailed file/result/preservation record: [STATS.MD](../STATS.MD#remediation-batch-01--mon-008011017022-2026-10-14).

## Historical MON-002 remediation snapshot — 2026-10-14

MON-002 ONLY authorized2026-10-14 as independent Goal10 remediation/Goal09 verification while live Goal05 remains paused. **FIXED_LOCAL; local acceptance criteria satisfied.** Actual restricted-runtime SQL conflict reproduced42501; readiness now uses only DATABASE_URL, history uses required operator DIRECT_URL, default full gate requires both with explicit modes/no fallback/read-only sessions. Runtime grants/schema/migrations unchanged. Focused8/8, strict68/68 zero skips, lint/typegen/types/build/postbuild, production E2E4/4 and actual built-artifact full/runtime/operator checks PASS. Runtime health/public pages200; failed runtime with valid operator health503; missing-operator/TLS refusals and unchanged public/drizzle schema/history PASS. Four E2E navigation stream-closed diagnostics, no failed assertions. Negative control restores only original preflight in disposable copy and fails runtime-only/operator-only/mismatch regressions as expected (4 failing of8); fixed source passes8/8. Final preservation:215 baseline nonsecret files unchanged; tested code/test bytes match final source; MON-001/permission SQL/migrations/audit/archive preserved, temporary own resources removed and diff check PASS. Exact live Supabase role/TLS/same-project/operator injection/release-artifact acceptance remains external. See [tracker](../STATS.MD#current-local-remediation--mon-002-2026-10-14) and [operator commands](OPERATIONS_CHECKS.md#release-checks). Original audit and MON-001 preserved; no production access/dependency install/commit/push/deploy.

**MON-001 completion snapshot (before MON-002 authorization):** MON-001 ONLY local Goal06 remediation and Goal09 verification are complete as FIXED_LOCAL; actual authenticated owner-form acceptance remains UNVERIFIED. User explicitly authorized this independent source fix while live Goal05 remains paused; no production Supabase access, commit, push or deployment. Original [production-readiness audit](audits/2026-10-14-monechai-production-readiness-audit.md#mon-001--stale-variant-metadata-save-can-restore-stock-already-sold) remains unchanged. Lifecycle tracing and metadata/inventory separation implemented. Focused lifecycle tests15/15 and strict suite60/60 (zero skips) PASS on isolated disposable PostgreSQL17.10/Node22.23.3; lint/typecheck/build/postbuild PASS. Negative control restores the original stale write only in a disposable copy and fails at stock1 !=0 as expected. Production E2E4/4 PASS after resolving missing libglib and scratch browser-loader issues using installed local read-only libraries. No repository browser/deployment configuration changes. Existing E2E covers public commerce, not the new authenticated admin forms; full MON-001 owner-flow acceptance remains UNVERIFIED. Recommended next independent remediation MON-002, awaiting instruction. Historical milestone statuses below remain external acceptance gates.

## Contents

- [Execution map and requirement coverage](#plan-index)
- [Goal 01 — Foundation](#goal-01)
- [Goal 02 — Catalog and product data](#goal-02)
- [Goal 03 — Storefront](#goal-03)
- [Goal 04 — Cart, shipping and real COD checkout](#goal-04)
- [Goal 05 — Admin authentication and authorization](#goal-05)
- [Goal 06 — Admin catalog and image storage](#goal-06)
- [Goal 07 — Orders and business settings](#goal-07)
- [Goal 08 — Internationalization, SEO and security](#goal-08)
- [Goal 09 — Automated and visual verification](#goal-09)
- [Goal 10 — Deployment, documentation and final hardening](#goal-10)
- [Goal 11 — Real online payments](#goal-11)
- [Repository audit and finding resolution](#project-audit)
- [Store, accounts, products, photos and payments](#store-operating-plan)
- [Owner inputs and production setup checklist](#owner-setup-checklist)
- [Detailed access requirements and historical provider options](#access-required)
- [Production services and hosting research](#production-services)

## Preservation and recovery

The complete original 17 source files, with their original paths and exact bytes, are saved in [planning-before-consolidation-2026-10-11.tar.gz](history/planning-before-consolidation-2026-10-11.tar.gz). [The manifest](history/planning-before-consolidation-2026-10-11.json) records their SHA-256 checksums and the section mapping. Only Markdown link destinations were rewritten in the merged copies so they resolve from this file; no requirements, checklist entries, logs or result paragraphs were summarized away. The archive contains documentation only, never environment/credential files.

To recover, extract the archive to a separate directory, verify manifest checksums, then copy only the desired documentation. Do not extract it over the current project or overwrite current tracking without review.


---

<a id="plan-index"></a>

<!-- BEGIN PRESERVED SOURCE: docs/goals/GOAL_INDEX.md -->
# Monechi rebuild — goal index

## Project objective

Replace the static Monechai prototype with one maintainable Next.js modular monolith backed by PostgreSQL: an owner can create and publish products with images in `/admin`, and a customer can place a real, server-priced, inventory-safe COD order that the owner can manage. Preserve the useful brand identity (now warm white, charcoal and restrained champagne gold at the owner's request) and English/Bangla experience. Deploy on a normal Node.js VPS with managed PostgreSQL; Vercel is optional.

Owner confirmed 2026-10-10: **only Sami sells products**. This is a single-owner resale store; marketplace seller accounts, commissions and payouts are out of scope. Owner corrected product scope on 2026-10-11: **new products only**; used/refurbished features are out of scope.

Owner update 2026-10-11: **domain purchased; complete production readiness required; minimize recurring cost and research free hosting first.** [Production services/tools and hosting research](#production-services) records candidates, actual limitations, access needs and launch acceptance gates. A self-hosted backend is only a researched option until selected and validated; current managed deployment instructions remain the implementation baseline. No domain/server purchase or provider setup was performed in this research.

## Repository audit and execution order

At the start of the original migration, the checkout had no git commits and contained four HTML pages, one stylesheet, three scripts, and logos. `assets/js/products.js` contained 24 products and nine categories; all imagery is external Unsplash placeholder imagery. `app.js` kept cart, wishlist and last order in localStorage, computed checkout totals in the browser, and redirected to a success page without a database. Search and sort loaded the full catalog in the browser. The old HTML duplicated chrome, included fake payment selectors, a midnight-reset sale timer, unsupported reviews/sold counts and business claims, and inconsistent/path-stale documentation. On 2026-10-10 the owner requested removal of the obsolete runtime; it was removed after seed data was preserved as JSON. Retrieve the old design from Git history. See [current audit](#project-audit).

| Goal | Status | Blocked state | Depends on | Description | External access |
|---|---|---|---|---|---|
| [01 Foundation](#goal-01) | DONE | Local foundation verified; separate live backend now provisioned, final acceptance later | — | Scaffold Next.js, TypeScript, base design, PostgreSQL/Drizzle wiring, environment checks and quality scripts. | Production `DATABASE_URL` later; local PostgreSQL verified. |
| [02 Catalog](#goal-02) | DONE | Local migration/seed/tests verified; live production catalog needs owner access and verified assets | 01 | Model products, categories, variants and images; safely import prototype data and query it. | PostgreSQL/Supabase project for live migration. |
| [03 Storefront](#goal-03) | DONE | Local pricing/quote validation passed 2026-10-11; live provider acceptance external | 02 | Responsive database-backed storefront and accurate purchasable prices. | None for pricing validation. |
| [04 Cart and checkout](#goal-04) | DONE | Quote/PRICE_CHANGED dependency validated 2026-10-11; live rates/config later | 02, 03 | Guest cart and transactional server-authoritative COD checkout. | Local test PostgreSQL; owner live rates/config later. |
| [05 Admin auth](#goal-05) | BLOCKED | Owner identity, membership and actual current-session AAL2 dashboard access verified; SMTP recovery/logout/expiry/revocation acceptance remains | 01 | Supabase Auth, explicit admin whitelist, protected routes and first-admin bootstrap. | Existing backend configured; owner-controlled recovery/session checks remain. |
| [06 Admin catalog](#goal-06) | BLOCKED | Catalog/media and dedicated workspace locally verified; inline category creation, photo preview and inventory UI pass; real owner product/photo/publish acceptance remains | 02, 05 | Product/category CRUD, variants, stock and image management. | Owner-supplied real product details/photos and live Storage acceptance. |
| [07 Order management](#goal-07) | BLOCKED | Order/settings UI and actual order/COD reporting pass locally; real customer→owner operations, business configuration and SMTP delivery remain | 04, 05 | Admin orders, valid status/payment changes, business settings and order/COD analytics. | Owner-controlled order acceptance, business facts and SMTP setup. |
| [08 i18n, SEO and security](#goal-08) | BLOCKED | Locale/brand/privacy/policy code passes locally; approved business copy and live security/owner acceptance external | 03, 04, 06, 07 | English/Bangla, SEO, security/abuse controls and truthful business information. | Approved policies/contact, canonical domain/DNS and live security checks. |
| [09 Testing and visual regression](#goal-09) | BLOCKED | Latest local strict127/production E2E37 pass; actual owner product/photo/order and remaining provider/manual acceptance remain | 03, 04, 06, 07, 08 | Automated regressions and desktop/tablet/mobile verification. | Local automated browser tools available; built-in browser unavailable after API switch. |
| [10 Deployment hardening](#goal-10) | BLOCKED | Independent artifacts/tests/Docker/nginx/ops pass; unpatched tooling/version gate and actual host/provider/off-site acceptance remain | 01–09 for final completion; independent Docker/docs slice unblocked | Finalize Docker/VPS deployment, docs, backup guidance, legacy cleanup and final quality gates. | VPS/Cloudflare/DNS access only for actual deployment. |
| [11 Online payments](#goal-11) | BLOCKED | Provider/launch choice and merchant sandbox access needed | 04, 05, 07, 08, 09 | Real guest-compatible gateway with verified payment and inventory lifecycle. | Selected provider merchant/sandbox/production access. |

**State key:** BLOCKED means required owner/provider/production acceptance or upstream tooling remediation remains. DONE describes a completed local milestone; overall production acceptance remains mandatory. Historical PAUSED entries remain in work logs only.

**Current milestone state — 2026-10-16:** Goal06 admin-workspace implementation slice and dependent Goal07 inventory/reporting presentation are locally complete and verified. No implementation task remains active in this handoff. Owner sign-in/MFA dashboard access is verified for the earlier actual session; Goal05 recovery/session and Goal06/07 real product/photo/order acceptance remain BLOCKED_EXTERNAL. No overall production-ready claim.

**Historical active goal:** None — local remediation batch02 (MON-012/013/015/021) FIXED_LOCAL under existing Goals03/08/09/10. [Latest tracker](../STATS.MD#remediation-batch-02--mon-012013015021-2026-10-14) overrides dated implementation counts and recommendations below. MON-001/002/011/017/022 FIXED_LOCAL; remaining actual owner/provider/release acceptance is external. Live Goal05 setup remains paused pending explicit resume and exact project access.

**Next action:** Owner opens the loopback admin preview in the normal browser, signs in/MFA if prompted, creates a real category and draft product, and uploads its own photo for publication/storefront acceptance. Do not repeat bootstrap. Recovery/session, real order/business/merchant/manual/provider/retention and deployment gates remain external; use the [Supabase setup handoff](SUPABASE_SETUP_HANDOFF.md) and [owner checklist](#owner-setup-checklist).

**Current fix record:** [Latest local batch](#remediation-batch-03--2026-10-14), [batch01](#remediation-batch-01--2026-10-14), and [historical audit resolution](#project-audit). Original audit records findings at its immutable baseline; dated local results do not establish launch acceptance. MON-008 BLOCKED_UPSTREAM remains visible; no exception authorized.

**New milestone:** [11 Online payments](#goal-11) is BLOCKED on owner gateway/merchant selection. Guest checkout and bearer receipt limitations are recorded in [store operating plan](#store-operating-plan). OTP is required only before future sensitive customer lookup/edits/history; no compulsory buyer accounts. Goal 10 final completion includes 11 if online payments are retained for launch.

**Current access inventory:** [Exact backend/provider/credential checklist](#access-required). Live Supabase initial setup applied, actual owner Auth/Storage acceptance pending; Recovery/MFA, policy/consent, SMTP outbox and operations code exist; real account/configuration/delivery/full-backend/off-site acceptance remains. Turnstile is optional provider-gated scope. Fresh GitHub API checks report current CLI user `Sami-754`, target repo PUBLIC with READ only; owner must verify intended visibility/authorize write/settings access before CI/release. No remote mutation. Independent local work is completed; external setup stays pending.

## Master Prompt Coverage

2026-10-10 execution update: goal 10 owns the completed repository audit/cleanup (`docs/PROJECT_AUDIT.md`); follow-up fixes retain their goal owners. No migration goal closes from build/tests alone. Legacy removal is complete with reference preserved in Git. 2026-10-11 resume: goal 03 validation passed; 08/05/07/09/10 independent code verified; real-owner and upstream gates remain. Latest scope is in [store operating plan](#store-operating-plan).

- Full repository audit, recent history, safe git handling and legacy comparison → 01; final legacy cleanup → 10.
- Modular monolith, Next.js App Router/React/TypeScript, Server Components, code boundaries, portable Node/VPS architecture, environment validation, health/logging base and quality scripts → 01.
- PostgreSQL/Drizzle migration tooling → 01; catalog schema, constraints/indexes, integer money, variants, images, stock and legacy product seed/import → 02.
- Home blocks, black/gold CSS/logo, responsive layout, reusable commerce components, shop/product routes, database search/filter/sort/pagination, accessibility and performance → 03.
- Guest cart, price/stock refresh, shipping zones/settings/calculation, customer validation, snapshots, transactional order creation, concurrency, idempotency, safe public order token, COD-only payment boundary, success/error states → 04.
- Supabase Auth, explicit `admin_members`, server authorization, secure sessions, admin login and first-admin bootstrap → 05.
- Source-free product/category creation and editing, image storage abstraction/upload/delete/reorder/primary, localized fields, publishing, featured, stock and storefront cache invalidation → 06.
- Admin order list/detail, valid status transitions/history, payment status protection, central business settings and management → 07.
- English/Bangla dictionaries and preference, metadata/canonical/Open Graph/sitemap/robots/Product JSON-LD, headers, XSS/CSRF/input/body/error protections, checkout abuse prevention, PII review, WhatsApp and false-claim cleanup → 08.
- Money/shipping/phone/schema/totals/stock/status domain tests, order persistence/security/idempotency integration tests, Playwright COD/invalid/out-of-stock journeys and desktop/tablet/mobile visual parity → 09.
- Docker, standalone build, Nginx/Caddy and Cloudflare/VPS/Supabase deployment guidance, backup/recovery, README, `ARCHITECTURE.md`, secret scan, removal of active static runtime, final gates and master coverage review → 10.
- Cheapest viable hosting, external service/credential inventory, purchased-domain DNS setup, actual SMTP/monitoring/recovery/CI/operating acceptance → 10; owner Auth recovery/MFA → 05; courier/order notification/reconciliation → 07; abuse controls/policies → 08. See `../PRODUCTION_SERVICES.md`.
- Real online gateway if retained for launch →11, requiring merchant access; optional future coupons/promotions/customer accounts/customer automatic messaging/courier APIs/invoices/analytics → scoped future work, no speculative integration. Owner SMTP alerts are implemented under07; operational alerts/backups under10.

- Latest product/account/privacy/payment Q&A → STORE_OPERATING_PLAN.md; guest/receipt protections → 04/08/09; actual online gateway → 11.

The coverage pass maps every major specification area to an owning goal. The detailed files preserve acceptance criteria and cross-goal boundaries.

<!-- END PRESERVED SOURCE: docs/goals/GOAL_INDEX.md -->

---

<a id="goal-01"></a>

<!-- BEGIN PRESERVED SOURCE: docs/goals/goal_01_foundation.md -->
# Goal 01 — Foundation

## Goal

Create a buildable Next.js App Router, TypeScript and Drizzle foundation for one portable Monechai application.

## Why this exists

At the start of this goal the repository was a browser-only prototype with no server, database connection, build or quality gates. Later goals needed stable module boundaries.

## Requirements from the master prompt

- Inspect every existing HTML/JS/CSS/README/assets and useful git history; understand cart, checkout, search, language, WhatsApp and responsive design before architecture changes. The current checkout has no commits, so there is no history to inspect.
- Use one Next.js App Router modular monolith with React, TypeScript, Server Components by default, server-side logic and clean `features`, `components`, `db`, `lib`, `i18n`, `styles` boundaries. Avoid separate API/admin apps, microservices, monorepo orchestration and other speculative infrastructure.
- Use current stable, documented versions; npm is acceptable. PostgreSQL through conventional `DATABASE_URL`, Drizzle ORM and versioned migrations; Supabase provides managed DB/Auth/Storage later without binding commerce logic to hosting APIs.
- Keep the app portable to an ordinary Linux/Node VPS and suitable for Cloudflare plus Nginx/Caddy; Vercel must not be mandatory.
- Preserve base black/gold tokens and logo while establishing maintainable CSS; retain old prototype as migration reference until parity is achieved.
- Add server-only environment validation, `.env.example`, no committed secrets or service-role key in client variables, DB client, migration commands, `/api/health`, useful PII-safe logging base and scripts for dev/build/lint/typecheck/test/test:e2e/db tasks.
- Keep TypeScript/ESLint enabled, avoid broad `any`, validate with install, lint, typecheck and production build; do not claim DB checks without actual DB access.
- Verify current official Next.js, React, Node, Drizzle and relevant Supabase guidance before significant API decisions; record them.

## Scope

Repository audit, package/config scaffold, route shell, base styling/logo, server env and database connection modules, Drizzle configuration, initial foundation migration strategy, health endpoint, quality commands and local validation.

## Out of scope

Catalog tables/import (02), storefront parity (03), checkout/order schema (04), Supabase admin Auth (05), storage (06), final deployment and docs (10).

## Dependencies

`AGENTS.md`, current prototype and Node/npm.

## External requirements

- `DATABASE_URL` — secret PostgreSQL connection string from Supabase Dashboard → Connect (or another PostgreSQL provider); required for live migration/query verification, not for local scaffold/build.
- A direct DB connection string may be needed later for migrations if a pooled URL is used; name `DIRECT_URL` if adopted. No credentials are present now.
- npm registry access to install official packages. No account login is required.

## Files expected to change

`package.json`, lockfile, `next.config.*`, `tsconfig.json`, ESLint config, `drizzle.config.ts`, `.env.example`, `.gitignore`, `src/app`, `src/db`, `src/lib`, `src/styles`, `public`, `MIGRATION_STATUS.md`.

## Implementation checklist

- [x] Audit prototype and document migration risks in goal index.
- [x] Verify current official stack guidance and select package versions.
- [x] Scaffold Next.js App Router and TypeScript with server/client boundaries.
- [x] Move logo and establish black/gold base styles and common shell.
- [x] Add server-only env validation and safe example environment.
- [x] Add Drizzle/PostgreSQL client, migration config and DB scripts.
- [x] Verify `/api/health` against local PostgreSQL; structured PII-safe logging base exists. Dev endpoint returned HTTP 200 after fixing URL validation.
- [x] Add quality scripts and verify install/lint/typecheck/build.
- [x] Verify a local DB connection through the app (password-authenticated TCP query, health HTTP 200). No catalog migration exists until goal 02; production Supabase connection is still unavailable.
- [x] Update work log/result, status and index after gates.

## Validation / tests

`npm install`, `npm run lint`, `npm run typecheck`, `npm run build`; inspect health route with app running. For local PostgreSQL set a real `DATABASE_URL` and `DATABASE_SSL=disable` (never commit credentials); production needs TLS. `npm run db:generate` produces versioned migrations after schema tables are defined in goal 02; `npm run db:migrate` applies them using `DIRECT_URL` if present, otherwise `DATABASE_URL`. Do not run migrations against production without checking the generated SQL. Verify health with and without a database; use a test DB for migration checks. Supabase live connectivity remains untested without project access.

## Definition of done

The new app builds and serves a base branded page/health endpoint, the DB/config boundary exists, secrets are excluded, migration commands are documented, and any unrun live DB verification is explicitly recorded as credential-blocked.

## Work log

- 2026-10-06: Initial audit found 24 hardcoded products, 9 categories, browser-only order success, localStorage cart/wishlist, fake bKash/Nagad selectors, Unsplash image placeholders and unsupported business claims. This checkout has no commits; existing files are staged/modified and must be preserved as reference.
- 2026-10-06: Verified current official Next.js App Router/ESLint/Node deployment, Drizzle migration and Supabase connection guidance. Selected Next.js 16.3.8, React 19.3.0 and Drizzle ORM 0.45.3. Built the foundation; `npm install`, lint, typecheck, production build and `db:generate` passed (0 schema tables by design). Homepage returned HTTP 200. No-DB health returned HTTP 503 as expected. A direct query to temporary local PostgreSQL 17 passed, but the same endpoint still returned 503 with its URL; diagnose before completing this goal. Production dependency audit found no advisories; full audit reported dev-tool advisories.
- 2026-10-06: Reproduced the 503 with a password-authenticated local PostgreSQL 17 URL and traced it to Zod `z.url({ protocol })`: the regex receives the scheme without `:`. Fixed the pattern in `src/lib/env.ts`; dev `/api/health` returned HTTP 200. Final checks passed: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run db:generate` (no schema tables), and `npm test` (0 tests discovered). Standalone server returned HTTP 503 with no DB URL and HTTP 200 with password-authenticated local PostgreSQL via TCP. Live Supabase connectivity and actual schema migration await goal 02 and project access.

## Result

Foundation complete locally: branded App Router shell, TypeScript and CSS tokens, server-only PostgreSQL/Drizzle, environment validation, health route and quality scripts. On 2026-10-06, lint, typecheck, production build and Drizzle generate passed; standalone health returned HTTP 200 against local PostgreSQL and HTTP 503 with no database URL. Later goals added migrations 0000–0010. The static prototype was removed on 2026-10-10. Live Supabase connectivity was outside this goal.

<!-- END PRESERVED SOURCE: docs/goals/goal_01_foundation.md -->

---

<a id="goal-02"></a>

<!-- BEGIN PRESERVED SOURCE: docs/goals/goal_02_catalog.md -->
# Goal 02 — Catalog and product data

## Goal

Create a database-backed catalog and repeatable import of the prototype's products.

## Why this exists

Products currently live in source code, so adding a product requires deployment and the browser must load the full catalog.

## Requirements from the master prompt

- Drizzle migrations for `categories`, `products`, `product_variants`, `product_images` and inventory representation, with useful constraints, foreign keys, unique slug/SKU, nonnegative prices/stock, positive quantities and indexes for category, publication, featured and lookup paths.
- Product fields: UUID/internal ID, slug, SKU, English/Bangla name and description where available, current/compare-at prices, category, publication, featured, optional inventory tracking, stock, image ordering/primary, legitimate badge and timestamps.
- Model variants for size/color/model/pack size without assuming all products have them; existing products can use a default variant. Derive safe types from schema.
- Store BDT money in integer minor units (or another explicit safe representation), centralize format/arithmetic helpers and test them.
- Read all 24 records and nine categories in `assets/js/products.js`; implement repeatable development seed/import without duplicate maintained catalogs. Treat Unsplash URLs, ratings/sold counts and marketing claims as placeholders, not verified production content. Development/demo records must be distinguished from production orders/data.
- Create a server catalog query layer for published products, categories, details and filters; no browser dependence on `products.js`. Ensure product #25/#100/#1000 requires no source edit.
- Keep images as storage metadata with a later provider boundary; production catalog must not permanently hotlink arbitrary third parties.

## Scope

Catalog schema/migrations, money helpers, import/seed, query layer, development data policy and domain tests.

## Out of scope

Storefront visual routes (03), checkout/order tables (04), admin CRUD and actual Supabase image uploads (06).

## Dependencies

01 foundation DB client and migration tooling; `fixtures/demo-catalog.json` (extracted from legacy `assets/js/products.js` during the 2026-10-10 authorized cleanup).

## External requirements

`DATABASE_URL` secret from Supabase Dashboard → Connect (or PostgreSQL provider) to apply migrations and seed a real DB. `DIRECT_URL` secret if pooled connection cannot run migrations. No Storage key required yet.

## Files expected to change

`src/db/schema/catalog.ts`, `src/db/migrations`, `src/features/catalog`, `src/lib/money.ts`, `scripts/seed*`, package scripts, goal/status docs.

## Implementation checklist

- [x] Model categories, products, variants, images and stock with constraints/indexes.
- [x] Generate and review version-controlled migration.
- [x] Implement money helpers and meaningful tests.
- [x] Build repeatable seed/import of 24 legacy records and nine categories.
- [x] Mark placeholder imagery/content and omit unverified ratings/sold metrics from production representation.
- [x] Implement server-side catalog queries and pagination inputs.
- [x] Apply migration and seed to a test DB; verify counts/constraints.
- [x] Run lint/typecheck/tests/build; update docs and status.

## Validation / tests

Money tests; migration and seed repeatability; SQL/query tests for published visibility, unique keys, pagination and constraints against a test PostgreSQL database; quality gates.

## Definition of done

Catalog data is DB-backed, import is repeatable and safe, money is exact, schema enforces core invariants, and legacy `products.js` is no longer an application data source.

## Work log

2026-10-10: Legacy runtime removed at owner's request. Seed now parses `fixtures/demo-catalog.json` rather than executing `assets/js/products.js` in a VM. Two successful local seed runs after migrations left exactly 9 categories and 24 unpublished demo products, variants and image metadata rows; no duplicates or published products. Historical design source is available in Git history.

- Started locally against the temporary PostgreSQL 17 container. Legacy file has 24 demo records and nine categories; prices are whole BDT and all images are Unsplash placeholders. Live production import is intentionally deferred; demo data must not publish automatically.
- Used BDT poisha as int4; 24 default variants hold inventory (zero for demo), with optional JSONB attributes and variant price override. Product publish and demo flags have a mutual-exclusion DB check. A real product image uses a storage key; demo source URLs are retained for audit but never returned by public catalog queries. Rating/sold/badges from prototype were not seeded. Demo descriptions and compare-at prices remain unverified and unpublished.
- `npm run db:migrate` uses `DIRECT_URL` or `DATABASE_URL`; `npm run db:seed` requires explicit `--demo` internally and refuses remote hosts and production `NODE_ENV`. Seed is idempotent for the known 24 SKUs and never overwrites non-demo products; no production data import is authorized. No live Supabase connection was supplied. To run locally, set `DATABASE_URL` to a loopback PostgreSQL URL and `DATABASE_SSL=disable`, migrate, seed, then run `npm test`. For production, migrate with a direct authenticated DB URL and create verified records through admin (goal 06); do not use the demo seed.
- Reviewed generated `0000_greedy_alex_wilder.sql`: constraints, partial unique image index, foreign keys and catalog indexes. Drizzle regenerate reported no drift. Next.js 16.3.8 local guide for ORM reads confirmed server-side query approach; queries are exposed via `server-only` wrapper. Seed repeat ran three times with unchanged counts. SQL tests cover publication, detail, pagination, escaped search, unique and check violations; all fixtures roll back.

## Result

Four-table Drizzle catalog with migration, safe local-only demo seed, money helpers and published-only server query layer. Local PostgreSQL migration passed; 9 categories, 24 demo products, 24 variants and 24 image metadata rows, zero published. Four tests passed with local DB; lint, typecheck, production build and schema-drift generation passed. The static prototype was removed on 2026-10-10, and the seed now reads `fixtures/demo-catalog.json`. Live Supabase import and verified product photos still need the owner. Admin media is implemented locally under goal 06 and blocked on a live bucket.

<!-- END PRESERVED SOURCE: docs/goals/goal_02_catalog.md -->

---

<a id="goal-03"></a>

<!-- BEGIN PRESERVED SOURCE: docs/goals/goal_03_storefront.md -->
# Goal 03 — Storefront

## Goal

Rebuild the public Monechai experience on server-rendered, reusable Next.js routes.

## Why this exists

The existing design is useful, but duplicated HTML and browser-wide catalog scripts prevent maintainable growth.

## Requirements from the master prompt

- Implement `/`, `/shop`, `/products/[slug]`, and useful redirects from legacy HTML URLs. Use Server Components by default; Client Components only for interactive parts.
- Preserve black/gold identity, existing logo, home sections, category feel, product cards, cart-drawer appearance, simple checkout visual direction, responsive desktop/tablet/mobile layout and WhatsApp affordance.
- Compose homepage from reusable blocks such as Hero, HowToOrder, CategoryGrid, FeaturedProducts, ProductGrid, Promotion, TrustBenefits and Testimonials; blocks receive clean data interfaces and know nothing about PostgreSQL.
- Build useful reusable commerce elements: ProductCard/Grid/Price/Gallery/Badge, search/filter/pagination/quantity UI and shared header/footer. Avoid trivial abstractions.
- Shop URL params support `q`, category, price-asc, price-desc, default/relevance and page; filter/sort/page in PostgreSQL, with hundreds/thousands of products in mind. Do not download the full catalog to the browser.
- Add loading, empty catalog/no-results, missing product, unavailable/out-of-stock and 404 states. Use safe rendering, image optimization, accessible controls/labels/alt/focus/drawer behavior and reasonable performance/caching.
- Do not present false sales, countdowns, reviews, sold counts or delivery claims from the prototype. A promotion block appears only when supported by real configured data.

## Scope

Public home/shop/product pages, shared visual system and components, server query integration, responsive/accessibility baseline.

## Out of scope

Functional cart/checkout (04), admin catalog (06), full i18n/SEO/security pass (08), final visual regression (09).

## Dependencies

02 catalog and 01 base app. The removed prototype's pages and CSS are in Git history when a visual comparison is needed.

## External requirements

None for code. Real store images from Supabase Storage or the owner are needed before publishing production products; prototype Unsplash images remain clearly development-only.

## Files expected to change

`src/app/(store)`, `src/components/blocks`, `src/components/commerce`, `src/components/layout`, `src/styles`, `public`, redirects in `next.config.*`.

## Implementation checklist

- [x] A09: align displayed/sorted prices with purchasable variants (validated 2026-10-11: focused 8/8, full 39/39, E2E 3/3, lint/typecheck/build/no-drift pass).
- [x] Run final sorting/out-of-stock assertions and new price-review browser case, full suite, lint/typecheck and production build before closing this milestone.

- [x] Build shared branded header, navigation, footer and responsive shell.
- [x] Implement reusable homepage blocks with truthful content (omit unverified promotions/testimonials).
- [x] Implement server-rendered `/shop` search/category/sort/page and stateful URL controls.
- [x] Implement product details/gallery and unavailable/404 states (ordering is intentionally disabled until 04).
- [x] Add loading/empty/error states, accessible controls and optimized images where verified Storage is configured; otherwise show local logo placeholder.
- [x] Compare desktop, tablet and mobile with legacy visual baseline (Firefox headless screenshots); Chromium Playwright keyboard navigation checked skip link, header search, shop filters/sort, product link and pagination.
- [x] Run lint/typecheck/tests/build and update docs/status.

## Validation / tests

Server query tests for URL filters and pagination; browse routes at desktop/tablet/mobile widths; keyboard checks; lint/typecheck/build.

## Definition of done

Public routes render DB-backed products with useful parity to the old visual design, scalable server filtering and accessible responsive behavior.

## Work log

2026-10-11 validation (owner resumed): focused catalog/domain/order/inventory 8/8 incl. price-asc sorting, From min/max, compare-at suppression and out-of-stock override; price-review E2E 1/1 (variant display + PRICE_CHANGED second confirmation); checkout/recovery E2E 2/2; full 39/39 zero skips; lint/typecheck/build/postbuild/no-drift/diff-check pass on disposable monechai-fixes-db. A09 FIXED_LOCAL. Status DONE locally; live provider acceptance remains external.

2026-10-11 pause: owner requested logging all fixes/remaining work and continuing tomorrow. Effective available-variant min/max/sorting, From labels, compare-at suppression, base inheritance and detail SKU saved. Small goal 04 dependency adds server-derived quote fingerprints and explicit review after stale totals. Focused 10/10 passed before final catalog assertions; existing checkout/recovery E2E 2/2 passed with quote changes; lint/typecheck passed before latest test additions. Final assertions, new tests/e2e/price-review.spec.ts, full updated suite and build NOT RUN. Status PAUSED; resume final validation here before 08. See PROJECT_AUDIT.md for file list and exact remaining audit IDs.

2026-10-11: Active for A09 effective purchasable variant price/sorting/detail/schema alignment. Keep product base as variant fallback, suppress unsupported compare-at displays for variable prices, and test out-of-stock overrides.

2026-10-10: Reopened as PAUSED after whole-project audit found advertised/sorted product base prices can differ from all active variant prices (A09). Prior local storefront milestone results remain historical evidence, not proof this regression is resolved.

2026-10-06: Started goal. Reviewed legacy homepage/shop (unverified sale, delivery, reviews and social/contact claims removed), catalog visibility policy and Next.js 16.3.8 bundled App Router guides. Server page searchParams/params are promises; uncached ORM reads must occur at request time, not build/prerender time. Demo imagery remains hidden.

2026-10-06: Built shared shell and query-backed routes; categories only show when containing a non-demo published product; cards expose active variant availability. Opt-in public Supabase Storage image keys are constrained to the `products` bucket and configured project host, with a logo placeholder otherwise. No non-functional cart or speculative WhatsApp number presented until checkout/contact details are verified. Redirected index/shop legacy HTML; checkout/success cannot redirect to fake success. Lint/typecheck/build passed; six tests passed with local DB. Built standalone server smoke-tested against local PostgreSQL: empty home/shop 200, filtered shop 200, temporary published product 200, missing product 404 (after moving loading boundary to `/shop`), index/shop HTML redirects 308, legacy checkout 404. Fixture removed afterward. Headless Firefox screenshots at 1280×900, 800×900 and 390×844 confirmed black/gold layout, logo, legible filters and no horizontal overflow in viewed area; screenshots used standalone static/public assets copied as deployment will do. No browser keyboard-interaction tooling used; focus/labels/semantic forms reviewed in code only. Final lint/typecheck/build, six DB-backed tests and Drizzle no-drift check passed. Optional verified public `NEXT_PUBLIC_WHATSAPP_NUMBER` link is hidden until configured.

## Result

**DONE locally 2026-10-11:** A09 validated (see work log). Earlier results below describe the original local milestone.

Public routes remain DB-backed, responsive and truthful; home/shop/product/legacy redirects were validated with local PostgreSQL. Lint/typecheck/build, 6 DB-backed tests and no-drift passed at goal 03 validation. On 2026-10-06, the remaining interactive keyboard check passed in Chromium Playwright against local fixture: skip link → brand → search, keyboard shop category/sort/apply, product link and next-page pagination. Goal 04's checkout E2E test owns that fixture and also exercises COD. No production Supabase credentials or verified product imagery have been provided; demo remains unpublished. Future richer accessibility/visual regression belongs to 09.

## Work log addendum

2026-10-06: User requested goal 04 before the last keyboard check; goal 03 was temporarily paused. After Playwright Chromium became available, its keyboard check passed in `tests/e2e/checkout.spec.ts`; closing 03 now while 04 continues.

2026-10-07: Theme moved to warm white, charcoal and restrained champagne gold in `src/app/globals.css`. The supplied logo went into `public`, with a light footer version, cropped mark and favicon, then header/hero/footer logos were scaled to 0.9×. Lint, typecheck and build passed. The static HTML copies mentioned in the original notes were removed on 2026-10-10. Full visual comparison remains with goal 09. Admin product photos are a separate goal 06 path.

<!-- END PRESERVED SOURCE: docs/goals/goal_03_storefront.md -->

---

<a id="goal-04"></a>

<!-- BEGIN PRESERVED SOURCE: docs/goals/goal_04_cart_checkout.md -->
# Goal 04 — Cart, shipping and real COD checkout

## Goal

Let guests place real, transactional Cash on Delivery orders with authoritative totals, safe inventory updates and a private success route.

## Why this exists

Current checkout trusts browser calculations, stores PII/order data in localStorage and can show success without database persistence.

## Requirements from the master prompt

- Guest cart may persist only product/variant IDs and quantities in browser storage. Re-query products/variants at preview and submit; explain deleted/unpublished items, changed price/stock and unavailable variants. Do not store customer PII permanently in localStorage.
- Implement `/checkout` and `/order/[publicToken]/success`, cart drawer/items/quantity/empty cart/form/summary. Success must read a real DB order by a non-enumerable public token and avoid leaking another customer's PII; failed database writes must never show success.
- Server validates IDs, quantities, Bangladesh phone normalization, name/address/area/note and payment method. Browser prices, shipping, discount, stock, payment status and order status are never authoritative.
- Server retrieves current published product/variant data, computes exact integer-money subtotal, configurable Inside/Outside Dhaka shipping and optional free-shipping threshold, valid discounts (if any) and total; checkout preview uses the same shipping domain but final server result wins. Test boundaries.
- Drizzle schema/migrations for `orders`, `order_items`, `shipping_zones` and needed idempotency fields. Persist immutable item snapshots: product/variant references, name, SKU, chosen attributes, quantity, unit price and line total. Use robust internal IDs plus safe customer-facing number/token.
- Use one PostgreSQL transaction to create complete orders/items and reserve/deduct stock; rollback all on failure, prevent overselling via atomic update/locking, and protect retries/double-click with a documented idempotency strategy.
- Start with real COD only. Keep payment method separate from status (`pending`, `paid`, `failed`, `refunded`); browser cannot mark paid. Define clean future payment provider boundary (`createPayment`, `verifyPayment`, `handleWebhook`, `refundPayment`) without fake bKash/Nagad; future gateway success requires server verification/signed webhooks and merchant credentials.
- Provide intentional validation, stock, empty cart, failed order and DB failure states; lightweight duplicate/abuse hook to be completed in 08.

## Scope

Guest cart, shipping domain, order schema/services, COD checkout, inventory, idempotency, success route and domain/integration tests.

## Out of scope

Real bKash/Nagad (future credentialed integration), admin order UI (07), full abuse/security audit (08), broad Playwright suite (09).

## Dependencies

02 catalog/stock/money and 03 storefront shell.

## External requirements

`DATABASE_URL` (SECRET; Supabase Dashboard → Connect → transaction pooler) for live checkout; `DIRECT_URL` (SECRET; Supabase Dashboard → Connect → direct/session connection) or `DATABASE_URL` for the owner-run shipping CLI. Owner must provide actual Inside Dhaka and Outside Dhaka delivery charges, and decide whether a free-shipping threshold applies; business figures are not secrets, but must not be invented. Configure them as integer poisha via `SHIPPING_INSIDE_DHAKA_MINOR`, `SHIPPING_OUTSIDE_DHAKA_MINOR`, optional `SHIPPING_FREE_ABOVE_MINOR` (all server CLI input, **not** `NEXT_PUBLIC_*`). No merchant credentials required for COD. If the owner later requests bKash/Nagad, obtain real merchant API credentials/webhook secret first; do not expose unfinished methods.

## Files expected to change

`src/db/schema/orders.ts`, migrations, `src/features/cart`, `checkout`, `orders`, `inventory`, `shipping`, `payments`, `src/app/(store)/checkout`, `src/app/(store)/order`.

## Implementation checklist

- [x] A04/A06/A07/A08/A13: durable retry recovery, cart limit/storage handling, shipping geography and checkout lock scope.
- [x] Goal 03 pricing dependency: quote fingerprint/PRICE_CHANGED review flow validated 2026-10-11 with final DB/browser/full build gates.

- [x] Build ID/quantity-only guest cart and refreshed summary (preview route re-queries catalog, unavailable lines disable order).
- [x] Add order/item/shipping schema and migration with constraints/indexes (0001 applied to local test DB).
- [x] Add validated checkout and Bangladesh phone normalization in the service, UI and API.
- [x] Add one authoritative shipping service and exact totals (owner must configure zone fees before checkout can succeed).
- [x] Implement transactional order/items/stock updates with concurrency safety (local DB test passed).
- [x] Implement idempotency and safe public identifiers (DB-backed retry lock and random 256-bit token; local test passed).
- [x] Expose COD only; speculative unused payment interface removed during cleanup, no fake payment integration.
- [x] Build real success/error flow and remove browser-local order success (token DB lookup; legacy success URL redirects to checkout).
- [x] Test pricing tampering, invalid/unpublished products, stock, rollback, duplicate requests and persistence (domain, DB and browser tests).
- [x] Run quality gates; update docs/status.

## Shipping configuration (owner action)

After applying migrations, obtain approved courier/store charges from the owner. Convert taka to integer poisha (৳1 = 100 poisha). Set both `SHIPPING_INSIDE_DHAKA_MINOR` and `SHIPPING_OUTSIDE_DHAKA_MINOR` to the approved charges; set optional `SHIPPING_FREE_ABOVE_MINOR` to the owner's chosen subtotal threshold, or leave unset to disable free shipping. Run `npm run shipping:configure` to preview **without database changes**, then `npm run shipping:configure -- --apply` with the same environment values and a server-only `DIRECT_URL` (or `DATABASE_URL`). This upserts both zones atomically. Do not commit the DB URL or claim any test-only fee is the production rate. Until configured, checkout preview cannot produce a total and order creation returns a service-unavailable error. Goal 07 can replace this CLI workflow with authorized admin business settings.

## Validation / tests

Domain tests for money/shipping/phone/checkout/totals/stock; PostgreSQL integration tests for persistence, rollback, concurrency and idempotency; browser COD journey when test environment is ready; lint/typecheck/build.

## Definition of done

Real COD orders persist once with correct server prices/shipping, snapshots and stock; invalid or failed orders cannot reach success; customer token is non-enumerable and private.

## Work log

2026-10-11 pricing dependency validated (owner resumed): stale-quote PRICE_CHANGED + refreshed second confirmation covered by price-review E2E 1/1 and full 39/39; checkout/recovery E2E 2/2 rerun with quote changes; goal 04 DONE locally again. Live fees/admin/provider acceptance remains in later goals.

2026-10-11 pricing dependency/pause: while goal 03 fixes A09, preview/submit share a fingerprint of server prices/quantities, delivery area and totals. Stale values reject before order creation and client refreshes/requires another confirmation; existing order recovery runs first. Focused 10/10 and existing E2E 2/2 passed before final test additions. New pricing browser case/full final gates pending. Owner asked to continue tomorrow; goal 04 PAUSED for this dependency. Earlier recovery/cart/delivery milestone remains validated; resume/validation owned by 03.

2026-10-11 repair validation: 34/34 full local tests; final focused area/cart/domain/order 10/10, E2E 2/2 incl. response-lost/reload recovery, lint/typecheck/build/diff/no-drift passed. First E2E selector failure and one fixture-overlap focused run are recorded honestly in PROJECT_AUDIT.md; both reruns pass. No production fees or area boundaries invented. Goal 04 local milestone repaired; moving to 07 cancellation/returns.

2026-10-11: Active for A04/A06/A07/A08/A13. Implement cookie-backed retry recovery without stored PII, validated cart writes/storage fallbacks, server-owned delivery-area-to-zone mapping and shared settings lock. Approved delivery areas require a small goal 07 settings dependency; no business coverage/rates guessed.

2026-10-10: Reopened as PAUSED for checkout findings in PROJECT_AUDIT.md: client retry UUID does not survive reload, cart edits can exceed the 100-unit cap, storage failures are uncaught, shipping zone is self-selected without geography validation, and singleton settings FOR UPDATE serializes checkouts. Server same-key idempotency/stock tests still pass; client recovery requires new regression coverage.

2026-10-06: Built migration 0001, the preview API, ID/quantity cart, checkout UI, COD success route, origin guard, cart drawer and owner shipping CLI. Local gates that day were 10/10 tests, 1/1 Chromium checkout and a production build. A forced mid-order database failure rolled the order back. No production shipping rates were invented. The quote-fingerprint work above is the part still waiting for final validation.

## Result

**DONE locally 2026-10-11 (pricing dependency validated);** earlier audit repairs validated 2026-10-11; live fees/admin/provider acceptance remains in later goals. Earlier results below describe the original milestone.

Goal 04 local implementation complete. Guests can add only variant IDs/quantities to browser storage, inspect a focus-managed cart drawer and server-refreshed checkout, and place COD orders with validated Bangladesh contact/address details. Migration 0001 adds configurable shipping, orders and immutable item snapshots; the transaction locks current product/variant/zone data, calculates exact server totals, writes order/items, conditionally decrements stock, and enforces retry idempotency and safe random public tokens. Success renders only for persisted orders, without customer PII. No real bKash/Nagad integration is exposed.

Validated on dedicated local PostgreSQL: migration and shipping CLI apply/cleanup, 10/10 unit/integration tests (including forced post-insert DB error rollback, concurrent last-unit orders, unchanged/changed key retries, unpublished products, tampering/phone/shipping), 1/1 Chromium Playwright E2E (drawer, keyboard, invalid phone, changed stock, COD success), lint/typecheck, Drizzle no-drift and production build. Standalone smoke verified checkout 200, nonexistent token 404, legacy redirect, valid vs foreign Origin behavior.

**Production rollout still requires owner action:** real delivery fees and an optional free-shipping threshold, plus a live database URL. No rates were invented. Later goals added local abuse limits, admin settings and order management. Expanded visual coverage and deployment acceptance remain in goals 09 and 10. Full Chromium ran the checkout browser test.

<!-- END PRESERVED SOURCE: docs/goals/goal_04_cart_checkout.md -->

---

<a id="goal-05"></a>

<!-- BEGIN PRESERVED SOURCE: docs/goals/goal_05_admin_auth.md -->
# Goal 05 — Admin authentication and authorization

## Goal

Protect a single in-app admin area with Supabase Auth plus explicit admin membership.

## Why this exists

Authentication alone must not grant access to product, order or settings mutations.

## Requirements from the master prompt

- Use Supabase Auth for admin login; no public customer accounts. Add `admin_members` whitelist table with appropriate FK/identity, and require both valid session and membership for all privileged server reads/mutations.
- Implement `/admin` protected layout/login and unauthorized states. Use current supported SSR/session/cookie flow, secure cookies and CSRF-aware mutation architecture; service secrets never enter browser bundles.
- Document and verify first-admin bootstrap without fabricated account/password. Admin URL/auth credentials need owner setup at the correct point.
- Keep admin in the same Next.js application; avoid separate admin app or client-only authorization.

## Scope

Supabase Auth clients/session handling, whitelist schema/migration, admin login/protected shell, server-side authorization helpers and bootstrap procedure.

## Out of scope

Product CRUD (06), order CRUD (07), customer accounts, permission hierarchy beyond a simple admin whitelist.

## Dependencies

01 foundation/database setup; 02 may share migration conventions.

## External requirements

- `NEXT_PUBLIC_SUPABASE_URL` — public project URL from Supabase Dashboard → Project Settings → API.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — public publishable key from the same API settings.
- Owner-created, confirmed Supabase Auth user/email and project SQL Editor access to insert that user's ID into `admin_members` after migration. `DATABASE_URL` (SECRET; Dashboard → Connect) needed for runtime membership reads; `DIRECT_URL` (SECRET) if migrations use a pooler. No service-role key required.
- A server-only key is requested only if the implementation genuinely needs privileged Supabase operations; name `SUPABASE_SERVICE_ROLE_KEY`, secret, from Project Settings → API. Never put it under `NEXT_PUBLIC_*`.

## Files expected to change

`src/db/schema/admin.ts`, migrations, `src/features/admin/auth`, `src/app/admin`, `src/lib/supabase`, `.env.example`, bootstrap docs.

## Implementation checklist

- [x] 2026-10-15 new target `srlwuwytnktgynsffepu`:17RLS tables/14exact migrations,restricted Storage/Auth baseline and actual certificate-verified separate operator/runtime connections; no API table grants,actual runtime protected-schema reads denied.
- [x] 2026-10-16 real owner signed-in dashboard access after personal TOTP verification: built-in browser `/admin` renders behind provider identity, membership and AAL2 guard. Current-session acceptance only; no credentials captured.
- [ ] Remaining provider/session/recovery acceptance: SMTP recovery delivery, logout, expiry and revocation. No guessed owner or paid upgrade.

- [x] Live separate Monechai backend with13 migrations/16 RLS tables, checked scoped runtime role, initial Auth settings and products bucket/policies.
- [x] Privately configure public project key/origin and scoped runtime app environment; production build/postbuild passes.
- [ ] **PAUSED/PENDING:** user logs into friend's intended account; verify access to exact project. Designated owner email unknown — add later.
- [ ] Real confirmed owner identity/membership, personal TOTP and actual login/revocation acceptance.
- [ ] Custom SMTP dependency: dashboard requires it before editing reset email template; six-digit settings alone do not complete recovery.

- [x] Independent owner recovery/TOTP/AAL2/rate-limit code and offline failure-policy tests.
- [ ] Live SMTP recovery template/mailbox, actual MFA enrollment/login/logout/revocation acceptance.

- [ ] Production recovery/MFA acceptance: app email-code/TOTP/AAL2 flow exists; configure owner SMTP/template and verify actual backend.
- [ ] Cross-check real anon/authenticated table denials after A01 hardening and complete live session checks.

- [x] Add `admin_members`, generated migration, local apply and RLS/revokes.
- [x] Implement Supabase SSR session flow with Next 16 Proxy refresh; live Auth verification pending.
- [x] Enforce verified Auth user + DB whitelist in reusable server helper and current admin data page; goal 06/07 must call guard per operation.
- [x] Build login, protected page/layout and unauthorized states.
- [x] Document first-admin bootstrap (`docs/admin-bootstrap.md`) and test offline allow/deny + local DB lookup; **blocked:** real Supabase login, nonmember and revocation browser verification require owner project/user.
- [x] Run local gates and document credential blockers; **blocked:** live login test.

## Validation / tests

Auth/membership tests for unauthenticated, authenticated non-admin and admin requests; manual login against actual Supabase project; lint/typecheck/build.

## Definition of done

Only a real signed-in whitelisted user can reach admin data or invoke privileged mutations; bootstrap is repeatable and documented.

## Work log

2026-10-11 user pause/handoff: user says this is friend's project and owner email unknown; asks to log all Supabase points and remaining work before signing into friend's Gmail/Supabase and continuing later. Live work stopped; goal BLOCKED, no active goal. [Complete Supabase handoff](SUPABASE_SETUP_HANDOFF.md) records exact project/account check, applied13 migrations/16 RLS tables, scoped runtime ACL/connection checks, live5MiB WebP products bucket/policies, initial Auth settings, private environment files and build/postbuild success. Actual owner identity/MFA/session/Storage/customer acceptance and SMTP/template remain. SMTP template editing is blocked by dashboard until custom SMTP is configured; no real email sent or owner user created. No app HTTP smoke performed after environment build.

2026-10-11 separate Monechai project lmrdvenrchsnueztzcdi created in authorized organization, FREE/NANO Singapore ap-southeast-1, Healthy. Automatic new-table API grants disabled; automatic RLS enabled. New DB password privately saved ignored mode600; old Lead remains untouched. Database/schema/Storage/Auth configuration follows.

2026-10-11 target correction: owner confirms old Lead project needed, switches to organization lpbdravwzduphzmfnlsj (Sami's org FREE, empty). No SQL/provider setting/credential changes on old project. Prepare separate Monechai backend here.

2026-10-11 owner authorizes live Supabase project setup through authenticated Kimi dashboard, project syzifxmdbfsfistwapkq. Restoration complete. Begin existing schema/data inspection; reviewed migration01/02 dependency precedes owner/Auth/Storage configuration. Owner identity/password/MFA and exact domain/SMTP/business values must not be invented.

2026-10-11 local security code validated: owner email-code recovery, enrolled TOTP/AAL2 checks before password update, global-session revoke request, TOTP enrollment/verification and mandatory AAL2 on every privileged operation. Login/recovery/MFA have durable attempt budgets; proxy fetch is bounded. Focused2/2 and full45/45 zero skips, typecheck and build/postbuild passed (lint warning subsequently fixed). Supabase source confirms listFactors.totp is verified-only; all is used for unverified enrollment. No owner Auth/SMTP connected; no message/enrollment performed. Setup template and live acceptance are documented in admin-bootstrap.md.

2026-10-11: Active independent owner recovery/MFA code slice after validated 08. Owner supplies real account/SMTP/setup after code checks; provider acceptance still blocked. Read current official Supabase MFA/recovery guidance.

2026-10-11 access clarification while paused: owner Supabase URL/public key/DB/confirmed user/Storage configuration still unavailable. Basic login/whitelist code and local tests exist; actual Auth sessions/revocation remain unverified. Production recovery/MFA also require implementation and SMTP, not just keys. Exact access/current supported variables are in docs/ACCESS_REQUIRED.md; no owner password/service-role key requested and no app implementation resumed.

2026-10-10: State set to BLOCKED for live owner Auth acceptance. Per-read and per-action guards already existed. Migration 0006 later revoked client API access on the other application tables; applying that migration on the owner's project is still unverified.

- Proxy matcher also includes future `/api/admin/*` handlers for cookie refresh; each API must still call `requireAdmin` before privileged operations. Lint/typecheck/build rerun after this change passed.
- First-admin setup documented in `docs/admin-bootstrap.md`: exact email-only owner SQL Editor operation checking `auth.users`, idempotent membership grant, revocation and login/deny verification steps; no privileged API key needed. Standalone no-Auth-config smoke: `/admin` 307 to `/admin/login`, login 200; with local DB homepage also 200. Live Supabase login remains blocked by owner access.
- Temporary PostgreSQL 17 accepted migration 0002 (including RLS/revoke); DB membership allowed/denied tests and offline policy passed alongside existing tests (12/12), lint/typecheck/build and Drizzle no-drift. Initial test import of Next navigation failed under react-server condition; moved membership lookup to a separate Next-independent module and reran successfully. Live Supabase Auth session has not been tested.
- Added 0002 whitelist UUID primary key without a PostgreSQL FK to `auth.users`: local portable PostgreSQL lacks the Supabase-managed `auth` schema; bootstrap must verify the identity in `auth.users` and insert only an existing ID. No client grants/privileged Supabase API. Added SSR proxy and per-request server auth; initial typecheck exposed SSR `headers` as record rather than `Headers`, fixed. Generate/lint/typecheck/build passed; live Auth not tested.
- Started goal 05 after locally closing 04. Next 16.3.8 auth guide warns layouts are not sufficient authorization boundaries; use a server data-access guard on every privileged read/mutation. Supabase SSR guide recommends per-request clients, `getClaims()`/`getUser()` (never unverified `getSession()` identity), and Proxy for cookie refresh with no-cache headers. Live login is owner-dependent.

## Result

BLOCKED_EXTERNAL / user-requested pause. Independent owner security code and prior local tests pass. Separate live backend/schema/ACL/runtime role/Storage/initial Auth are configured and production build/postbuild with local env passed. Designated owner email/user is pending; actual MFA/login/revocation/photo/customer acceptance and custom SMTP recovery template remain. No owner identity or email created/sent. Resume from ../SUPABASE_SETUP_HANDOFF.md after user account switch and explicit resume.

<!-- END PRESERVED SOURCE: docs/goals/goal_05_admin_auth.md -->

---

<a id="goal-06"></a>

<!-- BEGIN PRESERVED SOURCE: docs/goals/goal_06_admin_catalog.md -->
# Goal 06 — Admin catalog and image storage

## Goal

Let an authorized owner create, edit, publish and image products without editing source code.

## Why this exists

The core owner journey ends only when new products appear in the storefront from database/admin actions.

## Requirements from the master prompt

- Implement `/admin/products`, `/admin/products/new`, `/admin/products/[id]` and `/admin/categories` with create/edit, publish/unpublish, safe delete/archive, category/SKU/price/compare-at/stock/variant/featured/localized English/Bangla fields and usable validation/errors.
- Support product #25/#100/#1000 without code edits. Every mutation verifies server-side membership and invalidates relevant Next.js catalog/home cache using current supported APIs.
- Use Supabase Storage by default behind an image-storage interface that could later target S3/R2. Admin can upload/delete/reorder/set-primary. Validate MIME, supported format, file size and storage object ownership; never expose privileged storage credentials to the browser. Configure Next image handling for storage URLs and do not use random third-party imagery as permanent production product photos.
- Preserve safe integer money and stock constraints; avoid unintended edits to historical order-item snapshots.

## Scope

Admin product/category forms, mutations, storage adapter, image management and cache invalidation.

## Out of scope

Order management (07), customer accounts, speculative media-processing pipeline.

## Dependencies

02 catalog, 03 storefront queries, 05 admin authorization.

## External requirements

Supabase project URL/publishable key and Storage bucket access. A server-only `SUPABASE_SERVICE_ROLE_KEY` may be necessary for privileged storage operations; if used, obtain it from Supabase Dashboard → Project Settings → API and keep it secret. Real product photos require owner-provided assets/content.

## Files expected to change

`src/app/admin/products`, `src/app/admin/categories`, `src/features/admin/catalog`, `src/features/catalog/storage`, `src/lib/supabase`, schema/migrations if needed, image config.

## Implementation checklist

- [x] MON-018 durable catalog/category/variant/inventory/media actor history; transactional/AAL2/rollback/checkout integration tests PASS locally.
- [x] 2026-10-16 owner-requested admin workspace: dedicated responsive navigation/overview, discoverable product photos with preview, inline category creation from New product, inventory view and first-time-owner guidance. Local production/browser acceptance passed (strict127/E2E37, responsive/Axe checks); actual owner-supplied product/photo publication remains separate.

- [x] MON-001: separate metadata saves from explicit locked expected-quantity inventory adjustments; focused stale-form/race/replenishment/cancellation/return tests pass.
- [ ] MON-001 rendered owner-form acceptance (isolated browser/provider evidence still pending).

- [x] A02/A10: finish media management and reject invalid/nonexistent primary images or products without active variants.

- [x] Build validated category CRUD (create/edit/delete-empty with server guard and local DB test; live Supabase verification pending).
- [x] Build product create/edit/archive/publish/featured/variant/stock flows (local DB tests; live owner Auth and Storage acceptance still blocked).
- [x] Add localized fields and exact price inputs.
- [x] Add storage abstraction and secure upload/delete/reorder/primary flows.
- [x] Revalidate affected storefront data after category/product/variant mutations; revisit for image flows.
- [ ] Verify owner add→publish→storefront path and unauthorized denial.
- [x] Run gates; update docs/status.

## Validation / tests

Admin mutation authorization and validation tests; upload MIME/size/ordering tests; manual creation of a new product that appears in storefront; lint/typecheck/build.

## Definition of done

An authorized admin can complete the primary owner product journey without changing code, including image upload and immediate storefront visibility.

## Work log

2026-10-14 batch03: migration0013/transaction-local authenticated actor covers catalog, variants, intentional stock and media. Exact stock/price/publish differences and text fingerprints retained; runtime cannot write history. Existing MON-001 guards and postcommit Storage cleanup preserved. Local strict121/121/E2E36/36/gates PASS; actual owner/provider/retention acceptance remains external. Prior MON-001 work log below remains historical.

2026-10-14 MON-001 ONLY: authorized local dependency exception while live05 remains paused. Metadata writes whitelist SKU/labels/attributes/price/active fields and ignore stock/tracking even from old forms. Creation retains initial inventory. Separate inventory mutation validates bounded whole quantities, locks the product-bound variant, compares expected stock (null denotes untracked), retains existing unfulfilled-reservation tracking guard, then writes stock/tracking atomically. Stale adjustments roll back with reload/review guidance; action requires current member+AAL2 and explicit confirmation, revalidates admin/storefront and logs actor/product/variant/previous/new stock after commit without PII. No schema change; checkout/cancellation/return source remains byte-unchanged. Inventory form is keyed by current tracking/quantity so revalidation refreshes its defaults/expectation. Stock history is an operational log, not a new durable ledger; host retention remains external MON-018 scope. Official PostgreSQL17 locking, Drizzle transactions and installed Next16.3.8 form/revalidatePath guidance checked. Focused15/15 and strict60/60 zero skips, lint/types/build/postbuild PASS; original-write negative control catches stock0→1. Production E2E4/4 PASS. Authenticated new inventory-form/real-owner acceptance remains UNVERIFIED; full finding closure requires that separate journey.

2026-10-11 final security dependency: direct Storage product writes now require trusted AAL2 and owner membership via restrictive guards; modeled SQL tests include old allow-all and deny anon/nonmember/AAL1-owner insert/delete/overwrite, preserve public photo reads and AAL2 owner upload, and enforce membership revocation. No live policy application. Existing catalog preserved; optional Bangla variant labels added under08.

2026-10-11 pause handoff: local A02/A10 media fixes and A20 catalog usability logged in PROJECT_AUDIT.md. Actual owner Auth/Storage/upload/publish/revocation acceptance remains BLOCKED. No media code changed for the owner break. Follow docs/product-images.md and ops/supabase-storage.sql when owner access is available.

2026-10-11 validation: 0009/0010 owned verified media fingerprints, bounded real image decode/re-encode, owner JWT Storage adapter/policy, upload/order/primary/remove/publish gating; active variants required and destructive edits unpublish. Added attribute rows, filters/stock and semantic fixes. Five focused media/product/SQL-policy regressions; full39/39, lint/typecheck/build/no-drift/diff/E2E2/2 pass. Real sample pixels/local adapter and SQL role model used, not a live owner bucket/session. Follow docs/product-images.md for external setup; goal BLOCKED on actual owner journey, independent 03 pricing proceeds.

2026-10-11: Active for secure media upload/manage/publish validation and A20 catalog usability. Use authenticated Supabase user policies; privileged storage key is not required for normal uploads. Add image decode/re-encode/size/ownership validation, reject missing primary object or no active variants, test local adapters/policies and maintain external live-provider boundary.

2026-10-10 audit: publishing then accepted an invalid storage key and a product with no active variants. The 2026-10-11 media slice above closed that locally. Category and product CRUD were already in place; each admin action calls `requireAdmin()`. Live owner login and bucket acceptance remain blocked.

## Result

BLOCKED_EXTERNAL. Product/media code, real pixel/hash/lifecycle regressions and AAL2 restrictive Storage SQL checks pass locally. Actual bucket/owner upload/publish/policies and real catalog assets require owner setup. Existing products preserved.

<!-- END PRESERVED SOURCE: docs/goals/goal_06_admin_catalog.md -->

---

<a id="goal-07"></a>

<!-- BEGIN PRESERVED SOURCE: docs/goals/goal_07_order_management.md -->
# Goal 07 — Orders and business settings

## Goal

Give authorized admins a useful order queue, safe status controls and central store settings.

## Why this exists

Persisted orders must be actionable for the owner, and delivery/contact/payment settings must not live in scattered UI constants.

## Requirements from the master prompt

- Implement `/admin/orders`, `/admin/orders/[id]`, `/admin/settings` and an overview `/admin`. Order list shows number, timestamp, customer, phone, area, total, payment method/status and order status; detail shows item snapshots, quantities, customer/address, shipping, totals, note and status.
- Define explicit statuses (`pending_confirmation`, `confirmed`, `packed`, `shipped`, `delivered`, `cancelled`) and valid transitions; prevent impossible changes and record timestamps/history when reasonably simple. Payment status and method remain separate; browser cannot set paid.
- Add `site_settings` (and `order_status_history` if used), server-only authorized mutations, settings for store name, WhatsApp number, hotline, support email, Inside/Outside Dhaka fees, free threshold, enabled implemented payment methods, address/contact info. Cache and invalidate safely. Only enable real COD now.
- Keep future provider/coupons/notifications/courier/invoice/analytics boundaries simple and documented without implementing speculative features.

## Scope

Admin order list/detail/status updates, status history, settings schema/forms and cache invalidation.

## Out of scope

Online payment gateway, customer accounts, notifications, courier API, invoice/analytics systems.

## Dependencies

04 order persistence and 05 admin auth; 06 may establish admin form conventions.

## External requirements

Real PostgreSQL and authorized admin login for end-to-end verification. Owner-confirmed contact values improve production settings; never invent verified hotline/support claims.

## Files expected to change

`src/db/schema/orders.ts`, `src/db/schema/settings.ts`, migrations, `src/features/orders`, `src/features/admin/settings`, `src/app/admin/orders`, `src/app/admin/settings`.

## Implementation checklist

- [x] MON-018 durable courier/tracking/settings/rates/area history; exact/redacted/fingerprinted changes, concurrent/rollback/authorization tests PASS locally.
- [x] 2026-10-16 owner-requested sales/order analytics: authenticated7/30/90-day order activity/status/product reports and separate actual COD collection/refund event totals, with Bangladesh dates and honest empty states. SQL cohort/event/midnight tests and final responsive/browser checks pass. No visitor/conversion/profit claims or live order acceptance implied.

- [x] Transactional owner-alert outbox, leased/fenced TLS SMTP worker, redacted retries/failed queue and MFA-protected admin retry; local tests pass.
- [ ] Actual SMTP/inbox/scheduler and owner-approved customer confirmation workflow.

- [x] A03: restore reserved stock atomically and once on pre-shipment cancellation; scope failed-delivery/returns handling (A05).

- [x] Define and test allowed order transitions/history (local DB; live Auth verification pending).
- [x] Build paginated/filterable order list and detail (local DB; live UI pending).
- [x] Add server-authorized status updates and payment-status protections (COD payment remains pending; no browser mutation; live Auth pending).
- [x] Add central site/shipping/contact/payment settings and safe invalidation (local tests; live UI/auth pending).
- [ ] Verify a checkout order appears and can be managed by admin (local DB service tests passed; live authenticated browser journey pending).
- [x] Run local gates; update docs/status (live Auth/UI validation remains open).

## Validation / tests

Status transition tests, admin authorization tests, order list/detail/settings integration tests, real customer→admin flow, lint/typecheck/build.

## Definition of done

Every real order is visible to authorized staff with complete snapshots/customer details and only valid status changes; central settings drive commerce/UI values.

## Work log

2026-10-14 batch03: durable tracking/settings/shipping/area actor history commits with mutations. Existing status/payment/inventory-release histories remain sole records for their fields. Strict121/121/E2E36/36/gates/preflight PASS locally; provider/owner/retention acceptance remains external.

2026-10-11 notification code verified:0012 RLS/revokes unique transactional outbox, leased/fenced SMTP worker, bounded TLS adapter (no customer PII/receipt token), secret-token endpoint, admin queue/status/failed retry. Focused3/3 and lint/typecheck passed; shared-fixture parallel ad hoc run corrected to serial. At-least-once SMTP can repeat an alert after uncertain acknowledgement but never creates an order. No real SMTP send. Actual mailbox/scheduler/customer contact approval/admin provider acceptance remains blocked;10 final gates active.

2026-10-11: Active independent owner-notification slice after local10 operations checks. Add transactional order-alert outbox and bounded SMTP worker with concurrency/retry tests; actual SMTP/from/recipient and customer contact process remain owner setup. No live message authorization used or actual message sent.

2026-10-11 pause handoff: A03/A05 stock/returns fixes and receipt/courier reference surfaces saved/tested. Actual customer→authorized admin status/payment/return UI acceptance remains BLOCKED on owner Auth/project. A16 policies/ETA/contact/notification work is recorded in audit and goal 08; no business rules or real notifications invented/sent. Owner asked to continue tomorrow.

2026-10-11: Local A03/A05 fixed with 0008 reservation snapshots, exactly-once cancellation history, explicit return restock, failed delivery/return graph and actual cash refund recording. Added receipt/courier fields. Focused5/5 incl. concurrent cancels, full36/36, lint/typecheck/build/no-drift/diff/E2E2/2 pass after wrapped-error/type fixes. Snapshot immutability DB trigger tested. Live Auth/admin acceptance remains BLOCKED; activate 06 for independent media code.

2026-10-11: Active for A03 cancellation restock and A05 failed delivery/returns/refund records, plus receipt/tracking surfaces. Live Auth acceptance remains blocked, but local code/tests proceed. Goal 04 added approved delivery-area settings as a small documented dependency; no actual rates seeded.

2026-10-10 audit: cancelling a last-unit order left stock at zero, and status changes did not adjust inventory. The 2026-10-11 slice above restores reserved stock on cancel and records returns. Live owner verification remains blocked.

- Started at the owner's request while image upload was still unfinished. That upload later landed under goal 06. Goal 05 live verification still needs owner Supabase access. Every Server Action authorizes itself.
- Implemented 0003 migration mapping historical `placed` rows to `pending_confirmation`, adding `packed` and backfilling initial history; new checkout writes history in its transaction. Row-locked transitions, guarded queue/detail/action, exact order-number/status filters, snapshot display. Test runner now serializes integration files sharing fixed shipping-zone keys (initial parallel run raced). Initial test asserted packed→cancelled invalid; corrected to shipped→cancelled.
- Added singleton `site_settings` (0004), guarded settings forms for verified contacts/COD enablement and owner-entered two-zone fees/thresholds (no invented rates). Preview/transactional checkout check COD enablement, existing idempotent retry still returns original order; footer reads only configured contacts when DB available. Added explicit delivered-COD cash-received action with row lock and payment audit table (0005); no browser-supplied payment status or speculative refund/online payment flow. Local PostgreSQL 17 migrations 0000–0005, 20/20 tests, 1/1 checkout Playwright E2E (before final payment change), lint/typecheck/build, Drizzle no-drift and diff check passed. Tests cover queue/history, settings validation/rollback, payment gating and checkout disable/retry. No live Auth/admin browser tests; legacy `NEXT_PUBLIC_WHATSAPP_NUMBER` superseded in active Next shell. Next: authenticated end-to-end order→admin flow when owner provides Supabase access; review deployment/config later.
- Follow-up: contact settings are read at request time through Next `connection()`. Production build, lint, typecheck and diff check passed. The static prototype was removed on 2026-10-10.
- Limitation: old data status backfill has not been tested with actual pre-0003 orders; no real rates/contact values entered. Completed status/setting service tests use local DB without a real authenticated admin browser. No admin-access credentials invented. Marked BLOCKED for live verification, resume goal 06 meanwhile.

## Result

BLOCKED_EXTERNAL. Stock/order/COD/returns/history and transactional leased SMTP owner-alert code pass local tests. Actual owner/admin Auth, mailbox/inbox/scheduler/customer contact workflow and approved delivery configuration require acceptance.

<!-- END PRESERVED SOURCE: docs/goals/goal_07_order_management.md -->

---

<a id="goal-08"></a>

<!-- BEGIN PRESERVED SOURCE: docs/goals/goal_08_i18n_seo_security.md -->
# Goal 08 — Internationalization, SEO and security

## Goal

Finish bilingual content, truthful production claims, discoverability and public/admin security.

## Why this exists

The prototype uses scattered HTML injection and unsupported marketing claims; a public commerce app also needs strong validation and safe metadata.

## Requirements from the master prompt

- Preserve English/Bangla using structured Next-compatible dictionaries, localized category/product fields and optional client preference without client-rendering the entire app or arbitrary `innerHTML`.
- Dynamic titles/descriptions/canonical/Open Graph, unique product URLs, sitemap, robots and accurate Product JSON-LD. No fake review/rating structured data. Configure site URL and safe optimized storage images.
- Audit/remove or ground all prototype claims: 5000+ customers, sold counts, ratings, verified testimonials, artificial timer/flash sale, unverified 24h delivery/exchange/quality promises and unsupported discounts. Future review/promotions components may remain data-driven but must not pretend seed data is real.
- Centralize/confirm WhatsApp and contact values, encode URLs safely, and make WhatsApp supplemental to a real DB order; messages may use a persisted order number but opening WhatsApp never creates success.
- Review hostile input/validation, safe SQL/rendering, XSS/CSRF, secure cookies, authorization, security headers, body/request limits, safe errors, server secret boundaries and PII-safe structured logging. Add reasonable replaceable public-checkout anti-abuse (rate throttling/honeypot/idempotency); no immediate CAPTCHA without need.
- Cover missing product, unavailable, no results, empty, validation, failed order, DB/server failure and unauthorized admin states with intentional messages.

## Scope

Locale architecture, SEO metadata/routes/schema, security/abuse/privacy pass, truthful content and WhatsApp cleanup.

## Out of scope

Independent full review platform, genuine timed promotion engine without business data, online gateway integration.

## Dependencies

03 public pages, 04 checkout, 06 catalog management and 07 settings.

## External requirements

`NEXT_PUBLIC_SITE_URL` public canonical production URL when known; confirmed store contact values and any verified policy/claim wording from owner. Security controls can be coded with local/test defaults while these details are pending.

## Files expected to change

`src/i18n`, `src/app/sitemap.ts`, `src/app/robots.ts`, metadata files, `src/features/checkout/abuse`, `src/lib/security`, `src/components`, settings and security configuration.

## Implementation checklist

- [x] MON-014 verified-name/origin/logo entity graph, visible breadcrumbs and localized sharing metadata locally validated.
- [ ] MON-014 merchant return/shipping structured facts and actual business/share acceptance (BLOCKED_EXTERNAL).
- [x] MON-016 substantive English fallback language semantics and EN/BN DOM/Axe checks.
- [ ] MON-016 manual screen-reader acceptance (UNVERIFIED).
- [x] MON-018 durable policy publish/revision actor history; identical publish retains existing consent revision.

- [x] A16 independent policy authoring/pages/versioned immutable consent code; changed-policy rejection and retries tested.
- [ ] Owner actual policies/ETA/rates/contact/translations and notification acceptance.

- [x] A01/A11/A12/A14: all-table RLS/revokes, durable counters/budgets/body deadlines and outage fallback locally validated.
- [x] A19 local code: crawlable EN/BN URLs, alternates/canonical/metadata and remaining localized labels/copy. Bangla phone digits repaired under 04.
- [ ] A16: configurable policy pages/acceptance and approved delivery/returns/privacy/terms/contact/ETA information. Receipt/tracking implemented under 07.
- [x] A20 local code: configured store name in public branding/metadata and accessibility closure. Admin semantics/filters/attributes and checkout field errors repaired.
- [x] A09 cross-goal check: validate effective-price structured data after goal 03 final pricing gates.
- [x] A15: closed by owner NEW PRODUCTS ONLY scope; NewCondition remains accurate.

- [x] Implement structured English/Bangla UI, preference and localized catalog output.
- [ ] Verify localized home/shop/product/cart flow against published rows in a database; review mobile layout in both languages.
- [x] Add canonical/OG/sitemap/robots/Product JSON-LD without fake claims.
- [x] Audit the active Next storefront for false metrics, reviews, countdowns and delivery promises; none remain in the active routes. The legacy prototype was removed under goal 10 on 2026-10-10.
- [x] Centralize WhatsApp/contact URLs from database settings and safely encode optional messages.
- [ ] Confirm owner-provided production contact values and canonical domain.
- [ ] Audit authorization, input, cookies, CSRF, XSS, errors, limits, logging, headers and secrets.
- [x] Add durable PostgreSQL visitor/IP quotas, honeypot and duplicate/recovery protections; actual trusted-IP/proxy deployment still needs verification.
- [ ] Verify error/empty/unavailable states and run quality gates.

## Validation / tests

Locale and SEO output tests, security/abuse tests, secret/PII scan, manual English/Bangla and link checks; lint/typecheck/build.

## Definition of done

Both languages work on required routes, metadata is accurate, unsupported claims are absent, and public/admin security checks are verified without leaked PII/secrets.

## Work log

2026-10-14 batch03: Organization/WebSite homepage graph, actual visible shop/product BreadcrumbList, approved-logo social preview and policy descriptions validated without invented merchant/review/contact promises. English fallback product/policy passages carry lang=en; translations inherit bn. Policy history and no-op publication preserve consent. Strict121/121/E2E36/36/build/gates PASS. Merchant facts/manual screen-reader/live business acceptance remain external. MON-012/013 retained.

2026-10-11 local slice validated: route prefixes/alternates/metadata/sitemap, brand propagation, optional Bangla variant labels, no-referrer/private production receipts, policy pages/versioned admin publishing/mandatory consent and immutable history. Migration 0011 applied/no-drift; 43/43 zero skips, lint/typecheck/build/postbuild passed; production E2E 4/4. Browser found persistent root-language and prefetch cookie races, fixed through locale shell/document sync and document-only preference updates. Reviewed EN/BN 390/1280 shop screenshots, widths and dialog Escape/focus; actual photos/admin provider and broad accessibility scan remain under 09. Owner policies/notification workflow/contact/domain/translations remain pending.

2026-10-11 owner resumes independent fixes: persisted STORE_OPERATING_PLAN.md and goal 11 dependency. Leave current catalog records intact. Implement locale URLs/metadata, configured branding, policy authoring/acceptance and private receipt protections; business copy/credentials follow owner handoff. No invented policies or providers.

2026-10-11 pause handoff: security A01/A11/A12/A14 repaired locally and Bangla phone digits repaired under 04. Remaining work: A19 locale URLs/metadata/copy, A16 policy/configuration and A20 brand/accessibility. A09 pricing gates precede resumption here. Owner policies/rates/ETA/contact/canonical domain and live security acceptance remain external. Owner requested continuation tomorrow; no active goal during break.

2026-10-11 security slice: migration 0006 enables RLS and revokes API grants on the application tables, with a granted-role regression. Durable visitor/IP counters, preview/catalog throttles, slow-body deadlines, settings fallback and bounded database failures passed 31/31 after an ISO date fix, plus lint, typecheck, build and no-drift. Checkout recovery was finished under goal 04. Live project and proxy verification remain external.

2026-10-08: English/Bangla dictionaries, preference cookie, sitemap/robots, Product JSON-LD and baseline security headers landed. The static prototype that still held old marketing claims was removed on 2026-10-10. Crawlable locale URLs, policy pages and configured branding remain open.

## Result

BLOCKED_EXTERNAL. EN/BN routing/metadata/brand/policy revision/consent/private-receipt/security code passes local unit/production browser/WCAG checks. Real contact/domain/policies/catalog translations and backend/proxy acceptance remain owner requirements.

<!-- END PRESERVED SOURCE: docs/goals/goal_08_i18n_seo_security.md -->

---

<a id="goal-09"></a>

<!-- BEGIN PRESERVED SOURCE: docs/goals/goal_09_testing.md -->
# Goal 09 — Automated and visual verification

## Goal

Make the owner/customer journeys and core invariants verifiable in automated tests and browsers.

## Why this exists

Passing a build alone cannot prove transactional checkout, stock safety or usable mobile behavior.

## Requirements from the master prompt

- Meaningful unit/domain tests for integer money, shipping boundaries, Bangladesh phone validation, checkout schema, order totals, stock validation and allowed order transitions.
- PostgreSQL integration tests for order creation/persistence, invalid product, client price tampering, unavailable/oversold stock, transaction rollback and idempotent duplicate request. Do not claim tests that did not run.
- Install current official Playwright tooling/browser binaries if permitted. Browser happy path: home→shop→product→cart→checkout→submit COD→DB persists→real success details; also invalid checkout and unavailable item.
- Verify desktop, tablet-ish and mobile visual parity against old design for header, hero, products, categories, cart, checkout, footer and language switching; keyboard/accessibility regressions.
- Ensure `test`, `test:e2e`, lint, typecheck and build scripts are meaningful; fix failures rather than disabling checks.

## Scope

Consolidated coverage, fixtures/test DB setup, Playwright flows, manual visual/accessibility regression and gate report.

## Out of scope

Unrelated speculative load-testing or a giant monitoring stack.

## Dependencies

03, 04, 06, 07 and 08 application flows.

## External requirements

Isolated test PostgreSQL (`TEST_DATABASE_URL`, secret, if separate DB is used), test Supabase admin user/storage as needed, current Playwright package and browser downloads. Never run destructive tests against production data.

## Files expected to change

`tests`, `e2e`, `playwright.config.*`, test fixtures/scripts, CI configuration if useful, docs/status.

## Implementation checklist

- [x] Add regressions for API role denial, cancellation stock, durable client retries, cart limits and local media publish.
- [ ] Cover the real owner upload/admin publishing journey and the visual baseline. Use Git history for the removed prototype.

- [x] Cover domain invariants with meaningful unit tests (money, phone, cart/schema/shipping, status graph).
- [x] Cover order persistence/security/idempotency with isolated DB integration tests (including rollback/concurrency).
- [x] Configure existing Playwright/Chromium with guarded dedicated test DB.
- [x] Implement COD happy, invalid, tampered and unavailable E2E cases.
- [ ] Compare desktop/tablet/mobile and both locales against visual baseline; assertions for widths/language work, screenshot/manual parity and admin/photo views remain.
- [x] Run current gates, fix failures and record actual results (goal still open for visual and owner/admin flows).

## Validation / tests

`npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build` and documented manual viewport checks.

## Definition of done

Required invariants have meaningful passing tests and the core owner/customer browser journeys work at relevant widths.

## Work log

2026-10-14 MON-002 ONLY regression addendum: New preflight integration test creates isolated logins from actual runtime SQL and a metadata-SELECT-only operator; CLI artifact stubs isolate permission tests, while actual production build/preflight/HTTP/E2E is verified separately. Focused8/8 and strict68/68 zero skips PASS, including existing MON-001 inventory regressions. Production E2E4/4 PASS with scratch-only installed browser loader adaptation; repository browser config unchanged. Four navigation stream-closed diagnostics, no failed assertions. Runtime cannot access protected schemas, change membership or migration metadata; history-only operator cannot access app tables/write history. Missing/denied/invalid/unreachable operator, runtime no-fallback, journal mismatch, local target/mode guards verified. Original public/drizzle schema/history preserved. No production DB tests. Exact live owner/provider/manual acceptance remains outside this milestone.

2026-10-14 MON-001 verification: added10 tests (one pure schema case +nine disposable-DB cases) covering legacy stale metadata after committed checkout, simultaneous metadata edits, product-bound replenishment/correction/replay and bounds, competing inventory edits, actual checkout-first/replenishment-first row-lock races, cancellation in both lock orders, explicit once-only return restock and tracking reservation/stale-untracked guards. Race tests observe pg_stat_activity lock waits before releasing the first transaction. Existing catalog test now verifies metadata cannot adjust stock, then uses the separate adjustment API. Focused15/15 and full strict60/60 zero skips PASS. Original-write negative control fails expected0/actual1; restored source passes. Lint, route type generation, typecheck and production build/postbuild PASS with Node22.23.3. All SQL uses freshly initialized network-none container-local /monechai_test with zero initial public tables and migrations0000–0012; no production credentials or host sockets mounted. Production E2E4/4 PASS after sandbox-only installed-library/loader remediation; initial browser launch failures are not application assertion failures. Four server `destination stream closed early` cancellation diagnostics appeared; no assertion failed. Actual new authenticated admin forms and provider journey UNVERIFIED. No production credentials/socket/network exposed; sandbox DB/services destroyed.

2026-10-11 local WCAG pass: installed official @axe-core/playwright per Playwright documentation; targeted production browser1/1 passes WCAG2A/AA/2.1A/AA across both language mobile/desktop shops, modal cart, home, detail, checkout, policy, login and recovery screens. EN/BN screenshots inspected; no horizontal overflow and Escape restores cart-trigger focus. Local automated scanning is not a full accessibility certification or real-photo/provider owner acceptance. Goal10 active next.

2026-10-11 active local verification slice: pricing now validated, policy/locale/privacy tests added and45/45 local suite passes. Production Playwright4/4 and EN/BN390/1280 screenshots/keyboard-dialog focus checked. Add official axe WCAG scans of public pages, cart and unauthenticated owner screens; full real-image/authenticated-provider owner journey remains external.

2026-10-11 pause handoff: meaningful permission/cart/storage/recovery/inventory/returns/decoder/media/Storage-policy regressions now exist. Last complete milestone 39/39 zero skips and E2E 2/2 before latest pricing edits. New pricing browser case/final catalog assertions/full updated gates pending under 03. A17 remains partial: actual owner Auth/upload/publish/revocation/customer→admin and full real-image/locale/visual/accessibility acceptance required. A21 strict DB test/CI mode remains. No app tests rerun for documentation-only pause.

2026-10-10: PAUSED during audit. Existing 28 tests pass with no DB skips but miss the audit scenarios. First browser launch failed because matching Chromium was absent; installed it via official Playwright instructions and the retry passed 1/1. Final audit lint/typecheck/build passed and DB tests passed 28/28 with no skips. Lost-response/reload browser probe reproduced duplicate orders. These are audit checks, not closure of missing regression coverage. Prototype reference removed by owner request; source design remains in Git history. Record final audit gate results in PROJECT_AUDIT.md.

- 2026-10-08: Owner requested starting 09 early despite dependencies 06/07/08 not complete. Existing Node domain/DB tests and a Chromium COD+keyboard Playwright test already cover several requirements; retain these, expand missing cases and do not treat skipped DB/browser checks or live admin checks as passes.
- Added checkout boundary/invalid-field domain tests; migrated isolated local PostgreSQL 17 (0000–0005). Updated `npm test` runner to ignore inherited application `DATABASE_URL`, using only explicit local `/monechai_test` `TEST_DATABASE_URL`; Playwright enforces the same constraint and starts its own server. Setup in `docs/testing.md`.
- Local results: 28/28 Node tests (0 skips) with test URL; 21 pass/7 skip when no test URL even if an invalid app DB URL is inherited. Chromium E2E 1/1 after fixing stale existing test labels/plural; home/shop/product at 390/800/1280, English→Bangla→English, keyboard cart/COD flow, rejected forged price/payment and unavailable variant/stock, persisted success. Lint, typecheck, build and `git diff --check` passed. Invalid remote test URL was rejected by Playwright config (intentional negative check). No screenshot parity or authenticated admin journey verified; warning from Next dev about smooth scroll/LCP appeared during browser run. Never use production DB for destructive test fixtures.

## Result

BLOCKED_EXTERNAL. Latest strict suite50/50 zero skips and sequential production browser4/4 incl. tested WCAG/privacy/locale/price/recovery pass. Actual owner login/upload/publish/order/revocation/photo acceptance still needs the real Supabase project; local adapters are not provider proof.

<!-- END PRESERVED SOURCE: docs/goals/goal_09_testing.md -->

---

<a id="goal-10"></a>

<!-- BEGIN PRESERVED SOURCE: docs/goals/goal_10_deployment_hardening.md -->
# Goal 10 — Deployment, documentation and final hardening

## Goal

Leave one production-capable application with current documentation and reproducible VPS/Docker deployment.

## Why this exists

The migration is not complete until the owner can deploy, back up and operate the real store without the static prototype.

## Requirements from the master prompt

- Verify production build and use standalone Next output if appropriate. Provide Dockerfile and deployment examples for ordinary Linux/Node VPS behind Nginx or Caddy and Cloudflare, using managed PostgreSQL/Supabase rather than requiring DB on the VPS; Vercel optional.
- Document Supabase Auth/Storage/DB production setup, environment variables, migration generation/application, safe rollback/recovery strategy, development seed, first-admin bootstrap, adding products, managing orders, genuine COD-only payments, tests, build, local/VPS/Docker commands and troubleshooting.
- Add `ARCHITECTURE.md` explaining boundaries, schema, request/checkout/payment/auth/storage flows, deployment, and explicit invariants: client price/shipping not authoritative, browser cannot set payment status, transactional/idempotent order creation, immutable snapshots, server admin checks, source-free products, no client secrets.
- Document real backup/recovery expectations and current official Supabase plan behavior without pretending backups are enabled; include hooks for future error tracking/uptime monitoring, health checks and PII-safe logs.
- Preserve old prototype only as reference during migration, then remove obsolete active runtime files and stale README paths; final repo has one storefront. Review original master prompt and coverage map, verify no requirements were dropped, no secrets committed and no fake payment UX.
- Run actual dependency install, lint, typecheck, unit/integration/E2E when environment permits and production build; fix failures and report genuine limitations/credentials. Avoid forced history changes or unnecessary file deletion.

## Scope

Deployment artifacts, README/architecture/backup docs, production verification, secret/legacy audit and final report.

## Out of scope

Actual Cloudflare/DNS/VPS changes without owner access; future payment gateways, coupon/review/customer/notifications/courier/invoice/analytics systems.

## Dependencies

Goals 01–09 and the master-prompt coverage audit.

## External requirements

For an actual deployment: VPS SSH access (owner-provided secret), domain/DNS or Cloudflare authorization/token (secret), production `DATABASE_URL`/Supabase Auth/Storage credentials and confirmed public site URL. These are not needed to prepare reviewable deployment artifacts. Official current Supabase backup and Next/Docker guidance must be verified online.

2026-10-11: Owner confirms domain already purchased, requests cheapest/free hosting research and full production readiness. See `../PRODUCTION_SERVICES.md` for the researched account/tool/credential inventory, cost boundaries and acceptance gates. Hosting/backend selection remains open: paid 8 GB-class VPS with self-hosted Supabase is a lower recurring-cost candidate; managed Supabase remains the existing runbook until an alternative is selected and implemented/validated. Reliable SMTP, off-site DB+photo recovery, external monitoring/error alerts, CI and courier/COD operations are part of production acceptance. No provider purchase/setup is complete merely because it is listed.

## Files expected to change

`Dockerfile`, `.dockerignore`, reverse-proxy examples, deployment/backup docs, `README.md`, `ARCHITECTURE.md`, `next.config.*`, old root HTML/JS/CSS cleanup, status/goal docs.

## Implementation checklist

- [x] MON-002 local runtime/operator preflight split; scoped-role conflict reproduced42501; explicit modes/default required full gate/no credential fallback/read-only sessions, role regression8/8 and strict68/68/lint/types/build/E2E4/4/actual separate-role operations PASS2026-10-14.
- [ ] MON-002 external exact Supabase role/grants/TLS/same-project/operator injection/full-gate release-artifact acceptance after separately authorized live resume.

- [x] Independent CI/strict runner/runtime and ops/SMTP/scheduler code; local schema/preflight/restore/Docker/nginx checks.
- [x] Targeted esbuild remediation and checksum/version guarded braces string-pattern mitigation with regression.
- [ ] Upstream-compatible remediation of reported full-tooling advisories and ESLint/React-plugin support.
- [ ] Actual GitHub execution, host/domain/mail/independent upload/full-service restore and operator inbox acceptance.

- [x] Research production service/tool inventory, free/commercial hosting limitations and cheapest viable hosting candidates; record owner-confirmed purchased domain (2026-10-11).
- [ ] Select and verify actual hosting/backend quote, region, capacity and access; implement selected operations plan from `../PRODUCTION_SERVICES.md` (self-hosted backend requires additional artifacts and acceptance tests).
- [ ] Verify SMTP/admin recovery, monitoring/error alerts, DB+photo backup/restore, CI/rollback and courier/COD operating process against the production acceptance gates.

- [x] Build/test Docker standalone artifact (non-root runtime, public/static copies; DB-backed health smoke with disposable PostgreSQL 17 passed).
- [x] Document Nginx, Cloudflare, managed DB and secret setup (template only; no live credentials/deploy).
- [x] Document migrations, rollback/recovery and honest backup expectations (restore drill not yet executed).
- [x] Rewrite README and add architecture/invariant document (revisit as unfinished goals land).
- [x] Publish current in-progress project to existing GitHub `Monechai-website/main` via fast-forward (historical action; owner later requested deletion). Not a production launch.
- [x] Delete old public repo and publish current project to a newly created private same-name repo with fresh history. Deleted old, verified new private `main`, one-root history and 158 matching project files. Vercel separate.
- [x] Remove obsolete static runtime (2026-10-10 owner explicitly requested cleanup before unfinished visual parity; Git history keeps the reference, JSON preserves seed data).
- [ ] Review original master specification and coverage, scan secrets/fake claims/payment paths.
- [ ] Run and record final gates/build/E2E and deployment smoke tests where possible.
- [ ] Mark all goals DONE only when their acceptance criteria actually hold; produce final report.

## Validation / tests

Dependency install, lint, typecheck, unit/integration, Playwright, production build, Docker build/run and health check where tools/access permit; manual docs/secret/legacy audit.

## Definition of done

One real storefront/admin app is buildable and deployable by documented commands, all required goals are DONE, and actual test/build/deployment limitations are disclosed.

## Work log

2026-10-14 MON-002 ONLY: Inspected runtime SQL/DIRECT_URL migration configuration/operator handoff; fresh isolated PostgreSQL17.10 reproduced original runtime preflight42501 while application reads work. Runtime readiness now uses only DATABASE_URL, operator count check only required DIRECT_URL. Explicit --runtime-only/--migrations-only, default full gate fails safely when history unavailable, read-only sessions and local/production-TLS guards. No role/grant/schema/history change. Metadata-only operator has CONNECT/drizzle USAGE/history SELECT and cannot read app tables or mutate history. Focused8/8, strict68/68 zero skips, lint/typegen/typecheck/build/postbuild and production E2E4/4 PASS on Node22.23.3. Actual built-artifact full/runtime/operator preflight16 RLS/13 migrations, missing-operator/TLS refusals, restricted runtime HTTP200/failed runtime+valid operator health503 and before/after schema/history equality PASS. Existing count-only verification scope retained. Negative control restores only original preflight in disposable copy and fails runtime-only/operator-only/mismatch regressions as expected (4 failing of8); fixed source passes8/8. Live exact-role/TLS/same-project/release acceptance remains paused/external; no dependency install/production action/commit/push/deploy. MON-001 and original audit preserved.

2026-10-11 latest independent milestone: Node22.23.3 clean npm ci/postinstall,50/50 strict zero skips, production4/4 sequential, lint/typecheck/build/postbuild/no-drift, local preflight16 RLS/13 migrations, real app DB/photo restore16 tables/1 image, Docker build/UID1001/assets/health and dummy-cert nginx syntax pass. Targeted esbuild override removed4 moderate advisories; reported5 high braces chain remains with reviewed bounded parser mitigation, regression and deliberately failing full audit gate. ESLint10 lacks current React-plugin peer support, so no unsupported force upgrade. CI YAML parses but no GitHub run. No provider/SMTP/host/DNS/off-site/real gateway actions. Owner setup checklist is the next dependency; all independent checks done.

2026-10-11 final-check dependency: new enforced owner MFA must also govern direct Supabase Storage writes. Tightened private storage admin helper to require trusted auth.jwt AAL2 plus existing membership; local SQL regression verifies AAL1 owner upload/delete denied, AAL2 nonmember denied, AAL2 owner allowed, membership revocation denied. Small05/06 security dependency under10; actual provider policy application remains external.

2026-10-11 access clarification: docs/ACCESS_REQUIRED.md records all current versus planned credentials/account access and unfinished integration code. Official Supabase/Cloudflare credential docs refreshed. Live read-only GitHub check: current gh user Sami-754, target PUBLIC and pull/READ only, push/admin false; verify intended privacy and authorized write/settings access before CI/release. No remote mutation or paused implementation resumed. Host/backend remains unselected and SMTP/bot/backup/monitoring need actual setup/implementation/acceptance.

2026-10-11 pause handoff: 17-file legacy cleanup, JSON seed preservation, standalone startup assets and navigation attribute repaired/validated. Remaining A18 compatible dependency fixes (last audit nine dev advisories, zero production), A21 strict CI/runtime/executable preflight/recovery/alerts and real deployment/restore acceptance. Cheapest hosting/services/access research is in docs/PRODUCTION_SERVICES.md; route unselected and no purchase/setup/deploy performed. Owner asked to continue tomorrow; resume 03 first.

2026-10-11: Wrote `docs/PRODUCTION_SERVICES.md` from then-current provider docs. Published starting prices are research, not a selected or purchased plan. Domain purchased per owner. No provider signup or deploy. A01 was completed later the same day under goal 08; do not restart it from this note.

2026-10-10: Removed 17 obsolete prototype files after saving the demo seed as JSON, fixed standalone asset startup, and recorded the audit. Post-cleanup lint, typecheck, build, 28/28 tests and 1/1 browser case passed that day. Later local fixes are in the audit resolution table. The open-findings list from that day was removed so it would not be followed again.

2026-10-08: Added the Node 22 Dockerfile, deployment runbook, backup notes, Nginx example and architecture doc. A disposable database smoke returned health 200. Docker image build served login without a database and health 503, as expected. No live restore. Git history was republished as a fresh private repository at `e1546f3`. A 2026-10-11 read of the same GitHub repo reported PUBLIC and READ-only for the current CLI user; that later check is the one to trust. The static prototype is no longer in the working tree.

## Result

BLOCKED_EXTERNAL/UPSTREAM. Independent code/artifacts/checks completed: Node22.23.3, strict CI/zero-skip tests, reviewed tooling mitigation, preflight/health, encrypted app DB/photo export/isolated restore, SMTP/scheduler templates, Docker nonroot startup/assets and nginx syntax. Production audit0; full audit5 high unpatched braces-chain entries still block full security gate; no forced downgrades/disabled checks. Actual hosting/DNS/mail/CI/off-site/full-Supabase recovery acceptance and all required goals remain incomplete. See OWNER_SETUP_CHECKLIST.md.

<!-- END PRESERVED SOURCE: docs/goals/goal_10_deployment_hardening.md -->

---

<a id="goal-11"></a>

<!-- BEGIN PRESERVED SOURCE: docs/goals/goal_11_online_payments.md -->
# Goal 11 — Real online payments

## Goal

Integrate one owner-approved merchant payment gateway alongside COD, with verified financial and inventory outcomes.

## Why this exists

The owner asked how online payment fits into guest checkout. Current code/database deliberately accept COD only; gateway functionality must be real and verifiable.

## Requirements from the master prompt

Latest owner discussion: preserve guest checkout and protected owner admin; online payment does not require a Monechai buyer account. Server totals/payment status remain authoritative. No fake bKash/Nagad integration. See [store operating plan](#store-operating-plan).

## Scope

One selected provider, pending order/payment attempt lifecycle, hosted checkout handoff, provider validation/notifications, reconciliation, duplicate protection, failure/expiry inventory release and accurate success/refund states.

## Out of scope

Multiple speculative gateways, customer accounts, stored card/wallet credentials, provider onboarding/purchase without owner action, phone OTP for future customer order editing/history.

## Dependencies

04 transactional checkout; 05 server authorization; 07 order/payment state management; 08 request/privacy controls; 09 meaningful regression harness.

## External requirements

BLOCKED: owner gateway choice/launch requirement, approved merchant onboarding, sandbox and production API credentials, verified callback hostname, settlement/refund rules. Exact variable names depend on the chosen provider and must be documented before setup. Secret keys are server-only. Official current API documentation is required. No provider selected; do not invent credentials.

## Files expected to change

`src/features/checkout`, payment domain/adapter/routes, order/payment schema/migrations, checkout UI, admin payment/reconciliation UI, tests and operations docs.

## Implementation checklist

- [x] Persist required guest/privacy/provider validation boundaries and dependency ownership.
- [ ] BLOCKED: choose/approve provider and obtain actual sandbox merchant access.
- [ ] Design provider-specific payment attempts, immutable references and stock reservation/expiry strategy.
- [ ] Implement initiation/server verification and authenticated validated notifications with idempotency.
- [ ] Handle failed/cancelled/expired payments, stock release and reconciliation/refunds.
- [ ] Pass sandbox amount/order/currency tamper, lost response, duplicate callback and concurrency regressions.
- [ ] BLOCKED: verify production merchant configuration and owner-authorized acceptance.

## Validation / tests

Provider sandbox tests plus local financial/inventory invariants, hosted checkout E2E, lint/typecheck/tests/build, reviewed reconciliation/expiry recovery. Real payments require separate owner authorization.

## Definition of done

Chosen provider works with guest checkout; only server-verified matching transactions mark payment paid; retry/failure/expiry cannot double charge/order or leak/reserve stock indefinitely; owner/provider acceptance and operating procedure verified. If owner chooses COD-only launch, document that scope decision explicitly rather than claiming this integration complete.

## Work log

2026-10-11: Created before implementation. Owner wants independent code work first, then consolidated setup requirements. Provider choice/access is unavailable; COD remains active. No gateway package, fake UI or payment credentials introduced.

## Result

BLOCKED on provider selection/merchant access. Planning complete; no online gateway implemented.

<!-- END PRESERVED SOURCE: docs/goals/goal_11_online_payments.md -->

---

<a id="project-audit"></a>

<!-- BEGIN PRESERVED SOURCE: docs/PROJECT_AUDIT.md -->
# Monechai project audit — 2026-10-10

## Assessment

**Current checkpoint, 2026-10-11: independent code and local checks completed.** Sixteen findings have validated local fixes, A15 is closed by new-product-only scope, and four remain partial/external/upstream (A16/A17/A18/A21). EN/BN routing/metadata/branding, policy revision/consent, owner recovery/MFA, restricted Storage writes, SMTP outbox and CI/operations code now exist. Latest pinnedNode22 checks: strict50/50 zero skips; production browser4/4 including tested WCAG/guest privacy/price/recovery flows; build/Docker/nginx/local app-data+photo restore pass. Production dependency audit0; full tooling audit5 high entries remain for the unpatched braces chain despite a reviewed string-pattern mitigation. Real owner backend/mail/business/host/off-site/full-service recovery is unverified; the store is not ready for real orders.

**Owner confirmed: only Sami will sell products.** Reselling products you source yourself fits the current single-owner architecture. Seller registration/dashboards, multi-seller tenancy, commissions and payouts are unnecessary for this scope and should not be added. Owner subsequently confirmed on 2026-10-11 that stock is **new products only**. The earlier mixed-stock reply was immediately corrected; used/refurbished fields are outside scope.

The audit covered tracked application routes/components, catalog/admin/cart/checkout logic, SQL schema and migrations, configuration, scripts, tests, deployment artifacts and current operational docs. Tests and probes used a disposable local PostgreSQL 17.10 database. No production database, live Supabase Auth/Storage, deployed website, GitHub mutation or real customer order was used. This is a bounded source/local-runtime audit, not a claim that all possible defects have been found.

Latest owner authorization 2026-10-11: finish independent code/local checks now, then supply one access/business setup checklist. Independent work validated; no active goal, waiting for owner setup and upstream-compatible tooling remediation. Existing products preserved. New payment/privacy scope: [STORE_OPERATING_PLAN.md](#store-operating-plan); goal 11 is provider-gated. Earlier pause entries below are historical.

## Fix status and implementation log

Owner authorized fixing all code bugs and logging each change on 2026-10-11, then asked to log the remaining work and continue tomorrow. **Latest product scope: new products only** (the earlier mixed-stock reply was immediately corrected). Only the owner sells; delivery is across Bangladesh and the domain is already purchased. This section is the current resolution record. The 2026-10-10 open-findings table was removed; the audit-day record below keeps what was measured and cleaned up. FIXED_LOCAL means a regression/check passed locally, not that the live service is accepted. PARTIAL_VALIDATION means code is saved with final checks outstanding; PARTIAL means some parts are fixed and others remain. Live provider verification stays BLOCKED_EXTERNAL; business details are never invented.

Execution order: goal 08 security/reliability → goal 04 cart/checkout → goal 07 stock/order operations → goal 06 media/catalog → goal 03 advertised prices → remaining goal 08 locale/policies/accessibility → goal 09 regressions → goal 10 dependency/CI/operations code. Each milestone is validated and logged before changing the active goal. The existing user cleanup remains in the working tree and will be preserved.

| Finding | State | Resolution / remaining work |
|---|---|---|
| A01 | FIXED_LOCAL | Migration 0006 enables all-table RLS/revokes API grants; granted non-owner role denial regression passes. Live project deployment still external. |
| A02 | FIXED_LOCAL | Guarded upload/order/primary/remove UI, real image decode/re-encode, authenticated Storage adapter/policy and owner publish lifecycle implemented; local tests pass, live provider still required. |
| A03 | FIXED_LOCAL | 0008 reservation snapshots and row-locked atomic cancellation release/history; concurrent cancellation regression restores stock exactly once. Legacy unknown reservations require review. |
| A04 | FIXED_LOCAL | HttpOnly server-issued recovery cookie and serialized lookup; dropped-commit/reload browser test retains exactly one order. No customer PII persisted. |
| A05 | FIXED_LOCAL | Failed delivery/return transitions, explicit sellable-return restock and audited physical full-COD refund recording implemented and tested; no automatic money transfer. |
| A06 | FIXED_LOCAL | Validated writes enforce 20/item, 30 lines, 100 total; invalid edits preserve previous cart and malformed saved lines are recovered. |
| A07 | FIXED_LOCAL | Add reports actual limits, repeated Added button disabled, safe memory fallback/clear; saved order navigation independent of storage. |
| A08 | FIXED_LOCAL | 0007 approved delivery-area→zone mapping; client-selected shippingZone rejected; admin mapping forms added. Nationwide scope supported; real area/rate inputs external. |
| A09 | FIXED_LOCAL | Actual available-variant min/max prices, price sorting, "From" labels, compare-at suppression and SKU/detail output implemented. Stale checkout quotes require a refreshed total and another confirmation. Validated 2026-10-11: focused 8/8, full 39/39 zero skips, price-review E2E 1/1, checkout/recovery E2E 2/2, lint/typecheck/build/no-drift/diff-check pass on disposable local DB. |
| A10 | FIXED_LOCAL | Published products require owned verified primary bytes (SHA-256/current object) and active variants. Primary deletion and last-variant deactivation unpublish safely. |
| A11 | FIXED_LOCAL | Atomic expiring PostgreSQL counters isolate visitors/IPs across workers; separate recovery budget; trusted IP deployment still must be verified. |
| A12 | FIXED_LOCAL | Preview/catalog durable request budgets, 8 KiB cap and 5-second read deadline; slow-body regression passes. |
| A13 | FIXED_LOCAL | Settings/area/zone reads use shared locks, allowing unrelated checkouts while config updates serialize safely. |
| A14 | FIXED_LOCAL | Safe public-settings fallback, root global error/retry and DB connection/statement/lock deadlines; DB-outage login HTTP 200 verified. |
| A15 | CLOSED_SCOPE | Owner corrected stock to NEW ONLY. NewCondition is accurate; used/refurbished fields are outside scope. Supplier/cost tracking is optional future business tooling. |
| A16 | PARTIAL | Item receipt and admin courier/reference fields implemented and locally checked. Versioned policy forms/pages and mandatory recorded consent implemented/tested; approved serviceability/ETA/contact details and a verified owner/customer notification workflow remain. Transactional leased SMTP outbox/owner queue/retry and scheduler code pass locally; actual SMTP/inbox/customer contact approval remains external. |
| A17 | PARTIAL | Added cart/storage, permission denial, durable recovery, cancellation/returns, real image decoding, media lifecycle and modeled Storage-policy regressions. Real owner login→upload→publish→storefront and customer→admin/revocation journeys still require the actual Supabase project; pricing browser coverage passed under A09; full owner/provider acceptance remains. |
| A18 | PARTIAL_UPSTREAM | Targeted esbuild override removed4 moderate advisories; production audit0. Full audit5 high entries all trace to unpatched braces3.0.3. Checksum/version/layout-guarded string nesting mitigation and hostile-pattern test pass; npm version advisory/CI security gate stays open. ESLint10 upgrade is also blocked by current React-plugin peer compatibility. No forced downgrade or disabled checks. |
| A19 | FIXED_LOCAL | Bangla phone digits now normalize and checkout errors/price labels have EN/BN text. EN/BN route segments, localized links/metadata/alternates/sitemap, optional variant labels and language-navigation/prefetch fixes pass production browser checks. Actual owner catalog translations/domain remain external. |
| A20 | FIXED_LOCAL | Removed nested admin main landmarks; added product filters/stock overview, key/value attributes, safe repeated URL parameters and checkout field errors/focus. Configured name propagated and EN/BN mobile/desktop widths/screenshots/dialog focus verified. WCAG2A/AA/2.1A/AA scans of tested public/cart/login/recovery screens passed; actual owner/photo/admin review remains external. |
| A21 | PARTIAL | CI YAML/strict zero-skip runner, Node22.23.3 pin, preflight/health, encrypted app export/isolated restore and unenabled scheduler/SMTP hooks implemented/checked. Docker/nonroot/static/health and dummy-cert nginx syntax pass. Actual GitHub run/host/DNS/mail/independent upload/full-backend restore/alerts remain external. Fresh GitHub check: current CLI user has READ-only access and target repo reports PUBLIC; owner access/intended visibility needs verification. |

### Historical pause checkpoint (superseded by the current assessment/table)

**Paused on 2026-10-11 for the owner's requested break. Resume on the next requested session; nothing is scheduled or running automatically.** All fixes and the 17-file cleanup remain saved in the local working tree on `main` at `d18cb13`. They are uncommitted and have not been pushed or deployed. The resolution table above is the current work list. The 2026-10-10 open-findings table was removed because it still described repaired defects as open.

The disposable `monechai-fixes-db` container was stopped for the break, with local test data/migrations retained. No app/test server is running. Restart/readiness instructions and the dummy test URL are in `STATS.MD`; unrelated Docker services were untouched.

**Access clarification, 2026-10-11:** owner asked why work proceeded without Supabase credentials. Local fixes used a real disposable PostgreSQL database and fixtures; image/Auth policy coverage used local adapters/modeled identities. No owner Supabase project was connected/accepted. [ACCESS_REQUIRED.md](#access-required) lists all backend/host/DNS/email/bot/backup/monitoring/GitHub/courier access and remaining integration code. Fresh read-only GitHub checks identify `Sami-754`, with READ-only access to the now PUBLIC target repo; this supersedes the historical private-access checkpoint without establishing when/why it changed. No remote mutation occurred; original implementation pause remains.

1. **A09 done 2026-10-11 under goal 03.** Saved pricing/quote changes in `src/features/catalog/queries.ts`, `src/components/commerce/product.tsx`, the product route, `src/features/checkout/quote.ts`, `domain.ts`, `preview.ts`, `orders.ts`, `checkout-client.tsx` and `src/i18n/dictionary.ts` were validated: focused 8/8, full 39/39 zero skips, price-review E2E 1/1, checkout/recovery E2E 2/2, lint/typecheck/build/postbuild/no-drift/diff-check pass.
2. **Complete A19 and the remaining A20 work under goal 08.** Add/test crawlable EN/BN routes and accurate locale metadata/alternates; propagate the configured store name. Review public variant labels, mobile layout, keyboard/focus and remaining translated text. Owner catalog copy must be supplied rather than invented.
3. **Complete A16 under goals 07/08.** Add configurable public shipping/returns/privacy/terms and the required policy acceptance flow. Obtain actual delivery coverage, fees, ETA, returns/refund rules, courier/support information and the owner notification route. Existing receipt/tracking fields do not complete these requirements. No real notification has been sent.
4. **Close A18 under goal 10.** Review the nine recorded development-tool advisories and update compatible dependencies/overrides; validate migration tooling, lint/typecheck/tests/build afterwards. Avoid the suggested forced core-tool downgrades. Re-run both production and full dependency audits.
5. **Finish A17 and A21 under goals 09/10.** Add CI with disposable PostgreSQL and a mode that fails when required DB tests would skip; pin the supported runtime. Complete actual admin/nonmember/revocation/media/order browser journeys, real-image accessibility/visual checks and the chosen deployment's executable preflight/backup/restore/alerts workflow. Keep live provider acceptance separate from local adapters and modeled SQL identities.
6. **Complete the external launch gates.** Choose and verify the cheapest viable hosting/backend plan; configure owner Supabase Auth/Storage, approved products/photos/rates/policies, domain/TLS/proxy, recovery SMTP, monitoring and independent database-plus-photo backups. Perform the restore drill and full live customer→owner flow. See [production services and exact credential locations](#production-services), [database permissions](database-security.md) and [image setup](product-images.md). No account purchase or deployment is part of this pause checkpoint.

At that earlier pause, the remaining six audit IDs were **A16, A17, A18, A19, A20 and A21**. The current unresolved IDs are A16/A17/A18/A21. Live checks also remain for several FIXED_LOCAL findings; they are required before launch even though the code regression is repaired.

### Validation at this pause

| Saved milestone | Checks actually completed | What is still unverified |
|---|---|---|
| Security, cart/checkout, stock/returns, media/catalog | Most recent complete milestone: **39/39 unit/integration tests, 0 skips**, lint, typecheck, build/postbuild, schema no-drift and diff check passed; **2/2 Chromium browser cases** passed. Migrations 0000–0010 applied to the disposable local PostgreSQL database. Earlier failures and successful reruns are recorded below. | Actual Supabase project roles, Auth sessions, Storage and authenticated owner UI acceptance. |
| Latest pricing/quote work | Focused 8/8 incl. final sorting/out-of-stock assertions, full 39/39 zero skips, price-review E2E 1/1, checkout/recovery E2E 2/2, lint/typecheck/build/postbuild/no-drift/diff-check pass. | A09 live storefront/provider acceptance. Prior results now validate this snapshot. |
| Dependency security | Last recorded production audit: **0 advisories**; full audit: **9 development advisories (4 moderate, 5 high)**. | A18 remediation and fresh post-remediation audits. |
| Pause handoff | Audit/goal/status/resume files synchronized. Local links and all required goal sections checked across 14 docs; zero active goals; all 21 audit states/counts correct; git diff --check passed. Disposable DB confirmed stopped, data retained. No implementation tests started for this documentation-only pause. | Tomorrow's validation and implementation work above. |

### Implementation log

- 2026-10-11 latest independent-code handoff: STORE_OPERATING_PLAN/OWNER_SETUP_CHECKLIST/OPERATIONS_CHECKS persisted. Versioned policies/consent and EN/BN routes/metadata/brand passed; root locale and prefetch-cookie races fixed. Owner email-code recovery and mandatory AAL2 plus restrictive direct-Storage policies (even against legacy allow-all) locally verified. Transactional owner-alert queue/fenced worker/retries and safe TLS SMTP adapter added; no real email. Strict CI/runtime, checks and encrypted app DB/photo restore (16 tables/1 actual decoded fixture photo) pass. Latest sequential50/50+production4/4, lint/typecheck/build/postbuild/no-drift, Docker UID1001/HTTP health/assets/pages and dummy-cert nginx syntax pass. Production audit0; full5 high upstream entries retained. Full Supabase/hosting/off-site/merchant acceptance remains external. Prior fixture-overlap orchestration corrected to serial final gates.

- 2026-10-11: Read project authorities and audit; initialized resolution tracker and sequential goal ownership. No bugs marked fixed from code alone. Owner's final correction is new products only.
- 2026-10-11 pause: owner asked to log all fixes/remaining work for tomorrow. Saved the unfinished pricing slice without claiming final validation; synchronized STATS.MD, MIGRATION_STATUS.md and the goal records. All work is local/uncommitted; there is no automatic continuation.
- 2026-10-11 handoff completion: documentation links/goal sections/status counts across 14 files and git diff --check passed. Test database stopped with data retained and no app/test server running. Exact next task is goal 03 pricing final validation after the owner resumes.
- 2026-10-11 access clarification: added ACCESS_REQUIRED.md and synchronized service/status/index/auth/deployment goal records. Sixteen-doc link/section/access-group checks and git diff --check passed. Actual provider setup remains unverified; latest GitHub access/visibility corrected from fresh read-only API results. No app changes/tests or external setup/mutations; implementation pause remains.
- 2026-10-11 documentation cleanup: removed the superseded open-findings table, duplicate credential list and original fix order from this file. Updated README, architecture, deployment, database security, admin bootstrap, testing and the goal 03/05/08/10 current statements that still described removed prototype files or unfinished image upload as current work. No app tests rerun.

## Audit-day record (2026-10-10)

This section records what the audit measured and removed. It is not the current defect list. Current status is the resolution table above.

Before the 2026-10-11 fixes, local probes on a disposable database showed: a granted API role could read a dummy order and mark its payment paid; publishing accepted an invalid photo key and a product with no active variants; cancelling an order left stock at zero; a dropped checkout response plus reload created a second order; a cart whose quantities summed past 100 disappeared on reload. Those probes used rolled-back fixtures. The resolution table records which of them now have local regressions.

### Cleanup performed

Removed 17 obsolete files: `index.html`, `shop.html`, `checkout.html`, `order-success.html`, the legacy stylesheet and three scripts, three old PNG logos and three duplicated SVGs under `assets/`, `public/logo.png`, `public/logo-full.png`, and the unused `src/features/checkout/payment-boundary.ts`. Active SVG branding, application modules, SQL migrations, tests, Docker/proxy artifacts, goal files and operational docs stayed. The demo seed's 24 products and nine categories moved to `fixtures/demo-catalog.json` before `products.js` was deleted; the seed parses JSON. The old design is in Git history at the audit-start commit. Orphan CSS for unused `.gold`, footer `strong` and brand `strong`/`small` selectors was removed after checking active markup.

Production `npm start` had been returning 404 for logo, CSS and JavaScript. `scripts/prepare-standalone.mjs` now runs from `postbuild` and copies `public` and `.next/static` into the standalone artifact. After rebuild, those probes and health returned 200. Legacy `.html` URLs return 308. The root `data-scroll-behavior="smooth"` attribute was added after the browser test reported the Next navigation warning.

### Checks run that day

- `npm ci`, migrations 0000–0005, lint, typecheck and build passed. `npm test`: 28 passed, 0 skipped. Production `npm audit --omit=dev`: 0 findings. Full audit: 9 development advisories (4 moderate, 5 high).
- JSON seed twice: 9 categories, 24 products, 24 variants, 24 image rows, 0 published.
- Chromium end-to-end passed 1/1 after installing the matching browser (390/800/1280, English/Bangla, keyboard cart, tampered, invalid, out-of-stock, persisted COD).
- Standalone health, logo, CSS and JavaScript returned 200. `git diff --check`, local Markdown links, required goal sections and a common secret-signature scan passed. At that moment goal 10 was the active goal. The later pause set zero active goals.
- Docker build, nginx TLS validation, live Supabase Auth/Storage, a full visual baseline, live deployment and a restore drill were not run. Temporary audit scripts, the audit database container and generated reports were removed afterward.

Live credentials and provider setup are listed in [ACCESS_REQUIRED.md](#access-required). COD needs no payment-merchant credentials.

## Fix log

### 2026-10-11 — Goal 08 security/reliability slice

- A01: all twelve current app tables use Drizzle RLS. Migration 0006 revokes PUBLIC/anon/authenticated/service_role privileges. Granted non-owner permission regression verifies denied reads/mutations even after accidental grants. Live provider application is pending owner access.
- A11/A12: PostgreSQL atomic, expiring hashed counters replace the process Map/shared unidentified bucket; visitor cookie isolates fallback customers and proxy IP trust is explicit. Preview and catalog now have budgets. Body stream has a deadline and responds 408 on timeout. Checkout retry recovery will be refined under 04.
- A14: cached per-request settings read fails to an honest contact-free shell, global root error has independent bilingual recovery, and Next error handler now uses documented retry(). DB client has connect/statement/lock timeouts. Built login with unavailable DB returned HTTP 200.
- Validation: first full run had 30/31 tests pass; one counter test exposed Date serialization in raw SQL. Changed bound timestamps to ISO strings, six focused regressions passed, then full 31/31 passed with zero skips. Lint/typecheck/build and Drizzle no-drift passed. Browser gate subsequently passed 1/1; proceeding to goal 04.

### 2026-10-11 — Goal 04 checkout/cart slice

- Added private HttpOnly checkout recovery cookie and status/ack endpoint, using the same DB advisory key as order placement. Cookie is retained until the browser receives and acknowledges the saved reference. Fields freeze during submission; no PII is stored in local/session storage. Lost response followed by recovery outage and reload now recovers exactly one order.
- Cart writes validate total/line limits, salvage valid corrupted lines and fall back to tab memory; add feedback reflects actual changes. Successful order navigation cannot throw on browser storage failure. Bangla phone digits normalize correctly; field errors are associated and focus the invalid field.
- 0007 delivery areas assign server-owned fee zones, with protected admin configuration and immutable order area snapshots. Browser-supplied zone/price flags remain rejected. Owner confirms delivery across Bangladesh; actual coverage/rates are not seeded/guessed. Exclusive singleton settings/zone locks changed to shared locks.
- Validation: full 34/34 tests passed before final area assertions; focused 10/10 then passed with final area assertions. Initial browser run 1/2 failed from the new two-element error selector; fixed selector, rerun 2/2 passed including lost-response recovery. One focused run overlapped E2E fixtures and failed 9/10; rerun in isolation passed 10/10. Lint/typecheck/build/diff/no-drift passed. Live admin settings/provider verification still external.

### 2026-10-11 — Goal 07 inventory/order slice

- 0008 records whether a new order item reserved stock; cancellation restores all reserved quantities and logs movements in one locked transaction, exactly once. Unknown legacy reservations are explicitly rejected for review instead of guessed. Full purchase item snapshots have a DB immutability trigger.
- Added delivery_failed, return_requested and returned transitions. Returned inventory is restored only after explicit admin confirmation that all items are received and sellable as new. COD not collected is recorded as failed; actual full refunds of previously paid returned orders are manually confirmed/audited, never pretend gateway payouts.
- Admin can store courier/reference and view inventory/payment history. Private customer success page includes item receipt and courier reference without name/phone/address exposure. Policy content/configuration remains for the next 08 slice.
- Validation: 5/5 focused stock/order tests incl. two concurrent cancellations; full 36/36 tests zero skips, lint/typecheck/build/diff/no-drift, E2E 2/2 passed. First snapshot assertion needed Drizzle cause inspection, and checkout DB parameter type needed transaction-compatible narrowing; both fixed/rerun. Live owner admin/browser verification remains external.

### 2026-10-11 — Goal 06 media/catalog slice

- Real JPEG/PNG/WebP input signatures, 5 MiB/16M-pixel bounds, animation rejection and stripped WebP normalization. Generated owned random keys, verified timestamp/content hash, current object-byte checks before publish, ten-photo limit, ordering/primary/removal controls and safe orphan cleanup events.
- Normal Storage actions use signed-in admin JWT; no privileged Storage key needed. Reviewed SQL policy artifact restricts upload to whitelisted existing users and real-product namespace; anonymous/nonmember writes denied and membership revocation enforced. Auth cookies explicitly HttpOnly and Secure in production, provider fetch bounded/no-store. Live bucket/project configuration still not verified.
- Replaced manual attribute JSON with key/value rows, blocked prototype/duplicate keys, added admin SKU/name/status/category filters and stock summary. Removed nested admin main landmarks. Inventory-tracking mode cannot change while unfulfilled orders reserve that variant; stock/price history preserved.
- 0009/0010 media columns applied locally; Sharp 0.35.5 explicit dependency. Five focused decoder/owner-lifecycle/SQL-policy tests passed; full 39/39 zero skips, lint/typecheck/build/diff/no-drift, E2E2/2 passed. Media adapter uses real sample pixels + local object store; Storage identity policies modeled in SQL, not a live Auth/bucket session. Product owner browser journey on actual provider remains external.

### 2026-10-11 — Goal 03 pricing slice, saved with final validation pending

- A09: cards and database price sorting now resolve the minimum price among available active variants, with maximum price for a truthful "From" display. If all active variants are unavailable, their prices remain visible with unavailable state. Detail data retains the base price solely for variants that inherit it. Unsupported compare-at discounts are suppressed when variant prices differ; SKU is included in public detail data and structured data consumes the effective price.
- Small goal 04 dependency: preview emits a fingerprint of server-derived item quantities/prices, delivery area and totals. Submit re-derives current values and rejects stale totals with PRICE_CHANGED before creating an order. Checkout refreshes the summary and requires another click after review; browser totals remain non-authoritative. The existing same-key order recovery happens first. Fixture inputs were updated for the required quote hash.
- Validated 2026-10-11 after owner resume: focused 8/8, full 39/39 zero skips, price-review E2E 1/1, checkout/recovery E2E 2/2, lint/typecheck/build/postbuild/no-drift/diff-check pass. A09 is FIXED_LOCAL.
- Owner requested pause and tomorrow's continuation before this milestone's final gates. No further implementation or new app tests were started for the handoff.

<!-- END PRESERVED SOURCE: docs/PROJECT_AUDIT.md -->

---

<a id="store-operating-plan"></a>

<!-- BEGIN PRESERVED SOURCE: docs/STORE_OPERATING_PLAN.md -->
# Monechai store, checkout, privacy and payment plan

Owner discussion and implementation authorization: 2026-10-11. This is the durable record of the product/account/payment Q&A, not a claim of live setup. Owner asks to finish independent code/local checks first, then provide one consolidated owner setup checklist. Preserve all existing catalog records; do not remove products as cleanup.

## Business and two website areas

- Single owner, Sami, selling new products only across Bangladesh. No multi-seller accounts, commissions or payouts.
- Public storefront for products/search/cart/guest checkout and a limited private order receipt.
- Protected `/admin` for owner product/category/photo/stock/order/settings management. Authentication plus server-side membership checks are required at every privileged operation.
- Buyers do not need a Monechai account. Payment-provider authorization is separate from a store account. Optional customer accounts/saved addresses/history are future scope.
- Domain purchased at Spaceship; keeping registration there is compatible with a separate app host and Supabase backend. Hosting/backend/DNS setup is unverified.

## Adding and managing products

Owner signs in → Products → New → enters category, English/Bangla text, unique slug/product SKU, BDT price, first variant SKU/label and total stock → saves a draft → uploads photos/adds variant options → selects primary photo → publishes. Product creation does not require source edits.

- Slug is the readable product URL part; SKU is an internal unique product/option code.
- Variant means a purchasable option such as color/size, with independent stock and optional price override. One Default variant is sufficient for a product with no options.
- Stock edits set the total available quantity, not an increment. Server transactions enforce inventory at purchase. Past orders preserve immutable names/options/prices.
- Drafts are private. Publishing requires a verified current primary photo and an active variant. Published tracked zero-stock products are unavailable to purchase.
- Categories are managed in admin. Unpublishing/archiving hides a product without rewriting past orders.
- Existing products stay. Existing demo records remain unverified drafts and cannot be published as real merchandise; create separate real listings with approved assets.

## Images and backend

Upload through the product's admin edit page; the app writes image bytes to Supabase Storage and links/order/primary metadata to PostgreSQL. JPEG/PNG/WebP input, 5 MiB/file, ten photos/product; bounded real decoding and WebP normalization. No routine direct bucket upload or separate image vendor is required.

Current stack needs one working Supabase backend (hosted or independently provisioned self-hosted): PostgreSQL for products/orders/settings, Auth for owner identity, Storage for product images. Local tests use disposable PostgreSQL and image/policy adapters, not an accepted owner project. Independent backups must include database and photo bytes.

## Buyer separation and privacy

- No public order list or lookup of full customer records by sequential ID/order number/phone.
- Separate database order rows and browser-specific cart/recovery state. Cart storage contains variant IDs/quantities, not permanent name/phone/address/payment credentials.
- Limited receipts use random 256-bit bearer links and expose purchased items, amounts, status and optional courier reference, never name/phone/address/note.
- Anyone holding a private receipt URL can read that limited receipt. This is not identity verification. Protect responses from shared caches/referrer leakage/indexing and do not log tokens. On a shared browser, the next user can see the saved cart or retained receipt link.
- Full customer information is restricted to authorized owner admin operations.
- Phone OTP or another verified ownership mechanism is required before any future customer address display, order edits, phone-based lookup or past-order history. OTP/customer accounts are not silently added to the current limited receipt scope.
- Regression coverage must verify unrelated receipt tokens, nonexistent/invalid tokens, PII omission and denied admin/database access. Live provider checks remain separate.

## Payments

Owner mail code now has a transactional leased/retry queue and TLS SMTP worker, with private admin queue/status/retry controls. Configure sender/owner mailbox/worker scheduler and verify delivery before acceptance; no real email has been sent. Customer confirmation channel remains owner-approved manual call/WhatsApp or a separately integrated provider.

COD remains the real implemented method: create transactional order with pending payment, courier collects, owner records verified collection/failed collection/refund through authorized audited transitions. No fake bKash/Nagad/card buttons.

Online payments are a provider-gated milestone (goal 11). Choose approved gateway/merchant onboarding before provider-specific implementation. Examples to evaluate are SSLCommerz or direct bKash; their eligibility, methods, fees and settlement terms require current owner/provider verification.

Online integration must: calculate amount server-side; create pending order/payment attempt; hand off to provider-hosted checkout; validate transaction/order/amount/currency server-side before paid; safely handle redirects, callbacks, retries, duplicate notifications, failures, expiry, stock reservation/release, reconciliation and refunds. Browser redirects/screenshots/entered transaction IDs cannot prove payment. Do not collect wallet PINs/card credentials in Monechai.

Supabase persists records; the payment provider moves money. A buyer can pay as a store guest. Real gateways require merchant approval and scoped secret credentials; generic code does not establish a working integration.

## Ownership and next setup

- Goal 04: guest checkout/recovery/receipt privacy; goal 05: owner Auth/recovery/MFA; goal 06: product/media admin.
- Goal 07: delivery/COD/order notification operations; goal 08: locale/SEO/branding/policies/security.
- Goals 09/10: local checks/CI/deployment/backup/alerts; goal 11: selected real online gateway.
- Exact existing/planned credentials and public/business inputs: [ACCESS_REQUIRED.md](#access-required). Account passwords, wallet PINs, OTPs, MFA seeds/recovery codes and secrets must not be pasted in chat or committed. Secrets belong in ignored local env/provider secret storage. Owner can perform dashboard setup without sharing a password.
- Owner will supply accounts, credentials, policies and assets after independent code/local work is complete. No provider account purchase, DNS change, real payment or deployment is implied by local fix authorization.

Official payment reference: [SSLCommerz integration](https://sslcommerz.com/integration-document/) and [validation](https://developer.sslcommerz.com/docs.html); [bKash merchant information](https://www.bkash.com/en/business/merchant).

<!-- END PRESERVED SOURCE: docs/STORE_OPERATING_PLAN.md -->

---

<a id="owner-setup-checklist"></a>

<!-- BEGIN PRESERVED SOURCE: docs/OWNER_SETUP_CHECKLIST.md -->
# What Sami needs to provide after local code work

Owner requested independent code/checks first, then this one checklist. Existing products stay. Guest buyers need no store account; only the owner has protected admin access. Registrar is Spaceship. Local code/tests are distinct from provider setup and accepting real orders.

## Current Supabase handoff — 2026-10-11

[All completed Supabase setup and exact remaining/resume steps](SUPABASE_SETUP_HANDOFF.md) are saved. New project `lmrdvenrchsnueztzcdi` is provisioned with13 migrations/16 RLS tables, scoped runtime role, products bucket/policies and initial Auth settings. Public key/origin and secret connections are already privately configured; don't request or paste them again. The existing Lead project stays untouched.

**PAUSED:** User will log into the friend's intended Gmail/Supabase and resume later. Designated store-admin email is unknown; **add it later**. Verify the friend can access this exact project before further actions. Actual owner bootstrap/MFA, custom SMTP/code template, real product/customer acceptance and production setup remain.

## 1. Backend and owner access — remaining identity dependency

The hosted backend and connection values below are already configured locally. The confirmed owner identity is pending. Keep the values in ignored environment/provider secret storage; do not create a duplicate project or post secrets in chat.

| Variable / input | Purpose | Where to obtain it | Public or secret |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Actual Auth/image API origin | Supabase project Connect dialog; configured HTTPS API origin if self-hosted | PUBLIC |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public project key used with your own sign-in session | Supabase Connect / Settings → API Keys | PUBLIC; never use a service-role/secret key here |
| `DATABASE_URL` | Server database access | Connect; runtime role/grants reviewed per database-security.md | SECRET |
| `DIRECT_URL` when migration access is separate | Reviewed schema migrations/owner bootstrap | Connect direct/session connection with migration permissions | SECRET |
| Confirmed owner Auth email/user | Your admin login and whitelist identity | Authentication → Users; create the owner user in your account | Private identity/configuration; sign in personally |

Confirm the variable **names** are configured, and grant a scoped project/dashboard session or perform the dashboard steps yourself. The implemented login/media path needs no service-role key or new MCP server. App uses `.env.local` automatically through Next; standalone operations/migration commands need exported environment or Node22 `--env-file=.env.local` (Drizzle config does not load env files itself). Never share your login password, MFA code/QR/seed, wallet PIN, SSH private key or broad account password.

Migrations0000–0012 and the `products` bucket/restrictive owner-membership/AAL2 policies are already applied. Next create/bootstrap the real owner whitelist and perform actual login → authenticator setup → add draft → upload → publish → storefront → customer order → admin operations/revocation checks. Real photos are uploaded through admin; normal product entry requires no code edits. Local placeholder/demo records remain in place and are not silently published as real stock.

## 2. Domain and hosting

- **Exact purchased domain/desired canonical hostname**, and whether DNS is currently managed at Spaceship or elsewhere. `NEXT_PUBLIC_SITE_URL` is the PUBLIC canonical HTTPS origin, such as your actual chosen `https://…` hostname.
- Spaceship dashboard/DNS setup capability, or perform the record changes yourself. Domain registration can stay at Spaceship. No Cloudflare account/token is required unless those capabilities are selected.
- Tell me whether hosting already exists. Otherwise choose the host/backend route after we evaluate the actual commercial limits/cost and Bangladesh latency. No provider has been purchased by this code work.
- For a VPS: approved deploy user/host/SSH access via an authorized session or public-key grant. For a managed host: scoped project/collaborator access for builds/env/domain. GitHub write/Actions access to the correct repo is needed to push changes/run CI; intended repo visibility must be verified. No new broad token is necessary merely to discuss setup.

## 3. Real store/business information

Provide the actual public store name, hotline/support email/WhatsApp number and any public business address. Provide approved delivery areas, **fees**, estimated times, courier dispatch/tracking/COD settlement process, returns/refund/exchange/warranty rules, privacy and terms. Do not substitute guessed fees or legal/business promises.

The admin now has policy publishing fields; all four English policies are required before new checkout. Optional approved Bangla text is supported with an explicit English fallback. Each order records consent to a retained policy revision; customers must reaccept changed policies. Tell me how you want to confirm orders with customers (manual call/WhatsApp initially is supported by the operating plan; automatic customer SMS/email requires a selected channel/integration). Receipt URLs are bearer links: anyone with the private link can read its limited receipt, never customer name/phone/address. More sensitive customer lookup/history/edits requires separate verified ownership before implementation.

You can leave product assets for later admin entry: actual photos, EN/BN name/description, category, SKU/options, price and physical stock. Existing products are preserved; no need to re-upload everything just to configure the backend.

## 4. Mail, recovery, owner order alerts and operator alerts

One SMTP provider can supply both Supabase Auth mail and app/operator alerts, subject to its actual allowed sender/limits. Provide/authorize a verified sending domain/address and real recipient mailboxes.

| Value | Purpose and placement | Visibility / obtain from |
|---|---|---|
| SMTP host/port/user/password in **Supabase Auth SMTP settings** | Owner recovery email | Password SECRET; mail provider's SMTP credentials page |
| Reset password email template with `{{ .Token }}` | Six-digit recovery code for `/admin/recovery`; see admin-bootstrap.md. Dashboard currently requires custom SMTP before template editing. | Supabase Auth email templates; after SMTP configuration |
| `SMTP_HOST`, `SMTP_PORT` (465/587), `SMTP_USER`, `SMTP_PASSWORD` | App and operator SMTP delivery | SMTP password SECRET; server/private scheduler env only |
| `EMAIL_FROM` | Verified sender | Provider-approved address; public business sender |
| `ORDER_ALERT_EMAIL` | Owner order notifications | Your real private recipient mailbox |
| `OPS_ALERT_EMAIL` | Health/backup/worker failure alerts | Your real private recipient mailbox |
| `ORDER_WORKER_SECRET` | Authorizes private order-alert scheduler calls | SECRET; generate a random value of at least32 characters into server/scheduler secret storage |

You enroll the authenticator yourself; don't send its secret. We verify real recovery delivery, MFA, logout/revocation, queued order-alert retry and a deliberate operator incident after setup. Provider acceptance alone is not inbox delivery. Customer email collection/receipts are not implicitly enabled by configuring SMTP.

## 5. Backups and monitoring

Choose an **independent backup destination**, retention and acceptable data-loss/recovery windows. Provide scoped upload/storage authorization only for that destination; exact provider variables follow the chosen R2/S3/other route. Local encrypted export/restore code exists, but independent upload, actual full Supabase Auth/bucket/role recovery and host scheduling must be configured/tested with your provider. Keep encryption/recovery material separate from the stored backup.

- `BACKUP_DATABASE_URL`: SECRET scoped backup connection from backend/Connect.
- `BACKUP_OUTPUT_DIR`: private encrypted staging directory outside source/web paths.
- `BACKUP_SUPABASE_URL`: PUBLIC backend origin, normally same as `NEXT_PUBLIC_SUPABASE_URL`.
- `BACKUP_ENCRYPTION_PASSWORD`: SECRET strong independent phrase (at least20 characters), stored privately by you.
- `BACKUP_PG_IMAGE`: approved official CLI version matching actual PostgreSQL.
- `HEALTHCHECK_URL`: configured `/api/health` address for operator checks.
- Owner-controlled external uptime monitor and alert recipient; no mandatory vendor. Configure/test independent host/error incident detection and retention. [OPERATIONS_CHECKS.md](OPERATIONS_CHECKS.md) explains scripts, scheduler examples, scope and verified local restore boundary.

## 6. Online payment — provider choice required

Tell me **COD-only for initial launch, or COD plus online payments**, and whether you already have an approved gateway/merchant account. For online payments, supply the selected provider, merchant approval and sandbox access first; exact environment-variable names come from its official integration and go into server secret storage. Production gateway credentials/settlement/refund rules/callback domain follow sandbox validation. No wallet PIN/card credentials are needed by Monechai.

Goal11 tracks initiation/verification/notification/idempotency/expiry/inventory/reconciliation/refunds. No online payment UI is shipped as real functionality before integration. A buyer can pay as a store guest. SMS/phone OTP is only an additional decision if future customer data/history/edit features require it; current limited receipts don't silently create customer accounts.

## What can happen once these are ready

First connect the backend and your owner account; then enter approved store policies/rates/contact and real products/photos; verify actual owner/customer/security flows; configure host/domain/mail/backups/monitoring; complete gateway sandbox acceptance if selected; finally perform the separately authorized deployment/launch checks. Public values may be shared normally; secrets should be configured privately, then tell me the names are ready. No production readiness claim follows from merely supplying keys.

<!-- END PRESERVED SOURCE: docs/OWNER_SETUP_CHECKLIST.md -->

---

<a id="access-required"></a>

<!-- BEGIN PRESERVED SOURCE: docs/ACCESS_REQUIRED.md -->
# Monechai — remaining work and external access required

Current owner handoff: [OWNER_SETUP_CHECKLIST.md](#owner-setup-checklist). Latest implementation/operations: [STORE_OPERATING_PLAN.md](#store-operating-plan) and [OPERATIONS_CHECKS.md](OPERATIONS_CHECKS.md). Older proposed vendor-specific variables below are historical options, not a requirement to open every vendor account.

Updated **2026-10-11** after the owner asked how fixes were possible without providing Supabase credentials. This is an access and readiness checklist; owner resumed independent implementation on 2026-10-11; external setup follows local code/checks. No accounts were created, connected, purchased or changed for this clarification.

## What happened without provider access

The workspace already provides Node/npm, Git, Docker and browser-test tooling. A disposable local PostgreSQL 17.10 database held dummy products, delivery settings and orders. Tests exercised real SQL migrations, transactions, stock, order recovery and permission denial against that local database.

Image tests decoded real sample files and used a local object-store adapter; Storage policies were checked with modeled SQL identities. Admin policy tests do not establish a real Supabase Auth session. Customer browser fixtures inserted catalog data directly, so they do not prove the owner upload/publish journey.

**No owner Supabase project has been connected or verified.** Auth/Storage integration code and policy artifacts are written, but actual setup and acceptance remain blocked. There is no claim of a working production integration. The stopped local test database and restart details are in [STATS.MD](../STATS.MD).

## Remaining work

The [audit's current resolution table](#project-audit) records16 FIXED_LOCAL findings,A15 CLOSED_SCOPE and four unresolved IDs (A16/A17/A18/A21):

| ID | Remaining implementation / acceptance |
|---|---|
| A16 | Policy authoring/pages/immutable consent and durable SMTP owner-alert code pass locally. Actual approved policies/rates/ETA/contact, mailbox/inbox/scheduler and customer contact workflow remain. |
| A17 | Actual Auth member/nonmember/logout/revocation, owner create/upload/publish/storefront and customer/order/admin/return journeys; real-image/locale/visual/accessibility verification. |
| A18 | Production audit0; esbuild override removed4 moderate. Full5 high unpatched braces-chain/version entries remain despite reviewed string-pattern mitigation; ESLint10/React-plugin compatibility also upstream. No credentials resolve this gate. |
| A21 | CI/strict tests/runtime/ops/SMTP/scheduler/Docker/nginx code checked locally. Actual host/DNS/TLS/mail/GitHub execution/off-site upload/full-backend restore/monitoring/inbox/launch acceptance remain. |

Owner password-recovery/TOTP/AAL2 code now exists; actual SMTP template/provider/enrollment/recovery acceptance remains. SMTP/backup/monitoring job code now exists; actual providers/independent upload/full-backend restore/schedules/inbox acceptance remain. Turnstile is optional if retained. Keys alone do not complete provider acceptance. Goals 05/06/07 remain blocked on actual owner/backend acceptance even where local code fixes passed.

## 1. Backend: Supabase PostgreSQL, Auth and Storage

Provide one usable backend: a hosted Supabase project, or a self-hosted Supabase installation on the selected VPS. Hosted account access is not required if the self-hosted route is selected; that route needs its own provisioning and secret configuration first. Prefer isolated staging data for acceptance.

| Value/access | Purpose | Obtain from | Visibility / placement |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Auth and product-image API origin | Hosted project's Connect dialog; otherwise configured self-hosted HTTPS API origin | PUBLIC; current app supports it, build and runtime. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public client key used with the signed-in user's session | Hosted Connect or Settings → API Keys; compatible public key for selected self-hosted setup | PUBLIC; current app supports it, build and runtime. |
| `DATABASE_URL` | Server catalog/orders/settings connection | Hosted Dashboard → Connect, selecting the appropriate connection; provision a scoped runtime role | SECRET; app runtime, never a public variable. |
| `DIRECT_URL` if a separate migration connection is used | Apply reviewed schema migrations | Connect dialog, direct or suitable session connection with migration privileges | SECRET; migration environment. Current migration tooling supports it. |
| Owner dashboard/administrative setup capability | Auth settings, first-admin bootstrap, Storage bucket/policies and permissions review | Owner-authorized project session or scoped project access; owner may perform the setup steps | Account authorization; no app variable needed. |
| Confirmed owner Auth user/email | Actual login and admin whitelist | Authentication → Users; [bootstrap instructions](admin-bootstrap.md) | Owner signs in personally; do not collect password or MFA seed/recovery codes. |
| `products` Storage bucket and real photos | Actual upload/primary/reorder/delete/publish acceptance | Storage dashboard, [image setup](product-images.md), reviewed `ops/supabase-storage.sql` | Existing backend and owner assets; no separate image vendor needed. |

Current official key instructions use **Settings → API Keys** or **Connect**. See [Supabase API keys](https://supabase.com/docs/guides/api/api-keys) and [database connection methods](https://supabase.com/docs/guides/database/connecting-to-postgres). Database transport (`DATABASE_SSL`) and connection mode are chosen with the deployed network.

**The implemented login/normal image flow does not require a Supabase secret/service-role key.** It uses the public project key plus the authenticated owner session. A Supabase account access token/MCP connection is optional administration tooling, not required to run the store.

## 2. App hosting

Choose one deployment route before collecting provider-specific credentials. No provider has been selected/provisioned.

- **Linux VPS:** host/IP, SSH port, a deploy user authorized for the required setup, and SSH access through an owner-approved key/session. Deployment needs Docker/Node, persistent backend storage if self-hosting, proxy/TLS, restart/updates, backups and health checks.
- **Managed host:** owner-authorized project dashboard/CLI access and permission to configure builds, domain and environment values instead of VPS SSH.
- `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` are proposed CI names, not an existing deployed pipeline. Any SSH private key is SECRET and belongs in protected local/CI credential storage.

The [hosting research](#production-services) has the cost/limit comparison; published prices are not an order or a selected plan.

## 3. Domain / DNS / Cloudflare

Owner confirmed on 2026-10-11 that the purchased domain is registered at **Spaceship**. Actual hostname, active nameservers/DNS records and account setup access have not been verified in this clarification. Registrar choice does not select app hosting or require Cloudflare.

Need the actual purchased domain, canonical HTTPS hostname, registrar/DNS provider and authority to set its records. `NEXT_PUBLIC_SITE_URL` is PUBLIC and already supported by the app. DNS access also enables sender verification and TLS setup.

Owner dashboard setup is sufficient. If automating Cloudflare DNS, use a zone-scoped `CLOUDFLARE_API_TOKEN` (SECRET, deployment tooling only); this is not an app requirement. Preserve existing mail/DNS records. Cloudflare account/zone access is needed only for the capabilities chosen there.

## 4. Auth email, recovery, order alerts and support

Need one SMTP-capable provider, for example the previously proposed Resend or an existing equivalent, a verified sender domain/address, SMTP host/port/user/password, and a real owner/support recipient mailbox. Put SMTP credentials in Supabase's Auth SMTP configuration (or the self-hosted Auth environment); no current Monechai SMTP environment variables exist.

The official [Supabase custom SMTP instructions](https://supabase.com/docs/guides/auth/auth-smtp) cover these values; the default sender is intended for non-production use. App recovery/MFA code and offline policy tests exist; configure the six-digit recovery-code template per admin-bootstrap.md and verify real email/enrollment/session behavior.

If direct order-alert email is chosen, the current implementation uses provider-neutral `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`, `ORDER_ALERT_EMAIL` and `ORDER_WORKER_SECRET` rather than a Resend API integration. SMTP credentials/token are secret; see OWNER_SETUP_CHECKLIST.md. Checkout currently has no customer email field; agree on the actual confirmation channel (manual WhatsApp/call or an implemented notification adapter) rather than implying SMTP provides customer receipts automatically.

## 5. Bot protection

Durable application rate limits are implemented. Turnstile is the proposed additional provider and is not integrated yet. If retained, need a widget configured for the store hostname, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (PUBLIC) and `TURNSTILE_SECRET_KEY` (SECRET server value). Obtain from Cloudflare Dashboard → Turnstile. The app must implement and test server-side token checks; see [official setup](https://developers.cloudflare.com/turnstile/get-started/).

## 6. Independent backup destination

Need a private backup destination independent of the app's VPS/backend, a retention plan and owner-approved recovery/data-loss targets. R2/S3-compatible storage is one option; an existing suitable independent target can be used instead.

If R2 is selected, obtain a bucket, account endpoint and bucket-scoped access key ID/secret from Cloudflare R2 token management. See [official R2 credentials](https://developers.cloudflare.com/r2/api/tokens/). Proposed backup-job names: `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `BACKUP_BUCKET`, `BACKUP_ENCRYPTION_PASSWORD`. Credential/encryption values are SECRET, stored in the backup job; these are not supported app variables yet. Encrypted app-schema/photo export/isolated restore and unenabled scheduler/failure-alert code now exist; chosen off-site upload, full Supabase service recovery and actual schedule/recipient delivery still need setup/testing.

## 7. Monitoring and error alerts

Need an owner-controlled external uptime monitor and verified alert recipient; UptimeRobot was proposed, an equivalent can be selected. Dashboard access suffices; an API key is only needed for automation. Need a server-error collection/alert mechanism as well: Sentry was proposed, or an adequately implemented logs/alerts alternative.

If using Sentry, obtain project access and its DSN. Proposed names `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` identify the reporting endpoint, and `SENTRY_AUTH_TOKEN` is a SECRET build/CI token if source-map/release upload is used. No Sentry SDK is required/installed; existing body-free app events plus operator SMTP failure hooks need chosen host/external monitoring and redaction/incident delivery acceptance. See [Sentry authentication](https://docs.sentry.io/api/auth/). Test incident delivery and PII/token redaction are still required.

## 8. GitHub / CI / release access — fresh check

Read-only checks on 2026-10-11 found:

- Current `gh api user` identity: **Sami-754**.
- `contactshawonhasan-oss/Monechai-website`: **PUBLIC**; current identity has **READ/pull only**, not push/admin permission.
- This differs from the older private-repository checkpoint. The checks did not establish when/why visibility changed; no visibility, collaborator or remote-source change was performed.

Need owner-authorized write access to the correct repo to publish reviewed changes; settings/Actions/environment authorization is needed for CI/deployment secrets and any intended privacy correction. Existing authorized `gh` login may be switched by the owner or the current user can be granted suitable repository access. Do not create/collect a new broad token unnecessarily. Repository authorization is not an application environment variable.

## 9. Courier / COD fulfillment and business information

Need the selected Bangladesh courier's merchant/pickup workflow, approved delivery charges/coverage/ETA, tracking method and COD settlement/failed-delivery/returns process. Manual portal dispatch and manual tracking entry can be used without a courier API. API credentials are needed only if automated courier integration is selected, with provider-specific names agreed then.

Owner inputs also required: real new-product photos/SKUs/prices/stock, brand/contact/WhatsApp/support details, EN/BN product copy, shipping/returns/refund/warranty/privacy/terms content and the chosen notification workflow. These are business configuration/assets, not API secrets. A basic WhatsApp contact link needs the verified number, not a WhatsApp Business API token. COD requires no online payment merchant keys; real bKash/Nagad/card integration would be a separate scoped task.

## How to provide access

Set public values and secrets in an ignored local environment file or the selected provider's environment/secret manager; confirm the variable names are configured without posting secret values. Use owner-approved dashboard sessions, collaborator grants and SSH authorization as appropriate. Never commit secrets or send account passwords/private keys in chat. No new MCP server is required.

**Next setup dependency:** choose/provide one usable backend and authorized owner setup; confirm domain/DNS and intended host. GitHub authorization/privacy also needs owner verification. A09 local pricing validation is complete. Independent local code/checks are complete; owner will supply setup/access afterward. See [store operating plan](#store-operating-plan) and [provider-gated online payment goal](#goal-11).

<!-- END PRESERVED SOURCE: docs/ACCESS_REQUIRED.md -->

---

<a id="production-services"></a>

<!-- BEGIN PRESERVED SOURCE: docs/PRODUCTION_SERVICES.md -->
# Production services, tools and hosting decision

Research date: **2026-10-11**. Prices/limits are vendor snapshots, not a purchase quote. Recheck the chosen billing region, commitment/renewal price, tax, inventory and usage allowances immediately before ordering.

## Owner requirements and current decision

- Monechai is a **single-owner resale store**; only Sami sells **new products**, delivered across Bangladesh.
- Owner confirmed the domain is **already purchased**. Registrar is Spaceship per owner; exact hostname/DNS authorization still need verification; no domain purchase is needed for this plan.
- Owner requires **complete production readiness**, rather than a working demo or a build that passes locally.
- Owner asked for the **cheapest viable hosting**, including genuine free options; Linux VPS is a candidate. No hosting provider, paid plan, self-hosted Supabase deployment or purchase has been authorized/selected by this document.
- Current code uses Next.js/Node, PostgreSQL/Drizzle and implemented Supabase Auth/Storage adapters. Actual owner Auth/Storage acceptance is unverified. Existing deployment docs assume managed Supabase. Self-hosting needs its own operations artifacts and acceptance before replacing that runbook.
- COD is the current implemented payment scope. Courier operations are required; an automated courier API and online payment gateway are separate choices.

## Actual integration status and access

See [remaining implementation and exact access required](#access-required) for the current checklist. Local fixes used disposable PostgreSQL, dummy browser fixtures, a local media adapter and modeled SQL identities. No owner Supabase backend has been connected/accepted. Recovery/MFA, policy consent, SMTP owner outbox and operations/backup/monitoring job code now exist and pass local checks. Actual account/SMTP/scheduler/independent upload/full-backend restore and recipient acceptance remain. Turnstile is optional provider-gated scope. See OWNER_SETUP_CHECKLIST.md and OPERATIONS_CHECKS.md; independent code is finished, awaiting owner setup.

Fresh read-only GitHub checks on 2026-10-11: CLI user `Sami-754`, target `contactshawonhasan-oss/Monechai-website` PUBLIC with READ/pull only, no push/admin. This differs from the historical private/owner-access checkpoint. Owner authorization/intended visibility must be verified before release/CI; no remote changes were made.

## Hosting comparison

| Route | Published starting cost / limitations | Fit for this project |
|---|---|---|
| Netlify Free + Supabase Free | $0 within allowances. Netlify Free currently has 300 monthly credits and pauses projects if allowance is exhausted. Supabase Free can pause after low activity; managed downloadable backups are limited. | A genuine free development/preview route and possible tiny-store launch with explicitly accepted limits. Not the default dependable production recommendation. Current Next adapter, session, PostgreSQL transactions and quotas must be tested. |
| Linux VPS + self-hosted Supabase | Example: OVH Worldwide advertises an 8 GB / 4-vCore VPS-2 from **$8.50/month**, with IPv4 and daily VPS backup listed as included. More server administration and backup work. | Lowest recurring-bill candidate worth evaluating while preserving the stack. Start evaluation at 8 GB total RAM, benchmark the app and selected backend services. Full Supabase official minimum is 4 GB / 2 cores / 40 GB SSD; recommended 8 GB+ / 4 cores+ / 80 GB+ SSD. OVH example has 75 GB disk, below the recommended 80 GB, so storage capacity/upgrade must be checked. Not a validated capacity guarantee. |
| Small Linux VPS + Supabase Pro | Example: OVH advertises 4 GB VPS-1 from **$4.54/month**; Supabase Pro starts **$25/month** for one Micro instance within included compute credit. Combined starting arithmetic: **$29.04/month**, before relevant tax/usage/add-ons. | Lower database maintenance burden, close to current architecture/runbook. Database and Auth/Storage are managed; app/VPS still needs operations. Provider regional/term prices and available capacity must be verified. |
| Netlify Free + Supabase Pro | Backend starts **$25/month**, host remains $0 within 300-credit hard cap. Netlify Personal starts $9/month if upgrading host. | Cheap managed backend route, but free host exhaustion can still interrupt orders. A production assessment must include traffic/deploy estimates and an upgrade response, or choose paid hosting. |
| Cloudflare Workers | Free: 100,000 requests/day and 10 ms CPU per invocation. Paid starts **$5/month**, plus excess usage. Database/Auth/Storage costs are additional. | Not a drop-in replacement for this standalone Node app. Adapter, Postgres connection lifecycle, proxy/Auth, transactions, image handling and CPU behavior must be proven. Current Cloudflare guide defaults to beta vinext; OpenNext also documents Next 16 support. Do not migrate the runtime solely on a pricing headline. |
| Vercel Hobby | $0, **non-commercial personal use only**. | Exclude for the real commercial resale store. Paid Vercel would need its own total-cost comparison. |
| Render Free | Web service sleeps after 15 minutes without traffic; free PostgreSQL expires after 30 days. | Useful for experiments; not the production order database/hosting baseline. |
| Railway Free / trial | Free includes $1 monthly usage; trial is $5 one-time for 30 days; Hobby starts $5 with usage-based billing. | Does not establish a zero-cost always-on shop. A measured resource estimate is needed before claiming the $5 tier covers the app/database. |
| Oracle Always Free | Free compute depends on available capacity; idle instances can be reclaimed. | An opportunistic experiment, not the launch dependency for customer orders. |

**Recommendation:** evaluate an **8 GB-class paid Linux VPS with self-hosted Supabase** if minimizing the recurring bill is the priority and the owner accepts ongoing server/database maintenance. Use roughly **$10–15/month as a provisional planning allowance**, not a guaranteed all-in quote. The managed alternative starts around **$29–30/month** before extras. Do not buy a server before checking account/billing eligibility, region, storage, renewal/term conditions and a recovery design.

A second low-cost benchmark is Hetzner EU CX33: published June-2026 price **€8.49/month** plus **€0.50 IPv4** = **€8.99**, excluding VAT/backups. Its vendor listing specifies 4 vCPU / 8 GB / 80 GB. However the scraped product page reports unavailable and omits checkout prices, so it is not a verified orderable offer. Official server backup option adds 20% of server price. EU prices are not Singapore quotes; test Bangladesh latency to the selected origin and keep app/database colocated where practical.

Existing domain acquisition is excluded from monthly hosting estimates; renewal remains an annual operating cost. Courier charges, business mailbox, SMS, larger backup retention, optional PITR, traffic overages, taxes/FX and provider upgrades are not included. Free email/monitoring/backup allowances are usage caps, not unlimited services.

## External accounts and services

Capabilities below are required for the intended production operation. Specific vendors are recommended candidates, not installed/authorized integrations.

| Capability | Proposed tool/service | Readiness requirement | Cost approach |
|---|---|---|---|
| Domain / DNS | Existing registrar + Cloudflare DNS | Verify ownership, renewal, DNS access and canonical host. Preserve any email records. | Domain bought; Cloudflare Free candidate. |
| App hosting | One paid Linux VPS; Netlify as free preview candidate | Build artifact deploy, restart, updates, health checks, capacity and rollback tested. | Pay only for chosen host; do not provision two production hosts unnecessarily. |
| Database | Supabase PostgreSQL, hosted or self-hosted | Reviewed migrations, least-privilege runtime role, secured API permissions, persistent storage and tested restore. | Self-hosted shares VPS cost; hosted Pro starts $25. |
| Admin identity | Supabase Auth from the same backend | Bootstrap owner, member/nonmember/revocation/logout, MFA and working recovery flow. Close public registration where unneeded. | No separate identity vendor required. |
| Product images | Supabase Storage from the same backend | Real image upload/delete/order/primary/publish, authorization, file validation and photo recovery tested. | No separate Cloudinary service required for current scope. |
| Bot/abuse protection | Cloudflare Turnstile + application rate limits | Server-side token validation, hostname/action checks, durable retry handling and rate-limit tests. Keep normal customer checkout usable. | Turnstile Free supports businesses/production. |
| Email delivery | Resend via custom SMTP | Verified sender domain, SPF/DKIM/DMARC, admin recovery/invite delivery. Owner order-alert workflow where implemented. | Free currently 3,000 emails/month, max 100/day; monitor delivery failures/limits. |
| Support mailbox | Existing real mailbox or mailbox provider | Owner must receive/reply to support and monitoring alerts. Sender/API email service is not a full mailbox. | Existing mailbox can avoid a new subscription. |
| Backup destination | Private Cloudflare R2 Standard bucket, or equivalent independent target | Encrypted DB and photo copies, retention/last-success checks, separate credentials and actual restore drill. | R2 Standard free allowance: 10 GB-month, 1M Class A / 10M Class B operations; overages charged. |
| Uptime alerts | UptimeRobot | External site/health monitor and verified alert delivery to owner. | Vendor currently allows commercial use on Free: 50 monitors, 5-minute checks. |
| Error tracking | Sentry Developer, plus structured server logs | Capture server/checkout errors with PII/token redaction; trigger a test incident and verify alert. | Developer currently $0/one user, limited event quota; validate chosen plan during setup. |
| Source / release gates | GitHub private repo + GitHub Actions | Required lint/typecheck/unit/DB/E2E/build/security gates; isolated CI test DB, production secrets separated, release/rollback procedure. | Included CI usage first; track private-repo billing/limits. |
| Delivery / COD settlement | One Bangladesh courier merchant account; Pathao is one candidate | Owner-approved rates, pickup/dispatch, tracking reference, refused/returned parcel process, COD settlement reconciliation. | Shipment/COD service fees are operational costs. Portal/manual entry can precede API automation. |
| Customer support contact | Owner's WhatsApp/phone | Working contact links and business support details. | Basic click-to-chat needs no WhatsApp Business API credentials. |

Supabase's default SMTP is explicitly not intended for production. A custom SMTP provider is required for reliable production Auth email; account recovery code exists; its actual template/SMTP/session acceptance remains. Resend supports Supabase SMTP directly. Customer checkout currently has no email field, so email-provider signup alone does not create customer receipts; choose/use the actual customer notification channel explicitly.

Supabase database backups exclude Storage object bytes. A paid plan or VPS snapshot does not replace a tested database-and-photo recovery process. A single VPS has a shared failure domain for app/backend; it can be operated as a small production store, but it is not high availability. If the required uptime or acceptable data-loss window demands redundant infrastructure/PITR, scope and budget those capabilities explicitly.

## Build and operating tools

These are software utilities, not additional paid customer-facing services:

| Tool | Purpose | Current local inventory |
|---|---|---|
| Supported Node.js LTS + npm | Build/run Next.js and scripts | Installed. Deployment currently targets Node 22; audit host used Node 24.16.0. Pin/validate chosen runtime. |
| Git + GitHub CLI (`gh`) | Source and release administration | Installed; account authorization not rechecked here. |
| Docker Engine + Compose | Reproducible app, test DB and optional self-hosted backend | Installed; Compose 5.6.0 found. No production host provisioned. |
| PostgreSQL + Drizzle ORM/Kit | Transactions, schema and reviewed migrations | npm packages already declared; disposable Docker DB available for local checks. |
| Playwright + Chromium | Browser regression/checkout/admin verification | Already declared and installed during audit. Missing scenarios still need tests. |
| TypeScript / ESLint / dependency audit | Static/security release gates | Already declared; audit found development-tool advisories to resolve. |
| Nginx + Certbot/Let's Encrypt | VPS reverse proxy and automatically renewed TLS | Not on this workstation; existing Nginx template. Install/validate on selected VPS. Caddy is an alternative, not an additional requirement. |
| Supabase CLI | Local backend tooling/exports where useful | Not installed; optional until needed. Drizzle remains the app migration authority. |
| `pg_dump` + encrypted backup tool, e.g. restic | Database export and independent encrypted retention | Not installed on this workstation; can run in version-matched containers. Selected backup flow must include Storage files. |
| systemd timers/cron | Backup jobs, maintenance/heartbeat | Configure on selected host or a controlled external scheduler. No separate automation SaaS is necessary. |
| Cloudflare Wrangler | Workers deployment only if that route is selected | Not required for the ordinary VPS route. |

No MCP server is required for store operation. Official provider connectors/CLIs may help development/administration, but introduce them only for an actual task and scoped authorization. Firecrawl/web research tools are development aids and are not store runtime dependencies.

## Credentials and where they belong

Current app variables are the first five rows. Future integration variables are **proposed names** until the relevant implementation lands; they are not secretly already supported by this app.

| Value / proposed name | Purpose / obtain from | Visibility and placement |
|---|---|---|
| `DATABASE_URL` | Runtime DB connection: hosted Supabase Connect, or configured private self-hosted PostgreSQL endpoint | SECRET, app runtime only; use scoped DB role. |
| `DIRECT_URL` (optional) | Migration connection: hosted Connect or private migration endpoint | SECRET, migration job only; not Docker build args. |
| `NEXT_PUBLIC_SUPABASE_URL` | Auth/Storage origin: hosted Connect dialog or self-hosted HTTPS API origin | PUBLIC, build and runtime. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Hosted Connect / Settings → API Keys, or compatible public key from selected self-hosted setup | PUBLIC, build and runtime; never insert privileged server key. |
| `NEXT_PUBLIC_SITE_URL` | Verified canonical domain origin | PUBLIC, build and runtime. |
| `DATABASE_SSL` | Chosen secure DB transport; current hosted setting `require` | Configuration, not secret. Review self-hosted private-network/TLS setup; never expose an unsecured public DB. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare Dashboard → Turnstile widget | Site key PUBLIC; secret SERVER ONLY. Planned integration. |
| Resend SMTP host/port/user/password | Resend account and verified domain; password is scoped API key | Password SECRET in Supabase SMTP settings; app `RESEND_API_KEY` only if direct mail API implemented. |
| `RESEND_API_KEY`, `EMAIL_FROM`, `ORDER_ALERT_EMAIL` | Planned server-side owner alerts: Resend API keys / verified sender / owner recipient | API key SECRET; sender config public business info, recipient operational/private. |
| `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `BACKUP_BUCKET`, `BACKUP_ENCRYPTION_PASSWORD` | Cloudflare R2 bucket-scoped S3 credentials plus independent backup encryption secret | Credentials/encryption secret SECRET in backup job; never grant app general backup access. Names finalized with chosen backup tool. |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` | Sentry project client key and source-map upload authorization | DSN is client-visible endpoint; auth token SECRET, CI/build only. Planned integration. |
| `CLOUDFLARE_API_TOKEN` (only for API automation) | Account → scoped API tokens | SECRET in deploy job; manual dashboard DNS setup does not need it in app. |
| Deployment SSH key / `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` | Chosen VPS account / owner-created scoped deploy user | SSH key SECRET in protected CI/deploy environment; never ask owner to paste login passwords into chat. |
| GitHub authorization | Owner's approved `gh` login or scoped deploy app/token | SECRET/account authorization; app runtime does not need a GitHub token. |
| Courier credentials | Selected merchant portal, only when API integration is selected | SECRET, provider-specific names; not invented before provider selection. |
| Self-hosted backend secrets | Generate/set according to pinned official Supabase deployment instructions | SECRET server/backend environment; do not reuse demo/default keys. Their full list belongs in the selected deployment implementation. |

No Supabase service-role/secret key is required by the implemented Auth or normal media adapter. Image writes use the authenticated owner's session and reviewed Storage policies. Owner-authorized dashboard/DNS setup is still required; that is not an app environment variable. Current official locations: [Supabase API keys](https://supabase.com/docs/guides/api/api-keys) and [database Connect dialog](https://supabase.com/docs/guides/database/connecting-to-postgres).

## Production acceptance gates

Owning goals remain 01–10; this document adds the service/setup/recovery details, not a new parallel project.

- [ ] Choose the host/backend route with verified total recurring cost, capacity, region and ownership. Domain is purchased; DNS/canonical configuration still pending.
- [ ] Fix all launch-blocking findings in `PROJECT_AUDIT.md`, including Data API permissions, product upload/publish, cancellation stock and durable checkout retries. Do not close them because services were purchased.
- [ ] Use isolated staging/test data. Validate the selected real Auth/Storage/backend without customer PII in fixtures; run full member/nonmember/logout/revocation/MFA/recovery checks.
- [ ] Execute owner create→upload→publish→customer order→fulfillment/cancellation/return→COD reconciliation with correct prices, stock and fees.
- [ ] Validate checkout abuse controls, shared/durable rate limits, CSRF/origin/proxy behavior and secret/client boundaries on the actual HTTPS host.
- [ ] Verify a backup contains DB and product photo bytes, choose recovery/data-loss targets with owner, restore to an isolated environment and measure actual recovery. Schedule and alert on backup failures.
- [ ] Deliver a test admin recovery email and owner order/incident alert; verify support mailbox and customer confirmation/contact flow.
- [ ] Verify external health/uptime/error alerts, log rotation/redaction, restart after reboot, certificate renewal, resource/disk/usage alerts and rollback.
- [ ] Run required CI/local DB/admin/media/browser/build/security gates and documented mobile/desktop/EN/BN checks; resolve unsupported/vulnerable tooling.
- [ ] Confirm real catalog/condition information, business contact, shipping/returns/privacy terms and courier process. COD-only launch does not require an online gateway.
- [ ] Confirm every required goal's definition of done before declaring the project production ready. Owner-owned purchase/deploy actions still need their actual authorization.

## Sources verified during this research

- [Netlify commercial Free plan statement](https://www.netlify.com/blog/introducing-netlify-free-plan/) (2024 announcement; use current docs for limits), [current credit plans](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/), [pause behavior](https://docs.netlify.com/manage/accounts-and-billing/billing/resume-paused-projects/), [Next adapter](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/).
- [Vercel Hobby commercial restriction](https://vercel.com/docs/plans/hobby), [Render Free limits](https://render.com/docs/free), [Railway pricing](https://docs.railway.com/pricing/plans), [Oracle reclaim policy](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm).
- [OVH Worldwide VPS prices/specs](https://www.ovhcloud.com/en/vps/) (currently labels the range “VPS 2027”; quote/region/term not checked), [Hetzner June 2026 price adjustment](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/), [CX specs/availability](https://www.hetzner.com/cloud/cost-optimized/), [IPv4](https://docs.hetzner.com/cloud/servers/primary-ips/overview/), [backup billing](https://docs.hetzner.com/cloud/billing/faq/).
- [Supabase pricing](https://supabase.com/pricing), [production checklist](https://supabase.com/docs/guides/deployment/going-into-prod), [self-hosted resource requirements](https://supabase.com/docs/guides/self-hosting/docker), [SMTP restrictions](https://supabase.com/docs/guides/auth/auth-smtp), [database backup/object exclusion](https://supabase.com/docs/guides/platform/backups).
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [current Next runtime guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/), [OpenNext support](https://opennext.js.org/cloudflare), [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/) and [required server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [R2 allowance](https://developers.cloudflare.com/r2/pricing/).
- [Resend pricing](https://resend.com/pricing) and [Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp), [Sentry pricing](https://sentry.io/pricing/) and [Next SDK](https://docs.sentry.io/platforms/javascript/guides/nextjs/) (web open failed; official page retrieved using Firecrawl), [UptimeRobot commercial Free plan](https://help.uptimerobot.com/en/articles/11604710-who-should-use-uptimerobot-s-free-plan), [GitHub Actions](https://docs.github.com/en/actions/get-started/quickstart), [Pathao courier/merchant operations](https://pathao.com/courier/).

No provider account was created, paid plan enabled, DNS changed, email sent, tool installed, app implementation changed, or production test executed during this research.

<!-- END PRESERVED SOURCE: docs/PRODUCTION_SERVICES.md -->
