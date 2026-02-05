import React, { useState } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Type, List, CheckSquare } from "lucide-react";
import { motion, Reorder } from "framer-motion";

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface Question {
  id: string;
  text: string;
  type: "text" | "single_select" | "multi_select";
  options?: QuestionOption[];
}

export interface FormConfig {
  title: string;
  questions: Question[];
}

interface QuestionnaireEditorProps {
  data: FormConfig;
  onChange: (data: FormConfig) => void;
}

export function QuestionnaireEditor({ data, onChange }: QuestionnaireEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const updateForm = (updates: Partial<FormConfig>) => {
    onChange({ ...data, ...updates });
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: "New Question",
      type: "text",
    };
    const newQuestions = [...(data.questions || []), newQuestion];
    updateForm({ questions: newQuestions });
    setExpandedId(newQuestion.id);
  };

  const removeQuestion = (id: string) => {
    const newQuestions = data.questions.filter((q) => q.id !== id);
    updateForm({ questions: newQuestions });
    if (expandedId === id) setExpandedId(null);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    const newQuestions = data.questions.map((q) =>
      q.id === id ? { ...q, ...updates } : q
    );
    updateForm({ questions: newQuestions });
  };

  const addOption = (questionId: string) => {
    const question = data.questions.find((q) => q.id === questionId);
    if (!question) return;

    const newOption: QuestionOption = {
      id: `opt_${Date.now()}`,
      label: "New Option",
      value: "new_option",
    };
    const newOptions = [...(question.options || []), newOption];
    updateQuestion(questionId, { options: newOptions });
  };

  const updateOption = (questionId: string, optionId: string, updates: Partial<QuestionOption>) => {
    const question = data.questions.find((q) => q.id === questionId);
    if (!question || !question.options) return;

    const newOptions = question.options.map((opt) =>
      opt.id === optionId ? { ...opt, ...updates } : opt
    );
    updateQuestion(questionId, { options: newOptions });
  };

  const removeOption = (questionId: string, optionId: string) => {
    const question = data.questions.find((q) => q.id === questionId);
    if (!question || !question.options) return;

    const newOptions = question.options.filter((opt) => opt.id !== optionId);
    updateQuestion(questionId, { options: newOptions });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="group space-y-2">
          <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Form Title ( Identifier ) </label>
          <input
            type="text"
            value={data.title || ""}
            onChange={(e) => updateForm({ title: e.target.value })}
            placeholder="e.g. User Feedback"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Questions</label>
          <button
            onClick={addQuestion}
            className="flex items-center gap-2 bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-yellow-500/20"
          >
            <Plus size={14} />
            Add Question
          </button>
        </div>

        <div className="space-y-3">
          {data.questions?.map((q, index) => (
            <div key={q.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center bg-yellow-500/10 rounded text-yellow-500 text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-white truncate max-w-[180px]">
                    {q.text || "New Question"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeQuestion(q.id);
                    }}
                    className="p-1.5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  {expandedId === q.id ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
                </div>
              </div>

              {expandedId === q.id && (
                <div className="p-4 pt-0 border-t border-white/5 space-y-4 mt-2">
                  <div className="space-y-2 mt-4">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Question Text</label>
                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Input Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'text', icon: Type, label: 'Text' },
                        { id: 'single_select', icon: List, label: 'Pick One' },
                        { id: 'multi_select', icon: CheckSquare, label: 'Pick Many' }
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => updateQuestion(q.id, { type: type.id as any, options: type.id !== 'text' ? (q.options || []) : undefined })}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                            q.type === type.id 
                              ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' 
                              : 'bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/10'
                          }`}
                        >
                          <type.icon size={16} />
                          <span className="text-[10px] mt-1">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {q.type !== "text" && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Options</label>
                        <button
                          onClick={() => addOption(q.id)}
                          className="text-[10px] font-bold text-yellow-500 hover:text-yellow-400"
                        >
                          + Add Option
                        </button>
                      </div>
                      <div className="space-y-2">
                        {q.options?.map((opt) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={opt.label}
                              onChange={(e) => updateOption(q.id, opt.id, { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                              placeholder="Option label"
                              className="flex-1 bg-zinc-900 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
                            />
                            <button
                              onClick={() => removeOption(q.id, opt.id)}
                              className="p-1 hover:bg-red-500/10 text-zinc-600 hover:text-red-400 rounded"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
