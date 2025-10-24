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
// import AdvancedFiltersPanel from "./components/filters/AdvancedFiltersPanel";
import FilterHub from "./components/filters/FilterHub";
import InstructionsHub from "./components/help/InstructionsHub";
import PresetManagerPanel from "./components/presets/PresetManagerPanel";
import useFilterStore from "./stores/useFilterStore";
import usePreviewStore from "./stores/usePreviewStore";
import useSettingsStore from "./stores/useSettingsStore";
import {
  scanFiles,
  copyFiles,
  savePreset,
  healthCheck,
  startProgress,
  loadPreset,
} from "./services/api";
import PresetNameDialog from "./utils/PresetNameDialog";
import InlineDeepScanProgress from "./components/progress/InlineDeepScanProgress";

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFilterHub, setShowFilterHub] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showPresetManager, setShowPresetManager] = useState(false);

  // progress modal state
  const [progressState, setProgressState] = useState({ open: false, id: null });

  const {
    sourceFolder,
    destinationFolder,
    outputFolderName,
    dryRun,
    toggleDryRun,
    getFilterConfig,
    includeExtensions,
    excludeExtensions,
    sizeFilter,
    timeFilter,
    selectedFileTypes,
    selectedProjectTypes,
    excludedFolders,
    customExcludedFolders,
    deepScan,
    deepScanTerms,
  } = useFilterStore();

  const { setFiles, setDuplicates, setLoading, setError, clearPreview } =
    usePreviewStore();

  const [showPresetDialog, setShowPresetDialog] = useState(false);

  const { animationsEnabled } = useSettingsStore();
  const { defaultPresetName } = useSettingsStore();
  const { getNextOutputNameForPreset } = useSettingsStore();
  const { loadPresetConfig } = useFilterStore();
  const { getRequestTimeout } = useSettingsStore();

  // Derive active filters count for quick glance
  const activeFiltersCount = (() => {
    let c = 0;
    if (includeExtensions && includeExtensions.trim()) c++;
    if (excludeExtensions && excludeExtensions.trim()) c++;
    if (sizeFilter && sizeFilter !== "all") c++;
    if (timeFilter && timeFilter !== "none") c++;
    if (selectedFileTypes && selectedFileTypes.size > 0) c++;
    if (selectedProjectTypes && selectedProjectTypes.size > 0) c++;
    if (
      (excludedFolders && excludedFolders.size > 0) ||
      (customExcludedFolders && customExcludedFolders.size > 0)
    )
      c++;
    if (
      deepScan ||
      (Array.isArray(deepScanTerms) &&
        deepScanTerms.some((t) => (t || "").trim()))
    )
      c++;
    return c;
  })();

  /**
   * Check backend health on mount
   */
  useEffect(() => {
    checkBackendHealth();
  }, []);
  // Load default preset on start if configured
  useEffect(() => {
    const loadDefault = async () => {
      if (!defaultPresetName) return;
      try {
        const res = await loadPreset(defaultPresetName);
        if (res.success) {
          const cfg = res.data?.config || res.data;
          // Compute next output folder name for this preset as we do in the Preset Manager
          const baseOut = cfg.output_folder_name || cfg.outputFolderName;
          if (baseOut && getNextOutputNameForPreset) {
            const nextOut = getNextOutputNameForPreset(
              defaultPresetName,
              baseOut
            );
            cfg.output_folder_name = nextOut;
          }
          loadPresetConfig(cfg);
          console.log(
            `✅ Default preset \"${defaultPresetName}\" applied.` +
              (cfg.output_folder_name
                ? ` Output set to: ${cfg.output_folder_name}`
                : "")
          );
        } else {
          console.warn("Default preset failed to load:", res.error);
        }
      } catch (e) {
        console.warn("Default preset failed to load:", e);
      }
    };
    loadDefault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Helper: run scan with inline progress bar
  const runScanWithOptionalProgress = async (config) => {
    const hasTerms =
      Array.isArray(config.deep_scan_terms) &&
      config.deep_scan_terms.some((t) => String(t || "").trim().length > 0);
    // Show progress only when deep scan is enabled and terms exist (backend streams only in that case)
    const wantsProgress = !!config.deep_scan && hasTerms;

    let progressId = null;
    if (wantsProgress) {
      // Open UI immediately; we will attach SSE if channel is created
      setProgressState({ open: true, id: null });
      const res = await startProgress();
      if (res.success && res.data?.progress_id) {
        progressId = res.data.progress_id;
        setProgressState({ open: true, id: progressId });
      } else {
        console.warn(
          "Progress channel could not be created; falling back to indeterminate UI"
        );
      }
    }

    try {
      // pass progressId so backend publishes SSE updates
      const timeout =
        typeof getRequestTimeout === "function" ? getRequestTimeout() : 300000;
      const result = await scanFiles(config, { progressId, timeout });
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

      if (result && result.success) {
        setFiles(result.files || []);
        setDuplicates(result.duplicates || {});

        const fileCount = Number(
          result.total_files || (result.files || []).length
        );
        const duplicateCount = Object.keys(result.duplicates || {}).length;

        let message = `✅ Found ${fileCount} file${fileCount !== 1 ? "s" : ""}!`;
        if (duplicateCount > 0) {
          message += `\n\n⚠️ ${duplicateCount} duplicate filename${duplicateCount !== 1 ? "s" : ""} detected.`;
        }
        alert(message);
      } else {
        const errMsg = result?.error || "Failed to scan files";
        setError(errMsg);
        alert(`❌ Error: ${errMsg}`);
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
      const filesList =
        scanResult && scanResult.success ? scanResult.files || [] : [];
      if (!scanResult || !scanResult.success || filesList.length === 0) {
        alert("❌ No files to copy. Run a preview first.");
        setIsProcessing(false);
        return;
      }

      const filePaths = filesList.map((f) => f.path);
      const copyRequest = {
        files: filePaths,
        destination: destinationFolder,
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
  const handleSavePreset = () => {
    setShowPresetDialog(true);
  };

  const handleConfirmSavePreset = async (presetName) => {
    try {
      const config = getFilterConfig();
      const result = await savePreset(presetName, config);

      if (result.success) {
        console.log(`✅ Preset "${presetName}" saved successfully!`);
      } else {
        console.error(`❌ Failed to save preset: ${result.error}`);
      }
    } catch (error) {
      console.error("Save preset failed:", error);
    } finally {
      setShowPresetDialog(false);
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
        <Header
          onSettingsClick={() => setShowSettings(true)}
          onHelpClick={() => setShowInstructions(true)}
        />

        {/* Settings Panel */}
        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />

        {/* Main Configuration Section (Source, Destination, Output - NO dry run) */}
        <MainConfigSection
          onOpenPresetManager={() => setShowPresetManager(true)}
        />

        {/* Filters entrypoint */}
        <div className="mb-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">
                Filters
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Open the Filter Hub to configure file types, extensions, time,
                size, and more
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilterHub(true)}
                className={`px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow hover:shadow-md ${animationsEnabled ? "transition-all hover:scale-105" : ""}`}
              >
                Open Filters
                {activeFiltersCount ? ` (${activeFiltersCount})` : ""}
              </button>
            </div>
          </div>
        </div>

        {/* Dry Run Toggle - Moved here, just above action buttons */}
        <div className="mb-6">
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
              ${animationsEnabled ? "transition-all hover:scale-[1.02] active:scale-[0.98]" : ""}
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
              px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white 
              rounded-2xl shadow-xl hover:shadow-2xl font-semibold text-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-xl
              flex items-center justify-center gap-3
              ${animationsEnabled ? "transition-all hover:scale-[1.02] active:scale-[0.98]" : ""}
            `}
          >
            <Save className="w-6 h-6" />
            Save Preset
          </button>
        </div>

        {/* Inline progress bar for deep search */}
        <div className="mb-4 flex justify-center">
          <InlineDeepScanProgress
            open={!!progressState.open}
            progressId={progressState.id}
          />
        </div>

        {/* Preview Section - stays below action buttons */}
        <PreviewSection />

        {/* Preset Name Dialog */}
        <PresetNameDialog
          open={showPresetDialog}
          onClose={() => setShowPresetDialog(false)}
          onSave={handleConfirmSavePreset}
        />
      </div>
      <FilterHub open={showFilterHub} onClose={() => setShowFilterHub(false)} />
      <InstructionsHub
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
      <PresetManagerPanel
        isOpen={showPresetManager}
        onClose={() => setShowPresetManager(false)}
      />
    </div>
  );
}

export default App;
