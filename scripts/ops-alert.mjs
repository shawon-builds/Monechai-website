// OnFailure hook for the chosen host's operator. Requires explicit SMTP setup.
import nodemailer from "nodemailer";
import { z } from "zod";
let transport, timeout;
try {
  const config = z.object({ SMTP_HOST: z.string().regex(/^[a-z0-9.-]+$/i), SMTP_PORT: z.coerce.number().pipe(z.union([z.literal(465), z.literal(587)])), SMTP_USER: z.string().min(1), SMTP_PASSWORD: z.string().min(1), EMAIL_FROM: z.email(), OPS_ALERT_EMAIL: z.email() }).parse(process.env);
  const unit = process.argv[2] || "monechai";
  if (!/^[a-zA-Z0-9_.@-]{1,120}$/.test(unit)) throw new Error("Invalid unit");
  transport = nodemailer.createTransport({ host: config.SMTP_HOST, port: config.SMTP_PORT, secure: config.SMTP_PORT === 465, requireTLS: true, auth: { user: config.SMTP_USER, pass: config.SMTP_PASSWORD }, connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 10000, dnsTimeout: 5000, disableFileAccess: true, disableUrlAccess: true, logger: false, debug: false });
  const result = await Promise.race([transport.sendMail({ from: config.EMAIL_FROM, to: config.OPS_ALERT_EMAIL, subject: `Monechai operations failure: ${unit}`, text: `The ${unit} check/job failed. Review your private host logs, health and backup/owner-alert status. This message contains no customer information.` }), new Promise((_resolve, reject) => { timeout = setTimeout(() => { transport.close(); reject(new Error("Alert deadline")); }, 20000); })]);
  if (!result.accepted?.length || result.rejected?.length) throw new Error("Alert not accepted");
  console.log("Operator alert accepted by SMTP; verify recipient delivery during setup.");
} catch { console.error("Operator alert failed. Independent external monitoring must detect host/mail outages."); process.exitCode = 1; }
finally { if (timeout) clearTimeout(timeout); transport?.close(); }
