"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check } from "lucide-react";
import type { Question, FormConfig } from "./QuestionnaireEditor";

interface MiniAppProps {
  config: FormConfig;
  onComplete: (answers: Record<string, any>) => void;
}

export function MiniApp({ config, onComplete }: MiniAppProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const currentQuestion = config.questions[currentQuestionIndex];

  const handleNext = () => {
    const newAnswers = { ...answers, [currentQuestion.id]: currentQuestion.type === 'multi_select' ? selectedOptions : answers[currentQuestion.id] };
    
    if (currentQuestionIndex < config.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOptions([]);
    } else {
      onComplete(newAnswers);
    }
  };

  const handleOptionSelect = (optionValue: string) => {
    if (currentQuestion.type === "single_select") {
      setAnswers({ ...answers, [currentQuestion.id]: optionValue });
      // For single select, we can auto-advance or wait for "Next"
      // Let's advance automatically for a smoother experience
      const newAnswers = { ...answers, [currentQuestion.id]: optionValue };
       if (currentQuestionIndex < config.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOptions([]);
      } else {
        onComplete(newAnswers);
      }
    } else {
      // multi_select
      const next = selectedOptions.includes(optionValue)
        ? selectedOptions.filter(o => o !== optionValue)
        : [...selectedOptions, optionValue];
      setSelectedOptions(next);
    }
  };

  if (!currentQuestion) return null;

  return (
    <div className="w-full max-w-md mx-auto border rounded-3xl p-8 shadow-2xl" style={{ backgroundColor: 'var(--p-bg)', color: 'var(--p-text)', borderColor: 'rgba(255,255,255,0.05)' }}>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--p-primary)' }}>
            Question {currentQuestionIndex + 1} of {config.questions.length}
          </span>
          <div className="flex gap-1">
            {config.questions.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 w-4 rounded-full transition-all duration-500`} 
                style={{ backgroundColor: i <= currentQuestionIndex ? 'var(--p-primary)' : 'var(--p-secondary)', opacity: i <= currentQuestionIndex ? 1 : 0.2 }}
              />
            ))}
          </div>
        </div>
        <h2 className="text-2xl font-bold leading-tight">{currentQuestion.text}</h2>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {currentQuestion.type === "text" ? (
            <div className="space-y-4">
              <textarea
                autoFocus
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                placeholder="Type your answer here..."
                rows={4}
                style={{ backgroundColor: 'var(--p-secondary)', color: 'var(--p-text)', borderColor: 'rgba(255,255,255,0.05)' }}
                className="w-full border rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg font-medium placeholder:text-zinc-600"
              />
              <button
                onClick={handleNext}
                disabled={!answers[currentQuestion.id]}
                style={{ backgroundColor: 'var(--p-primary)', color: '#fff' }}
                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight size={20} />
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {currentQuestion.options?.map((option) => {
                  const isSelected = currentQuestion.type === 'single_select' 
                    ? answers[currentQuestion.id] === option.value
                    : selectedOptions.includes(option.value);

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(option.value)}
                      style={isSelected ? { backgroundColor: 'var(--p-primary)', color: '#fff' } : { backgroundColor: 'var(--p-secondary)', color: 'var(--p-text)', opacity: 0.8 }}
                      className={`w-full p-5 rounded-2xl border border-transparent text-left transition-all group flex items-center justify-between shadow-sm`}
                    >
                      <span className="font-semibold text-lg">{option.label}</span>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'bg-white border-white text-black' : 'border-white/10 text-transparent'
                      }`} style={isSelected ? { backgroundColor: '#fff', borderColor: '#fff' } : {}}>
                        <Check size={14} strokeWidth={4} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {currentQuestion.type === "multi_select" && (
                <button
                  onClick={handleNext}
                  disabled={selectedOptions.length === 0}
                  style={{ backgroundColor: 'var(--p-primary)', color: '#fff' }}
                  className="w-full h-14 mt-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Confirm Selection
                  <ChevronRight size={20} />
                </button>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
