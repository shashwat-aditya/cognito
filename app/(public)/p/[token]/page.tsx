import { getPublicPreviewConfig } from "@/lib/actions/preview_public";
import { getProjectTheme } from "@/lib/actions/theme";

import { VisitorPreview } from "@/components/public/VisitorPreview";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicPreviewPage({ params }: PageProps) {
  const { token } = await params;

  try {
    const config = await getPublicPreviewConfig(token);
    // Find version from config or refetch if needed. getPublicPreviewConfig already returns the config for that version.
    // We need versionId to save the journey. config.id is usually the graphId or versionId? 
    // In preview.ts, getPreviewConfig returns {...workflow, ...} where workflow is from getWorkflowData.
    // getWorkflowData returns the version.
    
    const versionId = config.version.id; 
    const projectId = config.graph.projectId;

    const [theme] = await Promise.all([
      getProjectTheme(projectId, true),
    ]);

    return (
      <div className="fixed inset-0 bg-black overflow-hidden flex flex-col">
        <VisitorPreview 
            config={config} 
            theme={theme} 
            versionId={versionId}
        />
      </div>
    );
  } catch (error) {
    console.error("Public preview error:", error);
    return notFound();
  }
}
