"use server";

import { db } from "@/db";
import { profiles, signatures } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import {
  uploadObject,
  decodeBase64DataUrl,
  buildSignatureObjectKey,
} from "@/lib/s3.server";

export async function updateProfile(data: { fullName: string; avatarUrl?: string }) {
  const cookieStore = await cookies();
  const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieStore.toString() }) });
  if (!session?.user) throw new Error("Unauthorized");

  await db
    .update(profiles)
    .set({
      fullName: data.fullName,
      avatarUrl: data.avatarUrl,
      updatedAt: new Date(),
    })
    .where(eq(profiles.authUserId, session.user.id));

  revalidateTag("profile", "user");
  return { success: true };
}

export async function saveUserSignature(signatureBase64: string) {
  const cookieStore = await cookies();
  const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieStore.toString() }) });
  if (!session?.user) throw new Error("Unauthorized");

  const [profile] = await db.select().from(profiles).where(eq(profiles.authUserId, session.user.id)).limit(1);
  if (!profile) throw new Error("Profile not found");

  const decoded = decodeBase64DataUrl(signatureBase64);
  const key = buildSignatureObjectKey(profile.id);

  // Upload to S3
  await uploadObject({
    key,
    body: decoded.buffer,
    contentType: "image/png",
  });

  // Upsert single signature entry per user
  const now = new Date();
  await db
    .insert(signatures)
    .values({
      userId: profile.id,
      storagePath: key,
      isActive: true,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: signatures.userId,
      set: {
        storagePath: key,
        isActive: true,
        updatedAt: now,
      },
    });

  revalidateTag("profile", "user");
  return { success: true, key };
}
