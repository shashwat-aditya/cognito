"use client";

import React, { useState, useEffect } from "react";
import { getVersionLeads, UserJourney, getVersionAnalytics } from "@/lib/actions/preview_public";
import { Mail, Calendar, ChevronRight, FileJson, Download, Rocket, Eye, Target, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface LeadsTableProps {
  versionId: string;
  versionNumber: number;
}

export function LeadsTable({ versionId, versionNumber }: LeadsTableProps) {
  const [leads, setLeads] = useState<UserJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<UserJourney | null>(null);
  const [analytics, setAnalytics] = useState<{ totalVisits: number, totalLeads: number, completionRate: number } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [leadsData, analyticsData] = await Promise.all([
          getVersionLeads(versionId),
          getVersionAnalytics(versionId)
        ]);
        setLeads(leadsData);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error("Failed to fetch leads data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [versionId]);

  const downloadLeads = () => {
    // Define Headers
    const headers = ["ID", "Email", "Created At", "AI Report", "Variables"];
    
    // Map data to rows
    const rows = leads.map((lead: UserJourney) => {
      const id = lead.id;
      const email = lead.email;
      const date = new Date(lead.createdAt).toLocaleString();
      const report = lead.summary?.aiReport || "";
      
      // Map variables to includes question text
      const variables: Record<string, any> = {};
      if (lead.summary?.variables) {
        Object.entries(lead.summary.variables).forEach(([k, v]) => {
          // New format: { value, questionText }, old format: value
          const questionText = v?.questionText || k;
          const displayValue = v?.value !== undefined ? v.value : v;
          variables[questionText] = displayValue;
        });
      }
      
      const variablesStr = JSON.stringify(variables);

      // Escape helpers
      const escape = (text: string) => {
        if (!text) return "";
        const stringText = String(text);
        if (stringText.includes(",") || stringText.includes("\n") || stringText.includes('"')) {
             return `"${stringText.replace(/"/g, '""')}"`;
        }
        return stringText;
      };

      return [
        escape(id),
        escape(email),
        escape(date),
        escape(report),
        escape(escape(variablesStr))
      ].join(",");
    });

    // Combine headers and rows
    const csvContent = [headers.join(","), ...rows].join("\n");
    
    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_version_v${versionNumber}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Public Leads</h2>
          <p className="text-zinc-500 text-sm">Review emails and conversation journeys from your public link.</p>
        </div>
        {leads.length > 0 && (
          <button 
            onClick={downloadLeads}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-bold text-xs hover:bg-zinc-200 transition-all active:scale-95"
          >
            <Download size={14} />
            Export CSV
          </button>
        )}
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 shrink-0">
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Eye size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Visits</p>
            <h4 className="text-xl font-bold text-white">{analytics?.totalVisits || 0}</h4>
          </div>
        </div>
        
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Target size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Leads</p>
            <h4 className="text-xl font-bold text-white">{analytics?.totalLeads || 0}</h4>
          </div>
        </div>
        
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Completion Rate</p>
            <h4 className="text-xl font-bold text-white">{analytics?.completionRate || 0}%</h4>
          </div>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl bg-zinc-900/10 m-4 sm:m-0">
          <div className="w-24 h-24 rounded-full bg-linear-to-br from-indigo-500/10 to-purple-500/10 border border-white/5 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/5">
            <Rocket size={40} className="text-indigo-400 drop-shadow-lg" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-3 text-center">Ready for liftoff?</h3>
          <p className="text-zinc-500 text-center max-w-md text-base leading-relaxed">
            Your agent is waiting for its first visitor! Publish your workflow and share the link to start gathering intelligent leads and conversation insights here.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex gap-8 min-h-0 overflow-hidden">
          {/* Left Side: Scrollable List */}
          <div className="w-80 flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {leads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between group shrink-0 ${
                  selectedLead?.id === lead.id 
                  ? 'bg-indigo-500/10 border-indigo-500/40' 
                  : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-900 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedLead?.id === lead.id ? 'bg-indigo-500 text-white' : 'bg-white/5 text-zinc-400 group-hover:text-white transition-colors'}`}>
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm truncate w-32">{lead.email}</div>
                    <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5 uppercase font-mono">
                      <Calendar size={10} />
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className={`text-zinc-600 transition-transform ${selectedLead?.id === lead.id ? 'translate-x-1 text-indigo-400' : ''}`} />
              </button>
            ))}
          </div>

          {/* Right Side: Scrollable Details */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent pr-4">
            <AnimatePresence mode="wait">
              {selectedLead ? (
                <motion.div 
                  key={selectedLead.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 pb-12"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                        <FileJson size={24} />
                      </div>
                      <div>
                        <h3 className="text-white font-bold">{selectedLead.email}</h3>
                        <p className="text-zinc-500 text-xs">Journey Summary</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">AI Journey Report</h4>
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-6 prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed shadow-sm">
                        {selectedLead.summary?.aiReport ? (
                          <ReactMarkdown>{selectedLead.summary.aiReport}</ReactMarkdown>
                        ) : (
                          <p className="text-zinc-500 italic">No AI summary available for this lead.</p>
                        )}
                      </div>
                    </div>

                    <details className="group">
                      <summary className="text-[10px] font-black text-zinc-600 uppercase tracking-widest cursor-pointer hover:text-zinc-400 transition-colors list-none flex items-center gap-2">
                        <ChevronRight size={10} className="group-open:rotate-90 transition-transform" />
                        View Raw History
                      </summary>
                      <div className="mt-4 space-y-3">
                        {selectedLead.summary?.history?.map((msg: any, i: number) => (
                          <div key={i} className={`p-4 rounded-xl text-[10px] leading-relaxed ${msg.role === 'user' ? 'bg-indigo-500/5 border border-indigo-500/10 text-indigo-100 ml-4' : 'bg-white/5 border border-white/5 text-zinc-400 mr-4'}`}>
                            <div className="text-[8px] font-black uppercase opacity-40 mb-1">{msg.role}</div>
                            {msg.text}
                          </div>
                        ))}
                      </div>
                    </details>

                    {selectedLead.summary?.variables && Object.keys(selectedLead.summary.variables).length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Collected Data</h4>
                         <div className="grid grid-cols-2 gap-2">
                            {Object.entries(selectedLead.summary.variables).map(([k, v]) => {
                              const questionText = v?.questionText || k;
                              const displayValue = v?.value !== undefined ? v.value : v;
                              return (
                                <div key={k} className="p-3 bg-white/5 rounded-xl border border-white/5">
                                   <div className="text-[8px] font-black text-zinc-500 uppercase mb-1">{questionText}</div>
                                   <div className="text-xs text-white truncate font-medium">{String(displayValue)}</div>
                                </div>
                              );
                            })}
                       </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-12 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
                <div>
                  <ChevronRight className="mx-auto text-zinc-800 mb-4 rotate-180" size={32} />
                  <p className="text-zinc-600 font-medium">Select a lead to view their full journey details</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      )}
    </div>
  );
}
