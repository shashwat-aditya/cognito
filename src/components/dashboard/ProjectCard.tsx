"use client";

import { Bot, Clock, LayoutGrid, Trash2 } from "lucide-react";
import { deleteProject } from "@/lib/actions/projects";
import { useState } from "react";
import Link from "next/link";
import { DeleteProjectDialog } from "./DeleteProjectDialog";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    updatedAt: Date;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
    } catch (error) {
      console.error("Failed to delete project:", error);
      setIsDeleting(false);
    }
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return "just now";
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  };

  return (
    <>
      <Link 
        href={`/dashboard/${project.id}`}
        className={`group glass p-6 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer flex flex-col gap-6 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="flex justify-between items-start">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
            <LayoutGrid className="text-indigo-400" size={24} />
          </div>
          <div className="relative">
            <button 
              onClick={handleDeleteClick}
              className="p-2 text-zinc-600 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
              title="Delete Project"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xl group-hover:text-indigo-400 transition-colors">{project.name}</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">
            {project.description || "No description provided."}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-3 text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Bot size={14} />
              <span className="text-xs">Active</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Clock size={14} />
            <span className="text-xs">{timeAgo(project.updatedAt)}</span>
          </div>
        </div>
      </Link>

      <DeleteProjectDialog 
        projectName={project.name}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
