"use client";

import React, { useState } from "react";
import { ChevronDown, History, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Version {
  id: string;
  versionNumber: number;
  status: string;
  createdAt: number;
}

import { publishVersion, unpublishVersion } from "@/lib/actions/workflow";
import { useDialog } from "@/contexts/DialogContext";

interface VersionSelectorProps {
  projectId: string; // Add projectId
  currentVersion: Version;
  versions: Version[];
  onVersionSelect: (versionId: string) => void;
  onVersionUpdated?: () => void;
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({ projectId, currentVersion, versions, onVersionSelect, onVersionUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const dialog = useDialog();

  // Format date to readable string
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  const handlePublish = async (e: React.MouseEvent, versionId: string) => {
    e.stopPropagation();
    const confirmed = await dialog.confirm("Are you sure you want to publish this version? This will unpublish any currently active version.", "Publish Version");
    if (confirmed) {
      setIsPublishing(true);
      try {
        await publishVersion(versionId, projectId);
        setIsOpen(false);
        onVersionUpdated?.();
      } catch (error) {
        console.error("Failed to publish version:", error);
      } finally {
        setIsPublishing(false);
      }
    }
  };

  const handleUnpublish = async (e: React.MouseEvent, versionId: string) => {
    e.stopPropagation();
    const confirmed = await dialog.confirm("Are you sure you want to unpublish this version?", "Unpublish Version");
    if (confirmed) {
      setIsPublishing(true);
      try {
        await unpublishVersion(versionId, projectId);
        setIsOpen(false);
        onVersionUpdated?.();
      } catch (error) {
        console.error("Failed to unpublish version:", error);
      } finally {
        setIsPublishing(false);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 z-50">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all text-xs font-medium text-zinc-400 hover:text-white"
        >
          <History size={14} />
          <span>v{currentVersion.versionNumber}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
            currentVersion.status === "draft" ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
          }`}>
            {currentVersion.status}
          </span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute top-full left-0 mt-2 w-72 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 p-1"
              >
                <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-1 flex justify-between items-center">
                  <span>Version History</span>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-0.5">
                  {versions.map((version) => (
                    <button
                      key={version.id}
                      onClick={() => {
                        onVersionSelect(version.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors group ${
                        version.id === currentVersion.id
                          ? "bg-indigo-600/10"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-sm ${version.id === currentVersion.id ? "text-indigo-400" : "text-zinc-400 group-hover:text-white"}`}>
                            v{version.versionNumber}
                          </span>
                          <span className={`text-[10px] uppercase font-bold tracking-wider ${
                            version.status === "draft" ? "text-amber-500" : "text-emerald-500"
                          }`}>
                            {version.status}
                          </span>
                        </div>
                        <span className="text-[10px] opacity-60 font-mono text-zinc-500">
                          {version.createdAt ? formatDate(new Date(version.createdAt)) : "Just now"}
                        </span>
                      </div>
                      {version.id === currentVersion.id && <Check size={14} className="text-indigo-500" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {currentVersion.status === 'draft' && (
        <button
          onClick={(e) => handlePublish(e, currentVersion.id)}
          disabled={isPublishing}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 hover:text-emerald-400 border border-emerald-500/20 rounded-lg transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-50"
        >
          {isPublishing ? "Publishing..." : "Publish"}
        </button>
      )}

      {currentVersion.status === 'published' && (
        <button
          onClick={(e) => handleUnpublish(e, currentVersion.id)}
          disabled={isPublishing}
          className="flex items-center gap-2 px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 hover:text-amber-400 border border-amber-500/20 rounded-lg transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-50"
        >
          {isPublishing ? "Processing..." : "Unpublish"}
        </button>
      )}
    </div>
  );
};
