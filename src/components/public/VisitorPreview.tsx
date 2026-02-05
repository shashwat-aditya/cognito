"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, RefreshCw, User, Bot, AlertCircle, Sun, Moon, Sparkles, Mail, List, ChevronRight, Check, ClipboardList } from "lucide-react";
import { chatWithAgent, evaluateNextNode, initiateAgentConversation, generateConversationSummary, type ChatMessage } from "@/lib/actions/preview";
import { resolveNodePrompt } from "@/lib/resolvers";
import { saveUserJourney } from "@/lib/actions/preview_public";
import { MiniApp } from "@/components/dashboard/MiniApp";
import ReactMarkdown from "react-markdown";

interface VisitorPreviewProps {
  config: any;
  theme: any;
  versionId: string;
}

const LOADING_MESSAGES = [
  "Initializing preview environment...",
  "Fetching latest workflow configuration...",
  "Optimizing AI system prompts...",
  "Applying custom theme settings...",
  "Assembling nodes and edges...",
  "Preparing interactive chat interface..."
];

export function VisitorPreview({ config, theme, versionId }: VisitorPreviewProps) {
  const [currentNodeKey, setCurrentNodeKey] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const historyRef = useRef<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runtimeVariables, setRuntimeVariables] = useState<Record<string, any>>({});
  const [transitionOptions, setTransitionOptions] = useState<any[] | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionData, setTransitionData] = useState<{ text: string, emoji: string, color: string } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  useEffect(() => {
    if (theme?.mode) {
      setIsDarkMode(theme.mode === "dark");
    }
  }, [theme]);

  useEffect(() => {
    if (theme?.fontStyle && !['Inter', 'Poppins', 'Geist', 'Geist_Mono'].includes(theme.fontStyle)) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${theme.fontStyle.replace(/\s+/g, '+')}:wght@400;500;600;700;800;900&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      return () => {
        try {
          document.head.removeChild(link);
        } catch (e) {}
      };
    }
  }, [theme?.fontStyle]);

  const [showSummary, setShowSummary] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false); // New state to control visibility after splash

  const preloadImages = (urls: string[]) => {
    return Promise.all(
      urls.filter(Boolean).map((url) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = url;
          img.onload = resolve;
          img.onerror = resolve; // Continue even if one image fails
        });
      })
    );
  };
  
  // Form Node States
  const [formAnswers, setFormAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTyping && history.length === 0) {
      interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    } else {
      setMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isTyping, history.length]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isTyping]);

  useEffect(() => {
    // Initialize starting node
    const init = async () => {
      const startTime = Date.now();
      
      // Preload images
      const themeAssets = [theme?.splashUrl, theme?.transitionUrl, theme?.logoUrl];
      await preloadImages(themeAssets);

      const nodes = config.nodes;
      const edges = config.edges;
      const targetNodes = new Set(edges.map((e: any) => e.toNodeKey));
      const startNode = nodes.find((n: any) => !targetNodes.has(n.nodeKey)) || nodes[0];
      if (startNode) setCurrentNodeKey(startNode.nodeKey);

      // Ensure at least 3 seconds for splash
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      setIsLoaded(true);
    };
    
    init();
  }, [config, theme]);



  const performTransition = async (nextNodeKey: string) => {
    if (!currentNodeKey || nextNodeKey === currentNodeKey) return;
    setIsTransitioning(true);
    setTransitionData({ text: "Moving Forward...", emoji: "⚡", color: "var(--p-primary)" });
    
    // Tiny delay to show the transition animation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setCurrentNodeKey(nextNodeKey);
    setIsTransitioning(false);
    setTransitionData(null);
  };

  useEffect(() => {
    // Only auto-generate if NOT a report node, since report node handles it manually after email
    if (showSummary && !aiSummary && !isGeneratingSummary && !currentNodeKey) {
       // logic for old legacy summary button
       const generateReport = async () => {
         setIsGeneratingSummary(true);
         try {
           const result = await generateConversationSummary(historyRef.current);
           setAiSummary(result.summary);
         } catch (err) {
           console.error("Failed to generate AI summary:", err);
           setAiSummary("Could not generate summary automatically.");
         } finally {
           setIsGeneratingSummary(false);
         }
       };
       generateReport();
    }
  }, [showSummary]);

  const triggerInitialAgentMessage = async (node: any) => {
    if (!node || isTyping) return;
    setIsTyping(true);
    try {
      const resolvedPrompt = resolveNodePrompt(node.systemPromptTemplate || "", config.variables, runtimeVariables);
      const interactive = await initiateAgentConversation(resolvedPrompt);
      const newMsg = { role: "model" as const, parts: [{ text: interactive.concise_text }], interactive };
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
    if (isLoaded && currentNodeKey && config) {
      const node = config.nodes.find((n: any) => n.nodeKey === currentNodeKey);
      const isAgent = node.category !== "form" && node?.config?.category !== "form" && node?.data?.category !== "form";
      const isNewNodeStart = history.length === 0 || history[history.length - 1].role === ('system' as any);
      if (isAgent && isNewNodeStart) triggerInitialAgentMessage(node);
    }
  }, [currentNodeKey, config, isLoaded]);

  const handleSendMessage = async (e?: React.FormEvent, message?: string) => {
    e?.preventDefault();
    const messageContent = message || userInput;
    if (!messageContent.trim() || !currentNodeKey || isTyping) return;
    
    setUserInput("");
    setError(null);

    const newUserMessage: ChatMessage = { role: "user", parts: [{ text: messageContent }] };
    
    // Update both state and ref for immediate consistency
    const updatedHistory = [...historyRef.current, newUserMessage];
    historyRef.current = updatedHistory;
    setHistory(updatedHistory);
    
    setIsTyping(true);

    try {
      const currentNode = config.nodes.find((n: any) => n.nodeKey === currentNodeKey);
      
      // 1. Evaluate Transition
      const decision = await evaluateNextNode(currentNodeKey, updatedHistory, config.edges);
      
      if (decision.completed && decision.nextNodeKey) {
        const nextNode = config.nodes.find((n: any) => n.nodeKey === decision.nextNodeKey);
        const isNextForm = nextNode?.formConfig || nextNode?.config?.category === "form" || nextNode?.data?.category === "form";
        if (isNextForm) {
          setIsTyping(false); // Reset before transition
          await performTransition(decision.nextNodeKey);
          return;
        }
      }


      // 2. Get Agent Response
      const systemPrompt = resolveNodePrompt(currentNode?.systemPromptTemplate || "", config.variables, runtimeVariables);
      const interactive = await chatWithAgent(systemPrompt, updatedHistory, messageContent);
      
      const newModelMessage: ChatMessage = { role: "model", parts: [{ text: interactive.concise_text }], interactive };
      
      const sessionHistory = [...historyRef.current, newModelMessage];
      historyRef.current = sessionHistory;
      setHistory(sessionHistory);

      // 3. Post-Response Transition
      const afterDecision = await evaluateNextNode(currentNodeKey, sessionHistory, config.edges);
      if (afterDecision.completed && afterDecision.nextNodeKey) {
        setIsTyping(false); // Reset before transition
        const transitionMsg: ChatMessage = {
          role: "system" as any,
          parts: [{ text: `Transitioning to: ${afterDecision.nextNodeKey}` }]
        };
        const finalHistory = [...historyRef.current, transitionMsg];
        historyRef.current = finalHistory;
        setHistory(finalHistory);
        await performTransition(afterDecision.nextNodeKey);

      }
    } catch (err: any) {
      console.error("Conversation Error:", err);
      setError(`Agent logic error. Please try again or rephrase.`);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormComplete = async (answers: Record<string, any>) => {
    const enrichedAnswers: Record<string, { value: any, questionText: string }> = {};
    
    Object.entries(answers).forEach(([id, val]) => {
      const q = (currentNode?.formConfig?.questions || currentNode?.config?.formConfig?.questions)?.find((q: any) => q.id === id);
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
    
    const outgoingEdges = config.edges.filter((e: any) => e.fromNodeKey === currentNodeKey);
    if (outgoingEdges.length === 1) {
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

  const handleSubmitJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const journeySummary = {
        history: historyRef.current.map(h => ({ role: h.role, text: h.parts[0].text })),
        variables: runtimeVariables,
        aiReport: aiSummary
      };
      await saveUserJourney(versionId, email, journeySummary);
      setSubmitted(true);
    } catch (err) {
      setError("Failed to save your journey.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLastNode = !config.edges.some((e: any) => e.fromNodeKey === currentNodeKey);
  const currentNode = config.nodes.find((n: any) => n.nodeKey === currentNodeKey);
  const isReportNode = currentNode?.reportConfig || currentNode?.category === "report" || currentNode?.config?.category === "report" || currentNode?.data?.category === "report";
  const isFormNode = currentNode?.formConfig || currentNode?.category === "form" || currentNode?.config?.category === "form" || currentNode?.data?.category === "form";

  const handleReportNodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // 1. Generate Report with Custom Prompt
      setIsGeneratingSummary(true);
      const prompt = currentNode?.reportConfig?.systemPromptTemplate || currentNode?.config?.reportConfig?.systemPromptTemplate;
      const reportResult = await generateConversationSummary(historyRef.current, prompt);
      setAiSummary(reportResult.summary);

      // 2. Save Journey
      const journeySummary = {
        history: historyRef.current.map(h => ({ role: h.role, text: h.parts[0].text })),
        variables: runtimeVariables, // already enriched
        aiReport: reportResult.summary
      };
      await saveUserJourney(versionId, email, journeySummary);
      setSubmitted(true); // This will switch the view to show the report
    } catch (err) {
      console.error("Report generation failed:", err);
      setError("Failed to generate and save report.");
      setAiSummary("Error generating report.");
    } finally {
      setIsSubmitting(false);
      setIsGeneratingSummary(false);
    }
  };

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

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isSaveDisabled = isSubmitting || !aiSummary || isGeneratingSummary || !email.trim() || !isValidEmail(email);

  if (showSummary) {
    return (
      <div 
        className="w-full h-full flex items-center justify-center p-6 sm:p-12 overflow-y-auto" 
        style={{
            ...themeStyles,
            backgroundColor: 'var(--p-bg)',
            color: 'var(--p-text)',
            fontFamily: 'var(--p-font)'
        } as any}
      >
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl w-full space-y-8 py-12 text-(--p-text)">
          {!submitted ? (
            <>
              <div className="text-center space-y-4 mt-8">
                <h1 className="text-3xl font-black text-(--p-text)">Your Journey Summary</h1>
                <p className="text-(--p-text)/60">Here's a quick recap of our conversation.</p>
              </div>

              <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 min-h-[200px] flex flex-col justify-center">
                {isGeneratingSummary ? (
                   <div className="space-y-4 animate-pulse">
                      <div className="h-4 bg-white/5 rounded w-3/4" />
                      <div className="h-4 bg-white/5 rounded w-1/2" />
                      <div className="h-4 bg-white/5 rounded w-5/6" />
                      <div className="h-4 bg-white/5 rounded w-2/3" />
                      <p className="text-zinc-500 text-xs text-center mt-8 font-mono animate-bounce uppercase tracking-widest">
                        Gemini is analyzing your conversation...
                      </p>
                   </div>
                ) : aiSummary ? (
                   <div className="prose prose-invert max-w-none prose-sm text-zinc-300 leading-relaxed summary-markdown" style={{ fontFamily: 'var(--p-font)' }}>
                      <ReactMarkdown>{aiSummary}</ReactMarkdown>
                   </div>
                ) : (
                   <p className="text-zinc-500 text-center italic">Waiting for report generation...</p>
                )}
              </div>

              <form onSubmit={handleSubmitJourney} className="space-y-4">
                 <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-(--p-primary) transition-colors" size={18} />
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email to save this"
                        className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-(--p-primary)/50 transition-all font-medium text-white"
                    />
                 </div>
                 <button 
                   type="submit"
                   disabled={isSubmitting}
                   className="w-full h-16 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                 >
                    {isSubmitting ? <RefreshCw className="animate-spin" /> : "Save My Journey"}
                 </button>
              </form>
            </>
          ) : (
             <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-green-500/10 rounded-3xl flex items-center justify-center mx-auto">
                  <Sparkles className="text-green-400" size={32} />
                </div>
                <h1 className="text-3xl font-black text-(--p-text)">All Saved!</h1>
                <p className="text-(--p-text)/60 text-lg">Thank you for going through the preview. The creator will be notified of your interest.</p>
             </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full flex flex-col overflow-hidden relative" 
      style={{ 
        ...themeStyles, 
        backgroundColor: 'var(--p-bg)', 
        color: 'var(--p-text)',
        fontFamily: 'var(--p-font)'
      } as any}
    >
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-100 bg-(--p-bg) backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
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
                      style={{ borderTopColor: 'var(--p-primary)', borderRightColor: 'var(--p-primary)' }}
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
              <h1 className="text-2xl font-black text-(--p-text) tracking-tight uppercase italic">
                Initializing Session
              </h1>
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
        )}

        {/* Brand Header */}
        <div className="w-full px-8 py-4 bg-transparent flex items-center justify-between relative z-20">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-(--p-secondary) border border-white/5 overflow-hidden shadow-lg">
             {theme?.logoUrl ? (
               <img src={theme.logoUrl} alt="Logo" className="w-full h-full object-cover" />
             ) : (
               <Bot size={20} className="text-(--p-primary)" />
             )}
          </div>
        </div>
        <AnimatePresence>
          {isTransitioning && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-(--p-bg)/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
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
                  <h3 className="text-xl font-bold tracking-tight text-(--p-text)">{transitionData?.text || "Moving forward..."}</h3>
               </motion.div>
            </motion.div>
          )}

        </AnimatePresence>

        <div className="flex-1 flex flex-col min-h-0 bg-(--p-bg)">
            {isFormNode ? (
                <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center gap-8">
                    {!transitionOptions ? (
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
                    ) : (
                        <div className="w-full max-w-md mx-auto space-y-6">
                            <div className="text-center space-y-2">
                                <div className="w-12 h-12 rounded-2xl bg-(--p-secondary) flex items-center justify-center mx-auto mb-8 border border-white/5 text-(--p-text) overflow-hidden shadow-lg">
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
                                      className="w-full p-6 bg-(--p-secondary) border border-white/5 rounded-2xl text-left hover:opacity-80 transition-all group flex items-center justify-between shadow-xl active:scale-95"
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
                    )}
                </div>
            ) : isReportNode ? (
                <div className="flex-1 overflow-y-auto p-6 sm:p-12 flex flex-col items-center justify-center">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl w-full space-y-8">
                       {!submitted ? (
                          <>
                             <div className="text-center space-y-4">
                               <div className="w-16 h-16 rounded-2xl bg-(--p-primary)/10 flex items-center justify-center mx-auto mb-6 text-(--p-primary) border border-(--p-primary)/20">
                                   <ClipboardList size={32} />
                               </div>
                               <h1 className="text-4xl font-black text-(--p-text)">{currentNode?.reportConfig?.title || currentNode?.config?.reportConfig?.title || "Your Report"}</h1>
                               <p className="text-(--p-text)/60 text-lg leading-relaxed">{currentNode?.reportConfig?.subtitle || currentNode?.config?.reportConfig?.subtitle || "Enter your email to generate and view your personalized report based on our session."}</p>
                             </div>

                             <form onSubmit={handleReportNodeSubmit} className="space-y-4 pt-8">
                                <div className="relative group">
                                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-(--p-primary) transition-colors" size={20} />
                                   <input 
                                       type="email" 
                                       required
                                       value={email}
                                       onChange={(e) => setEmail(e.target.value)}
                                       placeholder="name@example.com"
                                       className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-(--p-primary)/50 transition-all font-medium text-(--p-text) text-lg placeholder:text-zinc-600"
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
                          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                             <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-(--p-primary)/10 text-(--p-primary) text-xs font-black uppercase tracking-widest mb-4">
                                  <Check size={14} />
                                  Report Generated
                                </div>
                                <h1 className="text-3xl font-bold text-(--p-text)">Analysis Complete</h1>
                             </div>
                             
                             <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 min-h-[200px] shadow-2xl relative overflow-hidden group" style={{ backgroundColor: 'var(--p-secondary)' }}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-(--p-primary) to-transparent opacity-50" />
                                <div className="prose prose-invert max-w-none prose-lg text-zinc-300 leading-relaxed summary-markdown" style={{ fontFamily: 'var(--p-font)' }}>
                                    <ReactMarkdown>{aiSummary || ""}</ReactMarkdown>
                                </div>
                             </div>
                          </div>
                       )}
                    </motion.div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto relative">
                    <AnimatePresence mode="wait">
                        {isTyping && history.length > 0 ? (
                            <motion.div
                                key="typing-indicator"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="space-y-6 flex flex-col items-center"
                            >
                                <div className="w-16 h-16 rounded-full bg-(--p-secondary) flex items-center justify-center border border-white/5 overflow-hidden">
                                    {theme?.logoUrl ? (
                                      <img src={theme.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                      <RefreshCw className="w-8 h-8 animate-spin text-(--p-primary)" />
                                    )}
                                </div>
                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">Agent is thinking...</p>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key={history.length}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-full max-w-2xl space-y-12 text-center"
                            >
                                {(() => {
                                    const lastModelMsg = [...history].reverse().find(m => m.role === 'model');
                                    if (!lastModelMsg) return null;

                                    return (
                                        <>
                                            <div className="space-y-6">
                                                <div className="w-12 h-12 rounded-2xl bg-(--p-secondary) flex items-center justify-center mx-auto mb-8 border border-white/5 text-(--p-text) overflow-hidden shadow-lg">
                                                    {theme?.logoUrl ? (
                                                      <img src={theme.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                                    ) : (
                                                      <Bot size={24} />
                                                    )}
                                                </div>
                                                <div className="prose prose-xl prose-invert max-w-none text-(--p-text) font-bold leading-tight" style={{ fontFamily: 'var(--p-font)' }}>
                                                    <ReactMarkdown>{lastModelMsg.interactive?.concise_text || lastModelMsg.parts[0].text}</ReactMarkdown>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3 max-w-sm mx-auto pt-8">
                                                {lastModelMsg.interactive?.buttons && lastModelMsg.interactive.buttons.length > 0 && (
                                                    <>
                                                        <div className="grid gap-3 w-full">
                                                            {lastModelMsg.interactive.buttons.map((btn, idx) => (
                                                                <button 
                                                                    key={idx} 
                                                                    onClick={() => handleSendMessage(undefined, btn.next_message)} 
                                                                    className="w-full py-5 bg-(--p-primary) text-white text-sm font-black uppercase tracking-widest rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-(--p-primary)/10"
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

                                                {isLastNode && !isTyping && (
                                                    <button 
                                                        onClick={() => setShowSummary(true)}
                                                        style={{ backgroundColor: 'var(--p-primary)', color: isDarkMode ? '#000' : '#fff' }}
                                                        className="w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95 text-sm mt-4"
                                                    >
                                                        <Sparkles size={18} />
                                                        Generate Report
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    </div>
  );
}
