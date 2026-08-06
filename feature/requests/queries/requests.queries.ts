"use server";

import { db } from "@/db";
import {
  requests,
  profiles,
  requestTypes,
  departments,
  requestComments,
  requestAttachments,
} from "@/db/schema";
import { cacheLife, cacheTag } from "next/cache";
import { eq, desc, and, inArray } from "drizzle-orm";
import type { RequestStatus } from "../types";
import { INBOX_STATUSES } from "../constants";

/* -------------------------------------------------------------------------- */
/*  getRequestList — all requests (admin inbox view)                          */
/*  Cached for 1 minute; tagged with 'requests' for targeted revalidation     */
/* -------------------------------------------------------------------------- */

export async function getRequestList() {
  "use cache";
  cacheLife("minutes");
  cacheTag("requests", "inbox");

  return db
    .select({
      id: requests.id,
      code: requests.code,
      status: requests.status,
      priority: requests.priority,
      amount: requests.amount,
      requestDate: requests.requestDate,
      createdAt: requests.createdAt,
      updatedAt: requests.updatedAt,
      requestType: { id: requestTypes.id, name: requestTypes.name },
      department: { id: departments.id, name: departments.name },
      requester: {
        id: profiles.id,
        fullName: profiles.fullName,
        email: profiles.email,
        avatarUrl: profiles.avatarUrl,
      },
    })
    .from(requests)
    .leftJoin(profiles, eq(requests.requesterId, profiles.id))
    .leftJoin(requestTypes, eq(requests.requestTypeId, requestTypes.id))
    .leftJoin(departments, eq(requests.departmentId, departments.id))
    .orderBy(desc(requests.createdAt));
}

/* -------------------------------------------------------------------------- */
/*  getInboxRequests — only active/actionable requests                        */
/* -------------------------------------------------------------------------- */

export async function getInboxRequests() {
  "use cache";
  cacheLife("minutes");
  cacheTag("requests", "inbox");

  return db
    .select({
      id: requests.id,
      code: requests.code,
      status: requests.status,
      priority: requests.priority,
      amount: requests.amount,
      requestDate: requests.requestDate,
      createdAt: requests.createdAt,
      updatedAt: requests.updatedAt,
      requestType: { id: requestTypes.id, name: requestTypes.name },
      department: { id: departments.id, name: departments.name },
      requester: {
        id: profiles.id,
        fullName: profiles.fullName,
        email: profiles.email,
        avatarUrl: profiles.avatarUrl,
      },
    })
    .from(requests)
    .leftJoin(profiles, eq(requests.requesterId, profiles.id))
    .leftJoin(requestTypes, eq(requests.requestTypeId, requestTypes.id))
    .leftJoin(departments, eq(requests.departmentId, departments.id))
    .where(inArray(requests.status, INBOX_STATUSES as RequestStatus[]))
    .orderBy(desc(requests.createdAt));
}

/* -------------------------------------------------------------------------- */
/*  getMyRequests — requests created by a specific profile                    */
/* -------------------------------------------------------------------------- */

export async function getMyRequests(profileId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("requests", `my-requests:${profileId}`);

  return db
    .select({
      id: requests.id,
      code: requests.code,
      status: requests.status,
      priority: requests.priority,
      amount: requests.amount,
      requestDate: requests.requestDate,
      createdAt: requests.createdAt,
      updatedAt: requests.updatedAt,
      requestType: { id: requestTypes.id, name: requestTypes.name },
      department: { id: departments.id, name: departments.name },
    })
    .from(requests)
    .leftJoin(requestTypes, eq(requests.requestTypeId, requestTypes.id))
    .leftJoin(departments, eq(requests.departmentId, departments.id))
    .where(eq(requests.requesterId, profileId))
    .orderBy(desc(requests.createdAt));
}

/* -------------------------------------------------------------------------- */
/*  getRequestDetail — full detail of a single request                        */
/* -------------------------------------------------------------------------- */

export async function getRequestDetail(requestId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("requests", `request:${requestId}`);

  const [row] = await db
    .select({
      id: requests.id,
      code: requests.code,
      status: requests.status,
      priority: requests.priority,
      amount: requests.amount,
      requestDate: requests.requestDate,
      claimReference: requests.claimReference,
      claimDate: requests.claimDate,
      description: requests.description,
      paymentMethod: requests.paymentMethod,
      signatureMeta: requests.signatureMeta,
      signedPdfPath: requests.signedPdfPath,
      submittedAt: requests.submittedAt,
      approvedAt: requests.approvedAt,
      rejectedAt: requests.rejectedAt,
      cancelledAt: requests.cancelledAt,
      createdAt: requests.createdAt,
      updatedAt: requests.updatedAt,
      requestType: { id: requestTypes.id, name: requestTypes.name, code: requestTypes.code },
      department: { id: departments.id, name: departments.name },
      requester: {
        id: profiles.id,
        fullName: profiles.fullName,
        email: profiles.email,
        avatarUrl: profiles.avatarUrl,
      },
    })
    .from(requests)
    .leftJoin(profiles, eq(requests.requesterId, profiles.id))
    .leftJoin(requestTypes, eq(requests.requestTypeId, requestTypes.id))
    .leftJoin(departments, eq(requests.departmentId, departments.id))
    .where(eq(requests.id, requestId));

  return row ?? null;
}

/* -------------------------------------------------------------------------- */
/*  getRequestComments — comments for a request                               */
/* -------------------------------------------------------------------------- */

export async function getRequestComments(requestId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`request:${requestId}:comments`);

  const commentProfiles = db
    .$with("comment_profiles")
    .as(db.select().from(profiles));

  return db
    .select({
      id: requestComments.id,
      comment: requestComments.comment,
      createdAt: requestComments.createdAt,
      author: {
        id: profiles.id,
        fullName: profiles.fullName,
        email: profiles.email,
        avatarUrl: profiles.avatarUrl,
      },
    })
    .from(requestComments)
    .leftJoin(profiles, eq(requestComments.authorId, profiles.id))
    .where(eq(requestComments.requestId, requestId))
    .orderBy(requestComments.createdAt);
}

/* -------------------------------------------------------------------------- */
/*  getRequestAttachments — file attachments for a request                    */
/* -------------------------------------------------------------------------- */

export async function getRequestAttachments(requestId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`request:${requestId}:attachments`);

  return db
    .select({
      id: requestAttachments.id,
      fileName: requestAttachments.fileName,
      storagePath: requestAttachments.storagePath,
      mimeType: requestAttachments.mimeType,
      fileSize: requestAttachments.fileSize,
      createdAt: requestAttachments.createdAt,
    })
    .from(requestAttachments)
    .where(eq(requestAttachments.requestId, requestId))
    .orderBy(requestAttachments.createdAt);
}
