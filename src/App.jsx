/**
 * Main Application Component
 *
 * Orchestrates the entire File Filter Copier application with modular components
 * Manages global state through Zustand stores and coordinates API operations
 */

import React, { useState, useEffect } from "react";
import { Play, Save, Loader2 } from "lucide-react";

// Import layout components
import Header from "./components/layout/Header";
import SettingsPanel from "./components/layout/SettingsPanel";

// Import main section components
import MainConfigSection from "./components/main-config/MainConfigSection";
import PreviewSection from "./components/preview/PreviewSection";
import AdvancedFiltersPanel from "./components/filters/AdvancedFiltersPanel";

// Import stores
import useFilterStore from "./stores/useFilterStore";
import usePreviewStore from "./stores/usePreviewStore";
import useSettingsStore from "./stores/useSettingsStore";

// Import API service
import { scanFiles, copyFiles, savePreset, healthCheck } from "./services/api";

function App() {
  // Local UI state
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get state and actions from stores
  const {
    sourceFolder,
    destinationFolder,
    outputFolderName,
    dryRun,
    getFilterConfig,
  } = useFilterStore();

  const { setFiles, setDuplicates, setLoading, setError, clearPreview } =
    usePreviewStore();

  const { animationsEnabled } = useSettingsStore();

  /**
   * Check backend health on mount
   */
  useEffect(() => {
    checkBackendHealth();
  }, []);

  /**
   * Check if FastAPI backend is running
   */
  const checkBackendHealth = async () => {
    try {
      const result = await healthCheck();
      if (!result.success) {
        console.warn("Backend health check failed");
      }
    } catch (error) {
      console.error("Backend is not responding:", error);
    }
  };

  /**
   * Validate required fields
   */
  const validateInputs = () => {
    if (!sourceFolder || !sourceFolder.trim()) {
      alert("⚠️ Please select a source folder");
      return false;
    }

    if (!dryRun) {
      if (!destinationFolder || !destinationFolder.trim()) {
        alert("⚠️ Please select a destination folder");
        return false;
      }

      if (!outputFolderName || !outputFolderName.trim()) {
        alert("⚠️ Please enter an output folder name");
        return false;
      }
    }

    return true;
  };

  /**
   * Handle preview/scan operation
   */
  const handlePreview = async () => {
    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    setError(null);
    clearPreview();

    try {
      // Get filter configuration from store
      const config = getFilterConfig();

      console.log("🔍 Scanning with config:", config);

      // Call scan API
      const result = await scanFiles(config);

      if (result.success) {
        setFiles(result.data.files);
        setDuplicates(result.data.duplicates);

        // Show success message
        const fileCount = result.data.total_files;
        const duplicateCount = Object.keys(result.data.duplicates || {}).length;

        let message = `✅ Found ${fileCount} file${fileCount !== 1 ? "s" : ""}!`;

        if (duplicateCount > 0) {
          message += `\n\n⚠️ Warning: ${duplicateCount} duplicate filename${
            duplicateCount !== 1 ? "s" : ""
          } detected.`;
        }

        alert(message);
      } else {
        setError(result.error || "Failed to scan files");
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Preview failed:", error);
      const errorMessage =
        "Failed to preview files. Make sure the backend is running.";
      setError(errorMessage);
      alert(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle copy operation
   */
  const handleCopy = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Get filter configuration
      const config = getFilterConfig();

      console.log("📋 Copying with config:", config);

      // First scan to get files
      const scanResult = await scanFiles(config);

      if (!scanResult.success || scanResult.data.files.length === 0) {
        alert("❌ No files to copy. Run a preview first.");
        setIsProcessing(false);
        return;
      }

      // Prepare copy request
      const filePaths = scanResult.data.files.map((f) => f.path);
      const copyRequest = {
        files: filePaths,
        destination: destinationFolder,
        output_folder: outputFolderName,
      };

      // Call copy API
      const copyResult = await copyFiles(copyRequest);

      if (copyResult.success) {
        alert(
          `✅ Successfully copied ${copyResult.data.copied_count} file${
            copyResult.data.copied_count !== 1 ? "s" : ""
          }!\n\nOutput: ${copyResult.data.output_path}`
        );
      } else {
        alert(`❌ Copy failed: ${copyResult.error}`);
      }
    } catch (error) {
      console.error("Copy failed:", error);
      alert("❌ Failed to copy files. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle main action button
   */
  const handleRun = () => {
    if (dryRun) {
      handlePreview();
    } else {
      handleCopy();
    }
  };

  /**
   * Handle save preset
   */
  const handleSavePreset = async () => {
    const presetName = prompt("Enter a name for this preset:");

    if (!presetName || !presetName.trim()) {
      return;
    }

    try {
      const config = getFilterConfig();
      const result = await savePreset(presetName, config);

      if (result.success) {
        alert(`✅ Preset "${presetName}" saved successfully!`);
      } else {
        alert(`❌ Failed to save preset: ${result.error}`);
      }
    } catch (error) {
      console.error("Save preset failed:", error);
      alert("❌ Failed to save preset. Please try again.");
    }
  };

  /**
   * Check if run button should be disabled
   */
  const isRunDisabled = () => {
    if (isProcessing) return true;
    if (!sourceFolder) return true;
    if (!dryRun && (!destinationFolder || !outputFolderName)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Header onSettingsClick={() => setShowSettings(true)} />

        {/* Settings Panel */}
        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />

        {/* Main Configuration Section */}
        <MainConfigSection />

        {/* Preview Section (only shown when dry run is enabled) */}
        <PreviewSection />

        {/* Advanced Filters Panel */}
        <AdvancedFiltersPanel />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={handleRun}
            disabled={isRunDisabled()}
            className={`
              flex-1 flex items-center justify-center gap-3 px-6 py-4
              bg-gradient-to-r from-green-600 to-emerald-600 text-white 
              rounded-2xl shadow-xl hover:shadow-2xl font-semibold text-lg
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-xl
              ${animationsEnabled ? "transition-all hover:scale-[1.02]" : ""}
            `}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="w-6 h-6" />
                {dryRun ? "Run Preview" : "Copy Files"}
              </>
            )}
          </button>

          <button
            onClick={handleSavePreset}
            disabled={isProcessing}
            className={`
              px-6 py-4 flex items-center justify-center gap-2
              bg-gradient-to-r from-blue-600 to-purple-600 text-white 
              rounded-2xl shadow-xl hover:shadow-2xl font-semibold
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${animationsEnabled ? "transition-all hover:scale-[1.02]" : ""}
            `}
          >
            <Save className="w-5 h-5" />
            Save Preset
          </button>
        </div>

        {/* Backend Status Indicator */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>
              <strong>Backend:</strong> Ensure FastAPI is running on{" "}
              <code className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-mono text-xs">
                http://localhost:8000
              </code>
            </span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 pl-4">
            Run:{" "}
            <code className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-mono">
              cd backend && source venv/bin/activate && python main.py
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
