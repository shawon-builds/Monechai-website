import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDatabaseEnv } from "@/lib/env";

let client: ReturnType<typeof postgres> | undefined;

export function getDb() {
  if (!client) {
    const env = getDatabaseEnv();
    client = postgres(env.DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 5,
      connection: { statement_timeout: 10000, lock_timeout: 5000, idle_in_transaction_session_timeout: 20000 },
      prepare: false,
      ssl: env.DATABASE_SSL === "disable" ? false : env.DATABASE_SSL_CA ? { ca: env.DATABASE_SSL_CA, rejectUnauthorized: true } : "require",
    });
  }
  return drizzle({ client });
}
