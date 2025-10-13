import React, { useState, useEffect } from "react";
import { FolderOpen, Play, Save, Download } from "lucide-react";

/**
 * Main Application Component
 *
 * This is the root component that orchestrates the entire File Filter Copier app.
 * It manages global state, theme switching, and coordinates all child components.
 */
function App() {
  // Theme state
  const [theme, setTheme] = useState("light");

  // Filter states
  const [sourceFolder, setSourceFolder] = useState("");
  const [sizeFilter, setSizeFilter] = useState(">1KB");

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Toggle theme handler
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-fg dark:text-dark-fg transition-colors p-6">
      {/* Header */}
      <header className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-8 h-8 text-light-highlight dark:text-dark-highlight" />
          <h1 className="text-2xl font-bold">File Filter Copier</h1>
        </div>
        <button
          onClick={toggleTheme}
          className="px-4 py-2 bg-light-button-bg dark:bg-dark-button-bg hover:bg-light-highlight dark:hover:bg-dark-highlight text-light-button-fg dark:text-dark-button-fg rounded-lg transition-colors"
        >
          🌙 {theme === "light" ? "Dark" : "Light"} Mode
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto">
        <div className="bg-light-frame-bg dark:bg-dark-frame-bg rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">
            Welcome to File Filter Copier
          </h2>
          <p className="text-light-label-fg dark:text-dark-label-fg mb-4">
            This is your new React + Electron app. The setup is complete!
          </p>

          {/* Source Folder Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Source Folder:
            </label>
            <input
              type="text"
              value={sourceFolder}
              onChange={(e) => setSourceFolder(e.target.value)}
              placeholder="Select a folder..."
              className="w-full px-4 py-2 bg-light-entry-bg dark:bg-dark-entry-bg border border-light-border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-light-highlight dark:focus:ring-dark-highlight"
            />
          </div>

          {/* Size Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">File Size:</label>
            <div className="flex gap-4">
              {[">1KB", "<1KB", ">500MB", "All Sizes"].map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="sizeFilter"
                    value={option}
                    checked={sizeFilter === option}
                    onChange={(e) => setSizeFilter(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-light-success dark:bg-dark-success text-white rounded-lg hover:opacity-90 transition-opacity">
              <Play className="w-4 h-4" />
              Run
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-light-warning dark:bg-dark-warning text-white rounded-lg hover:opacity-90 transition-opacity">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-light-accent dark:bg-dark-accent text-white rounded-lg hover:opacity-90 transition-opacity">
              <Save className="w-4 h-4" />
              Save Preset
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
