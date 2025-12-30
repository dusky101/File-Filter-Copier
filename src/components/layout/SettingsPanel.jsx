/**
 * Settings Panel Component
 * Modal panel for configuring application settings including theme, language, and display options
 */

import React, { useEffect } from "react";
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
  Camera, // Import Camera icon for Photo Mode section
} from "lucide-react";
import useSettingsStore from "../../stores/useSettingsStore";

const SettingsPanel = ({ isOpen, onClose }) => {
  const {
    theme,
    language,
    showFileSize,
    showModifiedDate,
    showCreatedDate,
    showFileType,
    showFullPath,
    // --- NEW: Photo Mode State ---
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
    // -----------------------------
    animationsEnabled,
    compactMode,
    defaultExportFormat,
    includeMetadataInExport,
    setTheme,
    setLanguage,
    toggleFileSize,
    toggleModifiedDate,
    toggleCreatedDate,
    toggleFileType,
    toggleFullPath,
    toggleAnimations,
    toggleCompactMode,
    setDefaultExportFormat,
    toggleMetadataInExport,
    resetSettings,
    // Timeout settings
    requestTimeoutMs,
    disableRequestTimeout,
    setRequestTimeoutMs,
    toggleDisableRequestTimeout,
  } = useSettingsStore();

  // Handle escape key to close panel
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  // Apply theme to <html> and react to OS changes when theme === 'system'
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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Settings Panel */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div
          className={`
            w-full max-w-2xl max-h-[90vh] overflow-y-auto
            bg-white dark:bg-slate-800 rounded-2xl shadow-2xl
            border border-slate-200 dark:border-slate-700
            pointer-events-auto
            ${animationsEnabled ? "animate-in slide-in-from-top duration-300" : ""}
          `}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
            <h2
              id="settings-title"
              className="text-xl font-semibold text-slate-900 dark:text-white"
            >
              Settings
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Close settings"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Appearance Section */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Sun className="w-5 h-5 text-blue-600" />
                Appearance
              </h3>

              {/* Theme Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["light", "dark", "system"].map((themeOption) => {
                    const Icon = themeIcons[themeOption];
                    const isSelected = theme === themeOption;
                    return (
                      <button
                        key={themeOption}
                        onClick={() => setTheme(themeOption)}
                        className={`
                        flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                        ${
                          isSelected
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }
                        `}
                      >
                        <Icon
                          className={`w-6 h-6 ${
                            isSelected
                              ? "text-blue-600"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            isSelected
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
              </div>
            </section>

            {/* Performance / Backend Section */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Deep Search Timeout
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                  <div>
                    <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Disable timeout for long scans
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      If enabled, requests won't time out (use with care)
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
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Request timeout (milliseconds)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={Number(requestTimeoutMs) || 0}
                      onChange={(e) => setRequestTimeoutMs(e.target.value)}
                      disabled={!!disableRequestTimeout}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setRequestTimeoutMs(300000)}
                      disabled={!!disableRequestTimeout}
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      Set 5 minutes
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Set to 0 or enable "Disable timeout" for unlimited duration.
                  Applies to deep scan and copy requests.
                </p>
              </div>
            </section>

            {/* Language Section */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                Language
              </h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Interface Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="en-GB">English (UK)</option>
                  <option value="en-US">English (US)</option>
                </select>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Changes spelling and terminology throughout the application
                </p>
              </div>
            </section>

            {/* Preview Display Section */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Preview Display Options
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Show file size
                  </span>
                  <input
                    type="checkbox"
                    checked={showFileSize}
                    onChange={toggleFileSize}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Show modification date
                  </span>
                  <input
                    type="checkbox"
                    checked={showModifiedDate}
                    onChange={toggleModifiedDate}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Show creation date
                  </span>
                  <input
                    type="checkbox"
                    checked={showCreatedDate}
                    onChange={toggleCreatedDate}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Show file type
                  </span>
                  <input
                    type="checkbox"
                    checked={showFileType}
                    onChange={toggleFileType}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Show full file path
                  </span>
                  <input
                    type="checkbox"
                    checked={showFullPath}
                    onChange={toggleFullPath}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              </div>
            </section>

            {/* Photo Mode Options Section (NEW) */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Photo Mode Columns
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Camera Model
                    </span>
                    <input
                      type="checkbox"
                      checked={showCamera}
                      onChange={toggleCamera}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Lens Model
                    </span>
                    <input
                      type="checkbox"
                      checked={showLens}
                      onChange={toggleLens}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      ISO
                    </span>
                    <input
                      type="checkbox"
                      checked={showISO}
                      onChange={toggleISO}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Aperture
                    </span>
                    <input
                      type="checkbox"
                      checked={showAperture}
                      onChange={toggleAperture}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Shutter Speed
                    </span>
                    <input
                      type="checkbox"
                      checked={showShutter}
                      onChange={toggleShutter}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Dimensions
                    </span>
                    <input
                      type="checkbox"
                      checked={showDimensions}
                      onChange={toggleDimensions}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Location
                    </span>
                    <input
                      type="checkbox"
                      checked={showLocation}
                      onChange={toggleLocation}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </section>

            {/* Interface Section */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Layout className="w-5 h-5 text-blue-600" />
                Interface
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
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

                <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
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

            {/* Export Settings Section */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" />
                Export Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Default export format
                  </label>
                  <select
                    value={defaultExportFormat}
                    onChange={(e) => setDefaultExportFormat(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="txt">Text (.txt)</option>
                    <option value="csv">CSV (.csv)</option>
                    <option value="json">JSON (.json)</option>
                    <option value="md">Markdown (.md)</option>
                    <option value="html">HTML (.html)</option>
                  </select>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    HTML format can be saved as PDF using your browser's print
                    function
                  </p>
                </div>

                <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                  <div>
                    <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Include metadata in export
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Add file size, dates, and type information
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeMetadataInExport}
                    onChange={toggleMetadataInExport}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
            <button
              onClick={resetSettings}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;
