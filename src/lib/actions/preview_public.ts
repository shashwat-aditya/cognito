"use server";

import { db } from "@/db";
import { graphVersions, userJourneys, graphs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { PageNotFoundError } from "next/dist/shared/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { graphNodes } from "@/db/schema";

export interface UserJourneySummary {
  aiReport?: string | null;
  history?: {
    role: string;
    text: string;
  }[];
  variables?: Record<string, any>;
}

export interface UserJourney {
  id: string;
  versionId: string;
  email: string;
  summary: UserJourneySummary;
  createdAt: Date;
}

/**
 * Generates or retrieves a public token for a specific graph version.
 */
export async function getOrCreatePublicLink(versionId: string, force = false) {
  const version = await db.query.graphVersions.findFirst({
    where: eq(graphVersions.id, versionId),
  });

  if (!version) throw new Error("Version not found");

  if (version.publicToken && !force) {
    return version.publicToken;
  }

  const newToken = uuidv4();
  await db.update(graphVersions)
    .set({ 
      publicToken: newToken,
      visitCount: 0 
    })
    .where(eq(graphVersions.id, versionId));

  return newToken;
}

/**
 * Increments the visit count for a version associated with a public token.
 */
export async function recordVisit(token: string) {
  const version = await db.query.graphVersions.findFirst({
    where: eq(graphVersions.publicToken, token),
  });

  if (!version) return;

  await db.update(graphVersions)
    .set({ 
      visitCount: (version.visitCount || 0) + 1 
    })
    .where(eq(graphVersions.id, version.id));
}

/**
 * Fetches analytics for a version (visits, leads, completion rate).
 */
export async function getVersionAnalytics(versionId: string) {
  const version = await db.query.graphVersions.findFirst({
    where: eq(graphVersions.id, versionId),
  });

  if (!version) throw new Error("Version not found");

  const leads = await db.query.userJourneys.findMany({
    where: eq(userJourneys.versionId, versionId),
  });

  const totalVisits = version.visitCount || 0;
  const totalLeads = leads.length;
  const completionRate = totalVisits > 0 ? (totalLeads / totalVisits) * 100 : 0;

  return {
    totalVisits,
    totalLeads,
    completionRate: Math.round(completionRate * 10) / 10, // Round to 1 decimal
  };
}

/**
 * Retrieves the public token for a specific graph version if it exists.
 */
export async function getPublicLink(versionId: string) {
    const version = await db.query.graphVersions.findFirst({
      where: eq(graphVersions.id, versionId),
    });
  
    return version?.publicToken || null;
}

/**
 * Saves a visitor's journey summary and email.
 */
export async function saveUserJourney(versionId: string, email: string, summary: UserJourneySummary) {
  await db.insert(userJourneys).values({
    versionId,
    email,
    summary: summary as any,
  });
}

/**
 * Fetches all leads (email journeys) for a version.
 */
export async function getVersionLeads(versionId: string): Promise<UserJourney[]> {
  const journeys = await db.query.userJourneys.findMany({
    where: eq(userJourneys.versionId, versionId),
    orderBy: (uj, { desc }) => [desc(uj.createdAt)],
  });
  return journeys as UserJourney[];
}

/**
 * Fetches question ID to text mapping for a version.
 */
export async function getVersionQuestionMapping(versionId: string) {
  const nodes = await db.query.graphNodes.findMany({
    where: eq(graphNodes.versionId, versionId),
  });

  const mapping: Record<string, string> = {};

  nodes.forEach(node => {
    const formConfig = node.formConfig as any;
    if (formConfig?.questions) {
      formConfig.questions.forEach((q: any) => {
        if (q.id && q.text) {
          mapping[q.id] = q.text;
        }
      });
    }
  });

  return mapping;
}

/**
 * Resolves a public token to a version and returns its preview config.
 */
export async function getPublicPreviewConfig(token: string) {
  const version = await db.query.graphVersions.findFirst({
    where: eq(graphVersions.publicToken, token),
    with: {
        graph: {
            with: {
                project: true
            }
        }
    }
  }) as any;

  if (!version) throw new PageNotFoundError("Invalid or expired preview link");

  if (!version.graph?.project) throw new PageNotFoundError("Project not found");

  const projectId = version.graph.project.id;

  // Record visit
  await recordVisit(token);

  // Import from existing preview actions
  const { getPreviewConfig } = await import("./preview");
  return await getPreviewConfig(projectId, version.id, true);
}
