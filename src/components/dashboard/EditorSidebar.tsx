"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Trash2, Info, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { getProjectVariables } from "@/lib/actions/variables";
import { MentionTextArea } from "./MentionTextArea";
import { QuestionnaireEditor, FormConfig } from "./QuestionnaireEditor";

interface ProjectVariable {
  id: string;
  projectId: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}


export interface SidebarElement {
  type: "node" | "edge";
  data: any;
  id: string;
}

interface SidebarProps {
  projectId: string;
  selectedElement: SidebarElement | null;
  onClose: () => void;
  onChange: (id: string, type: "node" | "edge", data: any) => void;
  onDelete: (id: string, type: "node" | "edge") => Promise<void>;
}


export function EditorSidebar({ projectId, selectedElement, onClose, onChange, onDelete }: SidebarProps) {

  const [formData, setFormData] = useState<any>({});
  const [jsonString, setJsonString] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [variables, setVariables] = useState<ProjectVariable[]>([]);

  useEffect(() => {
    async function loadVariables() {
      try {
        const data = await getProjectVariables(projectId);
        setVariables(data as ProjectVariable[]);
      } catch (err) {
        console.error("Failed to load variables:", err);
      }
    }
    loadVariables();
  }, [projectId]);


  useEffect(() => {
    if (selectedElement) {
      setFormData(selectedElement.data || {});
      if (selectedElement.type === "node") {
        setJsonString(JSON.stringify(selectedElement.data?.structuredOutputSchema || {}, null, 2));
      }
      setJsonError(null);
    }
  }, [selectedElement]);

  if (!selectedElement) return null;

  const isNode = selectedElement.type === "node";

  const handleJsonChange = (val: string) => {
    setJsonString(val);
    try {
      const parsed = JSON.parse(val);
      setFormData((prev: any) => ({ ...prev, structuredOutputSchema: parsed }));
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  useEffect(() => {
    if (!selectedElement || jsonError) return;
    
    const handler = setTimeout(() => {
      onChange(selectedElement.id, selectedElement.type, formData);
    }, 400);

    return () => clearTimeout(handler);
  }, [formData, selectedElement?.id, jsonError]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(selectedElement.id, selectedElement.type);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 h-screen w-100 bg-zinc-900 border-l border-white/10 shadow-2xl z-150 overflow-y-auto pointer-events-auto"
    >
      <div className="sticky top-0 bg-zinc-900/80 backdrop-blur-md border-b border-white/5 p-6 flex justify-between items-center z-10">
        <div>
          <h2 className="text-xl font-bold text-white capitalize">
            {isNode ? (formData.category === "form" ? "Design Questionnaire" : (formData.category === "report" ? "Configure Report" : "Configure Agent")) : "Route Relation"}
          </h2>
          <p className="text-xs text-zinc-500 mt-1 font-mono tracking-tight">{selectedElement.id}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <X size={20} className="text-zinc-400" />
        </button>
      </div>

      <div className="p-6 space-y-8">
        {isNode && formData.category === "form" ? (
          <QuestionnaireEditor 
            data={formData.formConfig || { title: formData.title || "", description: "", questions: [] }}
            onChange={(config) => setFormData({ ...formData, formConfig: config, title: config.title })}
          />
        ) : isNode && formData.category === "report" ? (
          <div className="space-y-6">
            <div className="group space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-emerald-400 transition-colors">
                Report Title
              </label>
              <input
                type="text"
                value={formData.reportConfig?.title || ""}
                onChange={(e) => setFormData({ ...formData, reportConfig: { ...formData.reportConfig, title: e.target.value }, title: e.target.value })}
                placeholder="e.g. Your Analysis Report"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-semibold"
              />
            </div>
            <div className="group space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-emerald-400 transition-colors">
                Report Subtitle
              </label>
              <input
                type="text"
                value={formData.reportConfig?.subtitle || ""}
                onChange={(e) => setFormData({ ...formData, reportConfig: { ...formData.reportConfig, subtitle: e.target.value } })}
                placeholder="e.g. Here is a summary of your results..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-semibold"
              />
            </div>
            <div className="group space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-emerald-400 transition-colors">
                Report Generation Prompt
                <Info size={14} className="opacity-50" />
              </label>
              <MentionTextArea
                value={formData.reportConfig?.systemPromptTemplate || ""}
                onChange={(val) => setFormData({ ...formData, reportConfig: { ...formData.reportConfig, systemPromptTemplate: val } })}
                variables={variables}
                placeholder="Instructions for generating the report content..."
                rows={10}
                className="group-focus-within:ring-emerald-500/50"
              />
            </div>
          </div>
        ) : isNode ? (
          <div className="space-y-6">
            <div className="group space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-indigo-400 transition-colors">
                Agent Title
              </label>
              <input
                type="text"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Greeting Agent"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold"
              />
            </div>

            <div className="group space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-indigo-400 transition-colors">
                System Persona
                <Info size={14} className="opacity-50" />
              </label>
              <MentionTextArea
                value={formData.systemPromptTemplate || ""}
                onChange={(val) => setFormData({ ...formData, systemPromptTemplate: val })}
                variables={variables}
                placeholder="Describe this agent's personality and instructions..."
                rows={10}
              />

            </div>

            <div className="group space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-indigo-400 transition-colors">
                  Structured Response
                </label>
                {jsonError && (
                  <div className="flex items-center gap-1 text-red-400 text-[10px] font-black uppercase tracking-tighter bg-red-500/10 px-2 py-0.5 rounded">
                    <AlertCircle size={10} />
                    Syntax Error
                  </div>
                )}
              </div>
              <textarea
                value={jsonString}
                onChange={(e) => handleJsonChange(e.target.value)}
                rows={6}
                className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 transition-all font-mono text-xs ${
                  jsonError ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-indigo-500/50"
                }`}
              />
            </div>
          </div>
        ) : (
          <div className="group space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-emerald-400 transition-colors">
              Routing Logic (LLM Prompt)
            </label>
            <MentionTextArea
              value={formData.llmPromptTemplate || ""}
              onChange={(val) => setFormData({ ...formData, llmPromptTemplate: val })}
              variables={variables}
              placeholder="Describe when the flow should transition to this node..."
              rows={8}
              className="group-focus-within:ring-emerald-500/50"
            />

          </div>
        )}

        <div className="pt-4 flex gap-3">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 h-14 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl font-bold transition-all active:scale-95 border border-red-500/20"
          >
            {isDeleting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Trash2 size={18} /></motion.div> : <Trash2 size={18} />}
            Delete Element
          </button>
        </div>
      </div>
    </motion.div>
  );
}
