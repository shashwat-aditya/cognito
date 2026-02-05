"use server";

import { db } from "@/db";
import { projectThemes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getReadSignedUrl } from "./assets";

export async function getProjectTheme(projectId: string, skipAuth = false) {
  if (!skipAuth) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
  }

  const theme = await db.query.projectThemes.findFirst({
    where: eq(projectThemes.projectId, projectId),
  });

  if (!theme) return null;

  // Transform public URLs to Signed URLs for temporal access
  const [splashUrl, transitionUrl, logoUrl] = await Promise.all([
    getReadSignedUrl(theme.splashUrl),
    getReadSignedUrl(theme.transitionUrl),
    getReadSignedUrl(theme.logoUrl),
  ]);

  return {
    ...theme,
    splashUrl,
    transitionUrl,
    logoUrl,
  };
}

export async function upsertProjectTheme(projectId: string, data: Partial<typeof projectThemes.$inferInsert>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await db.query.projectThemes.findFirst({
    where: eq(projectThemes.projectId, projectId),
  });

  if (existing) {
    await db
      .update(projectThemes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projectThemes.id, existing.id));
  } else {
    await db.insert(projectThemes).values({
      projectId,
      ...data,
      lightPrimary: data.lightPrimary || "#000000",
      lightSecondary: data.lightSecondary || "#ffffff",
      lightBackground: data.lightBackground || "#ffffff",
      lightText: data.lightText || "#000000",
      darkPrimary: data.darkPrimary || "#ffffff",
      darkSecondary: data.darkSecondary || "#000000",
      darkBackground: data.darkBackground || "#000000",
      darkText: data.darkText || "#ffffff",
      fontStyle: data.fontStyle || "Inter",
      mode: data.mode || "light",
    } as any);
  }

  revalidatePath(`/dashboard/${projectId}`);
}
