import { date, index, jsonb, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { requestPriorityEnum, requestStatusEnum } from "../enums";
import { profiles } from "./profiles";
import { requestTypes } from "./request-types";
import { departments } from "./departments";

export interface SignatureMetadata {
  signatureId: string;
  signedBy: string;
  signerName: string;
  signerRole: "ADMIN";
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  verificationId: string;
  signedAt: string;
  documentHash?: string;
}

export const requests = pgTable(
  "requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull(),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict", onUpdate: "cascade" }),
    requestTypeId: uuid("request_type_id")
      .notNull()
      .references(() => requestTypes.id, { onDelete: "restrict", onUpdate: "cascade" }),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict", onUpdate: "cascade" }),
    amount: numeric("amount", { precision: 15, scale: 2, mode: "number" }).notNull(),
    priority: requestPriorityEnum("priority").default("MEDIUM").notNull(),
    status: requestStatusEnum("status").default("DRAFT").notNull(),
    requestDate: date("request_date", { mode: "date" }).notNull(),
    claimReference: text("claim_reference"),
    claimDate: date("claim_date", { mode: "date" }),
    description: text("description"),
    paymentMethod: text("payment_method"),
    signatureMeta: jsonb("signature_meta").$type<SignatureMetadata>(),
    signedPdfPath: text("signed_pdf_path"),
    signedPdfHash: text("signed_pdf_hash"),
    approvedBy: uuid("approved_by").references(() => profiles.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    submittedAt: timestamp("submitted_at", { withTimezone: true, mode: "date" }),
    approvedAt: timestamp("approved_at", { withTimezone: true, mode: "date" }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true, mode: "date" }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("requests_code_unique_idx").on(table.code),
    index("requests_requester_id_idx").on(table.requesterId),
    index("requests_request_type_id_idx").on(table.requestTypeId),
    index("requests_department_id_idx").on(table.departmentId),
    index("requests_status_idx").on(table.status),
    index("requests_priority_idx").on(table.priority),
    index("requests_created_at_idx").on(table.createdAt),
  ],
);

export type RequestItem = typeof requests.$inferSelect;
export type NewRequestItem = typeof requests.$inferInsert;
