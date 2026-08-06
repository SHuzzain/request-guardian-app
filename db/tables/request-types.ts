import { index, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { recordStatusEnum } from "../enums";

export const requestTypes = pgTable(
  "request_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    code: text("code").notNull(),
    description: text("description"),
    maxAmount: numeric("max_amount", { precision: 15, scale: 2, mode: "number" }),
    status: recordStatusEnum("status").default("ACTIVE").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("request_types_code_unique_idx").on(table.code),
    uniqueIndex("request_types_name_unique_idx").on(table.name),
    index("request_types_status_idx").on(table.status),
  ],
);

export type RequestType = typeof requestTypes.$inferSelect;
export type NewRequestType = typeof requestTypes.$inferInsert;
