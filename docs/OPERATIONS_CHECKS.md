# Executable local checks and production setup boundaries

Current code supports pinned Node **22.23.3**, Linux Docker/Node deployment, and the following commands. Read [owner setup checklist](PROJECT_RECORD.md#owner-setup-checklist) before production configuration. No production schedule, email, host, backup destination or alert delivery is configured by these files.

## Release checks

`npm run test:ci` requires explicit local `/monechai_test` and fails on any skipped test. CI uses PostgreSQL17.10, migrations, lint/typecheck, strict unit/DB checks, actual local DB/photo restore drill, production build, Chromium E2E/WCAG and production/full dependency audits. [quality.yml](../.github/workflows/quality.yml) is code only until pushed with owner write access and run by GitHub. Full security audit remains deliberately failing on the unpatched braces development dependency even with a checksum/version/layout-guarded string-pattern nesting mitigation and regression. No findings are hidden or forced core-tool downgrades applied; ESLint10 migration also needs current React-plugin peer support.

`npm run ops:preflight` is the full release gate: runtime readiness uses restricted `DATABASE_URL`, then operator migration-history verification uses separately injected `DIRECT_URL`. Missing/invalid/unreachable/unauthorized operator credentials or journal-count mismatch fail with exit1; neither connection falls back to the other. Both sessions default to read-only transactions. Pinned Node, standalone assets, reviewed columns, RLS, no production superuser, public key boundaries, real HTTPS/TLS settings and approved policies/rates/contact remain checked.

`npm run ops:preflight -- --runtime-only` needs only `DATABASE_URL` and explicitly reports migration history NOT VERIFIED; its success is not full release acceptance. `npm run ops:preflight -- --migrations-only` needs only operator `DIRECT_URL` and pinned Node; it checks the reviewed journal count without runtime/business/artifact queries. History-check credentials need only database CONNECT, schema `drizzle` USAGE and SELECT on `drizzle.__drizzle_migrations`; no application-table or history-write permission is required. The migration job needs its separately reviewed DDL privileges. Use protected operator environment injection; never put `DIRECT_URL` into app runtime or build variables. Both URLs must target the same intended project/database for full release acceptance, even when pooler/direct hostnames differ.

`--local` can accompany either mode or the full gate; **each used URL** must target isolated loopback `/monechai_test`. It skips real-provider/business requirements. Migration verification retains the existing count-versus-journal check; it does not prove migration hashes or schema drift. Preflight does not establish Auth/MFA/SMTP/media/backup/monitoring acceptance.

## Owner order alerts

New orders queue one alert transactionally. A `POST /api/internal/order-alerts` request requires `Authorization: Bearer <ORDER_WORKER_SECRET>` (server/scheduler only, at least32 characters). `npm run ops:order-alerts` makes that request against the canonical HTTPS site and processes one event. SMTP uses TLS465 or STARTTLS587, bounded deadlines, fixed sender/owner recipient, no customer name/phone/address/receipt token in email. It sends an order reference/total and protected admin link; it never marks payment paid.

Configure server-only `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`, `ORDER_ALERT_EMAIL`, `ORDER_WORKER_SECRET`. Obtain SMTP credentials and approved sender from your mail provider; owner recipient is your real mailbox. Normal orders persist even while SMTP is unconfigured/down. Five failed attempts become a visible failed event; owner can retry from order detail after fixing delivery. Lease fencing prevents an old worker from overwriting a newer attempt. SMTP delivery is **at least once**: a crash after acceptance/before DB acknowledgement may repeat an alert with the same Message-ID/order reference; it cannot create another order. Provider acceptance is not proof of inbox delivery. Customer confirmation remains limited receipt + your approved call/WhatsApp workflow; no customer email field or automatic SMS integration exists.

## Encrypted application backups and restore

`npm run ops:backup` exports **public and drizzle application schemas** using pg_dump's shared repeatable-read snapshot and exports all referenced verified Storage image bytes. It hashes photo bytes against recorded content hashes and fails if any referenced object is unavailable/changed. Database, photo files and manifest are authenticated AES256-GCM encrypted with per-file salt/IV and scrypt-derived keys; no plaintext snapshot is retained after completion. This is an application export, **not a full Supabase service backup**: Auth identities, Storage bucket/policy configuration, custom roles and other provider schemas need the selected backend's recovery procedure too.

Backup job values:

| Variable | Purpose / visibility |
|---|---|
| `BACKUP_DATABASE_URL` | SECRET scoped backup connection with snapshot/dump/read permissions; not a browser key |
| `BACKUP_SUPABASE_URL` | Public approved backend origin for product bytes; defaults to `NEXT_PUBLIC_SUPABASE_URL` |
| `BACKUP_OUTPUT_DIR` | Private encrypted staging directory; outside project/source/runtime web paths |
| `BACKUP_ENCRYPTION_PASSWORD` | SECRET strong independent backup encryption phrase, at least20 characters; retain separately |
| `BACKUP_PG_IMAGE` | Official version-matched postgres CLI image; defaults to17.10, verify actual server version |
| `DATABASE_SSL` | Production TLS required on public/managed transport; disable only local reviewed drill topology |

Pass credentials through protected environment files. pg tools receive connection secrets through environment, not CLI URLs. Docker permissions are administrative; only reviewed operator accounts run the job. App export alone on the same VPS is insufficient. Select independent storage, implement/test upload acknowledgement/checksums, retention and failure alerts, configure full backend recovery and then enable scheduling. Backups can fail during concurrent photo deletion; plan an owner-approved media/maintenance window and never treat failure as a completed backup.

`npm run ops:restore-drill` accepts only **empty local `/monechai_restore_test`**; it refuses your original or any populated target. Set `RESTORE_TEST_DATABASE_URL` (secret local URL), `RESTORE_SNAPSHOT_DIR`, a **new** `RESTORE_PHOTO_DIR`, and the encryption secret. It authenticates database/manifest/all photo files before restore, uses a single transaction, verifies table counts and exact restored photo bytes. It writes no live bucket or DNS. A real cutover still needs owner/provider approval and reconciliation of newer orders; measure/approve acceptable data loss and recovery time.

`npm run test:ops` creates that isolated database only if absent, uses real decoded fixture pixels, exports/restores, tests original/nonempty target refusal and removes only its own fixture/DB/temp archives. Requires explicitly local `/monechai_test`, Docker and version-matched pg tools. Do not overlap it with tests using the same DB.

## Health, schedules and operator alerts

`npm run ops:health` reads `HEALTHCHECK_URL` at `/api/health`, fails on non200/invalid database status/redirect/timeout, and never prints customer data. `scripts/ops-alert.mjs <unit>` sends a fixed operational failure message through configured SMTP to `OPS_ALERT_EMAIL`; it has no attachments/customer data/raw error details. It needs the same SMTP/sender values, and actual inbox delivery must be tested after owner setup. Independent external uptime monitoring is still required because a dead host or SMTP service cannot reliably notify through itself.

[systemd examples](../ops/systemd) provide health/owner-alert/backup timers and OnFailure hooks. Adjust app/node paths, users, protected env files, Docker permissions, frequency/retention/independent upload and alert recipients on the **chosen host**. They have not been enabled. Daily04:00 Asia/Dhaka backup is an example, not an approved RPO. Use external monitoring and verify a deliberate test incident reaches your mailbox. No arbitrary application diagnostic/error log containing PII is emailed.

Official references checked during implementation: [pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html), [pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html), [Node crypto](https://nodejs.org/api/crypto.html), [Nodemailer SMTP](https://nodemailer.com/smtp), [GitHub PostgreSQL services](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers).
