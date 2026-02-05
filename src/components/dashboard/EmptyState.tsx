"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateProjectDialog } from "./CreateProjectDialog";

export function EmptyState() {
  return (
    <div className="col-span-full border-2 border-dashed border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2">
        <Plus size={32} />
      </div>
      <div>
        <h3 className="text-lg font-bold mb-1">No projects found</h3>
        <p className="text-sm text-zinc-500 max-w-xs">
          Get started by creating your first AI agent workflow project.
        </p>
      </div>
      <CreateProjectDialog />
    </div>
  );
}
