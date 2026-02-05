"use client";

import React from "react";
import { motion } from "framer-motion";

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: "workflow", label: "Workflow", color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { id: "variables", label: "Variables", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { id: "assets", label: "Assets", color: "text-purple-400", bg: "bg-purple-500/10" },
    { id: "theming", label: "Theming", color: "text-pink-400", bg: "bg-pink-500/10" },
    { id: "preview", label: "Preview", color: "text-amber-400", bg: "bg-amber-500/10" },
    { id: "leads", label: "Leads", color: "text-blue-400", bg: "bg-blue-500/10" },
  ];

  return (
    <div className="flex p-1 bg-zinc-900 border border-white/5 rounded-xl gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`h-8 px-4 rounded-lg flex items-center text-xs font-semibold transition-all relative group overflow-hidden ${
            activeTab === tab.id
              ? `${tab.bg} ${tab.color} shadow-sm ring-1 ring-white/10`
              : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
          }`}
        >
          <span className="relative z-10">{tab.label}</span>
          {activeTab === tab.id && (
            <motion.div 
              layoutId="activeTabGlow"
              className={`absolute inset-0 ${tab.bg}`}
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
};
