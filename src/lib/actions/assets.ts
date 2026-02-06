"use server";

import { db } from "@/db";
import { projectThemes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { Storage } from "@google-cloud/storage";

const storage = new Storage();
const BUCKET_NAME = process.env.GCS_BUCKET_NAME;

export async function getUploadUrl(projectId: string, fileName: string, contentType: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!BUCKET_NAME) {
    throw new Error("GCS_BUCKET_NAME environment variable is not set");
  }

  const bucket = storage.bucket(BUCKET_NAME);
  // Create a unique path for the asset: projects/[projectId]/[fileName]
  const fileNameClean = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const blob = bucket.file(`projects/${projectId}/${Date.now()}-${fileNameClean}`);

  console.log(`Generating signed URL for: ${blob.name} (${contentType})`);

  const [url] = await blob.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType,
  });

  const [readUrl] = await blob.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

  return { 
    uploadUrl: url, 
    publicUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${blob.name}`,
    readUrl
  };
}

export async function getReadSignedUrl(gcsUrl: string | null) {
  if (!gcsUrl) return null;
  if (!BUCKET_NAME) return null;

  try {
    // Extract gcsPath from public URL: https://storage.googleapis.com/bucket/path/to/file
    const urlObj = new URL(gcsUrl);
    const path = urlObj.pathname.substring(1).split("/").slice(1).join("/");
    
    const [url] = await storage.bucket(BUCKET_NAME).file(path).getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });
    return url;
  } catch (error) {
    console.error("Failed to generate read signed URL:", error);
    return gcsUrl; // Fallback to public URL
  }
}

export async function updateAssetUrl(projectId: string, assetType: "splash" | "transition" | "logo", publicUrl: string | null) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await db.query.projectThemes.findFirst({
    where: eq(projectThemes.projectId, projectId),
  });

  const updateData: any = { updatedAt: new Date() };
  if (assetType === "splash") updateData.splashUrl = publicUrl;
  if (assetType === "transition") updateData.transitionUrl = publicUrl;
  if (assetType === "logo") updateData.logoUrl = publicUrl;

  if (existing) {
    await db
      .update(projectThemes)
      .set(updateData)
      .where(eq(projectThemes.id, existing.id));
  } else {
    // Should not normally happen if themes are created on project creation, 
    // but handle just in case.
    await db.insert(projectThemes).values({
      projectId,
      ...updateData,
    });
  }

  revalidatePath(`/dashboard/${projectId}`);
}

export async function deleteAsset(projectId: string, assetType: "splash" | "transition" | "logo", gcsPath: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!BUCKET_NAME) {
    throw new Error("GCS_BUCKET_NAME environment variable is not set");
  }

  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(gcsPath);
    await file.delete();
  } catch (error) {
    console.error("Failed to delete from GCS:", error);
    // Continue anyway to clear the DB if GCS delete fails (e.g. file already gone)
  }

  await updateAssetUrl(projectId, assetType, null);
}
