/**
 * Main Configuration Section Component
 * Handles source folder, destination folder, output folder name, and dry run toggle
 */

import React, { useEffect } from "react";
import { FolderOpen } from "lucide-react";
import useFilterStore from "../../stores/useFilterStore";
import useSettingsStore from "../../stores/useSettingsStore";

const MainConfigSection = () => {
  const {
    sourceFolder,
    destinationFolder,
    outputFolderName,
    dryRun,
    setSourceFolder,
    setDestinationFolder,
    setOutputFolderName,
    toggleDryRun,
  } = useFilterStore();

  const {
    animationsEnabled,
    addRecentSourceFolder,
    addRecentDestinationFolder,
    theme,
    setTheme,
  } = useSettingsStore();

  // Apply theme to <html> (document.documentElement)
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = (mode) => {
      if (mode === "dark") {
        root.classList.add("dark");
      } else if (mode === "light") {
        root.classList.remove("dark");
      } else {
        root.classList.toggle("dark", mq.matches);
      }
    };

    apply(theme);

    const handleChange = () => {
      if (theme === "system") apply("system");
    };

    // Support Safari/older browsers
    if (mq.addEventListener) mq.addEventListener("change", handleChange);
    else mq.addListener(handleChange);

    return () => {
      if (mq.removeEventListener)
        mq.removeEventListener("change", handleChange);
      else mq.removeListener(handleChange);
    };
  }, [theme]);

  /**
   * Handle folder selection using Electron's dialog
   * This will use the IPC bridge in preload.js
   */
  const handleBrowseFolder = async (type) => {
    try {
      // Check if running in Electron environment
      if (window.electron && window.electron.selectFolder) {
        const result = await window.electron.selectFolder();

        if (result && !result.canceled && result.filePaths.length > 0) {
          const selectedPath = result.filePaths[0];

          if (type === "source") {
            setSourceFolder(selectedPath);
            addRecentSourceFolder(selectedPath);
          } else if (type === "destination") {
            setDestinationFolder(selectedPath);
            addRecentDestinationFolder(selectedPath);
          }
        }
      } else {
        // Fallback for development in browser
        console.warn("Electron API not available. Using fallback.");
        alert(
          "Folder selection requires Electron environment. Running in browser mode."
        );
      }
    } catch (error) {
      console.error("Error selecting folder:", error);
      alert("Failed to select folder. Please try again.");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-6 border border-slate-200 dark:border-slate-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Source Folder */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Source Folder
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={sourceFolder}
              onChange={(e) => setSourceFolder(e.target.value)}
              placeholder="Select source folder..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            <button
              onClick={() => handleBrowseFolder("source")}
              className={`
                px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white 
                rounded-xl hover:from-blue-700 hover:to-blue-800 
                shadow-lg hover:shadow-xl flex items-center gap-2
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${animationsEnabled ? "transition-all" : ""}
              `}
            >
              <FolderOpen className="w-4 h-4" />
              Browse
            </button>
          </div>
        </div>

        {/* Destination Folder */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Destination Folder
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={destinationFolder}
              onChange={(e) => setDestinationFolder(e.target.value)}
              placeholder="Select destination folder..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            <button
              onClick={() => handleBrowseFolder("destination")}
              className={`
                px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white 
                rounded-xl hover:from-blue-700 hover:to-blue-800 
                shadow-lg hover:shadow-xl flex items-center gap-2
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${animationsEnabled ? "transition-all" : ""}
              `}
            >
              <FolderOpen className="w-4 h-4" />
              Browse
            </button>
          </div>
        </div>
      </div>

      {/* Output Folder Name */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Output Folder Name
        </label>
        <input
          type="text"
          value={outputFolderName}
          onChange={(e) => setOutputFolderName(e.target.value)}
          placeholder="e.g., Filtered_Files"
          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          This folder will be created inside the destination folder
        </p>
      </div>

      {/* Dry Run Toggle */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={toggleDryRun}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-purple-600"></div>
        </label>
        <div className="flex-1">
          <span className="font-semibold text-slate-900 dark:text-white block">
            Dry Run (Preview Only)
          </span>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Preview files without copying them
          </p>
        </div>
      </div>
    </div>
  );
};

export default MainConfigSection;
