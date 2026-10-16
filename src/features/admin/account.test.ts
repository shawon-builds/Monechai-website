import { test } from "node:test";
import assert from "node:assert/strict";
import { assuranceAllowsAdmin, recoveryInput } from "./account-domain";
import { completeOwnerRecovery } from "./account-service";

const input = recoveryInput.parse({ email: "owner@example.test", token: "123456", password: "Long test password 123!", confirm: "Long test password 123!", mfaCode: "654321" });
test("owner security requires AAL2 and recovery rejects malformed credentials without accepting weak/mismatched passwords", () => {
  for (const level of [null, undefined, "aal1", "admin", ""]) assert.equal(assuranceAllowsAdmin(level), false);
  assert.equal(assuranceAllowsAdmin("aal2"), true);
  for (const change of [{ token: "12345" }, { mfaCode: "forged" }, { password: "short", confirm: "short" }, { confirm: "different" }, { email: "invalid" }]) assert.equal(recoveryInput.safeParse({ ...input, ...change }).success, false);
});
test("recovery verifies provider email proof and membership/MFA before password update, then revokes globally", async () => {
  const events: string[] = [];
  let member = true, verified = true, factor = true, mfaOkay = true, aal2 = true, revoke = true;
  const adapter = {
    verifyOtp: async (value: { type: string }) => { assert.equal(value.type, "recovery"); events.push("verify-email"); return { error: verified ? null : new Error("invalid"), data: { user: { id: "owner-id" } } }; },
    mfa: {
      listFactors: async () => { events.push("list-factors"); return { error: null, data: { all: factor ? [{ id: "own-factor", status: "verified", factor_type: "totp" }] : [] } }; },
      challengeAndVerify: async (value: { factorId: string }) => { assert.equal(value.factorId, "own-factor"); events.push("verify-mfa"); return { error: mfaOkay ? null : new Error("bad code") }; },
      getAuthenticatorAssuranceLevel: async () => ({ error: null, data: { currentLevel: aal2 ? "aal2" : "aal1" } }),
    },
    updateUser: async () => { events.push("update-password"); return { error: null }; },
    signOut: async (value: { scope: string }) => { assert.equal(value.scope, "global"); events.push("revoke-all"); return { error: revoke ? null : new Error("unavailable") }; },
  } as unknown as Parameters<typeof completeOwnerRecovery>[0];
  const membership = async () => { events.push("membership"); return member; };
  assert.deepEqual(await completeOwnerRecovery(adapter, input, membership), { revoked: true });
  assert.deepEqual(events, ["verify-email", "membership", "list-factors", "verify-mfa", "update-password", "revoke-all"]);
  for (const mode of ["email", "membership", "mfa", "assurance"]) {
    events.length = 0; member = mode !== "membership"; verified = mode !== "email"; mfaOkay = mode !== "mfa"; aal2 = mode !== "assurance";
    await assert.rejects(completeOwnerRecovery(adapter, input, membership)); assert.equal(events.includes("update-password"), false, mode);
  }
  member = verified = mfaOkay = aal2 = true; factor = false; events.length = 0;
  assert.deepEqual(await completeOwnerRecovery(adapter, { ...input, mfaCode: "" }, membership), { revoked: true });
  assert.equal(events.includes("verify-mfa"), false); // bootstrap owner has no factor; admin still requires enrollment
  revoke = false;
  assert.deepEqual(await completeOwnerRecovery(adapter, input, membership), { revoked: false }); // accurately report partial success
});
