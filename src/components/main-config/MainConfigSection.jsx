/**
 * Main Configuration Section Component
 * Handles source folder, destination folder, and output folder name
 * (Dry Run toggle moved to App.jsx)
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
    setSourceFolder,
    setDestinationFolder,
    setOutputFolderName,
  } = useFilterStore();

  const {
    animationsEnabled,
    addRecentSourceFolder,
    addRecentDestinationFolder,
    theme,
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
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
        <FolderOpen className="w-6 h-6 text-blue-600" />
        Configuration
      </h2>

      {/* Source Folder */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Source Folder
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={sourceFolder}
            onChange={(e) => setSourceFolder(e.target.value)}
            placeholder="Select a folder to scan..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
          <button
            onClick={() => handleBrowseFolder("source")}
            className={`
              px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white 
              rounded-xl shadow-md hover:shadow-lg font-medium
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              flex items-center gap-2
              ${animationsEnabled ? "transition-all hover:scale-105" : ""}
            `}
          >
            <FolderOpen className="w-4 h-4" />
            Browse
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Folder containing files to filter and copy
        </p>
      </div>

      {/* Destination Folder */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Destination Folder
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={destinationFolder}
            onChange={(e) => setDestinationFolder(e.target.value)}
            placeholder="Where to save filtered files..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
          <button
            onClick={() => handleBrowseFolder("destination")}
            className={`
              px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white 
              rounded-xl shadow-md hover:shadow-lg font-medium
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              flex items-center gap-2
              ${animationsEnabled ? "transition-all hover:scale-105" : ""}
            `}
          >
            <FolderOpen className="w-4 h-4" />
            Browse
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Parent folder where output will be created
        </p>
      </div>

      {/* Output Folder Name */}
      <div>
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
    </div>
  );
};

export default MainConfigSection;
