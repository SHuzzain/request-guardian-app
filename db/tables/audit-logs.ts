import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { requestActionEnum } from "../enums";
import { requests } from "./requests";
import { profiles } from "./profiles";

export interface AuditMetadata {
  previousStatus?: string;
  newStatus?: string;
  comment?: string;
  fileName?: string;
  verificationId?: string;
  [key: string]: unknown;
}

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id").references(() => requests.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    actorId: uuid("actor_id").references(() => profiles.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    action: requestActionEnum("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata").$type<AuditMetadata>(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_request_id_idx").on(table.requestId),
    index("audit_logs_actor_id_idx").on(table.actorId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
