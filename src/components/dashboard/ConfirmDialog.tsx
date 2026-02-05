"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger"
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white shadow-red-500/20";
      case "warning":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500 hover:text-white shadow-amber-500/20";
      default:
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500 hover:text-white shadow-indigo-500/20";
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case "danger": return "text-red-400";
      case "warning": return "text-amber-400";
      default: return "text-indigo-400";
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-zinc-900/90 border border-white/10 w-full max-w-md rounded-[32px] p-8 relative shadow-2xl backdrop-blur-xl z-10"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6`}>
            <AlertTriangle className={getIconColor()} size={28} />
          </div>

          <h2 className="text-2xl font-black text-white mb-2">{title}</h2>
          <p className="text-zinc-400 leading-relaxed mb-8">{message}</p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 font-bold hover:bg-white/10 hover:text-white transition-all active:scale-95"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 h-14 rounded-2xl border font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg ${getVariantStyles()}`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
