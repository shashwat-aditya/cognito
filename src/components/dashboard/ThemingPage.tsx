"use client";

import React, { useEffect, useState } from "react";
import { getProjectTheme, upsertProjectTheme } from "@/lib/actions/theme";
import { Loader2, Palette, Save, Type, Eye, Sun, Moon, Bot } from "lucide-react";
import { motion } from "framer-motion";

interface ThemingPageProps {
  projectId: string;
}

const FONTS = ["Arial, sans-serif", "Verdana, sans-serif", "Times New Roman, serif", "Poppins", "Courier New, monospace", "Brush Script MT, cursive"];

const ColorInput = ({ label, value, onChange, id }: { label: string, value: string, onChange: (v: string) => void, id: string }) => (
  <div className="space-y-2">
    <label htmlFor={id} className="text-sm font-medium text-zinc-400">{label}</label>
    <div className="flex items-center gap-3 bg-zinc-900/50 border border-white/5 p-2 rounded-lg group focus-within:border-indigo-500/50 transition-colors">
      <input
        id={id}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm w-full outline-none text-zinc-200"
      />
    </div>
  </div>
);

export const ThemingPage: React.FC<ThemingPageProps> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState({
    lightPrimary: "#6366f1",
    lightSecondary: "#f4f4f5",
    lightBackground: "#ffffff",
    lightText: "#09090b",
    darkPrimary: "#818cf8",
    darkSecondary: "#27272a",
    darkBackground: "#09090b",
    darkText: "#f4f4f5",
    fontStyle: "Arial",
    mode: "light",
  });

  useEffect(() => {
    async function loadTheme() {
      try {
        const data = await getProjectTheme(projectId);
        if (data) {
          setTheme({
            lightPrimary: data.lightPrimary,
            lightSecondary: data.lightSecondary,
            lightBackground: data.lightBackground,
            lightText: data.lightText,
            darkPrimary: data.darkPrimary,
            darkSecondary: data.darkSecondary,
            darkBackground: data.darkBackground,
            darkText: data.darkText,
            fontStyle: data.fontStyle,
            mode: (data as any).mode || "light",
          });
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
      } finally {
        setLoading(false);
      }
    }
    loadTheme();
  }, [projectId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertProjectTheme(projectId, theme);
    } catch (error) {
      console.error("Failed to save theme:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateColor = (key: keyof typeof theme, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const isDark = theme.mode === "dark";

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 p-4">
      {/* Editor Side */}
      <div className="w-1/2 flex flex-col bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
              <Palette className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Theme Editor</h1>
              <p className="text-xs text-zinc-500">Configure your app's visual identity</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {/* Mode Selector */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Appearance Mode</label>
            <div className="flex gap-3">
              {[
                { id: "light", icon: Sun, label: "Light" },
                { id: "dark", icon: Moon, label: "Dark" }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => updateColor("mode", m.id)}
                  className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${
                    theme.mode === m.id 
                      ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-lg shadow-indigo-500/10" 
                      : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/10"
                  }`}
                >
                  <m.icon size={18} />
                  <span className="font-bold text-sm">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Pallette */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">{theme.mode} palette</label>
            <div className="grid grid-cols-2 gap-4">
              <ColorInput 
                id={`${theme.mode}Primary`} 
                label="Primary / Accent" 
                value={isDark ? theme.darkPrimary : theme.lightPrimary} 
                onChange={(v) => updateColor(isDark ? "darkPrimary" : "lightPrimary", v)} 
              />
              <ColorInput 
                id={`${theme.mode}Background`} 
                label="Main Background" 
                value={isDark ? theme.darkBackground : theme.lightBackground} 
                onChange={(v) => updateColor(isDark ? "darkBackground" : "lightBackground", v)} 
              />
              <ColorInput 
                id={`${theme.mode}Secondary`} 
                label="Surface / Card" 
                value={isDark ? theme.darkSecondary : theme.lightSecondary} 
                onChange={(v) => updateColor(isDark ? "darkSecondary" : "lightSecondary", v)} 
              />
              <ColorInput 
                id={`${theme.mode}Text`} 
                label="Text Color" 
                value={isDark ? theme.darkText : theme.lightText} 
                onChange={(v) => updateColor(isDark ? "darkText" : "lightText", v)} 
              />
            </div>
          </div>

          {/* Font Selection */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Typography</label>
            <div className="grid grid-cols-3 gap-3">
              {FONTS.map((font) => (
                <button
                  key={font}
                  onClick={() => updateColor("fontStyle", font)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    theme.fontStyle === font
                      ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                      : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/10"
                  }`}
                >
                  <span className="text-xl block mb-1" style={{ fontFamily: font }}>Aa</span>
                  <p className="text-[10px] font-bold truncate">{font.split(",")[0]}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Side */}
      <div className="w-1/2 flex flex-col bg-zinc-950 rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ 
          background: `radial-gradient(circle at 50% 0%, ${isDark ? theme.darkPrimary : theme.lightPrimary}, transparent 70%)` 
        }} />
        
        <div className="p-6 border-b border-white/5 flex items-center justify-between z-10 bg-zinc-950/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-bold text-zinc-400 capitalize">{theme.mode} Preview</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 z-10 overflow-hidden">
          <div 
            className="w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border transition-colors duration-500"
            style={{ 
              backgroundColor: isDark ? theme.darkBackground : theme.lightBackground, 
              color: isDark ? theme.darkText : theme.lightText, 
              fontFamily: theme.fontStyle,
              borderColor: 'rgba(255,255,255,0.05)'
            }}
          >
            {/* Mock Questionnaire UI */}
            <div className="p-8 space-y-12 text-center">
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-10 transition-colors shadow-lg" 
                     style={{ backgroundColor: isDark ? theme.darkSecondary : theme.lightSecondary, color: isDark ? theme.darkText : theme.lightText }}>
                  <Bot size={32} />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-black leading-tight" style={{ color: isDark ? theme.darkText : theme.lightText }}>
                    How would you like to brand your experience?
                  </h3>
                  <p className="text-xs opacity-60 font-medium">Select an option below to continue</p>
                </div>
              </div>

              <div className="space-y-3 pt-8">
                <div className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-xl transition-transform hover:scale-[1.02]" 
                     style={{ backgroundColor: isDark ? theme.darkPrimary : theme.lightPrimary }}>
                  Premium Minimalist
                </div>
                <div className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-xl transition-transform hover:scale-[1.02]" 
                     style={{ backgroundColor: isDark ? theme.darkPrimary : theme.lightPrimary }}>
                  Bold & Vibrant
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
