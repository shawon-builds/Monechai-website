import { z } from "zod";
export const recoveryEmail = z.email().max(254);
export const authenticatorCode = z.string().regex(/^\d{6}$/);
export const recoveredPassword = z.string().min(12).max(128);
export function assuranceAllowsAdmin(level: string | null | undefined) { return level === "aal2"; }
export const recoveryInput = z.object({ email: recoveryEmail, token: authenticatorCode, password: recoveredPassword,
  confirm: z.string(), mfaCode: z.union([authenticatorCode, z.literal("")]) }).refine(value => value.password === value.confirm, { message: "Passwords must match", path: ["confirm"] });
