import "server-only";
import nodemailer from "nodemailer";
import { z } from "zod";
import { publicSiteOrigin } from "@/lib/site-url";
import { formatBdt } from "@/lib/money";
import type { OrderAlert } from "./notifications";

export const smtpConfig = z.object({
  SMTP_HOST: z.string().min(1).max(253).regex(/^[a-z0-9.-]+$/i), SMTP_PORT: z.coerce.number().pipe(z.union([z.literal(465), z.literal(587)])),
  SMTP_USER: z.string().min(1), SMTP_PASSWORD: z.string().min(1), EMAIL_FROM: z.email(), ORDER_ALERT_EMAIL: z.email(),
});
export function ownerOrderMailer() {
  const input = smtpConfig.parse(process.env), origin = publicSiteOrigin();
  if (!origin) throw new Error("Configure public site origin before alerts");
  const transport = nodemailer.createTransport({ host: input.SMTP_HOST, port: input.SMTP_PORT, secure: input.SMTP_PORT === 465, requireTLS: true,
    auth: { user: input.SMTP_USER, pass: input.SMTP_PASSWORD }, connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 10000, dnsTimeout: 5000,
    disableFileAccess: true, disableUrlAccess: true, logger: false, debug: false,
  });
  return async (order: OrderAlert) => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
    // Admin URL requires owner MFA. Customer address/phone/name and receipt token stay out of email.
    const result = await Promise.race([transport.sendMail({ from: input.EMAIL_FROM, to: input.ORDER_ALERT_EMAIL, messageId: `<monechai-order-${order.id}@${new URL(origin).hostname}>`,
      subject: `New order ${order.orderNumber}`, text: `Order ${order.orderNumber}\nTotal: ${formatBdt(order.totalMinor)}\nReview in your protected admin panel: ${origin}/admin/orders/${order.id}\nThis alert does not confirm payment collection.`,
    }), new Promise<never>((_resolve, reject) => { timeout = setTimeout(() => { transport.close(); reject(new Error("SMTP deadline")); }, 20000); })]);
    if (!result.accepted?.length || result.rejected?.length) throw new Error("Owner alert not accepted");
    } finally { if (timeout) clearTimeout(timeout); transport.close(); }
  };
}
