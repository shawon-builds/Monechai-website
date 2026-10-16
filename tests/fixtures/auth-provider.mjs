// Test-only provider I/O adapter for a separately spawned local production app.
// Real requireAdmin, SSR cookies, Server Actions, services and PostgreSQL execute.
// This does not test Supabase JWT/MFA verification. Never preload into a release.
import { createHmac, timingSafeEqual } from 'node:crypto';
const target = new URL(process.env.TEST_DATABASE_URL || 'http://invalid');
if (process.env.E2E_AUTH_PROVIDER_FIXTURE !== 'local-only' || !['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname) || target.pathname !== '/monechai_test' || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL || process.env.HOSTNAME !== '127.0.0.1' || process.env.PORT !== '3106' || !/^[0-9a-f-]{36}$/.test(process.env.E2E_FIXTURE_USER || '')) throw new Error('Refuse provider fixture outside isolated local E2E');
const original = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (url.origin !== 'https://media.example' || url.pathname !== '/auth/v1/user') return original(input, init);
  try {
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    const token = (headers.get('authorization') || '').replace(/^Bearer /, '');
    const [header, payload, signature] = token.split('.');
    const expected = createHmac('sha256', 'monechai-isolated-fixture-only').update(`${header}.${payload}`).digest();
    const received = Buffer.from(signature, 'base64url');
    const claims = JSON.parse(Buffer.from(payload, 'base64url'));
    if (received.length !== expected.length || !timingSafeEqual(received, expected) || claims.sub !== process.env.E2E_FIXTURE_USER || claims.iss !== 'local-fixture' || claims.exp <= Date.now()/1000) throw new Error('Invalid fixture token');
    return Response.json({ id: claims.sub, aud: 'authenticated', role: 'authenticated', email: 'fixture@example.test', created_at: '2026-01-01T00:00:00Z', app_metadata: {}, user_metadata: {}, identities: [], factors: [] });
  } catch { return Response.json({ code: 'bad_jwt', message: 'Invalid fixture token' }, {status: 401}); }
};
