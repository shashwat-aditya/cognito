"use client";

import { useState } from "react";
import { Trash2, X, AlertTriangle, Loader2 } from "lucide-react";

interface DeleteProjectDialogProps {
  projectName: string;
  onConfirm: () => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteProjectDialog({ projectName, onConfirm, isOpen, onClose }: DeleteProjectDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isPending, setIsPending] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (confirmText.toLowerCase() !== "delete") return;
    setIsPending(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Error deleting project:", error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="glass w-full max-w-md rounded-3xl border border-white/10 p-8 relative animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
          <AlertTriangle className="text-red-400" size={24} />
        </div>

        <h2 className="text-2xl font-bold mb-2 text-zinc-100">Delete Project</h2>
        <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
          This action cannot be undone. This will permanently delete the project <span className="text-zinc-100 font-semibold">{projectName}</span> and all associated data.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Type <span className="text-zinc-300">delete</span> to confirm
            </label>
            <input 
              type="text" 
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all text-white"
              autoFocus
            />
          </div>

          <button 
            onClick={handleConfirm}
            disabled={confirmText.toLowerCase() !== "delete" || isPending}
            className="w-full h-12 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20"
          >
            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            Delete Project
          </button>
          
          <button 
            onClick={onClose}
            className="w-full h-12 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
