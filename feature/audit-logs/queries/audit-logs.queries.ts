"use server";

import { db } from "@/db";
import { auditLogs, profiles, requests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

export async function getAuditLogsData() {
  "use cache";
  cacheLife("minutes");
  cacheTag("audit-logs");

  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      description: auditLogs.description,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actor: { id: profiles.id, fullName: profiles.fullName, email: profiles.email },
      request: { id: requests.id, code: requests.code },
    })
    .from(auditLogs)
    .leftJoin(profiles, eq(auditLogs.actorId, profiles.id))
    .leftJoin(requests, eq(auditLogs.requestId, requests.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);
}
