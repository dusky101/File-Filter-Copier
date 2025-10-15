/**
 * Advanced Filters Panel Component
 * Contains all advanced filtering options including extensions, size, file types, and folder exclusions
 */

import React, { useState } from "react";
import {
  Filter,
  ChevronDown,
  ChevronRight,
  Database,
  X,
  Check,
  FileText,
  Image,
  Music,
  Video,
  Code,
  Archive,
  File,
  Search,
  Plus,
  AlertTriangle,
} from "lucide-react";
import useFilterStore from "../../stores/useFilterStore";
import useSettingsStore from "../../stores/useSettingsStore";

const AdvancedFiltersPanel = () => {
  const {
    includeExtensions,
    excludeExtensions,
    timeFilter,
    sizeFilter,
    selectedFileTypes,
    excludedFolders,
    deepScan,
    deepScanTerms,
    deepScanMode,
    showAdvancedFilters,
    showFileTypeSelector,
    showFolderExclusions,
    showDeepScan,
    setIncludeExtensions,
    setExcludeExtensions,
    setTimeFilter,
    setSizeFilter,
    toggleFileType,
    toggleExcludedFolder,
    toggleAdvancedFilters,
    toggleFileTypeSelector,
    toggleFolderExclusions,
    toggleDeepScan,
    setDeepScan,
    updateDeepScanTerm,
    addDeepScanTerm,
    removeDeepScanTerm,
    setDeepScanMode,
  } = useFilterStore();

  const { animationsEnabled } = useSettingsStore();

  // File type groups with icons and extensions
  const fileTypeGroups = {
    Documents: [
      {
        name: "Text Documents",
        icon: FileText,
        types: [".txt", ".doc", ".docx", ".pdf", ".rtf", ".odt"],
      },
      {
        name: "Spreadsheets",
        icon: FileText,
        types: [".xls", ".xlsx", ".csv", ".ods"],
      },
      {
        name: "Presentations",
        icon: FileText,
        types: [".ppt", ".pptx", ".odp", ".key"],
      },
    ],
    Media: [
      {
        name: "Images",
        icon: Image,
        types: [
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".svg",
          ".bmp",
          ".webp",
          ".ico",
        ],
      },
      {
        name: "Audio",
        icon: Music,
        types: [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma"],
      },
      {
        name: "Video",
        icon: Video,
        types: [".mp4", ".mov", ".avi", ".mkv", ".wmv", ".flv", ".webm"],
      },
    ],
    Development: [
      {
        name: "Code",
        icon: Code,
        types: [
          ".js",
          ".py",
          ".java",
          ".cpp",
          ".c",
          ".rb",
          ".go",
          ".rs",
          ".swift",
        ],
      },
      {
        name: "Web",
        icon: Code,
        types: [
          ".html",
          ".css",
          ".jsx",
          ".tsx",
          ".vue",
          ".scss",
          ".sass",
          ".less",
        ],
      },
      {
        name: "Config",
        icon: FileText,
        types: [".json", ".yaml", ".yml", ".xml", ".toml", ".ini", ".conf"],
      },
      {
        name: "Scripts",
        icon: File,
        types: [".sh", ".bash", ".zsh", ".ps1", ".bat", ".cmd"],
      },
    ],
    Archives: [
      {
        name: "Compressed",
        icon: Archive,
        types: [".zip", ".rar", ".tar", ".gz", ".7z", ".bz2", ".xz"],
      },
    ],
  };

  const timeOptions = [
    { value: "none", label: "None", description: "No time filtering" },
    {
      value: "<1h",
      label: "Last 1 hour",
      description: "Files modified in the last hour",
    },
    {
      value: "<3h",
      label: "Last 3 hours",
      description: "Files modified in the last 3 hours",
    },
    {
      value: "<6h",
      label: "Last 6 hours",
      description: "Files modified in the last 6 hours",
    },
    {
      value: "<24h",
      label: "Last 1 day",
      description: "Files modified in the last day",
    },
    {
      value: "<3d",
      label: "Last 3 days",
      description: "Files modified in the last 3 days",
    },
    {
      value: "<5d",
      label: "Last 5 days",
      description: "Files modified in the last 5 days",
    },
    {
      value: "<7d",
      label: "Last 1 week",
      description: "Files modified in the last week",
    },
    {
      value: "<14d",
      label: "Last 2 weeks",
      description: "Files modified in the last 2 weeks",
    },
    {
      value: "<30d",
      label: "Last 1 month",
      description: "Files modified in the last month",
    },
    {
      value: ">30d",
      label: "Older than 30 days",
      description: "Files modified more than 30 days ago",
    },
  ];

  const [customTimeInput, setCustomTimeInput] = useState("");
  const [customError, setCustomError] = useState("");

  // Size options
  const sizeOptions = [
    { value: "all", label: "All Sizes", description: "No size restriction" },
    { value: "small", label: "Small", description: "< 1 MB" },
    { value: "medium", label: "Medium", description: "1 MB - 10 MB" },
    { value: "large", label: "Large", description: "10 MB - 100 MB" },
    { value: "huge", label: "Huge", description: "> 100 MB" },
  ];

  // Default excluded folders
  const defaultExcludedFolders = [
    "node_modules",
    "venv",
    ".git",
    "__pycache__",
    ".idea",
    "dist",
    "build",
    ".vscode",
    "target",
    "bin",
    "obj",
  ];

  return (
    <>
      {/* Advanced Filters Toggle Button */}
      <button
        onClick={toggleAdvancedFilters}
        className={`
          w-full mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white 
          rounded-2xl shadow-xl hover:shadow-2xl p-4 
          flex items-center justify-between group
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
          ${animationsEnabled ? "transition-all hover:scale-[1.02]" : ""}
        `}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Filter className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-lg block">
              Advanced Filtering
            </span>
            <span className="text-sm text-white/80">
              Configure detailed filter options
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-6 h-6 ${animationsEnabled ? "transition-transform duration-300" : ""} ${
            showAdvancedFilters ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Advanced Filters Content */}
      {showAdvancedFilters && (
        <div
          className={`
            bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-6 
            border border-slate-200 dark:border-slate-700
            ${animationsEnabled ? "animate-in slide-in-from-top duration-300" : ""}
          `}
        >
          {/* Extensions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Include Extensions
              </label>
              <input
                type="text"
                value={includeExtensions}
                onChange={(e) => setIncludeExtensions(e.target.value)}
                placeholder=".jpg, .png, .pdf"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Only files with these extensions (comma-separated)
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Exclude Extensions
              </label>
              <input
                type="text"
                value={excludeExtensions}
                onChange={(e) => setExcludeExtensions(e.target.value)}
                placeholder=".tmp, .log"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Skip files with these extensions (comma-separated)
              </p>
            </div>
          </div>

          {/* Time Filter */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Modified Time
            </label>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
              {timeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setCustomError("");
                    setCustomTimeInput("");
                    setTimeFilter(opt.value);
                  }}
                  title={opt.description}
                  className={`
                    px-3 py-2 rounded-xl font-medium text-sm transition-all text-left
                    ${
                      timeFilter === opt.value
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
                        : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }
                    `}
                >
                  <div className="truncate">{opt.label}</div>
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="flex gap-2 items-start">
              <input
                type="text"
                placeholder="Custom (e.g. <10d or >2h)"
                value={customTimeInput}
                onChange={(e) => {
                  setCustomTimeInput(e.target.value);
                  setCustomError("");
                }}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              <button
                onClick={() => {
                  const val = String(customTimeInput || "").trim();
                  // Accept form like <10d, >2h  -> regex ^[<>]\d+(h|d)$
                  const valid = /^[<>]\d+(h|d)$/.test(val);
                  if (!valid) {
                    setCustomError(
                      "Invalid format — use < or > then number, then h or d (e.g. <10d)"
                    );
                    return;
                  }
                  setTimeFilter(val);
                  setCustomError("");
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-sm hover:shadow-md transition-all"
              >
                Set
              </button>
              <button
                onClick={() => {
                  setCustomTimeInput("");
                  setCustomError("");
                  setTimeFilter("none");
                }}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                title="Reset to none"
              >
                Clear
              </button>
            </div>
            {customError && (
              <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                {customError}
              </div>
            )}

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Backend format:{" "}
              <code className="font-mono px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
                {"<1h | <24h | <7d | >30d | none"}
              </code>
            </p>
          </div>

          {/* Size Filter */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              File Size Preference
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {sizeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSizeFilter(option.value)}
                  className={`
                    px-4 py-3 rounded-xl font-medium transition-all
                    ${
                      sizeFilter === option.value
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
                        : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }
                  `}
                  title={option.description}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* File Types Button */}
          <button
            onClick={toggleFileTypeSelector}
            className={`
              w-full mb-6 bg-gradient-to-r from-slate-100 to-slate-200 
              dark:from-slate-700 dark:to-slate-600 text-slate-900 dark:text-white 
              rounded-xl p-4 flex items-center justify-between hover:shadow-lg 
              border border-slate-300 dark:border-slate-600
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${animationsEnabled ? "transition-all" : ""}
            `}
          >
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div className="text-left">
                <span className="font-semibold block">Select File Types</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedFileTypes.size} type
                  {selectedFileTypes.size !== 1 ? "s" : ""} selected
                </span>
              </div>
            </div>
            <ChevronRight
              className={`w-5 h-5 ${animationsEnabled ? "transition-transform duration-300" : ""} ${
                showFileTypeSelector ? "rotate-90" : ""
              }`}
            />
          </button>

          {/* File Types Selector */}
          {showFileTypeSelector && (
            <div
              className={`
                mb-6 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 
                border border-slate-200 dark:border-slate-700
                ${animationsEnabled ? "animate-in slide-in-from-top duration-200" : ""}
              `}
            >
              {Object.entries(fileTypeGroups).map(([category, types]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {types.map((type) => {
                      const Icon = type.icon;
                      const isSelected = selectedFileTypes.has(type.name);
                      return (
                        <button
                          key={type.name}
                          onClick={() => toggleFileType(type.name)}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg transition-all
                            ${
                              isSelected
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                            }
                          `}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <div className="text-left flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {type.name}
                            </div>
                            <div
                              className={`text-xs truncate ${
                                isSelected
                                  ? "text-white/80"
                                  : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {type.types.join(", ")}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Deep Scan Button */}
          <button
            onClick={() => {
              // Show warning before enabling deep scan
              if (!deepScan && !showDeepScan) {
                const proceed = window.confirm(
                  "⚠️ Deep Scan Warning\n\n" +
                    "Deep scan searches the full text content of files, which can be time-consuming for:\n" +
                    "• Large files\n" +
                    "• Many files\n" +
                    "• Binary files (images, videos, etc.)\n\n" +
                    "Continue with deep scan?"
                );
                if (!proceed) return;
              }
              toggleDeepScan();
            }}
            className={`
              w-full mb-6 bg-gradient-to-r from-slate-100 to-slate-200 
              dark:from-slate-700 dark:to-slate-600 text-slate-900 dark:text-white 
              rounded-xl p-4 flex items-center justify-between hover:shadow-lg 
              border border-slate-300 dark:border-slate-600
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${animationsEnabled ? "transition-all" : ""}
            `}
          >
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div className="text-left">
                <span className="font-semibold block">Deep Scan</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {deepScan ? "Enabled" : "Search file content"} •{" "}
                  {deepScanTerms.filter((t) => t.trim()).length} term
                  {deepScanTerms.filter((t) => t.trim()).length !== 1
                    ? "s"
                    : ""}
                </span>
              </div>
            </div>
            <ChevronRight
              className={`w-5 h-5 ${animationsEnabled ? "transition-transform duration-300" : ""} ${
                showDeepScan ? "rotate-90" : ""
              }`}
            />
          </button>

          {/* Deep Scan Panel */}
          {showDeepScan && (
            <div
              className={`
                mb-6 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 
                border border-slate-200 dark:border-slate-700
                ${animationsEnabled ? "animate-in slide-in-from-top duration-200" : ""}
              `}
            >
              {/* Enable Deep Scan Toggle */}
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                    Performance Warning
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Deep scan reads file contents and may take considerable time
                    for large files or many files
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deepScan}
                    onChange={(e) => setDeepScan(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-blue-600"></div>
                </label>
              </div>

              {/* Search Terms */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Search Terms
                </label>
                {deepScanTerms.map((term, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={term}
                      onChange={(e) =>
                        updateDeepScanTerm(index, e.target.value)
                      }
                      placeholder="Enter search term..."
                      disabled={!deepScan}
                      className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {deepScanTerms.length > 1 && (
                      <button
                        onClick={() => removeDeepScanTerm(index)}
                        disabled={!deepScan}
                        className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Remove term"
                      >
                        <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addDeepScanTerm}
                  disabled={!deepScan}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Add Search Term
                </button>
              </div>

              {/* Match Mode */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Match Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDeepScanMode("any")}
                    disabled={!deepScan}
                    className={`
                      px-4 py-3 rounded-lg font-medium transition-all
                      ${
                        deepScanMode === "any"
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <div className="text-center">
                      <div className="font-semibold">ANY (OR)</div>
                      <div
                        className={`text-xs mt-1 ${deepScanMode === "any" ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}
                      >
                        Match any term
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setDeepScanMode("all")}
                    disabled={!deepScan}
                    className={`
                      px-4 py-3 rounded-lg font-medium transition-all
                      ${
                        deepScanMode === "all"
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <div className="text-center">
                      <div className="font-semibold">ALL (AND)</div>
                      <div
                        className={`text-xs mt-1 ${deepScanMode === "all" ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}
                      >
                        Match all terms
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Folder Exclusions Button */}
          <button
            onClick={toggleFolderExclusions}
            className={`
              w-full bg-gradient-to-r from-slate-100 to-slate-200 
              dark:from-slate-700 dark:to-slate-600 text-slate-900 dark:text-white 
              rounded-xl p-4 flex items-center justify-between hover:shadow-lg 
              border border-slate-300 dark:border-slate-600
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${animationsEnabled ? "transition-all" : ""}
            `}
          >
            <div className="flex items-center gap-3">
              <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div className="text-left">
                <span className="font-semibold block">Folder Exclusions</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {excludedFolders.size} folder
                  {excludedFolders.size !== 1 ? "s" : ""} excluded
                </span>
              </div>
            </div>
            <ChevronRight
              className={`w-5 h-5 ${animationsEnabled ? "transition-transform duration-300" : ""} ${
                showFolderExclusions ? "rotate-90" : ""
              }`}
            />
          </button>

          {/* Folder Exclusions Panel */}
          {showFolderExclusions && (
            <div
              className={`
                mt-4 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 
                border border-slate-200 dark:border-slate-700
                ${animationsEnabled ? "animate-in slide-in-from-top duration-200" : ""}
              `}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {defaultExcludedFolders.map((folder) => {
                  const isSelected = excludedFolders.has(folder);
                  return (
                    <button
                      key={folder}
                      onClick={() => toggleExcludedFolder(folder)}
                      className={`
                        flex items-center justify-between p-3 rounded-lg transition-all
                        ${
                          isSelected
                            ? "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-200 border-2 border-red-300 dark:border-red-700"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-2 border-transparent"
                        }
                      `}
                    >
                      <span className="font-mono text-sm truncate">
                        {folder}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 flex-shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-900 dark:text-blue-200">
                  <strong>Tip:</strong> Files inside excluded folders will be
                  skipped during scanning
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AdvancedFiltersPanel;
