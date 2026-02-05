"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Play, RefreshCw, User, Bot, AlertCircle, Terminal, Sun, Moon, Link as LinkIcon, Check, Copy, Sparkles, Loader2, List, ChevronRight, Mail, ClipboardList, X } from "lucide-react";
import { getPreviewConfig, chatWithAgent, evaluateNextNode, initiateAgentConversation, generateConversationSummary, type ChatMessage, type PreviewConfig } from "@/lib/actions/preview";
import { resolveNodePrompt } from "@/lib/resolvers";
import { WorkflowNode, WorkflowEdge } from "@/lib/actions/workflow";
import { getOrCreatePublicLink, getPublicLink, saveUserJourney } from "@/lib/actions/preview_public";
import { getProjectTheme } from "@/lib/actions/theme";
import { MiniApp } from "@/components/dashboard/MiniApp";
import ReactMarkdown from "react-markdown";

interface PreviewSessionProps {
  projectId: string;
  versionId?: string;
}

const LOADING_MESSAGES = [
  "Initializing preview environment...",
  "Fetching latest workflow configuration...",
  "Optimizing AI system prompts...",
  "Applying custom theme settings...",
  "Assembling nodes and edges...",
  "Preparing interactive chat interface..."
];

export function PreviewSession({ projectId, versionId }: PreviewSessionProps) {
  const [config, setConfig] = useState<PreviewConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentNodeKey, setCurrentNodeKey] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const historyRef = useRef<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runtimeVariables, setRuntimeVariables] = useState<Record<string, any>>({});
  const [transitionOptions, setTransitionOptions] = useState<WorkflowEdge[] | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionData, setTransitionData] = useState<{ text: string, emoji: string, color: string } | null>(null);
  const [theme, setTheme] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [publicLink, setPublicLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  // Form Node States
  const [formAnswers, setFormAnswers] = useState<Record<string, any>>({});
  
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [_, setIsGeneratingSummary] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    } else {
      setMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const PremiumLoader = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center z-100 rounded-2xl"
    >
      <div className="relative">
        {theme?.splashUrl ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-48 h-48 rounded-[32px] overflow-hidden shadow-2xl border border-white/10"
          >
            <img src={theme.splashUrl} alt="Splash" className="w-full h-full object-cover" />
          </motion.div>
        ) : (
          <div className="relative w-32 h-32 flex items-center justify-center">
             <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-(--p-primary)/20"
                style={{ borderColor: 'var(--p-primary)', opacity: 0.2 }}
             />
             <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 rounded-full border-2 border-transparent border-t-(--p-primary)/50 border-r-(--p-primary)/50"
                style={{ borderTopColor: 'var(--p-primary)', borderRightColor: 'var(--p-primary)', opacity: 0.5 }}
             />
             <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-12 h-12 rounded-full blur-xl bg-(--p-primary)/40"
                style={{ backgroundColor: 'var(--p-primary)' }}
             />
             <motion.div
                animate={{ rotate: 180 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="relative z-10"
             >
                <Sparkles className="text-white/60" size={24} />
             </motion.div>
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-12 text-center space-y-4"
      >
        <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">
          Initializing Session
        </h2>
        <div className="flex flex-col items-center gap-2 min-h-[60px]">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.5 }}
              className="text-zinc-500 font-medium tracking-wide text-sm max-w-xs leading-relaxed"
            >
              {LOADING_MESSAGES[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isTyping]);

  useEffect(() => {
    async function fetchTheme() {
      try {
        const data = await getProjectTheme(projectId);
        setTheme(data);
        if (data && (data as any).mode) {
          setIsDarkMode((data as any).mode === "dark");
        }
      } catch (error) {
        console.error("Failed to fetch theme:", error);
      }
    }
    fetchTheme();
  }, [projectId]);
  
  useEffect(() => {
    async function fetchPublicLink() {
      if (versionId) {
        try {
          const token = await getPublicLink(versionId);
          if (token) {
            setPublicLink(`${window.location.origin}/p/${token}`);
          } else {
            setPublicLink(null);
          }
        } catch (error) {
          console.error("Failed to fetch public link:", error);
        }
      }
    }
    fetchPublicLink();
  }, [versionId]);

  const preloadImages = (urls: string[]) => {
    return Promise.all(
      urls.filter(Boolean).map((url) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = url;
          img.onload = resolve;
          img.onerror = resolve; // Continue even if one image fails
        });
      })
    );
  };

   const startSession = async () => {
     setLoading(true);
     setError(null);
     setIsTransitioning(false);
     setTransitionData(null);
     
     const startTime = Date.now();
     
     try {
       const previewConfig = await getPreviewConfig(projectId, versionId);
       
       // Preload theme assets if theme is already loaded, otherwise we'll fetch them
       const themeAssets = [theme?.splashUrl, theme?.transitionUrl, theme?.logoUrl];
       
       await Promise.all([
          preloadImages(themeAssets),
          // Additional work if needed
       ]);

       const nodes = previewConfig.nodes;
       const edges = previewConfig.edges;
       const targetNodes = new Set(edges.map((e: WorkflowEdge) => e.toNodeKey));
       const startNode = nodes.find((n: WorkflowNode) => !targetNodes.has(n.nodeKey)) || nodes[0];
       
       if (!startNode) throw new Error("No nodes found in workflow");
       
       // Calculate remaining time for splash (minimum 3 seconds)
       const elapsedTime = Date.now() - startTime;
       const remainingTime = Math.max(0, 3000 - elapsedTime);
       if (remainingTime > 0) {
         await new Promise(resolve => setTimeout(resolve, remainingTime));
       }

       setConfig(previewConfig);
       setCurrentNodeKey(startNode.nodeKey);
       setSessionActive(true);
       setHistory([]);
       setRuntimeVariables({});
       setTransitionOptions(null);
       setSubmitted(false);
       setAiSummary(null);
       setEmail("");
     } catch (err: any) {
       setError(err.message);
     } finally {
       setLoading(false);
     }
   };
  

   const performTransition = async (nextNodeKey: string) => {
    if (!currentNodeKey || nextNodeKey === currentNodeKey) return;
    
    setIsTransitioning(true);
    setTransitionData({ 
      text: `Moving forward...`, 
      emoji: "⚡",
      color: "var(--p-primary)"
    });
    
    // Minimum duration for the transition effect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setCurrentNodeKey(nextNodeKey);
    setIsTransitioning(false);
    setTransitionData(null);
  };

  const triggerInitialAgentMessage = async (node: WorkflowNode) => {
    if (!node || isTyping) return;
    
    setIsTyping(true);
    try {
      const resolvedPrompt = resolveNodePrompt(node.systemPromptTemplate || "", config?.variables || {}, runtimeVariables);
      const interactive = await initiateAgentConversation(resolvedPrompt);
      const newMsg: ChatMessage = {
        role: "model",
        parts: [{ text: interactive.concise_text }],
        interactive
      };
      const updatedHistory = [...historyRef.current, newMsg];
      historyRef.current = updatedHistory;
      setHistory(updatedHistory);
    } catch (err: any) {
      console.error("Failed to initiate agent conversation:", err);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (sessionActive && currentNodeKey && config) {
      const node = config.nodes.find((n) => n.nodeKey === currentNodeKey);
      if (!node) return;
      const isAgent = node.category !== "form";
      // Only trigger if history is empty OR the last message was a transition system message
      const isNewNodeStart = history.length === 0 || history[history.length - 1].role === ('system' as any);
      
      if (isAgent && isNewNodeStart) {
        triggerInitialAgentMessage(node);
      }
    }
  }, [currentNodeKey, sessionActive, config]);

  const handleSendMessage = async (e?: React.FormEvent, message?: string) => {
    e?.preventDefault();
    const messageContent = message || userInput;
    if (!messageContent.trim() || !currentNodeKey || isTyping) return;

    setUserInput("");
    
    const newUserMessage: ChatMessage = {
      role: "user",
      parts: [{ text: messageContent }]
    };

    const updatedHistory = [...historyRef.current, newUserMessage];
    historyRef.current = updatedHistory;
    setHistory(updatedHistory);
    setIsTyping(true);

    try {
      if (!config) return;
      const currentNode = config.nodes.find((n) => n.nodeKey === currentNodeKey);
      
      // 1. Evaluate Node Transition BEFORE Agent Response
      const decision = await evaluateNextNode(currentNodeKey, updatedHistory, config.edges);
      
      if (decision.completed && decision.nextNodeKey) {
        const nextNode = config.nodes.find((n: any) => n.nodeKey === decision.nextNodeKey);
        if (nextNode) {
          const isNextForm = nextNode.category === "form";
          
          if (isNextForm) {
            // Instant shift to form - skip current agent response
            await performTransition(decision.nextNodeKey);
            return;
          }
        }
      }

      // 2. Get Agent Response (If no instant form transition)
      const systemPrompt = resolveNodePrompt(currentNode?.systemPromptTemplate || "", config!.variables, runtimeVariables);
      const interactive = await chatWithAgent(systemPrompt, updatedHistory, messageContent);
      
      const newModelMessage: ChatMessage = {
        role: "model",
        parts: [{ text: interactive.concise_text }],
        interactive
      };
      const sessionHistory = [...historyRef.current, newModelMessage];
      historyRef.current = sessionHistory;
      setHistory(sessionHistory);

      // 3. Re-evaluate if the agent response itself triggered a transition (e.g. at the end of its talk)
      const afterResponseDecision = await evaluateNextNode(currentNodeKey, sessionHistory, config!.edges);
      
      if (afterResponseDecision.completed && afterResponseDecision.nextNodeKey) {
        await performTransition(afterResponseDecision.nextNodeKey);
      }
    } catch (err: any) {
      setError(`Chat Error: ${err.message}`);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormComplete = async (answers: Record<string, any>) => {
    if (!config || !currentNodeKey) return;
    const currentNode = config.nodes.find((n) => n.nodeKey === currentNodeKey);
    if (!currentNode) return;
    const formConfig = currentNode.formConfig || currentNode?.config?.formConfig;

    const enrichedAnswers: Record<string, { value: any, questionText: string }> = {};
    
    Object.entries(answers).forEach(([id, val]) => {
      const q = formConfig?.questions?.find((q: any) => q.id === id);
      enrichedAnswers[id] = {
        value: val,
        questionText: q?.text || id
      };
    });

    const formattedAnswers = Object.entries(enrichedAnswers)
      .map(([_, data]) => `${data.questionText}: ${Array.isArray(data.value) ? data.value.join(", ") : data.value}`)
      .join("\n");

    const systemMsg: ChatMessage = {
      role: "user",
      parts: [{ text: `Form Completed:\n${formattedAnswers}` }]
    };
    
    
    const updatedHistory = [...historyRef.current, systemMsg];
    historyRef.current = updatedHistory;
    setHistory(updatedHistory);
    setRuntimeVariables(prev => ({ ...prev, ...enrichedAnswers }));
    
    // Find outgoing edges
    const outgoingEdges = config.edges.filter((e) => e.fromNodeKey === currentNodeKey);
    
     if (outgoingEdges.length === 1) {
       // Singular path -> transition instantly
       const transitionMsg: ChatMessage = {
         role: "system" as any,
         parts: [{ text: `Form completed. Transitioning to: ${outgoingEdges[0].toNodeKey}` }]
       };
       const finalHistory = [...historyRef.current, transitionMsg];
       historyRef.current = finalHistory;
       setHistory(finalHistory);
       await performTransition(outgoingEdges[0].toNodeKey);
     } else {
        setTransitionOptions(outgoingEdges);
      }
  };

  const handleManualTransition = async (nextNodeKey: string) => {
    const transitionMsg: ChatMessage = {
      role: "system" as any,
      parts: [{ text: `Transitioning to: ${nextNodeKey}` }]
    };
    const finalHistory = [...historyRef.current, transitionMsg];
    historyRef.current = finalHistory;
    setHistory(finalHistory);
    setTransitionOptions(null);
    await performTransition(nextNodeKey);
  };

  const handleReportNodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // 1. Generate Report with Custom Prompt
      setIsGeneratingSummary(true);
      const currentNode = config?.nodes.find(n => n.nodeKey === currentNodeKey);
      const prompt = currentNode?.reportConfig?.systemPromptTemplate;
      const reportResult = await generateConversationSummary(historyRef.current, prompt);
      setAiSummary(reportResult.summary);

      // 2. Save Journey (Simulated for author testing, but using same action)
      const journeySummary = {
        history: historyRef.current.map(h => ({ role: h.role, text: h.parts[0].text })),
        variables: runtimeVariables, // already enriched
        aiReport: reportResult.summary
      };
      if (versionId) {
        await saveUserJourney(versionId, email, journeySummary);
      }
      setSubmitted(true);
    } catch (err) {
      console.error("Report generation failed:", err);
      setError("Failed to generate report.");
      setAiSummary("Error generating report.");
    } finally {
      setIsSubmitting(false);
      setIsGeneratingSummary(false);
    }
  };

   const handleGenerateLink = async (force = false) => {
     setIsGeneratingLink(true);
     setError(null);
     try {
       const token = await getOrCreatePublicLink(versionId || "", force);
       const url = `${window.location.origin}/p/${token}`;
       setPublicLink(url);
     } catch (err: any) {
       setError(`Link generation failed: ${err.message}`);
     } finally {
       setIsGeneratingLink(false);
     }
   };

   const copyToClipboard = () => {
     if (publicLink) {
       navigator.clipboard.writeText(publicLink);
       setHasCopied(true);
       setTimeout(() => setHasCopied(false), 2000);
     }
   };

  if (!sessionActive && !loading && error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto ring-1 ring-red-500/20">
            <AlertCircle className="text-red-400" size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight">Preview Error</h1>
            <p className="text-zinc-400 text-lg">{error}</p>
          </div>
          
          <button
            onClick={startSession}
            className="w-full h-16 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 text-lg"
          >
            <RefreshCw size={24} />
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  if (!sessionActive) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="w-24 h-24 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto ring-1 ring-indigo-500/20">
            <Play className="text-indigo-500 fill-indigo-500" size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight">Run Preview Session</h1>
            <p className="text-zinc-400 text-lg">Test your workflow agents and logic transitions in a live environment.</p>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={startSession}
                disabled={loading}
                className="flex-1 h-16 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
              >
                {loading ? <RefreshCw className="animate-spin" size={24} /> : <Play size={24} className="fill-current" />}
                {loading ? "Starting..." : "Start Session"}
              </button>

              {!publicLink && (
                 <button 
                  onClick={() => handleGenerateLink(false)}
                  disabled={isGeneratingLink}
                  className="w-16 h-16 bg-zinc-900 border border-white/5 hover:border-white/10 text-white rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center p-0"
                  title="Generate Public Link"
                >
                  {isGeneratingLink ? <RefreshCw className="animate-spin" size={20} /> : <LinkIcon size={20} />}
                </button>
              )}
            </div>

            {publicLink && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 transition-all w-full">
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">Public Link Active</p>
                    <p className="text-sm text-indigo-400/80 font-mono truncate">{publicLink}</p>
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="w-12 h-12 flex items-center justify-center bg-indigo-500/20 hover:bg-indigo-500/30 rounded-xl transition-colors text-indigo-400"
                    title="Copy Link"
                  >
                    {hasCopied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
                
                <button
                  onClick={() => handleGenerateLink(true)}
                  disabled={isGeneratingLink}
                  className="w-full text-[10px] text-zinc-500 border border-white/5 hover:border-white/10 hover:text-zinc-300 py-2 rounded-lg font-black uppercase tracking-widest transition-all"
                >
                  {isGeneratingLink ? "Regenerating..." : "Generate New Link (Overwrite)"}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Scoped Premium Loader */}
        <AnimatePresence>
          {loading && PremiumLoader}
        </AnimatePresence>
      </div>
    );
  }

  if (!config) return null;

  const currentNode = config.nodes.find((n) => n.nodeKey === currentNodeKey);
  const isFormNode = currentNode?.formConfig || currentNode?.config?.category === "form" || currentNode?.category === "form";
  const isReportNode = currentNode?.reportConfig || currentNode?.config?.category === "report" || currentNode?.category === "report";

   const themeStyles = isDarkMode ? {
     '--p-primary': theme?.darkPrimary || '#6366f1',
     '--p-secondary': theme?.darkSecondary || '#27272a',
     '--p-bg': theme?.darkBackground || '#09090b',
     '--p-text': theme?.darkText || '#f4f4f5',
     '--p-font': theme?.fontStyle || 'Inter',
   } : {
     '--p-primary': theme?.lightPrimary || '#6366f1',
     '--p-secondary': theme?.lightSecondary || '#f4f4f5',
     '--p-bg': theme?.lightBackground || '#ffffff',
     '--p-text': theme?.lightText || '#09090b',
     '--p-font': theme?.fontStyle || 'Inter',
   };

   return (
     <div className="w-full h-full flex flex-col bg-[#09090b] rounded-2xl overflow-hidden border border-white/5 relative">
       {/* Header */}
      <div className="px-6 py-4 bg-zinc-900/50 border-b border-white/5 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-400 overflow-hidden`}>
            {theme?.logoUrl ? (
              <img src={theme.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Terminal size={20} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">{currentNode?.title || "Active Agent"}</span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${isFormNode ? 'bg-yellow-500/10 text-yellow-500' : isReportNode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                {isFormNode ? "Form Node" : isReportNode ? "Report Node" : "Agent Node"}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono tracking-tight">{currentNodeKey}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => publicLink ? copyToClipboard() : handleGenerateLink(false)}
            disabled={isGeneratingLink}
            className={`p-2 rounded-lg transition-all active:scale-90 ${publicLink ? 'text-indigo-400 hover:bg-indigo-500/10' : 'text-zinc-500 hover:bg-white/5'}`}
            title={publicLink ? "Copy Public Link" : "Generate Public Link"}
          >
            {isGeneratingLink ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : hasCopied ? (
              <Check size={16} />
            ) : (
              <LinkIcon size={16} />
            )}
          </button>

          <button 
            onClick={startSession}
            title="Restart Session"
            className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all active:scale-90"
          >
            <RefreshCw size={16} />
          </button>

          <button 
            onClick={() => setSessionActive(false)}
            title="Exit Preview"
            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all active:scale-90"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div 
        className="flex-1 overflow-hidden flex flex-col relative"
        style={{ 
            ...themeStyles, 
            backgroundColor: 'var(--p-bg)', 
            color: 'var(--p-text)',
            fontFamily: 'var(--p-font)'
        } as any}
      >
        <AnimatePresence>
          {loading && PremiumLoader}
        </AnimatePresence>

        <AnimatePresence>
          {isTransitioning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-(--p-bg)/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
            >
               {/* Static Background Animation for Global Feel */}
               <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-(--p-primary)/5 rounded-full blur-[100px] animate-pulse" style={{ backgroundColor: 'var(--p-primary)', opacity: 0.05 }} />
               </div>

               <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 max-w-sm relative z-10">
                  <div className="relative flex items-center justify-center">
                    {theme?.transitionUrl ? (
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-48 h-48 rounded-[32px] overflow-hidden shadow-2xl border border-white/10"
                      >
                        <img src={theme.transitionUrl} alt="Transition" className="w-full h-full object-cover" />
                      </motion.div>
                    ) : (
                      <div className="w-32 h-32 relative flex items-center justify-center">
                          <motion.div 
                            animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                            transition={{ rotate: { duration: 6, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
                            className="absolute inset-0 rounded-full border border-(--p-primary)/30 border-t-transparent"
                            style={{ borderColor: 'var(--p-primary)', borderTopColor: 'transparent' }}
                          />
                          <motion.div 
                            animate={{ rotate: -180 }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-4 rounded-full border border-white/10 border-b-white/30"
                          />
                           <div className="absolute inset-0 flex items-center justify-center text-4xl z-20">{transitionData?.emoji || "⚡"}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold tracking-tight text-(--p-text)">{transitionData?.text || "Moving forward..."}</h3>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: 'var(--p-primary)' }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: 'var(--p-primary)' }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--p-primary)' }} />
                    </div>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto relative">
            <AnimatePresence mode="wait">
              {isTransitioning ? (
                null // Handled by the global transition overlay
              ) : isTyping ? (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="space-y-6 flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center" style={{ backgroundColor: 'var(--p-secondary)' }}>
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--p-bg)' }} />
                  </div>
                  <p className="text-(--p-text)/60 font-bold uppercase tracking-widest text-[10px] animate-pulse">Agent is thinking...</p>
                </motion.div>
              ) : isFormNode && !transitionOptions ? (
                <motion.div
                  key={`form-${currentNodeKey}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full max-w-2xl space-y-12 text-center"
                >
                  {(() => {
                    const formConfig = currentNode?.formConfig || currentNode?.config?.formConfig;
                    if (!formConfig) return null;

                    return (
                      <MiniApp 
                        config={formConfig} 
                        onComplete={handleFormComplete} 
                      />
                    );
                  })()}
                </motion.div>
              ) : isReportNode ? (
                <motion.div
                  key={`report-${currentNodeKey}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="w-full max-w-2xl space-y-8 text-center"
                >
                  {!submitted ? (
                    <>
                      <div className="space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-(--p-primary)/10 flex items-center justify-center mx-auto mb-6 text-(--p-primary) border border-(--p-primary)/20">
                            <ClipboardList size={32} />
                        </div>
                        <h1 className="text-4xl font-black text-(--p-text)">
                          {currentNode?.reportConfig?.title || currentNode?.config?.reportConfig?.title || "Your Report"}
                        </h1>
                        <p className="text-(--p-text)/60 text-lg leading-relaxed max-w-lg mx-auto">
                          {currentNode?.reportConfig?.subtitle || currentNode?.config?.reportConfig?.subtitle || "Enter your email to generate and view your personalized report based on our session."}
                        </p>
                      </div>

                      <form onSubmit={handleReportNodeSubmit} className="space-y-4 pt-8 max-w-md mx-auto">
                        <div className="relative group">
                           <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-(--p-primary) transition-colors" size={20} />
                           <input 
                               type="email" 
                               required
                               value={email}
                               onChange={(e) => setEmail(e.target.value)}
                               placeholder="name@example.com"
                               style={{ backgroundColor: 'var(--p-secondary)', color: 'var(--p-text)', borderColor: 'rgba(255,255,255,0.05)' }}
                               className="w-full h-16 border rounded-2xl pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-(--p-primary)/50 transition-all font-medium text-lg placeholder:text-zinc-600"
                           />
                        </div>
                        <button 
                          type="submit"
                          disabled={isSubmitting || !email.trim()}
                          style={{ backgroundColor: 'var(--p-primary)', color: isDarkMode ? '#000' : '#fff' }}
                          className="w-full h-16 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                        >
                           {isSubmitting ? (
                             <>
                              <RefreshCw className="animate-spin" />
                              Generating Analysis...
                             </>
                           ) : (
                             <>
                              Generate My Report
                              <ChevronRight size={20} />
                             </>
                           )}
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 text-left">
                       <div className="text-center space-y-2">
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-(--p-primary)/10 text-(--p-primary) text-xs font-black uppercase tracking-widest mb-4">
                            <Check size={14} />
                            Report Generated
                          </div>
                          <h1 className="text-3xl font-bold text-(--p-text)">Analysis Complete</h1>
                       </div>
                       
                       <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 min-h-[200px] shadow-2xl relative overflow-hidden group" style={{ backgroundColor: 'var(--p-secondary)' }}>
                          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-(--p-primary) to-transparent opacity-50" />
                          <div className="prose prose-invert max-w-none prose-lg leading-relaxed summary-markdown" style={{ color: 'var(--p-text)' }}>
                              <ReactMarkdown>{aiSummary || ""}</ReactMarkdown>
                          </div>
                       </div>

                       <div className="flex justify-center pt-8">
                          <button
                            onClick={startSession}
                            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-(--p-text) border border-white/10 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95"
                          >
                            Restart Preview
                          </button>
                       </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key={transitionOptions ? 'transition-options' : history.length}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full max-w-2xl space-y-12 text-center"
                >
                  {transitionOptions ? (
                    <div className="w-full max-w-md mx-auto space-y-6">
                      <div className="text-center space-y-2">
                         <div className="w-12 h-12 rounded-2xl bg-(--p-secondary) flex items-center justify-center mx-auto mb-8 border border-white/5 text-(--p-text) overflow-hidden shadow-lg" style={{ backgroundColor: 'var(--p-secondary)', color: 'var(--p-text)' }}>
                            {theme?.logoUrl ? (
                              <img src={theme.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              <Bot size={24} />
                            )}
                         </div>
                        <h3 className="text-3xl font-bold text-(--p-text)">Form Completed</h3>
                        <p className="text-(--p-text)/60 text-sm">Choose the next step in the workflow:</p>
                      </div>
                      <div className="grid gap-3">
                        {transitionOptions.map((edge: any) => (
                          <button
                            key={edge.edgeKey}
                            onClick={() => handleManualTransition(edge.toNodeKey)}
                            style={{ backgroundColor: 'var(--p-secondary)', borderColor: 'rgba(255,255,255,0.05)' }}
                            className="w-full p-6 border hover:opacity-80 rounded-2xl text-left transition-all group flex items-center justify-between"
                          >
                            <div>
                              <span className="block text-(--p-text) font-bold">{edge.toNodeKey}</span>
                              <span className="text-(--p-text)/60 text-xs italic">{edge.llmPromptTemplate}</span>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-(--p-bg) flex items-center justify-center overflow-hidden border border-white/5">
                              {theme?.logoUrl ? (
                                <img src={theme.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                              ) : (
                                <Bot size={16} />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (() => {
                    const lastModelMsg = [...history].reverse().find(m => m.role === 'model');
                    if (!lastModelMsg) return (
                      <div className="space-y-4">
                        <p className="text-(--p-text)/60 text-sm">Starting conversation...</p>
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-800" />
                      </div>
                    );

                    return (
                      <>
                        <div className="space-y-6">
                           <div className="w-12 h-12 rounded-2xl bg-(--p-secondary) flex items-center justify-center mx-auto mb-8 border border-white/5 overflow-hidden shadow-lg" style={{ backgroundColor: 'var(--p-secondary)', color: 'var(--p-text)' }}>
                              {theme?.logoUrl ? (
                                <img src={theme.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                              ) : (
                                <Bot size={24} />
                              )}
                           </div>
                           <div className="prose prose-xl prose-invert max-w-none text-white font-bold leading-tight" style={{ color: 'var(--p-text)' }}>
                              <ReactMarkdown>{lastModelMsg.interactive?.concise_text || lastModelMsg.parts[0].text}</ReactMarkdown>
                           </div>
                        </div>

                        <div className="flex flex-col gap-3 max-w-sm mx-auto pt-8">
                          {lastModelMsg.interactive?.buttons && lastModelMsg.interactive.buttons.length > 0 && (
                            <>
                              <div className="grid gap-3 w-full">
                                {lastModelMsg.interactive.buttons.map((btn: any, idx: number) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleSendMessage(undefined, btn.next_message)}
                                    style={{ backgroundColor: 'var(--p-primary)', color: '#fff' }}
                                    className="w-full py-5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-(--p-primary)/10"
                                  >
                                    {btn.label}
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center gap-4 py-2">
                                <div className="h-px flex-1 bg-white/5" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Or type something else</span>
                                <div className="h-px flex-1 bg-white/5" />
                              </div>
                            </>
                          )}

                          <form onSubmit={handleSendMessage} className="relative group">
                             <input 
                               value={userInput}
                               onChange={(e) => setUserInput(e.target.value)}
                               placeholder="Type your message..."
                               style={{ backgroundColor: 'var(--p-secondary)', color: 'var(--p-text)', borderColor: 'rgba(255,255,255,0.05)' }}
                               className="w-full h-14 bg-white/5 border rounded-2xl pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-(--p-primary)/50 transition-all font-medium text-sm placeholder:text-zinc-600"
                             />
                             <button 
                               type="submit"
                               disabled={!userInput.trim() || isTyping}
                               className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-(--p-primary) text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                               style={{ backgroundColor: 'var(--p-primary)' }}
                             >
                               <Send size={18} />
                             </button>
                          </form>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
      </div>

      {error && (
        <div className="absolute bottom-24 left-6 right-6 p-4 bg-red-500 text-white rounded-xl shadow-2xl flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} />
            <span className="text-sm font-bold">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-white/20 rounded">
            <RefreshCw size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
