"use client";

import React, { useState, useEffect } from "react";
import { MoreVertical, Search, Plus, Trash2, Edit2, X, AlertTriangle, Loader2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getProjectVariables, upsertProjectVariable, deleteProjectVariable, renameProjectVariable } from "@/lib/actions/variables";

interface ProjectVariable {
  id: string;
  projectId: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

interface VariablesPageProps {
  projectId: string;
}

export function VariablesPage({ projectId }: VariablesPageProps) {
  const [variables, setVariables] = useState<ProjectVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVarId, setSelectedVarId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newVarKey, setNewVarKey] = useState("");
  const [newVarValue, setNewVarValue] = useState("");
  const [editValue, setEditValue] = useState("");
  const [tempKey, setTempKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingDuplicate, setIsConfirmingDuplicate] = useState(false);





  const fetchVariables = async () => {
    try {
      const data = await getProjectVariables(projectId);
      setVariables(data as ProjectVariable[]);
    } catch (error) {
      console.error("Failed to fetch variables", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchVariables();
  }, [projectId]);

  const selectedVariable = variables.find((v) => v.id === selectedVarId);

  useEffect(() => {
    if (selectedVariable) {
      setEditValue(selectedVariable.value);
    } else {
      setEditValue("");
    }
  }, [selectedVarId, selectedVariable?.value]);

  const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value);
  };




  const handleAddVariable = async (bypassCheck = false) => {
    if (!newVarKey.trim()) return;
    
    // Check if key already exists
    const existing = variables.find(v => v.key.toLowerCase() === newVarKey.trim().toLowerCase());
    if (existing && !bypassCheck) {
      setIsConfirmingDuplicate(true);
      return;
    }

    setIsSaving(true);
    try {
      await upsertProjectVariable(projectId, newVarKey, newVarValue);
      setNewVarKey("");
      setNewVarValue("");
      setIsConfirmingDuplicate(false);
      await fetchVariables();
    } catch (error) {
      console.error("Failed to add variable", error);
    } finally {
      setIsSaving(false);
    }
  };



  const handleManualSave = async () => {
    if (!selectedVariable) return;
    setIsSaving(true);
    try {
      await upsertProjectVariable(projectId, selectedVariable.key, editValue);
      await fetchVariables();
      setSelectedVarId(null);
    } catch (error) {
      console.error("Failed to save variable", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {

    if (!isDeleting) return;
    setIsSaving(true);
    try {
      await deleteProjectVariable(projectId, isDeleting);
      setIsDeleting(null);
      await fetchVariables();
      if (selectedVarId === isDeleting) {
        setSelectedVarId(null);
      }
    } catch (error) {
      console.error("Failed to delete variable", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRename = async () => {
    if (!isRenaming || !tempKey.trim()) return;
    setIsSaving(true);
    try {
      await renameProjectVariable(projectId, isRenaming, tempKey);
      setIsRenaming(null);
      await fetchVariables();
    } catch (error) {
      console.error("Failed to rename variable", error);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredVariables = variables.filter((v) =>
    v.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex w-full h-full gap-6">
      {/* Left Column: Editor / Creation Form */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedVarId ? (
          <div className="flex flex-col h-full">


            <div className="space-y-2 flex-1 flex flex-col">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 px-1">Variable Key (Unique)</label>
                <input
                  autoFocus
                  value={newVarKey}
                  onChange={(e) => setNewVarKey(e.target.value)}
                  placeholder="e.g. API_KEY, MODEL_ID, etc."
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-6 py-4 mt-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-white font-mono"
                />
              </div>

              <div className="space-y-2 flex-1 flex flex-col">
                <label className="text-sm font-medium text-zinc-400 px-1">Initial Value</label>
                <textarea
                  value={newVarValue}
                  onChange={(e) => setNewVarValue(e.target.value)}
                  placeholder="Enter the value for this variable..."
                  className="flex-1 w-full bg-zinc-900/50 border border-white/10 rounded-3xl p-8 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all resize-none text-zinc-300 font-mono text-sm leading-relaxed"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleAddVariable()}
                  disabled={isSaving || !newVarKey.trim()}

                  className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  Create Variable
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                 <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/5 flex items-center gap-2">
                    <Edit2 size={14} className="text-zinc-500" />
                    <span className="text-xs font-medium text-zinc-400">Editing</span>
                    <span className="text-sm font-bold text-white font-mono">{selectedVariable?.key}</span>
                 </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedVarId(null)}
                  className="p-2 text-zinc-500 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5"
                  title="Cancel editing and create new"
                >
                  <X size={20} />
                </button>
                <button
                  onClick={handleManualSave}
                  disabled={isSaving || editValue === selectedVariable?.value}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/10 active:scale-95"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              </div>

            </div>
            
            <div className="flex-1 relative group">
              <textarea
                value={editValue}
                onChange={handleValueChange}
                disabled={!selectedVariable}
                placeholder="Enter variable value here..."
                className="w-full h-full bg-zinc-900/50 border border-white/5 rounded-3xl p-8 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all resize-none text-zinc-300 font-mono text-sm leading-relaxed"
              />
            </div>
          </div>
        )}

      </div>


      {/* Right Column: Variables List */}
      <div className="w-80 flex flex-col gap-4">
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-400 text-sm uppercase tracking-wider">Project Variables</h3>
            </div>

            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
              <input
                type="text"
                placeholder="Search variables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-white/20 transition-all text-zinc-300"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="animate-spin text-zinc-600" size={24} />
                <p className="text-xs text-zinc-500">Loading variables...</p>
              </div>
            ) : filteredVariables.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
                <p className="text-xs text-zinc-500">No variables found</p>
              </div>
            ) : (
              filteredVariables.map((v) => (
                <div
                  key={v.id}
                  onClick={() => {
                    setSelectedVarId(v.id);
                  }}
                  className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    selectedVarId === v.id
                      ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                      : "hover:bg-white/5 text-zinc-400 hover:text-zinc-200"
                  }`}
                >

                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold truncate">{v.key}</span>
                    <span className="text-[10px] opacity-50 truncate">{v.value || "no value"}</span>
                  </div>

                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <VariableMenu 
                      onEdit={() => {
                        setIsRenaming(v.id);
                        setTempKey(v.key);
                      }} 
                      onDelete={() => setIsDeleting(v.id)} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>


        {isConfirmingDuplicate && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass w-full max-w-sm rounded-3xl border border-white/10 p-8 text-center"
            >
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2">Overwrite Variable?</h2>
              <p className="text-zinc-400 text-sm mb-8">
                A variable named <span className="text-white font-mono font-bold">"{newVarKey}"</span> already exists. Do you want to overwrite its value?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsConfirmingDuplicate(false)}
                  className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddVariable(true)}
                  disabled={isSaving}
                  className="flex-1 h-12 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-600/20"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Overwrite"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isRenaming && (

          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass w-full max-w-sm rounded-3xl border border-white/10 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Rename Variable</h2>
                <button onClick={() => setIsRenaming(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Key Name</label>
                  <input
                    autoFocus
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <button
                  onClick={handleRename}
                  disabled={isSaving || !tempKey.trim()}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isDeleting && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass w-full max-w-sm rounded-3xl border border-white/10 p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2">Delete Variable?</h2>
              <p className="text-zinc-400 text-sm mb-8">This action cannot be undone. Any workflow using this variable will fail to resolve it.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleting(null)}
                  className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="flex-1 h-12 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VariableMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-zinc-500 hover:text-white"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-110" 
            onClick={(e) => {

              e.stopPropagation();
              setIsOpen(false);
            }} 
          />
          <div className="absolute right-0 top-full mt-2 w-36 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-120 overflow-hidden animate-in fade-in zoom-in duration-150 origin-top-right">

            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Edit2 size={14} />
              Rename
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
