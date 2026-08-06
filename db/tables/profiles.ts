import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { departments } from "./departments";
import { roles } from "./roles";

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authUserId: text("auth_user_id").notNull(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    roleId: uuid("role_id").references(() => roles.id, { onDelete: "set null", onUpdate: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    avatarUrl: text("avatar_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("profiles_auth_user_id_unique_idx").on(table.authUserId),
    uniqueIndex("profiles_email_unique_idx").on(table.email),
    index("profiles_role_id_idx").on(table.roleId),
    index("profiles_department_id_idx").on(table.departmentId),
    index("profiles_is_active_idx").on(table.isActive),
  ],
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
