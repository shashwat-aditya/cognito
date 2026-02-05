"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Variable {
  id: string;
  key: string;
  value: string;
}

interface MentionTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  variables: Variable[];
  placeholder?: string;
  className?: string;
  rows?: number;
}

export function MentionTextArea({
  value,
  onChange,
  variables,
  placeholder,
  className = "",
  rows = 5,
}: MentionTextAreaProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const [filter, setFilter] = useState("");
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredVariables = variables.filter((v) =>
    v.key.toLowerCase().includes(filter.toLowerCase())
  );

  // Sync scroll
  useEffect(() => {
    const handleScroll = () => {
      if (textareaRef.current && overlayRef.current) {
        overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      }
    };
    const textarea = textareaRef.current;
    textarea?.addEventListener("scroll", handleScroll);
    return () => textarea?.removeEventListener("scroll", handleScroll);
  }, []);


  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    const pos = e.target.selectionStart;
    onChange(newVal);
    setCursorPos(pos);

    // Look back for '@'
    const textBeforeCursor = newVal.slice(0, pos);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIdx + 1);
      // Ensure no spaces between @ and cursor to trigger dropdown
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setFilter(textAfterAt);
        setShowDropdown(true);
        setSelectedIndex(0);
        calculateDropdownPosition(lastAtIdx);
      } else {
        setShowDropdown(false);
      }
    } else {
      setShowDropdown(false);
    }
  };

  const calculateDropdownPosition = (atIndex: number) => {
    if (!textareaRef.current) return;
    
    // Simple estimation for cursor position
    // For more accurate positioning, we'd need a ghost div
    const { selectionStart } = textareaRef.current;
    const lines = value.slice(0, selectionStart).split("\n");
    const currentLineIdx = lines.length - 1;
    const charInLine = lines[currentLineIdx].length;
    
    // Rough estimates
    const lineHeight = 24;
    const charWidth = 8.5;
    
    setDropdownPos({
      top: (currentLineIdx + 1) * lineHeight + 10,
      left: charInLine * charWidth,
    });
  };

  const insertVariable = useCallback((variableKey: string) => {
    if (!textareaRef.current) return;

    const textBeforeAt = value.slice(0, cursorPos - filter.length - 1);
    const textAfterCursor = value.slice(cursorPos);
    const insertedText = `@${variableKey} `;
    const newValue = textBeforeAt + insertedText + textAfterCursor;

    onChange(newValue);
    setShowDropdown(false);
    setFilter("");
    
    // Focus back and set cursor
    const newPos = textBeforeAt.length + insertedText.length;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }, [value, cursorPos, filter, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showDropdown) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredVariables.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredVariables.length) % filteredVariables.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (filteredVariables[selectedIndex]) {
          insertVariable(filteredVariables[selectedIndex].key);
        }
      } else if (e.key === "Escape") {
        setShowDropdown(false);
      }
    }
  };

  // Helper to render highlighted text
  const renderHighlightedText = () => {
    const parts = value.split(/(@[a-zA-Z0-9_]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@") && variables.some(v => `@${v.key}` === part)) {
        return (
          <span 
            key={i} 
            className="bg-indigo-500/25 rounded text-center px-0.5"
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };




  const sharedStyles: React.CSSProperties = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '14px',
    lineHeight: '24px',
    padding: '16px 20px',
    border: '1px solid transparent',
    boxSizing: 'border-box',
    fontVariantLigatures: 'none',
    WebkitFontFeatureSettings: '"liga" 0',
    fontFeatureSettings: '"liga" 0',
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Highlighting Overlay */}
      <div 
        ref={overlayRef}
        className={`absolute inset-0 pointer-events-none whitespace-pre-wrap wrap-break-word overflow-hidden ${className}`}
        style={{ 
          ...sharedStyles,
          color: "transparent",
          zIndex: 0
        }}
      >
        {renderHighlightedText()}
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={`w-full bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 relative z-10 scrollbar-hide ${className}`}
        style={{ 
          ...sharedStyles,
          caretColor: "white",
          resize: 'none',
          backgroundColor: 'rgb(255 255 255 / 0.05)'
        }}
      />



      <AnimatePresence>
        {showDropdown && filteredVariables.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            style={{ 
              top: `${dropdownPos.top}px`, 
              left: `${Math.min(dropdownPos.left, (containerRef.current?.offsetWidth || 0) - 200)}px` 
            }}
          >
            <div className="p-2 max-h-48 overflow-y-auto custom-scrollbar">
              {filteredVariables.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => insertVariable(v.key)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs truncate transition-colors ${
                    i === selectedIndex ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-white/5"
                  }`}
                >
                  <span className="font-bold">@</span>{v.key}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
