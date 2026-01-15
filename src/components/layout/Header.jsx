/**
 * Header Component
 * Displays the application logo, title, settings button, and the Photo Mode toggle.
 */

import React, { useState, useEffect } from "react";
import { Settings, Info, Camera, Sun, Moon } from "lucide-react";
import useSettingsStore from "../../stores/useSettingsStore";
import useFilterStore from "../../stores/useFilterStore";
// Import your custom icons
import FFCIcon from "../../assets/FFCIcon.png";
import FFCIconD from "../../assets/FFCIconD.png"; // Dark mode icon

const Header = ({ onSettingsClick, onHelpClick }) => {
  const { animationsEnabled, theme, setTheme } = useSettingsStore();

  // Connect to the Filter Store for the smart toggle logic
  const { photoMode, togglePhotoMode } = useFilterStore();

  // --- Theme Logic ---
  // We need to know the *effective* theme (is it actually dark?) to swap the image
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      if (theme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
      return theme === "dark";
    };

    setIsDark(checkTheme());

    // Listen for system changes if mode is 'system'
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e) => setIsDark(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  const toggleTheme = () => {
    // If currently system/dark, switch to light. If light, switch to dark.
    const newTheme =
      theme === "dark" || (theme === "system" && isDark) ? "light" : "dark";
    setTheme(newTheme);
  };
  // -------------------

  return (
    <header className="flex items-center justify-between mb-8">
      {/* Logo and Title */}
      <div className="flex items-center gap-3">
        <div
          className={`
            w-12 h-12 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white dark:bg-slate-800
            ${animationsEnabled ? "transition-transform hover:scale-110" : ""}
          `}
        >
          {/* Swap Image based on effective theme */}
          <img
            src={isDark ? FFCIconD : FFCIcon}
            alt="File Filter Copier Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1
            className={`
              text-3xl font-bold bg-linear-to-r bg-clip-text text-transparent
              ${
                isDark
                  ? "from-blue-600 to-purple-600" // Dark Mode: Original Vibrant
                  : "from-[#7996BA] to-[#0088FF]" // Light Mode: Custom Colors
              }
            `}
          >
            File Filter Copier
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Intelligent file filtering and organisation
          </p>
        </div>
      </div>

      {/* Actions: Photo Mode + Help + Theme + Settings */}
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
          title={
            photoMode
              ? "Photo Mode Active: Filters restricted to photos"
              : "Enable Photo Mode (Auto-selects Photo filters)"
          }
        >
          <Camera className={`w-5 h-5 ${photoMode ? "text-white" : ""}`} />
          <span className="font-medium text-sm hidden sm:inline">
            Photo Mode
          </span>
        </button>

        {/* Instructions Button */}
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

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`
            p-3 rounded-xl bg-white dark:bg-slate-800 shadow-lg 
            hover:shadow-xl border border-slate-200 dark:border-slate-700
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${animationsEnabled ? "transition-all hover:scale-105" : ""}
          `}
          aria-label="Toggle Dark Mode"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-500" />
          ) : (
            <Moon className="w-5 h-5 text-slate-700" />
          )}
        </button>

        {/* Settings Button */}
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
