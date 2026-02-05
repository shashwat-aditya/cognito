"use client";

import {
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  Edge,
  Node,
  NodeProps,
  Panel,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  NodeChange,
  EdgeChange,
} from "@xyflow/react";
import { Plus, Trash2, Maximize2, ClipboardList, Focus } from "lucide-react";
import { EditorSidebar } from "./EditorSidebar";
import { AnimatePresence } from "framer-motion";
import { syncWorkflow, WorkflowNode as BackendNode, WorkflowEdge as BackendEdge } from "@/lib/actions/workflow";
import { useDialog } from "@/contexts/DialogContext";

type WorkflowNodeData = {
  label?: string;
  title?: string;
  category?: string;
  systemPromptTemplate?: string;
  structuredOutputSchema?: Record<string, unknown>;
  formConfig?: {
    title: string;
    description: string;
    questions: any[];
  } | any;
  reportConfig?: {
    title: string;
    subtitle: string;
    systemPromptTemplate: string;
  };
};

type WorkflowEdgeData = {
  llmPromptTemplate?: string;
};

type FlowNode = Node<WorkflowNodeData>;
type FlowEdge = Edge<WorkflowEdgeData>;

type SelectedElement =
  | { type: "node"; data: WorkflowNodeData; id: string }
  | { type: "edge"; data: WorkflowEdgeData; id: string };

type WorkflowSyncNode = {
  nodeKey: string;
  title?: string;
  position: { x: number; y: number };
  systemPromptTemplate?: string;
  structuredOutputSchema?: Record<string, unknown>;
  config: { category: string };
};

type WorkflowSyncEdge = {
  edgeKey: string;
  fromNodeKey: string;
  toNodeKey: string;
  llmPromptTemplate: string;
};

// Custom Node Component
const AgentNode = ({ data, selected }: NodeProps) => {
  const nodeData = data as WorkflowNodeData;
  const borderColor = selected ? "border-indigo-500 shadow-indigo-500/20" : "border-indigo-500/30";

  return (
    <div className={`relative p-4 rounded-2xl bg-zinc-900 border-2 transition-all min-w-45 shadow-lg ${borderColor}`}>
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="t-in"
        isConnectableStart
        isConnectableEnd
        className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-10"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="t-out"
        isConnectableStart
        isConnectableEnd
        className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-20"
      />
      
      {/* Bottom Handle */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="b-in"
        isConnectableStart
        isConnectableEnd
        className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-10"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b-out"
        isConnectableStart
        isConnectableEnd
        className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-20"
      />

      {/* Left Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="l-in"
        isConnectableStart
        isConnectableEnd
        className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-10"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="l-out"
        isConnectableStart
        isConnectableEnd
        className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-20"
      />

      {/* Right Handle */}
      <Handle
        type="target"
        position={Position.Right}
        id="r-in"
        isConnectableStart
        isConnectableEnd
        className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-10"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="r-out"
        isConnectableStart
        isConnectableEnd
        className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-20"
      />

      <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
          Agent Tool
        </span>
        <span className="text-sm font-semibold text-white truncate">{nodeData.label || "New Agent"}</span>
      </div>
    </div>
  );
};

const FormNode = ({ data, selected }: NodeProps) => {
  const nodeData = data as WorkflowNodeData;
  const borderColor = selected ? "border-yellow-500 shadow-yellow-500/20" : "border-yellow-500/30";

  return (
    <div className={`relative p-4 rounded-2xl bg-zinc-900 border-2 transition-all min-w-45 shadow-lg ${borderColor}`}>
      <Handle type="target" position={Position.Top} id="t-in" isConnectableStart isConnectableEnd className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-10" />
      <Handle type="source" position={Position.Top} id="t-out" isConnectableStart isConnectableEnd className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-20" />
      <Handle type="target" position={Position.Bottom} id="b-in" isConnectableStart isConnectableEnd className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-10" />
      <Handle type="source" position={Position.Bottom} id="b-out" isConnectableStart isConnectableEnd className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-20" />
      <Handle type="target" position={Position.Left} id="l-in" isConnectableStart isConnectableEnd className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-10" />
      <Handle type="source" position={Position.Left} id="l-out" isConnectableStart isConnectableEnd className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-20" />
      <Handle type="target" position={Position.Right} id="r-in" isConnectableStart isConnectableEnd className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-10" />
      <Handle type="source" position={Position.Right} id="r-out" isConnectableStart isConnectableEnd className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-20" />

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <ClipboardList size={14} className="text-yellow-500" />
          <span className="text-[10px] uppercase tracking-wider text-yellow-500/70 font-bold">
            Form Node
          </span>
        </div>
        <span className="text-sm font-semibold text-white truncate">{nodeData.label || "New Form"}</span>
      </div>
    </div>
  );
};

const ReportNode = ({ data, selected }: NodeProps) => {
  const nodeData = data as WorkflowNodeData;
  const borderColor = selected ? "border-emerald-500 shadow-emerald-500/20" : "border-emerald-500/30";

  return (
    <div className={`relative p-4 rounded-2xl bg-zinc-900 border-2 transition-all min-w-45 shadow-lg ${borderColor}`}>
      <Handle type="target" position={Position.Top} id="t-in" isConnectableStart isConnectableEnd className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-10" />
      <Handle type="target" position={Position.Bottom} id="b-in" isConnectableStart isConnectableEnd className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-10" />
      <Handle type="target" position={Position.Left} id="l-in" isConnectableStart isConnectableEnd className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-10" />
      <Handle type="target" position={Position.Right} id="r-in" isConnectableStart isConnectableEnd className="w-3 h-3 bg-zinc-700 border-2 border-zinc-800 z-10" />

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <ClipboardList size={14} className="text-emerald-500" />
          <span className="text-[10px] uppercase tracking-wider text-emerald-500/70 font-bold">
            Report Node
          </span>
        </div>
        <span className="text-sm font-semibold text-white truncate">{nodeData.label || "Report"}</span>
      </div>
    </div>
  );
};

const nodeTypes = {
  agent: AgentNode,
  form: FormNode,
  report: ReportNode,
};

const normalizeSourceHandleId = (handleId?: string | null) => {
  if (!handleId) return undefined;
  switch (handleId) {
    case "t":
    case "t-in":
      return "t-out";
    case "b":
    case "b-in":
      return "b-out";
    case "l":
    case "l-in":
      return "l-out";
    case "r":
    case "r-in":
      return "r-out";
    default:
      return handleId;
  }
};

const normalizeTargetHandleId = (handleId?: string | null) => {
  if (!handleId) return undefined;
  switch (handleId) {
    case "t":
    case "t-out":
      return "t-in";
    case "b":
    case "b-out":
      return "b-in";
    case "l":
    case "l-out":
      return "l-in";
    case "r":
    case "r-out":
      return "r-in";
    default:
      return handleId;
  }
};

const getEdgeHandles = (
  sourcePosition: { x: number; y: number },
  targetPosition: { x: number; y: number }
) => {
  const deltaX = targetPosition.x - sourcePosition.x;
  const deltaY = targetPosition.y - sourcePosition.y;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0
      ? { sourceHandle: "r-out", targetHandle: "l-in" }
      : { sourceHandle: "l-out", targetHandle: "r-in" };
  }

  return deltaY >= 0
    ? { sourceHandle: "b-out", targetHandle: "t-in" }
    : { sourceHandle: "t-out", targetHandle: "b-in" };
};

interface WorkflowCanvasProps {
  projectId: string;
  versionId: string;
  initialNodes: FlowNode[];
  initialEdges: FlowEdge[];
  onUnsavedChanges?: (hasChanges: boolean) => void;
}


export interface WorkflowCanvasRef {
  saveAll: () => Promise<void>;
  createNewVersion: () => Promise<{ nodes: BackendNode[]; edges: BackendEdge[] }>;
  confirmSaved: () => void;
}

const CanvasContent = forwardRef(({ projectId, versionId, initialNodes, initialEdges, onUnsavedChanges }: WorkflowCanvasProps, ref) => {

  const [nodes, setNodes, onNodesChangeHook] = useNodesState(
    initialNodes.map((node) => {
      // Ensure node type matches category for correct styling
      if (node.data?.category === "report") {
        return { ...node, type: "report" };
      }
      if (node.data?.category === "form") {
        return { ...node, type: "form" };
      }
      return node;
    })
  );
  const [edges, setEdges, onEdgesChangeHook] = useEdgesState(initialEdges);
  
  // Baseline state for change detection
  const [baselineNodes, setBaselineNodes] = useState(initialNodes);
  const [baselineEdges, setBaselineEdges] = useState(initialEdges);

  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const dialog = useDialog();

  // Helper to serialize state for comparison
  const serializeState = useCallback((ns: FlowNode[], es: FlowEdge[]) => {
    const simpleNodes = ns.map(n => ({
      id: n.id,
      type: n.type,
      position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
      data: n.data
    })).sort((a,b) => a.id.localeCompare(b.id));

    const simpleEdges = es.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      data: e.data
    })).sort((a,b) => a.id.localeCompare(b.id));

    return JSON.stringify({ nodes: simpleNodes, edges: simpleEdges });
  }, []);

  // Check for unsaved changes
  useEffect(() => {
    const currentHash = serializeState(nodes, edges);
    const baselineHash = serializeState(baselineNodes, baselineEdges);
    onUnsavedChanges?.(currentHash !== baselineHash);
  }, [nodes, edges, baselineNodes, baselineEdges, serializeState, onUnsavedChanges]);


  const onNodesChange = useCallback(
    async (changes: NodeChange<FlowNode>[]) => {
      const removals = changes.filter((c) => c.type === "remove");
      const others = changes.filter((c) => c.type !== "remove");

      if (others.length > 0) {
        onNodesChangeHook(others as any);
      }

      if (removals.length > 0) {
        const confirmed = await dialog.confirm(
          "Are you sure you want to delete the selected node(s)?",
          "Delete Node(s)"
        );
        if (confirmed) {
          onNodesChangeHook(removals as any);
        }
      }
    },
    [onNodesChangeHook, dialog]
  );

  const onEdgesChange = useCallback(
    async (changes: EdgeChange<FlowEdge>[]) => {
      const removals = changes.filter((c) => c.type === "remove");
      const others = changes.filter((c) => c.type !== "remove");

      if (others.length > 0) {
        onEdgesChangeHook(others as any);
      }

      if (removals.length > 0) {
        const confirmed = await dialog.confirm(
          "Are you sure you want to delete the selected connection(s)?",
          "Delete Connection(s)"
        );
        if (confirmed) {
          onEdgesChangeHook(removals as any);
        }
      }
    },
    [onEdgesChangeHook, dialog]
  );

  const { fitView } = useReactFlow();

  useEffect(() => {
    if (nodes.length === 0) return;

    setEdges((eds) => {
      let changed = false;
      const positions = new Map(nodes.map((node) => [node.id, node.position]));
      const nextEdges = eds.map((edge) => {
        const normalizedSource = normalizeSourceHandleId(edge.sourceHandle);
        const normalizedTarget = normalizeTargetHandleId(edge.targetHandle);
        const hasHandles = Boolean(normalizedSource && normalizedTarget);
        let nextEdge = edge;

        if (normalizedSource !== edge.sourceHandle || normalizedTarget !== edge.targetHandle) {
          nextEdge = { ...nextEdge, sourceHandle: normalizedSource, targetHandle: normalizedTarget };
          changed = true;
        }

        if (hasHandles) return nextEdge;

        const sourcePosition = positions.get(edge.source);
        const targetPosition = positions.get(edge.target);
        if (!sourcePosition || !targetPosition) return nextEdge;

        const { sourceHandle, targetHandle } = getEdgeHandles(sourcePosition, targetPosition);
        changed = true;
        return {
          ...nextEdge,
          sourceHandle: normalizedSource ?? sourceHandle,
          targetHandle: normalizedTarget ?? targetHandle,
        };
      });

      return changed ? nextEdges : eds;
    });
  }, [nodes, setEdges]);

  useImperativeHandle(ref, () => ({
    saveAll: async () => {
      // Map nodes to the format expected by syncWorkflow
      const nodesToSync: BackendNode[] = nodes.map((node) => ({
        nodeKey: node.id,
        title: node.data.title || node.data.label || "New Agent",
        position: node.position,
        systemPromptTemplate: node.data.systemPromptTemplate,
        structuredOutputSchema: node.data.structuredOutputSchema,
        config: { 
          category: node.data.category || (node.type === "form" ? "form" : (node.type === "report" ? "report" : "node")),
          formConfig: node.data.formConfig,
          reportConfig: node.data.reportConfig
        },
      }));

      // Map edges to the format expected by syncWorkflow
      const edgesToSync: BackendEdge[] = edges.map((edge) => ({
        edgeKey: edge.id,
        fromNodeKey: edge.source,
        toNodeKey: edge.target,
        llmPromptTemplate: edge.data?.llmPromptTemplate || "",
      }));

      await syncWorkflow(versionId, nodesToSync, edgesToSync);
    },
    createNewVersion: async () => {
      const nodesToSync: BackendNode[] = nodes.map((node) => ({
        nodeKey: node.id,
        title: node.data.title || node.data.label || "New Agent",
        position: node.position,
        systemPromptTemplate: node.data.systemPromptTemplate,
        structuredOutputSchema: node.data.structuredOutputSchema,
        config: { 
          category: node.data.category || (node.type === "form" ? "form" : (node.type === "report" ? "report" : "node")),
          formConfig: node.data.formConfig,
          reportConfig: node.data.reportConfig
        },
      }));

      const edgesToSync: BackendEdge[] = edges.map((edge) => ({
        edgeKey: edge.id,
        fromNodeKey: edge.source,
        toNodeKey: edge.target,
        llmPromptTemplate: edge.data?.llmPromptTemplate || "",
      }));

      // We'll return the nodes and edges so the parent can call the action, 
      // or we can call the action here. 
      // To keep it consistent, let's return the data and let the parent handle the action call 
      // so it can handle the versionID updates.
      return { nodes: nodesToSync, edges: edgesToSync };
    },
    confirmSaved: () => {
      setBaselineNodes(nodes);
      setBaselineEdges(edges);
    }
  }));

  const onConnect = useCallback(
    (params: Connection) => {
      const edgeKey = `edge_${Date.now()}`;
      const newEdge: FlowEdge = {
        ...params,
        id: edgeKey,
        type: "smoothstep",
        animated: true,
        data: { llmPromptTemplate: "" },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_: ReactMouseEvent, node: FlowNode) => {
    setSelectedElement({ type: "node", data: node.data, id: node.id });
  }, []);

  const onEdgeClick = useCallback((_: ReactMouseEvent, edge: FlowEdge) => {
    setSelectedElement({ type: "edge", data: edge.data ?? {}, id: edge.id });
  }, []);

  const addNode = () => {
    const nodeKey = `node_${Date.now()}`;
    const newNode: FlowNode = {
      id: nodeKey,
      type: "agent",
      position: { x: 100, y: 100 },
      data: { 
        label: `Agent ${nodes.filter(n => n.type === 'agent').length + 1}`, 
        title: `Agent ${nodes.filter(n => n.type === 'agent').length + 1}`,
        category: "node",
        systemPromptTemplate: "", 
        structuredOutputSchema: {} 
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const addFormNode = () => {
    const nodeKey = `form_${Date.now()}`;
    const newNode: FlowNode = {
      id: nodeKey,
      type: "form",
      position: { x: 150, y: 150 },
      data: { 
        label: `Form ${nodes.filter(n => n.type === 'form').length + 1}`, 
        title: `Form ${nodes.filter(n => n.type === 'form').length + 1}`,
        category: "form",
        formConfig: {
          title: `Form ${nodes.filter(n => n.type === 'form').length + 1}`,
          description: "",
          questions: []
        }
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const addReportNode = () => {
    const nodeKey = `report_${Date.now()}`;
    const newNode: FlowNode = {
      id: nodeKey,
      type: "report",
      position: { x: 200, y: 200 },
      data: { 
        label: `Report`, 
        title: `Report`,
        category: "report",
        reportConfig: {
          title: "Your Personalized Report",
          subtitle: "Based on our conversation, here is a summary.",
          systemPromptTemplate: "Generate a summary of this conversation."
        }
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const clearCanvas = async () => {
    const confirmed = await dialog.confirm("Are you sure you want to clear the entire canvas? This cannot be undone until you refresh without saving.", "Clear Canvas");
    if (confirmed) {
      setNodes([]);
      setEdges([]);
      setSelectedElement(null);
    }
  };

  const handleSidebarChange = async (
    id: string,
    type: "node" | "edge",
    data: WorkflowNodeData | WorkflowEdgeData
  ) => {
    if (type === "node") {
      const nodeData = data as WorkflowNodeData;
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, ...nodeData, label: nodeData.title || node.data.label } }
            : node
        )
      );
      setSelectedElement((prev) =>
        prev && prev.type === "node"
          ? { ...prev, data: { ...prev.data, ...nodeData, label: nodeData.title || prev.data.label } }
          : prev
      );
    } else {
      const edgeData = data as WorkflowEdgeData;
      setEdges((eds) =>
        eds.map((edge) => (edge.id === id ? { ...edge, data: { ...edge.data, ...edgeData } } : edge))
      );
      setSelectedElement((prev) =>
        prev && prev.type === "edge" ? { ...prev, data: { ...prev.data, ...edgeData } } : prev
      );
    }
  };

  const handleDelete = async (id: string, type: "node" | "edge") => {
    const node = type === "node" ? nodes.find((n) => n.id === id) : null;
    let title = "Delete Item";
    let message = "Are you sure you want to delete this item?";

    if (type === "edge") {
      title = "Delete Connection";
      message = "Are you sure you want to delete this connection? This action cannot be undone.";
    } else if (node) {
      const nodeTypeLabel =
        node.type === "report" ? "Report" : node.type === "form" ? "Form" : "Agent";
      title = `Delete ${nodeTypeLabel}`;
      message = `Are you sure you want to delete this ${nodeTypeLabel}? This action cannot be undone.`;
    }

    const confirmed = await dialog.confirm(message, title);

    if (confirmed) {
      if (type === "node") {
        setNodes((nds) => nds.filter((node) => node.id !== id));
        setEdges((eds) =>
          eds.filter((edge) => edge.source !== id && edge.target !== id)
        );
      } else {
        setEdges((eds) => eds.filter((edge) => edge.id !== id));
      }
      setSelectedElement(null);
    }
  };

  return (
    <div className="w-full h-full relative bg-zinc-950 rounded-2xl overflow-hidden border border-white/5">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{maxZoom: 1}}
      >
        <Background color="#27272a" gap={20} />
        
        <Panel position="top-right" className="flex flex-col gap-2">
          <button
            onClick={addNode}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
          >
            <Plus size={18} />
            Add Agent
          </button>
          <button
            onClick={addFormNode}
            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-xl shadow-yellow-600/20"
          >
            <Plus size={18} />
            Add Form
          </button>
          <button
            onClick={addReportNode}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-xl shadow-emerald-600/20"
          >
            <Plus size={18} />
            Add Report
          </button>
          <button
            onClick={clearCanvas}
            className="flex items-center gap-2 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-xl"
          >
            <Trash2 size={18} />
            Clear Canvas
          </button>
        </Panel>

        <Panel position="bottom-left">
          <button
            onClick={() => fitView({ duration: 800 })}
            className="p-3 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-indigo-400 rounded-xl transition-all active:scale-95 shadow-xl"
            title="Focus View"
          >
            <Focus size={20} />
          </button>
        </Panel>
      </ReactFlow>

      <AnimatePresence>
        {selectedElement && (
          <div className="fixed inset-0 z-140 pointer-events-none">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto" onClick={() => setSelectedElement(null)} />
            <EditorSidebar
              projectId={projectId}
              selectedElement={selectedElement}
              onClose={() => setSelectedElement(null)}
              onChange={handleSidebarChange}
              onDelete={handleDelete}
            />

          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

CanvasContent.displayName = "CanvasContent";

export const WorkflowCanvas = forwardRef((props: WorkflowCanvasProps, ref) => {
  return (
    <ReactFlowProvider>
      <CanvasContent {...props} ref={ref} />
    </ReactFlowProvider>
  );
});

WorkflowCanvas.displayName = "WorkflowCanvas";
