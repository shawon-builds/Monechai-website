# First admin bootstrap (owner operation)

The app does not create admin accounts or offer public signup. Only a Supabase Auth user **also** present in `public.admin_members` may read admin data or mutate it. Do not insert unverified browser IDs or put a service-role key in this app.

1. In your Supabase project, obtain **Project URL** and **publishable key** under **Project Settings → API / Connect**. Set `NEXT_PUBLIC_SUPABASE_URL` (PUBLIC URL) and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (PUBLIC, publishable key only) in the deployment environment. Do **not** use a `service_role` or secret key here. Set `DATABASE_URL` (SECRET, server-only, Supabase Dashboard → Connect) for the app and `DIRECT_URL` (SECRET, direct DB connection if using a pooler) for migrations. Never commit `.env.local`. Set public variables **before building** Next.js (they are build-time inlined), and rebuild/redeploy if the project URL or publishable key changes.
2. In **Authentication → Users**, create/invite the owner's Auth user using an email the owner controls; ensure the account can sign in with email/password and its email is confirmed. Configure appropriate email confirmation and disable self-service signup in the project's Auth settings if it is not needed; the app has no signup form. Do not share the password with the agent. Use a strong unique password and enable project security controls/MFA where supported.
3. Inspect the [saved Supabase setup](SUPABASE_SETUP_HANDOFF.md) before changing the live project; the full migration set is already recorded as applied there. For a separately authorized new backend or reviewed pending migration, run `npm run db:migrate` with operator-only `DIRECT_URL`; keep the restricted runtime `DATABASE_URL` separate. Verify the applied migration set before granting membership. Backup the live database first. Migration `0002` revokes `anon` and `authenticated` grants on `public.admin_members` and enables its row-level security with no client policies. Migration `0006` does the same style of revoke and RLS for the other application tables. Confirm both are applied.
4. In the **Supabase SQL Editor** (owner project, privileged SQL only), replace `owner@example.com` below with the exact owner's email and execute. It verifies a unique existing confirmed Auth identity and is safe to repeat. **Do not** make this SQL a public endpoint or give arbitrary authenticated users table write access.

```sql
DO $$
DECLARE member_id uuid;
BEGIN
  SELECT id INTO STRICT member_id FROM auth.users
  WHERE lower(email) = lower('owner@example.com') AND email_confirmed_at IS NOT NULL;
  INSERT INTO public.admin_members (user_id) VALUES (member_id)
  ON CONFLICT (user_id) DO NOTHING;
EXCEPTION WHEN NO_DATA_FOUND THEN
  RAISE EXCEPTION 'No confirmed Auth user found for this exact email';
WHEN TOO_MANY_ROWS THEN
  RAISE EXCEPTION 'Multiple Auth users match this email';
END $$;
```

5. Confirm one matching row with `SELECT user_id, created_at FROM public.admin_members WHERE user_id = (SELECT id FROM auth.users WHERE lower(email) = lower('owner@example.com'));`. Log in at `/admin/login`, enroll/verify TOTP at `/admin/security`, then verify AAL2 `/admin` access; in a private browser without a session, `/admin` must redirect to login. A signed-in *nonmember* must not see the admin page. Verify logout and that revoking membership immediately denies access to subsequent requests. Do not post passwords or database URLs in issue/chat logs.

To revoke an admin, run (privileged SQL Editor) `DELETE FROM public.admin_members WHERE user_id = '<verified-user-uuid>';` and optionally revoke/sign out the Auth user in **Authentication → Users**. Access checks re-read membership for each privileged operation; a layout alone is never a security boundary. Catalog, order and settings handlers call `requireAdmin()` inside each server operation. Every new privileged handler must do the same. Use `getUser()` for current Auth identity and never trust `getSession()`'s user directly. Keep `/admin` and Auth refresh responses uncacheable in reverse proxies/CDNs.

## Owner recovery and enforced authenticator (2026-10-11)

App login now routes first-factor owner sessions to `/admin/security`; every privileged read/mutation requires server-confirmed owner membership plus AAL2. Enroll TOTP there, scan the private QR yourself and verify a current code. Do not send the QR, seed or authenticator codes to an agent. No mandatory buyer accounts were added.

For `/admin/recovery`, configure custom Auth SMTP and the Supabase **Reset password** email template to show the six-digit `{{ .Token }}` recovery code. Suggested template body: `<p>Your recovery code is {{ .Token }}.</p><p>Open your store's /admin/recovery page and enter this code. If you already enrolled an authenticator, enter its current code too.</p>`. Configure six-digit email OTP, the exact canonical Site URL, short code expiry and owner-only account onboarding. Disable email link tracking if used. The app verifies `type: recovery`, membership and existing TOTP/AAL2 before updating the password, then requests global session revocation. Access tokens already issued can remain valid until their expiry; configure appropriate session expiry and verify revocation behavior on the actual provider. Lost MFA devices require owner-controlled backend recovery; do not build a public bypass.

Offline adapter tests exercise failed proof/nonmembership/MFA/assurance and password-before-revocation order, not real email delivery or provider sessions. Live enrollment/recovery/logout/revocation remains required. Current references: [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates), [TOTP](https://supabase.com/docs/guides/auth/auth-mfa/totp) and [assurance levels](https://supabase.com/docs/reference/javascript/auth-mfa-getauthenticatorassurancelevel).
