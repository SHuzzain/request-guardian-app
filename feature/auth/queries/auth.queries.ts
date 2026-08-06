"use server";

import { db } from "@/db";
import { profiles, departments, roles, signatures } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPresignedObjectUrl } from "@/lib/s3.server";
import { cacheLife, cacheTag } from "next/cache";

export async function getProfileByAuthId(authUserId: string, email: string, name: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("profile", `profile:${authUserId}`);

  let [profile] = await db
    .select({
      id: profiles.id,
      authUserId: profiles.authUserId,
      fullName: profiles.fullName,
      email: profiles.email,
      avatarUrl: profiles.avatarUrl,
      isActive: profiles.isActive,
      departmentId: profiles.departmentId,
      roleId: profiles.roleId,
      departmentName: departments.name,
      roleName: roles.name,
      rolePermissions: roles.permissions,
    })
    .from(profiles)
    .leftJoin(departments, eq(profiles.departmentId, departments.id))
    .leftJoin(roles, eq(profiles.roleId, roles.id))
    .where(eq(profiles.authUserId, authUserId))
    .limit(1);

  if (!profile) {
    // Auto-create profile if missing
    const [newProfile] = await db
      .insert(profiles)
      .values({
        authUserId,
        email,
        fullName: name || email.split("@")[0],
      })
      .returning();

    return {
      id: newProfile.id,
      email: newProfile.email,
      fullName: newProfile.fullName,
      department: null,
      isAdmin: false,
      signatureUrl: null,
      permissions: {},
    };
  }

  // Get active signature
  const [activeSig] = await db
    .select({ storagePath: signatures.storagePath })
    .from(signatures)
    .where(eq(signatures.userId, profile.id))
    .limit(1);

  const signatureUrl = activeSig?.storagePath
    ? await getPresignedObjectUrl(activeSig.storagePath, 900)
    : null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl ?? null,
    department: profile.departmentId ? { id: profile.departmentId, name: profile.departmentName } : null,
    isAdmin: profile.roleName?.toLowerCase() === "admin",
    signatureUrl,
    permissions: (profile.rolePermissions as Record<string, string[]>) || {},
  };
}
