import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";
import { signatureTypeEnum } from "../enums";

export const signatures = pgTable(
  "signatures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => profiles.id, { onDelete: "cascade", onUpdate: "cascade" }),
    signatureType: signatureTypeEnum("signature_type").default("DRAWN").notNull(),
    storagePath: text("storage_path"),
    fileName: text("file_name"),
    mimeType: text("mime_type"),
    isActive: boolean("is_active").default(true).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("signatures_user_id_idx").on(table.userId),
    index("signatures_is_active_idx").on(table.isActive),
  ],
);

export type Signature = typeof signatures.$inferSelect;
export type NewSignature = typeof signatures.$inferInsert;
