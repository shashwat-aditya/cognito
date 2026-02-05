"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, AlertCircle, Ghost, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const pathname = usePathname();
  const isPublicPreview = pathname?.startsWith("/p/");

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-indigo-500/30">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          {/* Icon Container */}
          <div className="w-24 h-24 bg-zinc-900 border border-white/10 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/10">
            {isPublicPreview ? (
              <AlertCircle size={40} className="text-red-400" />
            ) : (
              <Ghost size={40} className="text-zinc-400" />
            )}
          </div>

          {/* Heading */}
          <h1 className="text-6xl font-black mb-4 tracking-tighter bg-linear-to-br from-white to-zinc-500 bg-clip-text text-transparent">
            404
          </h1>

          {/* Dynamic Message */}
          <h2 className="text-xl font-bold text-white mb-3">
            {isPublicPreview ? "Link Unavailable" : "Page Not Found"}
          </h2>
          
          <p className="text-zinc-500 mb-8 leading-relaxed">
            {isPublicPreview ? (
              <>
                This public preview link may have expired, been deleted, or never existed. 
                <br className="hidden sm:block" />
                <span className="text-zinc-300 font-medium block mt-2">
                  Please contact the project owner for a new link.
                </span>
              </>
            ) : (
              "The page you are looking for has vanished into the digital void. It might have been moved or doesn't exist anymore."
            )}
          </p>

          {/* Action Button */}
          {!isPublicPreview ? (
            <Link 
              href="/"
              target="_self"
              className="group flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all active:scale-95"
            >
              <Home size={16} />
              Return Home
            </Link>
          ) : (
            <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl text-xs text-zinc-500">
               If you believe this is an error, check the URL or try again later.
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Footer Decoration */}
      <div className="absolute bottom-8 text-zinc-800 text-[10px] font-mono uppercase tracking-widest">
        ERR_NOT_FOUND_404
      </div>
    </div>
  );
}
