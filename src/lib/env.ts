import "server-only";
import { z } from "zod";

const databaseEnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }).min(1),
  DATABASE_SSL: z.enum(["require", "disable"]).default("require"),
  DATABASE_SSL_CA: z.string().min(1).optional(),
});

export function getDatabaseEnv() {
  const parsed = databaseEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_SSL: process.env.DATABASE_SSL,
    DATABASE_SSL_CA: process.env.DATABASE_SSL_CA,
  });

  if (!parsed.success) {
    const names = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid database environment: ${names}. See .env.example.`);
  }

  return parsed.data;
}
