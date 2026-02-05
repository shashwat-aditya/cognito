"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type DialogType = "alert" | "confirm" | "prompt";

interface DialogConfig {
  type: DialogType;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
}

interface DialogContextValue {
  showDialog: (config: Omit<DialogConfig, "onConfirm" | "onCancel">) => Promise<string | boolean | null>;
  alert: (message: string, title?: string) => Promise<void>;
  confirm: (message: string, title?: string) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string, title?: string) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}

interface DialogProviderProps {
  children: ReactNode;
}

export function DialogProvider({ children }: DialogProviderProps) {
  const [dialogConfig, setDialogConfig] = useState<DialogConfig | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showDialog = useCallback((config: Omit<DialogConfig, "onConfirm" | "onCancel">) => {
    return new Promise<string | boolean | null>((resolve) => {
      setDialogConfig({
        ...config,
        onConfirm: (value) => {
          setIsOpen(false);
          setTimeout(() => setDialogConfig(null), 200);
          if (config.type === "prompt") {
            resolve(value || "");
          } else {
            resolve(true);
          }
        },
        onCancel: () => {
          setIsOpen(false);
          setTimeout(() => setDialogConfig(null), 200);
          if (config.type === "prompt") {
            resolve(null);
          } else {
            resolve(false);
          }
        },
      });
      setIsOpen(true);
    });
  }, []);

  const alert = useCallback(
    async (message: string, title?: string) => {
      await showDialog({ type: "alert", message, title });
    },
    [showDialog]
  );

  const confirm = useCallback(
    (message: string, title?: string) => {
      return showDialog({ type: "confirm", message, title }) as Promise<boolean>;
    },
    [showDialog]
  );

  const prompt = useCallback(
    (message: string, defaultValue?: string, title?: string) => {
      return showDialog({ type: "prompt", message, defaultValue, title }) as Promise<string | null>;
    },
    [showDialog]
  );

  return (
    <DialogContext.Provider value={{ showDialog, alert, confirm, prompt }}>
      {children}
      {dialogConfig && (
        <CustomDialog
          isOpen={isOpen}
          config={dialogConfig}
        />
      )}
    </DialogContext.Provider>
  );
}

interface CustomDialogProps {
  isOpen: boolean;
  config: DialogConfig;
}

function CustomDialog({ isOpen, config }: CustomDialogProps) {
  const [inputValue, setInputValue] = useState(config.defaultValue || "");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (config.type === "prompt") {
      config.onConfirm?.(inputValue);
    } else {
      config.onConfirm?.();
    }
  };

  const handleCancel = () => {
    config.onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && config.type !== "prompt") {
      handleConfirm();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleCancel}
      onKeyDown={handleKeyDown}
    >
      <div 
        className="glass w-full max-w-md rounded-3xl border border-white/10 p-8 relative animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {config.title && (
          <h2 className="text-2xl font-bold mb-4 text-zinc-100">{config.title}</h2>
        )}
        
        <p className="text-zinc-300 mb-6 text-sm leading-relaxed">
          {config.message}
        </p>

        {config.type === "prompt" && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleConfirm();
              }
            }}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white mb-6"
            autoFocus
          />
        )}

        <div className="flex gap-3">
          {config.type !== "alert" && (
            <button
              onClick={handleCancel}
              className="flex-1 h-12 text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 rounded-xl transition-all text-sm font-medium"
            >
              {config.cancelText || "Cancel"}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
            autoFocus={config.type === "alert"}
          >
            {config.confirmText || (config.type === "alert" ? "OK" : "Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
