import "server-only";
import { sql } from "drizzle-orm";
import type { getDb } from "@/db/client";

type Db = Pick<ReturnType<typeof getDb>, "transaction">;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** Actor must come from requireAdmin(), never form data. LOCAL context cannot leak through the pool. */
export function withAdminMutation<T>(db: Db, actorUserId: string, mutation: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async tx => {
    await setAdminMutationActor(tx, actorUserId);
    return mutation(tx);
  });
}

/** For services with external Storage cleanup after their own DB transaction commits. */
export async function setAdminMutationActor(tx: Tx, actorUserId: string) {
  // Recheck within the transaction; triggers check again at each write.
  // Membership stays SELECT-only for the runtime (row locks require UPDATE privilege).
  const member = await tx.execute(sql`select user_id from public.admin_members where user_id=${actorUserId}::uuid`);
  if (!member.length) throw new Error("Admin membership is no longer active.");
  await tx.execute(sql`select set_config('monechai.admin_actor', ${actorUserId}, true)`);
}
