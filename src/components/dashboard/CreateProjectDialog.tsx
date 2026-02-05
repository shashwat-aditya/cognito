"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { createProject } from "@/lib/actions/projects";

export function CreateProjectDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    const formData = new FormData(event.currentTarget);
    try {
      await createProject(formData);
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-xl shadow-white/5"
      >
        <Plus size={18} />
        Add Project
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-3xl border border-white/10 p-8 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Project Name</label>
                <input 
                  name="name"
                  type="text" 
                  required
                  placeholder="e.g. Customer Support Bot"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Description (Optional)</label>
                <textarea 
                  name="description"
                  placeholder="What will this agent do?"
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={isPending}
                className="w-full h-12 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
              >
                {isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                Create Project
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
