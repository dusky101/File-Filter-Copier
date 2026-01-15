/**
 * Settings Panel Component
 * Modal panel for configuring application settings including theme, language, display options, and custom colours.
 */

import React, { useEffect, useState } from "react";
import {
  X,
  Sun,
  Moon,
  Monitor,
  Globe,
  Eye,
  Download,
  Zap,
  Layout,
  Camera,
  ChevronDown,
  Palette,
  RotateCcw, // Added for the Reset Colours button
} from "lucide-react";
import useSettingsStore from "../../stores/useSettingsStore";

const SettingsPanel = ({ isOpen, onClose, initialTab = "general" }) => {
  const [activeTab, setActiveTab] = useState("general");

  const {
    // --- General Settings ---
    theme,
    language,
    setTheme,
    setLanguage,

    // --- Preview Settings ---
    showFileSize,
    showModifiedDate,
    showCreatedDate,
    showFileType,
    showFullPath,
    toggleFileSize,
    toggleModifiedDate,
    toggleCreatedDate,
    toggleFileType,
    toggleFullPath,

    // --- Photo Mode Settings ---
    showCamera,
    toggleCamera,
    showLens,
    toggleLens,
    showISO,
    toggleISO,
    showAperture,
    toggleAperture,
    showShutter,
    toggleShutter,
    showDimensions,
    toggleDimensions,
    showLocation,
    toggleLocation,

    // --- Interface Settings ---
    animationsEnabled,
    compactMode,
    toggleAnimations,
    toggleCompactMode,

    // --- Export Settings ---
    defaultExportFormat,
    includeMetadataInExport,
    setDefaultExportFormat,
    toggleMetadataInExport,

    // --- Timeout Settings ---
    requestTimeoutMs,
    disableRequestTimeout,
    setRequestTimeoutMs,
    toggleDisableRequestTimeout,

    // --- Theme Engine ---
    customColors,
    setCustomColor,

    // --- Global Reset ---
    resetSettings,
  } = useSettingsStore();

  // Handle escape key to close panel
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Sync active tab when panel opens with a specific initialTab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || "general");
    }
  }, [isOpen, initialTab]);

  // Apply theme to <html> class
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = (mode) => {
      if (mode === "dark") root.classList.add("dark");
      else if (mode === "light") root.classList.remove("dark");
      else root.classList.toggle("dark", mq.matches);
    };

    apply(theme);

    const handleChange = () => {
      if (theme === "system") apply("system");
    };

    if (mq.addEventListener) mq.addEventListener("change", handleChange);
    else mq.addListener(handleChange);

    return () => {
      if (mq.removeEventListener)
        mq.removeEventListener("change", handleChange);
      else mq.removeListener(handleChange);
    };
  }, [theme]);

  if (!isOpen) return null;

  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  // Define Tabs Configuration
  const tabs = [
    { id: "general", label: "General", icon: Layout },
    { id: "theme", label: "Theme & Colours", icon: Palette }, // UK Spelling
    { id: "columns", label: "Columns", icon: Eye },
    { id: "photo", label: "Photo Mode", icon: Camera },
    { id: "export", label: "Export", icon: Download },
  ];

  // Helper to determine active mode (light vs dark)
  const getActiveMode = () => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme;
  };

  const activeMode = getActiveMode();

  // Helper to handle color changes safely
  const handleColorChange = (key, value) => {
    setCustomColor(activeMode, key, value);
  };

  // Helper to reset ONLY the current theme's colors
  const handleResetThemeColors = () => {
    // CORRECT DEFAULTS (Matching Tailwind Slate-50/Slate-900)
    const defaults = {
      light: {
        bg: "#f8fafc", // Slate-50 (Matches original light theme)
        fg: "#1e293b", // Slate-800
        highlight: "#2563eb", // Blue-600
        buttonBg: "#f1f5f9", // Slate-100
        entryBg: "#ffffff", // White
      },
      dark: {
        bg: "#0f172a", // Slate-900 (Matches original dark theme)
        fg: "#e2e8f0", // Slate-200
        highlight: "#3b82f6", // Blue-500
        buttonBg: "#1e293b", // Slate-800
        entryBg: "#1e293b", // Slate-800
      },
    };

    const targetDefaults = defaults[activeMode];
    if (targetDefaults) {
      Object.keys(targetDefaults).forEach((key) => {
        setCustomColor(activeMode, key, targetDefaults[key]);
      });
    }
  };

  // Safe access to colors (default to empty object if undefined)
  const currentColors = customColors?.[activeMode] || {};

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Settings Panel Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`
            w-full max-w-4xl h-[85vh] flex overflow-hidden
            bg-white dark:bg-slate-800 rounded-2xl shadow-2xl
            border border-slate-200 dark:border-slate-700
            pointer-events-auto
            ${animationsEnabled ? "animate-in slide-in-from-top duration-300" : ""}
          `}
        >
          {/* Sidebar Navigation */}
          <aside className="w-64 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-1">
            <h2 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Settings
            </h2>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${
                      isActive
                        ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}

            <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={resetSettings}
                className="w-full px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* --- GENERAL TAB --- */}
              {activeTab === "general" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Appearance */}
                  <section>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Sun className="w-4 h-4 text-blue-600" />
                      Appearance Mode
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {["light", "dark", "system"].map((themeOption) => {
                        const Icon = themeIcons[themeOption];
                        return (
                          <button
                            key={themeOption}
                            onClick={() => setTheme(themeOption)}
                            className={`
                            flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                            ${
                              theme === themeOption
                                ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                            }
                            `}
                          >
                            <Icon
                              className={`w-6 h-6 ${
                                theme === themeOption
                                  ? "text-blue-600"
                                  : "text-slate-600 dark:text-slate-400"
                              }`}
                            />
                            <span
                              className={`text-sm font-medium ${
                                theme === themeOption
                                  ? "text-blue-600"
                                  : "text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {themeOption.charAt(0).toUpperCase() +
                                themeOption.slice(1)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* Language */}
                  <section>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600" />
                      Language
                    </h3>
                    <div className="relative">
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
                      >
                        <option value="en-GB">English (UK)</option>
                        <option disabled>More Languages to follow...</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      </div>
                    </div>
                  </section>

                  {/* Interface */}
                  <section>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Layout className="w-4 h-4 text-blue-600" />
                      Interface
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Enable animations
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Smooth transitions and hover effects
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={animationsEnabled}
                          onChange={toggleAnimations}
                          className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Compact mode
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Reduce spacing and padding
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={compactMode}
                          onChange={toggleCompactMode}
                          className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </label>
                    </div>
                  </section>

                  {/* Deep Search Timeout */}
                  <section>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-600" />
                      Performance
                    </h3>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-4">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Disable timeout for long scans
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={!!disableRequestTimeout}
                          onChange={toggleDisableRequestTimeout}
                          className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Request timeout (ms)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={Number(requestTimeoutMs) || 0}
                            onChange={(e) =>
                              setRequestTimeoutMs(e.target.value)
                            }
                            disabled={!!disableRequestTimeout}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setRequestTimeoutMs(300000)}
                          disabled={!!disableRequestTimeout}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                        >
                          Set 5 mins
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {/* --- NEW: THEME & COLOURS TAB --- */}
              {activeTab === "theme" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-300 h-full">
                  {/* Controls Column */}
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl text-sm text-blue-800 dark:text-blue-200">
                      <p>
                        Customize the{" "}
                        <strong>
                          {activeMode === "dark" ? "Dark" : "Light"}
                        </strong>{" "}
                        theme colours. Changes apply immediately.
                      </p>
                    </div>

                    {/* Background Colour */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Background Colour
                      </label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="color"
                          value={currentColors.bg || "#ffffff"}
                          onChange={(e) =>
                            handleColorChange("bg", e.target.value)
                          }
                          className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={currentColors.bg || ""}
                          onChange={(e) =>
                            handleColorChange("bg", e.target.value)
                          }
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm"
                        />
                      </div>
                    </div>

                    {/* Foreground (Text) Colour */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Text Colour
                      </label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="color"
                          value={currentColors.fg || "#000000"}
                          onChange={(e) =>
                            handleColorChange("fg", e.target.value)
                          }
                          className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={currentColors.fg || ""}
                          onChange={(e) =>
                            handleColorChange("fg", e.target.value)
                          }
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm"
                        />
                      </div>
                    </div>

                    {/* Highlight / Accent Colour */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Highlight / Accent Colour
                      </label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="color"
                          value={currentColors.highlight || "#2563eb"}
                          onChange={(e) =>
                            handleColorChange("highlight", e.target.value)
                          }
                          className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={currentColors.highlight || ""}
                          onChange={(e) =>
                            handleColorChange("highlight", e.target.value)
                          }
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm"
                        />
                      </div>
                    </div>

                    {/* Button Background */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Secondary Button BG
                      </label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="color"
                          value={currentColors.buttonBg || "#e5e7eb"}
                          onChange={(e) =>
                            handleColorChange("buttonBg", e.target.value)
                          }
                          className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={currentColors.buttonBg || ""}
                          onChange={(e) =>
                            handleColorChange("buttonBg", e.target.value)
                          }
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm"
                        />
                      </div>
                    </div>

                    {/* RESET COLOURS BUTTON */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={handleResetThemeColors}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                      >
                        <RotateCcw className="w-4 h-4" /> Reset Colours to
                        Default
                      </button>
                    </div>
                  </div>

                  {/* Preview Column (Replica) */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-500 uppercase tracking-wider">
                      Mini Replica Preview
                    </label>
                    <div
                      className="rounded-2xl shadow-xl overflow-hidden border p-4 flex flex-col gap-4 relative"
                      style={{
                        backgroundColor: currentColors.bg,
                        color: currentColors.fg,
                        borderColor: currentColors.buttonBg, // Rough approximation for border
                        height: "300px",
                      }}
                    >
                      {/* Replica Header */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                          style={{ backgroundColor: currentColors.entryBg }}
                        >
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: currentColors.highlight }}
                          ></div>
                        </div>
                        <div>
                          <div
                            className="h-3 w-24 rounded mb-1"
                            style={{
                              backgroundColor: currentColors.fg,
                              opacity: 0.9,
                            }}
                          ></div>
                          <div
                            className="h-2 w-16 rounded"
                            style={{
                              backgroundColor: currentColors.fg,
                              opacity: 0.5,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Replica Card */}
                      <div
                        className="p-4 rounded-xl border flex-1"
                        style={{
                          backgroundColor: currentColors.entryBg,
                          borderColor: currentColors.buttonBg,
                        }}
                      >
                        <div className="flex justify-between mb-4">
                          <div
                            className="h-4 w-20 rounded"
                            style={{
                              backgroundColor: currentColors.fg,
                              opacity: 0.8,
                            }}
                          ></div>
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: currentColors.highlight }}
                          ></div>
                        </div>
                        <div className="space-y-2">
                          <div
                            className="h-2 w-full rounded"
                            style={{ backgroundColor: currentColors.buttonBg }}
                          ></div>
                          <div
                            className="h-2 w-3/4 rounded"
                            style={{ backgroundColor: currentColors.buttonBg }}
                          ></div>
                        </div>
                        <div className="mt-6 flex gap-2">
                          <div
                            className="h-8 flex-1 rounded-lg"
                            style={{
                              backgroundColor: currentColors.highlight,
                              opacity: 0.1,
                            }}
                          ></div>
                          <div
                            className="h-8 w-20 rounded-lg"
                            style={{ backgroundColor: currentColors.highlight }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 text-center">
                      The entire app background has also updated to your
                      selection.
                    </p>
                  </div>
                </div>
              )}

              {/* --- COLUMNS TAB --- */}
              {activeTab === "columns" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl text-sm text-blue-800 dark:text-blue-200">
                    <p>
                      Select which details to display in the file preview list.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        label: "File Size",
                        checked: showFileSize,
                        toggle: toggleFileSize,
                      },
                      {
                        label: "Modification Date",
                        checked: showModifiedDate,
                        toggle: toggleModifiedDate,
                      },
                      {
                        label: "Creation Date",
                        checked: showCreatedDate,
                        toggle: toggleCreatedDate,
                      },
                      {
                        label: "File Type",
                        checked: showFileType,
                        toggle: toggleFileType,
                      },
                      {
                        label: "Full File Path",
                        checked: showFullPath,
                        toggle: toggleFullPath,
                      },
                    ].map((item, idx) => (
                      <label
                        key={idx}
                        className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-all"
                      >
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {item.label}
                        </span>
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={item.toggle}
                          className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* --- PHOTO MODE TAB --- */}
              {activeTab === "photo" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30 rounded-xl text-sm text-purple-800 dark:text-purple-200 flex items-start gap-3">
                    <Camera className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">
                        Photo Metadata Columns
                      </p>
                      <p>
                        These columns only appear when you enable "Photo Mode"
                        in the main interface.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        label: "Camera Model",
                        checked: showCamera,
                        toggle: toggleCamera,
                      },
                      {
                        label: "Lens Model",
                        checked: showLens,
                        toggle: toggleLens,
                      },
                      { label: "ISO", checked: showISO, toggle: toggleISO },
                      {
                        label: "Aperture",
                        checked: showAperture,
                        toggle: toggleAperture,
                      },
                      {
                        label: "Shutter Speed",
                        checked: showShutter,
                        toggle: toggleShutter,
                      },
                      {
                        label: "Dimensions",
                        checked: showDimensions,
                        toggle: toggleDimensions,
                      },
                      {
                        label: "Location",
                        checked: showLocation,
                        toggle: toggleLocation,
                      },
                    ].map((item, idx) => (
                      <label
                        key={idx}
                        className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 cursor-pointer transition-all"
                      >
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {item.label}
                        </span>
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={item.toggle}
                          className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* --- EXPORT TAB --- */}
              {activeTab === "export" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <section>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                      Default Format
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {["txt", "csv", "json", "md", "html"].map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setDefaultExportFormat(fmt)}
                          className={`
                                    px-4 py-3 rounded-xl border text-left font-medium transition-all
                                    ${
                                      defaultExportFormat === fmt
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500"
                                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }
                                `}
                        >
                          .{fmt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <label className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all">
                      <div>
                        <span className="block font-medium text-slate-700 dark:text-slate-300">
                          Include metadata in export
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Add file size, dates, and type information to
                          generated files
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={includeMetadataInExport}
                        onChange={toggleMetadataInExport}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </label>
                  </section>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;
