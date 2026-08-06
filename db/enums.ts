import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "USER"]);
export const recordStatusEnum = pgEnum("record_status", ["ACTIVE", "INACTIVE"]);
export const requestPriorityEnum = pgEnum("request_priority", ["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const requestStatusEnum = pgEnum("request_status", [
  "DRAFT",
  "SUBMITTED",
  "PENDING",
  "IN_REVIEW",
  "CHANGES_REQUESTED",
  "RESUBMITTED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);
export const requestActionEnum = pgEnum("request_action", [
  "CREATED",
  "UPDATED",
  "SUBMITTED",
  "RESUBMITTED",
  "APPROVED",
  "REJECTED",
  "CHANGES_REQUESTED",
  "CANCELLED",
  "COMMENTED",
  "DOCUMENT_UPLOADED",
  "DOCUMENT_DOWNLOADED",
  "SIGNATURE_APPLIED",
]);
export const signatureTypeEnum = pgEnum("signature_type", ["UPLOADED", "DRAWN", "TYPED"]);
