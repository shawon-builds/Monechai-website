import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encryptFile, decryptFile } from "../../scripts/backup-tools.mjs";

test("encrypted backups authenticate content/header/password and do not leave rejected plaintext", async () => {
  const root = await mkdtemp(join(tmpdir(), "monechai-crypto-test-"));
  const password = "test-only backup password long enough";
  try {
    const plain = join(root, "plain"), encrypted = join(root, "encrypted"), restored = join(root, "restored");
    await writeFile(plain, "TEST-ONLY PRIVATE ORDER DATA", { mode: 0o600 });
    await encryptFile(plain, encrypted, password);
    assert.equal((await readFile(encrypted)).includes(Buffer.from("PRIVATE ORDER")), false);
    await decryptFile(encrypted, restored, password); assert.equal(await readFile(restored, "utf8"), "TEST-ONLY PRIVATE ORDER DATA");
    for (const mode of ["password", "ciphertext", "header"]) {
      const bytes = await readFile(encrypted);
      if (mode === "ciphertext") bytes[40] ^= 1;
      if (mode === "header") bytes[12] ^= 1;
      const bad = join(root, `${mode}-input`), out = join(root, `${mode}-output`); await writeFile(bad, bytes);
      await assert.rejects(decryptFile(bad, out, mode === "password" ? "wrong password" : password));
      await assert.rejects(access(out));
    }
    await assert.rejects(decryptFile(encrypted, restored, password)); // never overwrite an existing file
    assert.equal(await readFile(restored, "utf8"), "TEST-ONLY PRIVATE ORDER DATA");
  } finally { await rm(root, { recursive: true, force: true }); }
});
