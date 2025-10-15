/**
 * Main Application Component
 *
 * Orchestrates the entire File Filter Copier application with modular components
 * Manages global state through Zustand stores and coordinates API operations
 */

import React, { useState, useEffect } from "react";
import { Play, Save, Loader2 } from "lucide-react";
import Header from "./components/layout/Header";
import SettingsPanel from "./components/layout/SettingsPanel";
import MainConfigSection from "./components/main-config/MainConfigSection";
import PreviewSection from "./components/preview/PreviewSection";
import AdvancedFiltersPanel from "./components/filters/AdvancedFiltersPanel";
import useFilterStore from "./stores/useFilterStore";
import usePreviewStore from "./stores/usePreviewStore";
import useSettingsStore from "./stores/useSettingsStore";
import {
  scanFiles,
  copyFiles,
  savePreset,
  healthCheck,
  startProgress,
} from "./services/api";
import DeepScanProgressModal from "./components/progress/DeepScanProgressModal";

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // progress modal state
  const [progressState, setProgressState] = useState({ open: false, id: null });

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

  // Helper: run scan with optional progress modal
  const runScanWithOptionalProgress = async (config) => {
    const hasTerms =
      Array.isArray(config.deep_scan_terms) &&
      config.deep_scan_terms.some((t) => String(t || "").trim().length > 0);
    const wantsProgress = !!config.deep_scan && hasTerms;

    let progressId = null;
    if (wantsProgress) {
      const res = await startProgress();
      if (res.success && res.data?.progress_id) {
        progressId = res.data.progress_id;
        setProgressState({ open: true, id: progressId });
      }
    }

    try {
      // pass progressId so backend publishes SSE updates
      const result = await scanFiles(config, { progressId, timeout: 300000 });
      return result;
    } finally {
      // The modal auto-closes when SSE marks done; also ensure manual close fallback
      setTimeout(() => setProgressState((s) => ({ ...s, open: false })), 500);
    }
  };

  /**
   * Handle preview/scan operation
   */
  const handlePreview = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setError(null);
    clearPreview();

    try {
      const config = getFilterConfig();
      console.log("🔍 Scanning with config:", config);

      const result = await runScanWithOptionalProgress(config);

      if (result.success) {
        setFiles(result.data.files);
        setDuplicates(result.data.duplicates);

        const fileCount = result.data.total_files;
        const duplicateCount = Object.keys(result.data.duplicates || {}).length;

        let message = `✅ Found ${fileCount} file${fileCount !== 1 ? "s" : ""}!`;
        if (duplicateCount > 0) {
          message += `\n\n⚠️ ${duplicateCount} duplicate filename${duplicateCount !== 1 ? "s" : ""} detected.`;
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
    if (!validateInputs()) return;

    setIsProcessing(true);
    try {
      const config = getFilterConfig();
      console.log("📋 Copying with config:", config);

      const scanResult = await runScanWithOptionalProgress(config);
      if (!scanResult.success || scanResult.data.files.length === 0) {
        alert("❌ No files to copy. Run a preview first.");
        setIsProcessing(false);
        return;
      }

      const filePaths = scanResult.data.files.map((f) => f.path);
      const copyRequest = {
        files: filePaths,
        destination: destinationFolder,
        // FIX: use outputFolder (what api.js expects)
        outputFolder: outputFolderName,
      };

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

        {/* Progress Modal */}
        <DeepScanProgressModal
          open={progressState.open}
          progressId={progressState.id}
          onClose={() => setProgressState({ open: false, id: null })}
        />

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
