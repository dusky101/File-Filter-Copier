/**
 * Main Application Component
 *
 * Orchestrates the entire File Filter Copier application with modular components
 * Manages global state through Zustand stores and coordinates API operations
 */

import React, { useState, useEffect } from "react";
import {
  Play,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FolderCheck,
  FolderTree, // Imported for the new section icon
} from "lucide-react";
import Header from "./components/layout/Header";
import SettingsPanel from "./components/layout/SettingsPanel";
import MainConfigSection from "./components/main-config/MainConfigSection";
import PreviewSection from "./components/preview/PreviewSection";
import FilterHub from "./components/filters/FilterHub";
import InstructionsHub from "./components/help/InstructionsHub";
import PresetManagerPanel from "./components/presets/PresetManagerPanel";
import useFilterStore from "./stores/useFilterStore";
import usePreviewStore from "./stores/usePreviewStore";
import useSettingsStore from "./stores/useSettingsStore";
import SearchOverlay from "./components/progress/SearchOverlay";
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

// Dialog Import
import { Dialog, DialogHeader, DialogFooter } from "./ui/dialog";

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFilterHub, setShowFilterHub] = useState(false);
  const [filterHubSection, setFilterHubSection] = useState("quick");
  const [showInstructions, setShowInstructions] = useState(false);
  const [showPresetManager, setShowPresetManager] = useState(false);

  // --- Dialog States ---
  const [scanResult, setScanResult] = useState(null); // { count, duplicates }
  const [copyResult, setCopyResult] = useState(null); // { count, output_path }
  const [errorState, setErrorState] = useState(null); // { title, message }
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [presetSuccess, setPresetSuccess] = useState(null); // { name, output }

  // progress modal state
  const [progressState, setProgressState] = useState({ open: false, id: null });

  // --- Listen for "User Guide" menu click from Electron ---
  useEffect(() => {
    if (window.electron && window.electron.onOpenHelp) {
      const removeListener = window.electron.onOpenHelp(() => {
        setShowInstructions(true);
      });
      return () => removeListener();
    }
  }, []);

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
    // Destructure copy settings here
    copyStructure,
    setCopyStructure,
  } = useFilterStore();

  const {
    setFiles,
    setDuplicates,
    setLoading,
    setError,
    clearPreview,
    isLoading,
  } = usePreviewStore();

  const {
    animationsEnabled,
    defaultPresetName,
    getNextOutputNameForPreset,
    getRequestTimeout,
  } = useSettingsStore();
  const { loadPresetConfig } = useFilterStore();

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

  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Load default preset on start
  useEffect(() => {
    const loadDefault = async () => {
      if (!defaultPresetName) return;
      try {
        const res = await loadPreset(defaultPresetName);
        if (res.success) {
          const cfg = res.data?.config || res.data;
          const baseOut = cfg.output_folder_name || cfg.outputFolderName;
          if (baseOut && getNextOutputNameForPreset) {
            const nextOut = getNextOutputNameForPreset(
              defaultPresetName,
              baseOut
            );
            cfg.output_folder_name = nextOut;
          }
          loadPresetConfig(cfg);
          console.log(`✅ Default preset "${defaultPresetName}" applied.`);
        }
      } catch (e) {
        console.warn("Default preset failed to load:", e);
      }
    };
    loadDefault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkBackendHealth = async () => {
    try {
      const result = await healthCheck();
      if (!result.success) console.warn("Backend health check failed");
    } catch (error) {
      console.error("Backend is not responding:", error);
    }
  };

  const validateInputs = () => {
    if (!sourceFolder || !sourceFolder.trim()) {
      setErrorState({
        title: "Missing Information",
        message: "Please select a source folder to scan.",
      });
      return false;
    }

    if (!dryRun) {
      if (!destinationFolder || !destinationFolder.trim()) {
        setErrorState({
          title: "Missing Information",
          message: "Please select a destination folder for your files.",
        });
        return false;
      }

      if (!outputFolderName || !outputFolderName.trim()) {
        setErrorState({
          title: "Missing Information",
          message: "Please enter a name for the output folder.",
        });
        return false;
      }
    }
    return true;
  };

  const runScanWithOptionalProgress = async (config) => {
    const hasTerms =
      Array.isArray(config.deep_scan_terms) &&
      config.deep_scan_terms.some((t) => String(t || "").trim().length > 0);
    const wantsProgress = !!config.deep_scan && hasTerms;

    let progressId = null;
    if (wantsProgress) {
      setProgressState({ open: true, id: null });
      const res = await startProgress();
      if (res.success && res.data?.progress_id) {
        progressId = res.data.progress_id;
        setProgressState({ open: true, id: progressId });
      }
    }

    try {
      const timeout =
        typeof getRequestTimeout === "function" ? getRequestTimeout() : 300000;
      const result = await scanFiles(config, { progressId, timeout });
      return result;
    } finally {
      setTimeout(() => setProgressState((s) => ({ ...s, open: false })), 500);
    }
  };

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

        setScanResult({
          count: Number(result.total_files || (result.files || []).length),
          duplicates: Object.keys(result.duplicates || {}).length,
        });
      } else {
        const errMsg = result?.error || "Failed to scan files";
        setError(errMsg);
        setErrorState({ title: "Scan Failed", message: errMsg });
      }
    } catch (error) {
      console.error("Preview failed:", error);
      const errorMessage =
        "Failed to preview files. Make sure the backend is running.";
      setError(errorMessage);
      setErrorState({ title: "Connection Error", message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!validateInputs()) return;

    setIsProcessing(true);
    try {
      const config = getFilterConfig();
      // Step 1: Scan
      const scanResult = await runScanWithOptionalProgress(config);
      const filesList =
        scanResult && scanResult.success ? scanResult.files || [] : [];

      if (!scanResult || !scanResult.success || filesList.length === 0) {
        setErrorState({
          title: "No Files Found",
          message:
            "No files matched your filters. Try adjusting them and running a preview first.",
        });
        setIsProcessing(false);
        return;
      }

      // Step 2: Copy
      const filePaths = filesList.map((f) => f.path);
      const copyRequest = {
        files: filePaths,
        destination: destinationFolder,
        outputFolder: outputFolderName,
        structure: config.structure || "flat",
        source_folder: sourceFolder,
      };

      const copyRes = await copyFiles(copyRequest);

      if (copyRes.success) {
        setCopyResult({
          count: copyRes.data.copied_count,
          output_path: copyRes.data.output_path,
        });
      } else {
        setErrorState({
          title: "Copy Failed",
          message: copyRes.error || "An unknown error occurred during copy.",
        });
      }
    } catch (error) {
      console.error("Copy failed:", error);
      setErrorState({
        title: "Operation Failed",
        message:
          "Failed to copy files. Please check your destination permissions.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRun = () => {
    if (dryRun) handlePreview();
    else handleCopy();
  };

  const handleSavePreset = () => setShowPresetDialog(true);

  const handleConfirmSavePreset = async (presetName) => {
    try {
      const config = getFilterConfig();
      const result = await savePreset(presetName, config);

      if (result.success) {
        console.log(`✅ Preset "${presetName}" saved successfully!`);
      } else {
        setErrorState({
          title: "Save Failed",
          message: result.error || "Could not save preset.",
        });
      }
    } catch (error) {
      setErrorState({
        title: "Error",
        message: "An unexpected error occurred while saving.",
      });
    } finally {
      setShowPresetDialog(false);
    }
  };

  const isRunDisabled = () => {
    if (isProcessing) return true;
    if (!sourceFolder) return true;
    if (!dryRun && (!destinationFolder || !outputFolderName)) return true;
    return false;
  };

  // Fixed: Correctly update state when event is fired
  useEffect(() => {
    const open = () => setShowSettings(true);
    window.addEventListener("open-settings", open);
    return () => window.removeEventListener("open-settings", open);
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
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

        {/* Main Configuration Section (Source/Dest/Output) */}
        <MainConfigSection
          onOpenPresetManager={() => setShowPresetManager(true)}
        />

        {/* --- GLOBAL COPY ORGANISATION --- */}
        {/* Placed here so it controls both main Copy and "Copy Selected" */}
        <div className="mb-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-blue-500" />
              Folder Structure
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Define how subfolders are created in the output location.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={copyStructure}
              onChange={(e) => setCopyStructure(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="flat">Flat: No subfolders (All in one)</option>
              <option value="date">
                Date: Folders by Year/Month (e.g. 2024/12)
              </option>
              <option value="type">
                Type: Folders by Category (e.g. Images/Code)
              </option>
              <option value="preserve">
                Tree: Recreate original folder structure
              </option>
            </select>
          </div>
        </div>

        {/* Filters entrypoint */}
        <div className="mb-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">
                Filters
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Configure file types, extensions, time, size, and advanced rules
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFilterHubSection("quick");
                  setShowFilterHub(true);
                }}
                className={`px-4 py-2 rounded-lg bg-linear-to-r from-blue-600 to-purple-600 text-white shadow hover:shadow-md ${animationsEnabled ? "transition-all hover:scale-105" : ""}`}
              >
                Open Filters
                {activeFiltersCount ? ` (${activeFiltersCount})` : ""}
              </button>
            </div>
          </div>
        </div>

        {/* Dry Run Toggle */}
        <div className="mb-6">
          <div className="flex items-center gap-3 p-4 bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={toggleDryRun}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-linear-to-r peer-checked:from-blue-600 peer-checked:to-purple-600"></div>
            </label>
            <div className="flex-1">
              <span className="font-semibold text-slate-900 dark:text-white block">
                Dry Run (Preview Files Only)
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
              bg-linear-to-r from-green-600 to-emerald-600 text-white 
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
              px-6 py-4 bg-linear-to-r from-blue-600 to-purple-600 text-white 
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

        {/* Preview Section */}
        <PreviewSection onOpenSettings={() => setShowSettings(true)} />

        {/* Preset Name Dialog */}
        <PresetNameDialog
          open={showPresetDialog}
          onClose={() => setShowPresetDialog(false)}
          onSave={handleConfirmSavePreset}
        />

        {/* Normal Search Progress Overlay */}
        <SearchOverlay open={isLoading && !progressState.open} />
      </div>

      {/* --- Global Modals --- */}

      <FilterHub
        open={showFilterHub}
        onClose={() => setShowFilterHub(false)}
        initialSection={filterHubSection}
      />
      <InstructionsHub
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        onOpenAdvanced={() => {
          setShowInstructions(false);
          setFilterHubSection("adv");
          setShowFilterHub(true);
        }}
      />

      <PresetManagerPanel
        isOpen={showPresetManager}
        onClose={() => setShowPresetManager(false)}
        onPresetLoaded={(name, output) => setPresetSuccess({ name, output })}
      />

      {/* 1. Scan Success Dialog */}
      <Dialog open={!!scanResult} onClose={() => setScanResult(null)}>
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <DialogHeader>
            <span className="text-xl">Scan Complete!</span>
          </DialogHeader>
          <div className="mt-2 text-slate-600 dark:text-slate-300">
            <p className="mb-4">
              Found{" "}
              <strong className="text-slate-900 dark:text-white text-lg">
                {scanResult?.count}
              </strong>{" "}
              files matching your criteria.
            </p>
            {scanResult?.duplicates > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm flex items-start gap-3 text-left">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-amber-800 dark:text-amber-200">
                  Warning: <strong>{scanResult.duplicates}</strong> duplicate
                  filenames were detected. Check the "Duplicates" tab.
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <button
              onClick={() => setScanResult(null)}
              className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
            >
              View Results
            </button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* 2. Copy Success Dialog */}
      <Dialog open={!!copyResult} onClose={() => setCopyResult(null)}>
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <FolderCheck className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <DialogHeader>
            <span className="text-xl">Copy Successful!</span>
          </DialogHeader>
          <div className="mt-2 text-slate-600 dark:text-slate-300">
            <p className="mb-2">
              Successfully copied{" "}
              <strong className="text-slate-900 dark:text-white">
                {copyResult?.count}
              </strong>{" "}
              files.
            </p>
            <div className="mt-4 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-xs font-mono text-left break-all border border-slate-200 dark:border-slate-700">
              {copyResult?.output_path}
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setCopyResult(null)}
              className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-all"
            >
              Close
            </button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* 3. Error/Warning Dialog */}
      <Dialog open={!!errorState} onClose={() => setErrorState(null)}>
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <DialogHeader>
            <span className="text-lg text-red-600 dark:text-red-400">
              {errorState?.title || "Error"}
            </span>
          </DialogHeader>
          <div className="mt-2 text-slate-600 dark:text-slate-300 text-sm">
            <p>{errorState?.message}</p>
          </div>
          <DialogFooter>
            <button
              onClick={() => setErrorState(null)}
              className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white px-5 py-2.5 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
            >
              Close
            </button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* 4. Preset Loaded Dialog */}
      <Dialog open={!!presetSuccess} onClose={() => setPresetSuccess(null)}>
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <DialogHeader>
            <span className="text-xl">Preset Loaded!</span>
          </DialogHeader>
          <div className="mt-2 text-slate-600 dark:text-slate-300">
            <p className="mb-2">
              Preset{" "}
              <strong className="text-slate-900 dark:text-white">
                {presetSuccess?.name}
              </strong>{" "}
              is now active.
            </p>
            <div className="mt-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-left">
              <div className="text-xs text-slate-500 uppercase font-semibold mb-1">
                Output Folder
              </div>
              <div className="font-mono text-slate-800 dark:text-slate-200 break-all">
                {presetSuccess?.output}
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setPresetSuccess(null)}
              className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-all"
            >
              Start Scanning
            </button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}

export default App;
