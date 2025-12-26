import React, { useEffect, useState } from "react";
import { Search, FolderOpen, FileText, Filter } from "lucide-react";
import { createPortal } from "react-dom";

const MESSAGES = [
  "Indexing file structure...",
  "Applying exclusion rules...",
  "Filtering by extension...",
  "Analyzing metadata...",
  "Finalizing results...",
];

const ICONS = [FolderOpen, Filter, FileText, Search];

export default function SearchOverlay({ open }) {
  const [msgIndex, setMsgIndex] = useState(0);

  // Cycle through messages to show activity
  useEffect(() => {
    if (!open) {
      setMsgIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 800); // Change message every 800ms

    return () => clearInterval(interval);
  }, [open]);

  if (!open) return null;

  const CurrentIcon = ICONS[msgIndex % ICONS.length];

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-8 flex flex-col items-center gap-6 max-w-sm w-full mx-4 relative overflow-hidden">
        {/* Background Decorative Gradient Blob */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />

        {/* Animation Container */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Ripple Effect rings */}
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />

          {/* Central Icon that changes */}
          <div className="relative z-10 bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm ring-1 ring-slate-100 dark:ring-slate-700">
            <CurrentIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-bounce" />
          </div>
        </div>

        {/* Text Area */}
        <div className="text-center space-y-1 z-10">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Scanning Files
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 min-h-5 transition-all duration-300">
            {MESSAGES[msgIndex]}
          </p>
        </div>

        {/* Progress Bar (Indeterminate) */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-blue-500 to-purple-600 w-1/2 animate-[shimmer_1.5s_infinite_linear] rounded-full"
            style={{ width: "100%", transformOrigin: "0% 50%" }}
          />
        </div>
      </div>

      {/* CSS for the custom shimmer animation if not in tailwind config */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>,
    document.body
  );
}
