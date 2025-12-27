/**
 * Header Component
 * Displays the application logo, title, and settings button
 */

import React from "react";
import { Filter, FolderSearch, Settings, Info } from "lucide-react";
import useSettingsStore from "../../stores/useSettingsStore";

const Header = ({ onSettingsClick, onHelpClick }) => {
  const animationsEnabled = useSettingsStore(
    (state) => state.animationsEnabled
  );

  return (
    <header className="flex items-center justify-between mb-8">
      {/* Logo and Title */}
      <div className="flex items-center gap-3">
        <div
          className={`
            w-12 h-12 bg-linear-to-br from-blue-600 to-purple-600 
            rounded-xl flex items-center justify-center shadow-lg
            ${animationsEnabled ? "transition-transform hover:scale-110" : ""}
          `}
        >
          <FolderSearch className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            File Filter Copier
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Intelligent file filtering and organisation
          </p>
        </div>
      </div>

      {/* Actions: Help + Settings */}
      <div className="flex items-center gap-3">
        <button
          onClick={onHelpClick}
          className={`
            p-3 rounded-xl bg-white dark:bg-slate-800 shadow-lg 
            hover:shadow-xl border border-slate-200 dark:border-slate-700
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${animationsEnabled ? "transition-all hover:scale-105" : ""}
          `}
          aria-label="Open Instructions"
        >
          <Info className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>
        <button
          onClick={onSettingsClick}
          className={`
            p-3 rounded-xl bg-white dark:bg-slate-800 shadow-lg 
            hover:shadow-xl border border-slate-200 dark:border-slate-700
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${animationsEnabled ? "transition-all hover:scale-105" : ""}
          `}
          aria-label="Open Settings"
        >
          <Settings className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>
      </div>
    </header>
  );
};

export default Header;
