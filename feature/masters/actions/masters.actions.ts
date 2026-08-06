"use server";

import { db } from "@/db";
import { departments, roles, requestTypes, profiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";

export async function getMastersData() {
  "use cache";
  cacheLife("minutes");
  cacheTag("masters");

  const [depts, roleList, types, userList] = await Promise.all([
    db.select().from(departments).orderBy(desc(departments.createdAt)),
    db.select().from(roles).orderBy(desc(roles.createdAt)),
    db.select().from(requestTypes).orderBy(desc(requestTypes.createdAt)),
    db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        email: profiles.email,
        isActive: profiles.isActive,
        createdAt: profiles.createdAt,
        department: departments.name,
        role: roles.name,
      })
      .from(profiles)
      .leftJoin(departments, eq(profiles.departmentId, departments.id))
      .leftJoin(roles, eq(profiles.roleId, roles.id))
      .orderBy(desc(profiles.createdAt)),
  ]);

  return { departments: depts, roles: roleList, requestTypes: types, users: userList };
}

export async function saveDepartment(data: { id?: string; name: string; description?: string }) {
  if (data.id) {
    await db.update(departments).set({ name: data.name, description: data.description }).where(eq(departments.id, data.id));
  } else {
    await db.insert(departments).values({ name: data.name, description: data.description });
  }
  revalidateTag("masters", "admin");
  return { success: true };
}

export async function deleteDepartmentAction(id: string) {
  await db.delete(departments).where(eq(departments.id, id));
  revalidateTag("masters", "admin");
  return { success: true };
}

export async function saveRole(data: { id?: string; name: string; description?: string; permissions?: Record<string, string[]> }) {
  if (data.id) {
    await db.update(roles).set({ name: data.name, description: data.description, permissions: data.permissions || {} }).where(eq(roles.id, data.id));
  } else {
    await db.insert(roles).values({ name: data.name, description: data.description, permissions: data.permissions || {} });
  }
  revalidateTag("masters", "admin");
  return { success: true };
}

export async function deleteRoleAction(id: string) {
  await db.delete(roles).where(eq(roles.id, id));
  revalidateTag("masters", "admin");
  return { success: true };
}

export async function saveRequestType(data: { id?: string; name: string; code: string; maxAmount?: number; description?: string }) {
  if (data.id) {
    await db.update(requestTypes).set({ name: data.name, code: data.code, maxAmount: data.maxAmount?.toString() as any, description: data.description }).where(eq(requestTypes.id, data.id));
  } else {
    await db.insert(requestTypes).values({ name: data.name, code: data.code, maxAmount: data.maxAmount?.toString() as any, description: data.description });
  }
  revalidateTag("masters", "admin");
  return { success: true };
}

export async function deleteRequestTypeAction(id: string) {
  await db.delete(requestTypes).where(eq(requestTypes.id, id));
  revalidateTag("masters", "admin");
  return { success: true };
}
