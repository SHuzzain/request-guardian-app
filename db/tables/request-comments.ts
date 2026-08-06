import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { requests } from "./requests";
import { profiles } from "./profiles";

export const requestComments = pgTable(
  "request_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade", onUpdate: "cascade" }),
    authorId: uuid("author_id").references(() => profiles.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    comment: text("comment").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("request_comments_request_id_idx").on(table.requestId),
    index("request_comments_author_id_idx").on(table.authorId),
  ],
);

export type RequestComment = typeof requestComments.$inferSelect;
export type NewRequestComment = typeof requestComments.$inferInsert;
