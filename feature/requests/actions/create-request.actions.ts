"use server";

import { db } from "@/db";
import { departments, requestTypes, requests, requestAttachments, auditLogs, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidateTag, cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { deleteObject } from "@/lib/s3.server";

export async function getMasterOptions() {
  "use cache";
  cacheLife("hours");
  cacheTag("masters-options");

  const [depts, types] = await Promise.all([
    db.select({ id: departments.id, name: departments.name }).from(departments).where(eq(departments.status, "ACTIVE")),
    db.select({ id: requestTypes.id, name: requestTypes.name, maxAmount: requestTypes.maxAmount }).from(requestTypes).where(eq(requestTypes.status, "ACTIVE")),
  ]);

  return { departments: depts, requestTypes: types };
}

export async function createNewRequest(data: {
  departmentId: string;
  requestTypeId: string;
  amount: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  description?: string;
  claimReference?: string;
  paymentMethod?: string;
}) {
  const cookieStore = await cookies();
  const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieStore.toString() }) });
  if (!session?.user) throw new Error("Unauthorized");

  const [profile] = await db.select().from(profiles).where(eq(profiles.authUserId, session.user.id)).limit(1);
  if (!profile) throw new Error("Profile not found");

  const code = `REQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

  const [newReq] = await db
    .insert(requests)
    .values({
      code,
      requesterId: profile.id,
      departmentId: data.departmentId,
      requestTypeId: data.requestTypeId,
      amount: data.amount.toString() as any,
      priority: data.priority,
      status: "SUBMITTED",
      requestDate: new Date(),
      submittedAt: new Date(),
      description: data.description,
      claimReference: data.claimReference,
      paymentMethod: data.paymentMethod,
    })
    .returning();

  await db.insert(auditLogs).values({
    requestId: newReq.id,
    actorId: profile.id,
    action: "CREATED",
    description: `Request ${code} created`,
  });

  revalidateTag("requests", "inbox");
  revalidateTag(`my-requests:${profile.id}`, "user");
  return { success: true, id: newReq.id };
}

export async function updateExistingRequest(data: {
  id: string;
  departmentId?: string;
  requestTypeId?: string;
  amount: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  description?: string;
  claimReference?: string;
  paymentMethod?: string;
}) {
  const cookieStore = await cookies();
  const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieStore.toString() }) });
  if (!session?.user) throw new Error("Unauthorized");

  const [profile] = await db.select().from(profiles).where(eq(profiles.authUserId, session.user.id)).limit(1);
  if (!profile) throw new Error("Profile not found");

  const [existing] = await db.select().from(requests).where(eq(requests.id, data.id)).limit(1);
  if (!existing) throw new Error("Request not found");
  if (existing.requesterId !== profile.id) throw new Error("You can only edit your own requests");

  const now = new Date();
  await db
    .update(requests)
    .set({
      amount: data.amount.toString() as any,
      priority: data.priority,
      description: data.description,
      claimReference: data.claimReference,
      paymentMethod: data.paymentMethod,
      status: existing.status === "CHANGES_REQUESTED" ? "RESUBMITTED" : existing.status,
      updatedAt: now,
    })
    .where(eq(requests.id, data.id));

  await db.insert(auditLogs).values({
    requestId: data.id,
    actorId: profile.id,
    action: existing.status === "CHANGES_REQUESTED" ? "RESUBMITTED" : "UPDATED",
    description: `Request ${existing.code} updated & resubmitted`,
  });

  revalidateTag("requests", "inbox");
  revalidateTag(`my-requests:${profile.id}`, "user");
  revalidateTag(`request:${data.id}`, "detail");
  return { success: true, id: data.id };
}

export async function deleteAttachmentAction(attachmentId: string) {
  const [att] = await db.select().from(requestAttachments).where(eq(requestAttachments.id, attachmentId)).limit(1);
  if (att) {
    await deleteObject(att.storagePath);
    await db.delete(requestAttachments).where(eq(requestAttachments.id, attachmentId));
    revalidateTag(`request:${att.requestId}:attachments`, "attachments");
  }
  return { success: true };
}
