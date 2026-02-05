"use client";

import React, { useState, useEffect, use } from "react";
import { getProject } from "@/lib/actions/projects";
import { getWorkflowData, getProjectVersions, createNextVersion } from "@/lib/actions/workflow";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { WorkflowCanvas, WorkflowCanvasRef } from "@/components/dashboard/WorkflowCanvas";
import { VersionSelector } from "@/components/dashboard/VersionSelector";
import { VariablesPage } from "@/components/dashboard/VariablesPage";
import { ThemingPage } from "@/components/dashboard/ThemingPage";
import { PreviewSession } from "@/components/dashboard/PreviewSession";
import { LeadsTable } from "@/components/dashboard/LeadsTable";
import { notFound, useSearchParams, useRouter } from "next/navigation";

import { motion, AnimatePresence } from "framer-motion";
import type { graphEdges, graphNodes, graphVersions, graphs, projects } from "@/db/schema";
import { AssetsPage } from "@/components/dashboard/AssetsPage";

interface ProjectPageProps {
  params: Promise<{ project_id: string }>;
}

type Project = typeof projects.$inferSelect;
type Graph = typeof graphs.$inferSelect;
type GraphVersion = typeof graphVersions.$inferSelect;
type GraphNode = typeof graphNodes.$inferSelect;
type GraphEdge = typeof graphEdges.$inferSelect;

type WorkflowData = {
  graph: Graph;
  version: GraphVersion;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type VersionOption = {
  id: string;
  versionNumber: number;
  status: string;
  createdAt: number;
};

const toVersionOption = (version: GraphVersion): VersionOption => ({
  id: version.id,
  versionNumber: version.versionNumber,
  status: version.status,
  createdAt: version.createdAt.getTime(),
});

export default function ProjectPage({ params }: ProjectPageProps) {
  const { project_id } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeVersionId = searchParams.get("versionId");

  const [project, setProject] = useState<Project | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [versions, setVersions] = useState<GraphVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("workflow");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const canvasRef = React.useRef<WorkflowCanvasRef>(null);

  const handleSave = async () => {
    if (!canvasRef.current) return;
    setIsSaving(true);
    try {
      await canvasRef.current.saveAll();
      canvasRef.current.confirmSaved(); // Update baseline state in canvas
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Manual save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsVersion = async () => {
    if (!canvasRef.current) return;
    setIsSaving(true);
    try {
      const { nodes, edges } = await canvasRef.current.createNewVersion();
      const newVersion = await createNextVersion(project_id, nodes, edges);
      // Refresh versions list and swith to new version
      const updatedVersions = await getProjectVersions(project_id);
      setVersions(updatedVersions as GraphVersion[]);
      setHasUnsavedChanges(false);
      router.push(`/dashboard/${project_id}?versionId=${newVersion.id}`);
    } catch (error) {
      console.error("Save as version failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVersionSelect = (id: string) => {
    router.push(`/dashboard/${project_id}?versionId=${id}`);
  };

  useEffect(() => {
    async function fetchData() {
      // Don't set loading to true if we are just switching versions to avoid full page flicker, 
      // but here we want to ensure data consistency.
      setLoading(true);
      try {
        const [projData, workflowData, versionsData] = await Promise.all([
          getProject(project_id),
          getWorkflowData(project_id, activeVersionId || undefined),
          getProjectVersions(project_id)
        ]);

        const typedProject = projData as Project | null;
        const typedWorkflow = workflowData as WorkflowData;
        const typedVersions = versionsData as GraphVersion[];

        if (!typedProject) {
          notFound();
        }
        setProject(typedProject);
        setWorkflow(typedWorkflow);
        setVersions(typedVersions);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [project_id, activeVersionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!project || !workflow) {
    return notFound();
  }

  const mappedNodes = workflow.nodes.map((n) => {
    const nodePosition = n.position as { x: number; y: number } | undefined;
    const nodeConfig = (n.config ?? {}) as { category?: string; formConfig?: any; reportConfig?: any }; // Add reportConfig type
    const title = n.title ?? undefined;
    const structuredOutputSchema =
      n.structuredOutputSchema && typeof n.structuredOutputSchema === "object"
        ? (n.structuredOutputSchema as Record<string, unknown>)
        : undefined;

    const isForm = nodeConfig.category === "form";
    
    return {
      id: n.nodeKey,
      type: isForm ? "form" : (nodeConfig.category === "report" ? "report" : "agent"),
      position: nodePosition || { x: 100, y: 100 },
      data: { 
        label: title, 
        title,
        category: nodeConfig.category || "node",
        systemPromptTemplate: n.systemPromptTemplate ?? undefined,
        structuredOutputSchema,
        formConfig: (n.formConfig ?? nodeConfig.formConfig) as any,
        reportConfig: (n.reportConfig ?? nodeConfig.reportConfig) as any // Add reportConfig
      },
    };
  });

  const mappedEdges = workflow.edges.map((e) => ({
    id: e.edgeKey,
    source: e.fromNodeKey,
    target: e.toNodeKey,
    type: "smoothstep",
    animated: true,
    data: { llmPromptTemplate: e.llmPromptTemplate },
  }));

  const refreshVersions = async () => {
    // Only fetch versions data to update the selector UI
    const versionsData = await getProjectVersions(project_id);
    setVersions(versionsData as GraphVersion[]);
    
    // Also re-fetch current workflow data to ensure status integrity
    const workflowData = await getWorkflowData(project_id, activeVersionId || undefined);
    setWorkflow(workflowData as WorkflowData);
  };

  const nextVersionId = "v" + (versions.length + 1).toString();
  const versionOptions = versions.map(toVersionOption);
  const currentVersionOption = toVersionOption(workflow.version);

  return (
    <div className="flex flex-col h-screen bg-black text-white selection:bg-indigo-500/30 overflow-hidden">
      <DashboardTopBar 
        projectTitle={project.name} 
        onSave={handleSave}
        onSaveAsNewVersion={handleSaveAsVersion}
        isSaving={isSaving}
        currentVersionId={nextVersionId}
        hideActions={activeTab === "variables" || activeTab === "preview" || activeTab === "theming" || activeTab === "leads"}
        hasUnsavedChanges={hasUnsavedChanges}
        isPublishedVersion={currentVersionOption.status === "published"}
      />
      
      <div className="flex items-center justify-between px-6 py-2 border-white/5 bg-zinc-900/30">
        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="py-2">
          {workflow.version && activeTab !== "variables" && (
            <VersionSelector 
              projectId={project_id}
              currentVersion={currentVersionOption}
              versions={versionOptions}
              onVersionSelect={handleVersionSelect}
              onVersionUpdated={refreshVersions}
            />
          )}
        </div>

      </div>
      
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full px-6 pb-2"
          >
            {activeTab === "workflow" && (
              <WorkflowCanvas
                key={workflow.version.id} // Force re-render on version change
                ref={canvasRef}
                projectId={project_id}
                versionId={workflow.version.id}
                initialNodes={mappedNodes}
                initialEdges={mappedEdges}
                onUnsavedChanges={setHasUnsavedChanges}
              />
            )}

            {activeTab === "variables" && (
                <VariablesPage projectId={project_id} />
            )}

            {activeTab === "assets" && (
                <AssetsPage projectId={project_id} />
            )}

            {activeTab === "theming" && (
                <ThemingPage projectId={project_id} />
            )}

            {activeTab === "preview" && (
              <PreviewSession projectId={project_id} versionId={workflow.version.id} />
            )}

            {activeTab === "leads" && (
              <LeadsTable versionNumber={currentVersionOption.versionNumber} versionId={workflow.version.id} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
