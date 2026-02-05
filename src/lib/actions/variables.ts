"use server";

import { db } from "@/db";
import { projectVariables } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getProjectVariables(projectId: string, skipAuth = false) {
  if (!skipAuth) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
  }

  return db.query.projectVariables.findMany({
    where: eq(projectVariables.projectId, projectId),
    orderBy: [projectVariables.key],
  });
}

export async function upsertProjectVariable(projectId: string, key: string, value: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await db.query.projectVariables.findFirst({
    where: and(
      eq(projectVariables.projectId, projectId),
      eq(projectVariables.key, key)
    ),
  });

  if (existing) {
    await db
      .update(projectVariables)
      .set({ value, updatedAt: new Date() })
      .where(eq(projectVariables.id, existing.id));
  } else {
    await db.insert(projectVariables).values({
      projectId,
      key,
      value,
    });
  }

  revalidatePath(`/dashboard/${projectId}`);
}

export async function deleteProjectVariable(projectId: string, id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.delete(projectVariables).where(eq(projectVariables.id, id));

  revalidatePath(`/dashboard/${projectId}`);
}

export async function renameProjectVariable(projectId: string, id: string, newKey: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
  
    await db
      .update(projectVariables)
      .set({ key: newKey, updatedAt: new Date() })
      .where(eq(projectVariables.id, id));
  
    revalidatePath(`/dashboard/${projectId}`);
}
