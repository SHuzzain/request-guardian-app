"use server";

import { db } from "@/db";
import {
  requests,
  requestComments,
  requestAttachments,
  auditLogs,
  profiles,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { normalizeStatus, isEditableByRequester } from "../types";
import type { RequestStatus } from "../types";
import {
  getPresignedObjectUrl,
  uploadObject,
  deleteObject,
  decodeBase64DataUrl,
  buildAttachmentObjectKey,
  buildSignedPdfObjectKey,
} from "@/lib/s3.server";

/* -------------------------------------------------------------------------- */
/*  Helper: get current session profile                                       */
/* -------------------------------------------------------------------------- */

async function getSessionProfile() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const session = await auth.api.getSession({
    headers: new Headers({
      cookie: cookieStore.toString(),
    }),
  });

  if (!session?.user) throw new Error("Unauthorized");

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.authUserId, session.user.id))
    .limit(1);

  if (!profile) throw new Error("Profile not found");
  return { session, profile };
}

/* -------------------------------------------------------------------------- */
/*  updateRequestStatus — approve, reject, request changes                    */
/* -------------------------------------------------------------------------- */

export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus,
  comment?: string,
) {
  const { profile } = await getSessionProfile();

  const [req] = await db
    .select({ id: requests.id, status: requests.status })
    .from(requests)
    .where(eq(requests.id, requestId))
    .limit(1);

  if (!req) throw new Error("Request not found");

  const now = new Date();
  const updatePayload: Partial<typeof requests.$inferInsert> = {
    status,
    updatedAt: now,
  };

  if (status === "APPROVED") {
    updatePayload.approvedBy = profile.id;
    updatePayload.approvedAt = now;
  } else if (status === "REJECTED") {
    updatePayload.rejectedAt = now;
  } else if (status === "CANCELLED") {
    updatePayload.cancelledAt = now;
  }

  await db.update(requests).set(updatePayload).where(eq(requests.id, requestId));

  // Add audit log
  await db.insert(auditLogs).values({
    requestId,
    actorId: profile.id,
    action: status === "APPROVED"
      ? "APPROVED"
      : status === "REJECTED"
      ? "REJECTED"
      : status === "CHANGES_REQUESTED"
      ? "CHANGES_REQUESTED"
      : "UPDATED",
    description: comment || `Status changed to ${status}`,
    metadata: { previousStatus: req.status, newStatus: status, comment },
  });

  // Add comment if provided
  if (comment?.trim()) {
    await db.insert(requestComments).values({
      requestId,
      authorId: profile.id,
      comment: comment.trim(),
    });
  }

  revalidateTag("requests", "inbox");
  revalidateTag(`request:${requestId}`, "detail");
  return { success: true };
}

/* -------------------------------------------------------------------------- */
/*  submitRequest — move DRAFT → SUBMITTED                                     */
/* -------------------------------------------------------------------------- */

export async function submitRequest(requestId: string) {
  const { profile } = await getSessionProfile();

  const [req] = await db
    .select({ id: requests.id, status: requests.status, requesterId: requests.requesterId })
    .from(requests)
    .where(eq(requests.id, requestId))
    .limit(1);

  if (!req) throw new Error("Request not found");
  if (req.requesterId !== profile.id) throw new Error("You can only submit your own requests");

  const normalizedStatus = normalizeStatus(req.status);
  if (!isEditableByRequester(normalizedStatus)) {
    throw new Error("This request is not in a submittable state");
  }

  const now = new Date();
  await db.update(requests).set({ status: "SUBMITTED", submittedAt: now, updatedAt: now }).where(eq(requests.id, requestId));
  await db.insert(auditLogs).values({
    requestId,
    actorId: profile.id,
    action: req.status === "CHANGES_REQUESTED" ? "RESUBMITTED" : "SUBMITTED",
    description: "Request submitted for approval",
    metadata: { previousStatus: req.status, newStatus: "SUBMITTED" },
  });

  revalidateTag("requests", "inbox");
  revalidateTag(`my-requests:${profile.id}`, "user");
  revalidateTag(`request:${requestId}`, "detail");
  return { success: true };
}

/* -------------------------------------------------------------------------- */
/*  addComment                                                                 */
/* -------------------------------------------------------------------------- */

export async function addComment(requestId: string, comment: string) {
  const { profile } = await getSessionProfile();

  if (!comment?.trim()) throw new Error("Comment cannot be empty");

  await db.insert(requestComments).values({
    requestId,
    authorId: profile.id,
    comment: comment.trim(),
  });

  await db.insert(auditLogs).values({
    requestId,
    actorId: profile.id,
    action: "COMMENTED",
    description: "Comment added",
  });

  revalidateTag(`request:${requestId}:comments`, "comments");
  return { success: true };
}

/* -------------------------------------------------------------------------- */
/*  uploadAttachment                                                           */
/* -------------------------------------------------------------------------- */

export async function uploadAttachment(params: {
  requestId: string;
  fileName: string;
  fileBase64: string;
  mimeType?: string;
}) {
  const { profile } = await getSessionProfile();

  const decoded = decodeBase64DataUrl(params.fileBase64);
  const key = buildAttachmentObjectKey(params.requestId, params.fileName);

  await uploadObject({
    key,
    body: decoded.buffer,
    contentType: params.mimeType || decoded.mimeType,
  });

  await db.insert(requestAttachments).values({
    requestId: params.requestId,
    uploadedBy: profile.id,
    fileName: params.fileName,
    storagePath: key,
    mimeType: params.mimeType || decoded.mimeType,
  });

  await db.insert(auditLogs).values({
    requestId: params.requestId,
    actorId: profile.id,
    action: "DOCUMENT_UPLOADED",
    description: `File uploaded: ${params.fileName}`,
    metadata: { fileName: params.fileName },
  });

  revalidateTag(`request:${params.requestId}:attachments`, "attachments");
  return { success: true, key };
}

/* -------------------------------------------------------------------------- */
/*  saveSignedPdf                                                              */
/* -------------------------------------------------------------------------- */

export async function saveSignedPdf(params: {
  requestId: string;
  pdfBase64: string;
  signatureMeta: unknown;
}) {
  const { profile } = await getSessionProfile();

  const [req] = await db
    .select({ id: requests.id, signedPdfPath: requests.signedPdfPath })
    .from(requests)
    .where(eq(requests.id, params.requestId))
    .limit(1);

  if (!req) throw new Error("Request not found");

  // Delete old signed PDF if exists
  if (req.signedPdfPath) {
    await deleteObject(req.signedPdfPath);
  }

  const decoded = decodeBase64DataUrl(params.pdfBase64);
  const key = buildSignedPdfObjectKey(params.requestId);

  await uploadObject({ key, body: decoded.buffer, contentType: "application/pdf" });

  await db.update(requests).set({
    signedPdfPath: key,
    signatureMeta: params.signatureMeta as any,
    updatedAt: new Date(),
  }).where(eq(requests.id, params.requestId));

  await db.insert(auditLogs).values({
    requestId: params.requestId,
    actorId: profile.id,
    action: "SIGNATURE_APPLIED",
    description: "Signed PDF saved",
  });

  revalidateTag(`request:${params.requestId}`, "detail");
  return { success: true, key };
}

/* -------------------------------------------------------------------------- */
/*  getPresignedUrl — for client to download/preview files                    */
/* -------------------------------------------------------------------------- */

export async function getPresignedUrlAction(storagePath: string) {
  await getSessionProfile(); // auth check
  return getPresignedObjectUrl(storagePath, 900);
}

/* -------------------------------------------------------------------------- */
/*  deleteRequest                                                              */
/* -------------------------------------------------------------------------- */

export async function deleteRequest(requestId: string) {
  const { profile } = await getSessionProfile();

  const [req] = await db
    .select({ requesterId: requests.requesterId, status: requests.status })
    .from(requests)
    .where(eq(requests.id, requestId))
    .limit(1);

  if (!req) throw new Error("Request not found");
  if (req.requesterId !== profile.id) throw new Error("You can only delete your own requests");

  const normalizedStatus = normalizeStatus(req.status);
  if (!isEditableByRequester(normalizedStatus)) {
    throw new Error("This request cannot be deleted in its current state");
  }

  await db.delete(requestAttachments).where(eq(requestAttachments.requestId, requestId));
  await db.delete(requestComments).where(eq(requestComments.requestId, requestId));
  await db.delete(requests).where(eq(requests.id, requestId));

  revalidateTag("requests", "inbox");
  revalidateTag(`my-requests:${profile.id}`, "user");
  return { success: true };
}
