"use server";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getProjects() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return db.query.projects.findMany({
    where: and(
      eq(projects.userId, userId),
      isNull(projects.deletedAt)
    ),
    orderBy: [desc(projects.updatedAt)],
  });
}

export async function createProject(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name) throw new Error("Name is required");

  await db.insert(projects).values({
    userId,
    name,
    description,
  });

  revalidatePath("/dashboard");
}

export async function deleteProject(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Soft delete
  await db
    .update(projects)
    .set({ deletedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));

  revalidatePath("/dashboard");
}

export async function getProject(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return db.query.projects.findFirst({
    where: and(
      eq(projects.id, id),
      eq(projects.userId, userId),
      isNull(projects.deletedAt)
    ),
  });
}
