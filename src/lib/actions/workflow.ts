"use server";

import { db } from "@/db";
import { graphs, graphVersions, graphNodes, graphEdges } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export interface WorkflowNode {
  id?: string;
  nodeKey: string;
  title: string;
  systemPromptTemplate?: string;
  structuredOutputSchema?: any;
  position?: { x: number; y: number };
  config?: any;
  formConfig?: any;
  reportConfig?: any;
  category?: "agent" | "form" | "report";
}

export interface WorkflowEdge {
  id?: string;
  edgeKey: string;
  fromNodeKey: string;
  toNodeKey: string;
  llmPromptTemplate?: string;
}

export interface WorkflowVersion {
  id: string;
  graphId: string;
  versionNumber: number;
  status: "draft" | "published" | "archived";
  isActive: boolean;
  publicToken?: string | null;
  createdAt: Date;
}

export interface WorkflowGraph {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getWorkflowData(projectId: string, versionId?: string, skipAuth = false) {
  if (!skipAuth) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
  }

  // 1. Get or create graph
  let graph = await db.query.graphs.findFirst({
    where: eq(graphs.projectId, projectId),
  });

  if (!graph) {
    const [newGraph] = await db.insert(graphs).values({
      projectId,
      name: "Default Workflow",
    }).returning();
    graph = newGraph;
  }

  // 2. Get specific version or latest draft
  let version;
  if (versionId) {
    version = await db.query.graphVersions.findFirst({
      where: and(
        eq(graphVersions.id, versionId),
        eq(graphVersions.graphId, graph.id)
      ),
    });
  }

  if (!version) {
    version = await db.query.graphVersions.findFirst({
      where: and(
        eq(graphVersions.graphId, graph.id),
        eq(graphVersions.status, "draft")
      ),
      orderBy: (graphVersions, { desc }) => [desc(graphVersions.createdAt)],
    });
  }

  if (!version) {
    const [newVersion] = await db.insert(graphVersions).values({
      graphId: graph.id,
      versionNumber: 1,
      status: "draft",
      isActive: true,
    }).returning();
    version = newVersion;
  }

  // 3. Fetch nodes and edges
  const nodes = await db.query.graphNodes.findMany({
    where: eq(graphNodes.versionId, version.id),
  });

  const edges = await db.query.graphEdges.findMany({
    where: eq(graphEdges.versionId, version.id),
  });

  return {
    graph,
    version,
    nodes,
    edges,
  };
}

export async function getProjectVersions(projectId: string): Promise<WorkflowVersion[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const graph = await db.query.graphs.findFirst({
    where: eq(graphs.projectId, projectId),
  });

  if (!graph) return [];

  const versions = await db.query.graphVersions.findMany({
    where: eq(graphVersions.graphId, graph.id),
    orderBy: (graphVersions, { desc }) => [desc(graphVersions.versionNumber)],
  });

  return versions as WorkflowVersion[];
}

export async function saveNode(versionId: string, nodeData: WorkflowNode) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { id, nodeKey, title, systemPromptTemplate, structuredOutputSchema, position } = nodeData;

  const values = {
    versionId,
    nodeKey: (nodeKey || id || "unknown") as string,
    title: title || "New Agent",
    systemPromptTemplate,
    structuredOutputSchema: structuredOutputSchema || {},
    position: (position || { x: 0, y: 0 }) as any,
    config: nodeData.config,
    formConfig: nodeData.formConfig,
  };

  await db.insert(graphNodes)
    .values(values)
    .onConflictDoUpdate({
      target: [graphNodes.versionId, graphNodes.nodeKey],
      set: values,
    });
}

export async function saveEdge(versionId: string, edgeData: WorkflowEdge) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { id, edgeKey, fromNodeKey, toNodeKey, llmPromptTemplate } = edgeData;

  const values = {
    versionId,
    edgeKey: edgeKey || id!,
    fromNodeKey,
    toNodeKey,
    llmPromptTemplate: llmPromptTemplate || "Route to next node",
  };

  await db.insert(graphEdges)
    .values(values)
    .onConflictDoUpdate({
      target: [graphEdges.versionId, graphEdges.edgeKey],
      set: values,
    });
}

export async function deleteNodeAction(versionId: string, nodeKey: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.delete(graphNodes)
    .where(and(eq(graphNodes.versionId, versionId), eq(graphNodes.nodeKey, nodeKey)));
}

export async function deleteEdgeAction(versionId: string, edgeKey: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.delete(graphEdges)
    .where(and(eq(graphEdges.versionId, versionId), eq(graphEdges.edgeKey, edgeKey)));
}

export async function syncWorkflow(versionId: string, nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Transaction to ensure atomicity
  await db.transaction(async (tx) => {
    // 1. Delete all existing nodes and edges for this version
    await tx.delete(graphEdges).where(eq(graphEdges.versionId, versionId));
    await tx.delete(graphNodes).where(eq(graphNodes.versionId, versionId));

    // 2. Insert new nodes (with deduplication)
    if (nodes.length > 0) {
      const uniqueNodesMap = new Map();
      nodes.forEach(n => {
        const key = n.id || n.nodeKey;
        if (key) uniqueNodesMap.set(key, n);
      });
      const uniqueNodes = Array.from(uniqueNodesMap.values());

      if (uniqueNodes.length > 0) {
        await tx.insert(graphNodes).values(
          uniqueNodes.map(node => ({
            versionId,
            nodeKey: node.id || node.nodeKey || "unknown",
            title: node.title || "New Agent",
            systemPromptTemplate: node.systemPromptTemplate,
            structuredOutputSchema: node.structuredOutputSchema || {},
            position: node.position || { x: 0, y: 0 },
            config: node.config,
            formConfig: node.config?.formConfig || node.formConfig,
          }))
        );
      }
    }

    // 3. Insert new edges (with deduplication)
    if (edges.length > 0) {
      const uniqueEdgesMap = new Map();
      edges.forEach(e => {
        const key = e.id || e.edgeKey;
        if (key) uniqueEdgesMap.set(key, e);
      });
      const uniqueEdges = Array.from(uniqueEdgesMap.values());

      if (uniqueEdges.length > 0) {
        await tx.insert(graphEdges).values(
          uniqueEdges.map(edge => ({
            versionId,
            edgeKey: edge.id || edge.edgeKey,
            fromNodeKey: edge.fromNodeKey,
            toNodeKey: edge.toNodeKey,
            llmPromptTemplate: edge.llmPromptTemplate || "Route to next node",
          }))
        );
      }
    }
  });

  revalidatePath(`/dashboard/[project_id]`);
}

export async function createNextVersion(projectId: string, nodes: WorkflowNode[], edges: WorkflowEdge[]): Promise<WorkflowVersion> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const graph = await db.query.graphs.findFirst({
    where: eq(graphs.projectId, projectId),
  });

  if (!graph) throw new Error("Graph not found");

  const latestVersion = await db.query.graphVersions.findFirst({
    where: eq(graphVersions.graphId, graph.id),
    orderBy: (graphVersions, { desc }) => [desc(graphVersions.versionNumber)],
  });

  const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

  const [newVersion] = await db.insert(graphVersions).values({
    graphId: graph.id,
    versionNumber: nextVersionNumber,
    status: "draft",
    isActive: true,
  }).returning();

  // Clone nodes (deduplicated)
  const uniqueNodesMap = new Map();
  nodes.forEach(n => {
    const key = n.id || n.nodeKey;
    if (key) uniqueNodesMap.set(key, n);
  });
  
  for (const node of uniqueNodesMap.values()) {
    await saveNode(newVersion.id, {
      ...node,
      nodeKey: node.id || node.nodeKey
    });
  }

  // Clone edges (deduplicated)
  const uniqueEdgesMap = new Map();
  edges.forEach(e => {
    const key = e.id || e.edgeKey;
    if (key) uniqueEdgesMap.set(key, e);
  });

  for (const edge of uniqueEdgesMap.values()) {
    await saveEdge(newVersion.id, {
      ...edge,
      edgeKey: edge.id || edge.edgeKey
    });
  }

  revalidatePath(`/dashboard/[project_id]`);
  return newVersion;
}

export async function publishVersion(versionId: string, projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const graph = await db.query.graphs.findFirst({
    where: eq(graphs.projectId, projectId),
  });

  if (!graph) throw new Error("Graph not found");

  await db.transaction(async (tx) => {
    // 1. Set all versions to draft
    await tx.update(graphVersions)
      .set({ status: "draft" })
      .where(eq(graphVersions.graphId, graph.id));

    // 2. Set target version to published
    await tx.update(graphVersions)
      .set({ status: "published" })
      .where(eq(graphVersions.id, versionId));
  });

  revalidatePath(`/dashboard/[project_id]`);
}

export async function unpublishVersion(versionId: string, projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const graph = await db.query.graphs.findFirst({
    where: eq(graphs.projectId, projectId),
  });

  if (!graph) throw new Error("Graph not found");

  await db.update(graphVersions)
    .set({ status: "draft" })
    .where(and(
      eq(graphVersions.id, versionId),
      eq(graphVersions.graphId, graph.id)
    ));

  revalidatePath(`/dashboard/[project_id]`);
}

import { notInArray } from "drizzle-orm";
