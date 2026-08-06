import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { requests } from "./requests";
import { profiles } from "./profiles";

export const requestAttachments = pgTable(
  "request_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade", onUpdate: "cascade" }),
    uploadedBy: uuid("uploaded_by").references(() => profiles.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    fileName: text("file_name").notNull(),
    storagePath: text("storage_path").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSize: text("file_size"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("request_attachments_request_id_idx").on(table.requestId),
    index("request_attachments_uploaded_by_idx").on(table.uploadedBy),
  ],
);

export type RequestAttachment = typeof requestAttachments.$inferSelect;
export type NewRequestAttachment = typeof requestAttachments.$inferInsert;
