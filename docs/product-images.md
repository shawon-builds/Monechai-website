# Product image setup and validation

**Current owner workflow,2026-10-16:** Admin → New product can create a category inline. Save the product draft, then use its prominent Photos section for selection/preview/upload, cover selection and ordering/removal. Existing backend/bucket/policies and owner login/MFA are configured; do not repeat setup. Actual owner-supplied upload/publication/Storage-denial acceptance is the next Goal06 task. Use the owner's normal browser for personal actions; built-in browser access is currently unavailable. See [current acceptance order](PROJECT_RECORD.md#current-readiness-and-next-session-plan).

The app now uploads JPEG/PNG/WebP (5 MiB maximum), checks signatures and bounded pixels/animation, strips metadata and re-encodes WebP. Only an authenticated admin Server Action can upload. Each file has a random key under the product UUID; DB rows store verification time and SHA-256 content hash. Publishing checks the primary object still exists and matches its recorded bytes, plus at least one active variant. Demo products cannot publish. Removing a published primary image unpublishes the product; selecting another primary or deactivating the last variant is guarded.

## Owner backend setup

The [Supabase handoff](SUPABASE_SETUP_HANDOFF.md) records an existing bucket/policy baseline for the exact Monechai project. Verify that state after authorized resume; do not recreate the bucket or reapply setup blindly. Instructions below cover required configuration and remaining actual-owner acceptance.

1. Supply `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (PUBLIC, hosted project API settings or selected self-hosted setup) and server DB connection per deployment docs. Complete first-admin bootstrap.
2. In Supabase Storage create public bucket `products`, restrict allowed MIME to `image/webp`, set file-size limit 5 MiB. Originals are normalized by the application before uploading.
3. Review/apply `ops/supabase-storage.sql` with the privileged migration/owner connection. Keep schema `private` out of exposed Data API schemas. Review/remove old broad write policies. The artifact now also uses restrictive product-bucket write guards for anon/authenticated: AAL2 plus owner membership for insert/delete and no overwrites, even with a permissive legacy policy. Public photo reads stay allowed.
4. Check anonymous/nonmember upload/delete denied, whitelisted AAL2 owner upload/delete allowed; AAL1 owner writes denied, and membership revocation immediately removes access. Normal app uses the signed-in user's JWT; no privileged Storage secret is exposed or required by these actions.
5. Create draft, upload real owner-supplied photos, set/order primary, publish and view it on actual mobile/desktop storefront. Delete the primary and confirm unpublish; test a missing or externally changed file cannot publish. Back up both DB metadata and image bytes.

Storage is an external system: DB metadata deletion/unpublish happens first, then file deletion. An external cleanup failure emits a body-free orphan event and may leave an unreferenced public product file for operator cleanup. It does not leave a published product referencing the removed primary. Upload DB failures attempt to remove the just-uploaded object. The backup/operations process must track orphan cleanup; do not claim DB and Storage share a distributed transaction.

Local tests use a file-store adapter with real decoded sample pixels and PostgreSQL transactions, plus simulated authenticated Storage roles. These tests do not establish a live owner account/bucket configuration. Recorded provisioning alone does not close acceptance: actual owner upload/publish/revocation checks above remain required.
