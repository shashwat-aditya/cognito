"use strict";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ArrowRight, Bot, Cpu, Layers, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#09090b] text-white selection:bg-indigo-500/30">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0">
        <div className="animate-mesh absolute -top-[10%] -left-[10%] h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="animate-mesh absolute top-[20%] -right-[10%] h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[100px] [animation-delay:2s]" />
        <div className="animate-mesh absolute -bottom-[10%] left-[20%] h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[120px] [animation-delay:4s]" />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-x-0 top-0 z-0 h-screen opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <img src={'/favicon.png'} className="aspect-square w-8" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-zinc-400">
            Cognito
          </span>
        </div>

        <div className="flex items-center gap-6">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer">
                Sign In
              </button>
            </SignInButton>
            <SignInButton mode="modal">
              <button className="px-5 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-white/10 cursor-pointer">
                Get Started
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link 
              href="/dashboard"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 animate-fade-in">
          <Sparkles size={14} className="text-indigo-400" />
          <span className="text-xs font-medium text-zinc-300">The Future of AI Orchestration</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
          Build <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400">Agentic Workflows</span> <br />
          with Unmatched Velocity
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed">
          Design, deploy, and manage multi-agent systems using an intuitive visual canvas. 
          The ultimate platform for autonomous AI development.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center mb-24">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-linear-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg hover:shadow-[0_0_30px_-5px_rgba(79,70,229,0.6)] transition-all active:scale-[0.98] group cursor-pointer">
                Start Building Free
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </SignInButton>
          </SignedOut>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
          <div className="glass p-8 rounded-4xl text-left hover:border-white/20 transition-colors group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
              <Cpu className="text-indigo-400" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Visual Canvas</h3>
            <p className="text-zinc-500 leading-relaxed text-sm">
              Drag-and-drop interface for complex multi-agent reasoning paths.
            </p>
          </div>

          <div className="glass p-8 rounded-4xl text-left hover:border-white/20 transition-colors group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
              <Layers className="text-purple-400" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Model Agnostic</h3>
            <p className="text-zinc-500 leading-relaxed text-sm">
              Connect to any LLM provider with standardized agent protocols.
            </p>
          </div>

          <div className="glass p-8 rounded-4xl text-left hover:border-white/20 transition-colors group">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
              <Zap className="text-blue-400" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Real-time Debug</h3>
            <p className="text-zinc-500 leading-relaxed text-sm">
              Inspect agent thoughts, tool calls, and state changes in real-time.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Decoration */}
      <div className="mt-20 border-t border-white/5 pt-12 pb-24 text-center">
        <p className="text-zinc-600 text-sm italic">
          Powering the next generation of autonomous intelligence.
        </p>
      </div>
    </div>
  );
}
