"use client";

import React from "react";
import Link from "next/link";
import { Save, Home } from "lucide-react";

interface DashboardTopBarProps {
  projectTitle: string;
  onSave?: () => void;
  onSaveAsNewVersion?: () => void;
  isSaving?: boolean;
  currentVersionId?: string;
  hideActions?: boolean;
  hasUnsavedChanges?: boolean;
  isPublishedVersion?: boolean;
}

export const DashboardTopBar: React.FC<DashboardTopBarProps> = ({ 
  projectTitle, 
  onSave, 
  onSaveAsNewVersion, 
  isSaving, 
  currentVersionId,
  hideActions = false,
  hasUnsavedChanges = false,
  isPublishedVersion = false
}) => {
  return (
    <div className="w-full h-16 bg-zinc-900/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-100">        
      <div className="flex items-center gap-1">
        <Link 
          href="/dashboard"
          className="p-1 hover:bg-zinc-100 flex items-center gap-1 text-lg dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <Home size={20} />
          Projects
        </Link>
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">/</p>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{projectTitle}</h1>
      </div>
      {!hideActions && (
        <div className="flex items-center gap-4">
          {hasUnsavedChanges && !isSaving && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full animate-pulse">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">Unsaved Changes</span>
            </div>
          )}
          {
            !isPublishedVersion && 
            <button 
              onClick={onSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 ${
                hasUnsavedChanges 
                  ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20" 
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              {isSaving ? <div className="animate-spin"><Save size={18} /></div> : <Save size={18} />}
              <span className="text-sm font-bold tracking-tight">Save</span>
            </button>
          }
          <button 
            onClick={onSaveAsNewVersion}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            <span className="text-sm font-bold tracking-tight">Save as {currentVersionId} ( draft ) </span>
          </button>
        </div>
      )}
    </div>
  );
};

