"use server";

import { db } from "@/db";
import { requests, requestTypes, profiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

export async function getDashboardData() {
  "use cache";
  cacheLife("minutes");
  cacheTag("dashboard");

  const recent = await db
    .select({
      id: requests.id,
      code: requests.code,
      status: requests.status,
      priority: requests.priority,
      amount: requests.amount,
      requestDate: requests.requestDate,
      createdAt: requests.createdAt,
      approvedBy: requests.approvedBy,
      requestType: { id: requestTypes.id, name: requestTypes.name },
      requester: { id: profiles.id, fullName: profiles.fullName, email: profiles.email },
    })
    .from(requests)
    .leftJoin(profiles, eq(requests.requesterId, profiles.id))
    .leftJoin(requestTypes, eq(requests.requestTypeId, requestTypes.id))
    .orderBy(desc(requests.createdAt))
    .limit(10);

  const allStatuses = await db
    .select({
      id: requests.id,
      status: requests.status,
      amount: requests.amount,
      approvedBy: requests.approvedBy,
      requesterId: requests.requesterId,
      requestDate: requests.requestDate,
      createdAt: requests.createdAt,
    })
    .from(requests);

  return {
    recent,
    all: allStatuses,
  };
}
