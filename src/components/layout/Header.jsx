/**
 * Header Component
 * Displays the application logo, title, and settings button
 */

import React from "react";
import { Filter, FolderSearch, Settings, Info, Camera } from "lucide-react";
import useSettingsStore from "../../stores/useSettingsStore";
import useFilterStore from "../../stores/useFilterStore";

const Header = ({ onSettingsClick, onHelpClick }) => {
  const animationsEnabled = useSettingsStore(
    (state) => state.animationsEnabled
  );
  const { photoMode, togglePhotoMode } = useFilterStore();

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

      {/* Actions: Photo Mode + Help + Settings */}
      <div className="flex items-center gap-3">
        {/* Photo Mode Toggle */}
        <button
          onClick={togglePhotoMode}
          className={`
            flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg 
            hover:shadow-xl border 
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
            ${animationsEnabled ? "transition-all hover:scale-105" : ""}
            ${
              photoMode
                ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            }
          `}
          aria-label="Toggle Photo Mode"
          title={photoMode ? "Photo Mode Active" : "Enable Photo Mode"}
        >
          <Camera className={`w-5 h-5 ${photoMode ? "text-white" : ""}`} />
          <span className="font-medium text-sm hidden sm:inline">
            Photo Mode
          </span>
        </button>

        <button
          onClick={onHelpClick}
          className={`
            p-3 rounded-xl bg-white dark:bg-slate-800 shadow-lg 
            hover:shadow-xl border border-slate-200 dark:border-slate-700
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${animationsEnabled ? "transition-all hover:scale-105" : ""}
          `}
          aria-label="Open Instructions"
          title="Instructions"
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
          title="Settings"
        >
          <Settings className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>
      </div>
    </header>
  );
};

export default Header;
