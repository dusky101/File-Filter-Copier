/**
 * Zustand Store for Filter State Management
 * Manages all filter configurations including size, extensions, file types, structure, and exclusions.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

const useFilterStore = create(
  persist(
    (set, get) => ({
      // --- Core Paths ---
      sourceFolder: "",
      destinationFolder: "",
      outputFolderName: "Output",

      // --- Main Toggles ---
      dryRun: true,
      photoMode: false, // NEW: Photo Mode State

      // --- Basic Filters ---
      includeExtensions: "",
      excludeExtensions: "",
      sizeFilter: "all", // all, small, medium, large, huge, custom:min-max
      timeFilter: "none", // none, 1h, 24h, 7d, 30d, custom

      // --- Selection Sets ---
      selectedFileTypes: new Set(),
      selectedProjectTypes: new Set(),

      // --- Exclusions ---
      excludedFolders: new Set([
        "node_modules",
        ".git",
        ".svn",
        ".hg",
        "dist",
        "build",
        "coverage",
        ".next",
        ".nuxt",
        ".idea",
        ".vscode",
        "__pycache__",
        ".DS_Store",
        "Thumbs.db",
      ]),
      customExcludedFolders: new Set(),

      // --- Deep Scan ---
      deepScan: false,
      deepScanTerms: [],
      deepScanMode: "any", // 'any' or 'all'
      deepScanMaxSizeMB: 50,

      // --- Advanced Settings ---
      includeHidden: false,
      followSymlinks: false,
      respectGitignore: true,
      maxDepth: 0, // 0 = unlimited
      timeAttribute: "mtime", // mtime, ctime, atime

      // --- Matchers (Glob/Regex) ---
      nameGlobInclude: "",
      nameGlobExclude: "",
      nameRegexInclude: "",
      nameRegexExclude: "",

      // --- Duplicates & Structure (New) ---
      excludeDuplicates: false, // Moved from PreviewStore
      copyStructure: "flat", // 'flat', 'date', 'type', 'preserve'

      // =========================================
      // ACTIONS
      // =========================================

      // Path Actions
      setSourceFolder: (path) => set({ sourceFolder: path }),
      setDestinationFolder: (path) => set({ destinationFolder: path }),
      setOutputFolderName: (name) => set({ outputFolderName: name }),

      // Toggle Actions
      toggleDryRun: () => set((state) => ({ dryRun: !state.dryRun })),

      // NEW: Smart Photo Mode Toggle Logic
      togglePhotoMode: () =>
        set((state) => {
          const newState = !state.photoMode;
          const PHOTOS_KEY = "Photos"; // Must match key in fileTypes.js

          if (newState) {
            // TURNING ON:
            // 1. Add "Photos" to selected types without removing others
            const newTypes = new Set(state.selectedFileTypes);
            newTypes.add(PHOTOS_KEY);

            return {
              photoMode: true,
              copyStructure: "date", // Auto-set structure to Date
              selectedFileTypes: newTypes,
              // We do NOT clear extension filters here, allowing users to add .png if they want
            };
          } else {
            // TURNING OFF:
            // 1. Remove "Photos" from selection
            const newTypes = new Set(state.selectedFileTypes);
            newTypes.delete(PHOTOS_KEY);

            return {
              photoMode: false,
              selectedFileTypes: newTypes,
            };
          }
        }),

      // Filter Actions
      setIncludeExtensions: (val) => set({ includeExtensions: val }),
      setExcludeExtensions: (val) => set({ excludeExtensions: val }),
      setSizeFilter: (val) => set({ sizeFilter: val }),
      setTimeFilter: (val) => set({ timeFilter: val }),

      // File Types
      toggleFileType: (type) =>
        set((state) => {
          const newSet = new Set(state.selectedFileTypes);
          if (newSet.has(type)) newSet.delete(type);
          else newSet.add(type);
          return { selectedFileTypes: newSet };
        }),
      setFileTypes: (types) => set({ selectedFileTypes: new Set(types) }),
      clearFileTypes: () => set({ selectedFileTypes: new Set() }),

      // Project Types
      toggleProjectType: (type) =>
        set((state) => {
          const newSet = new Set(state.selectedProjectTypes);
          if (newSet.has(type)) newSet.delete(type);
          else newSet.add(type);
          return { selectedProjectTypes: newSet };
        }),
      clearProjectTypes: () => set({ selectedProjectTypes: new Set() }),

      // Folder Exclusions
      toggleExcludedFolder: (folder) =>
        set((state) => {
          const newSet = new Set(state.excludedFolders);
          if (newSet.has(folder)) newSet.delete(folder);
          else newSet.add(folder);
          return { excludedFolders: newSet };
        }),

      addCustomExcludedFolder: (folder) =>
        set((state) => {
          if (!folder) return {};
          const newSet = new Set(state.customExcludedFolders);
          newSet.add(folder);
          return { customExcludedFolders: newSet };
        }),

      removeCustomExcludedFolder: (folder) =>
        set((state) => {
          const newSet = new Set(state.customExcludedFolders);
          newSet.delete(folder);
          return { customExcludedFolders: newSet };
        }),

      clearCustomExcludedFolders: () =>
        set({ customExcludedFolders: new Set() }),

      // Deep Scan Actions
      setDeepScan: (val) => set({ deepScan: val }),
      setDeepScanTerms: (terms) => set({ deepScanTerms: terms }),
      setDeepScanMode: (mode) => set({ deepScanMode: mode }),
      setDeepScanMaxSizeMB: (mb) => set({ deepScanMaxSizeMB: mb }),

      // Advanced Actions
      setIncludeHidden: (val) => set({ includeHidden: val }),
      setFollowSymlinks: (val) => set({ followSymlinks: val }),
      setRespectGitignore: (val) => set({ respectGitignore: val }),
      setMaxDepth: (val) => set({ maxDepth: val }),
      setTimeAttribute: (val) => set({ timeAttribute: val }),

      // Matcher Actions
      setNameGlobInclude: (val) => set({ nameGlobInclude: val }),
      setNameGlobExclude: (val) => set({ nameGlobExclude: val }),
      setNameRegexInclude: (val) => set({ nameRegexInclude: val }),
      setNameRegexExclude: (val) => set({ nameRegexExclude: val }),

      // Structure & Duplicates Actions
      setExcludeDuplicates: (val) => set({ excludeDuplicates: val }),
      setCopyStructure: (val) => set({ copyStructure: val }),

      // Reset Actions
      resetFilters: () =>
        set((state) => ({
          includeExtensions: "",
          excludeExtensions: "",
          sizeFilter: "all",
          timeFilter: "none",
          selectedFileTypes: new Set(),
          selectedProjectTypes: new Set(),
          // Keep default excludedFolders, clear custom
          customExcludedFolders: new Set(),
          deepScan: false,
          deepScanTerms: [],
          deepScanMode: "any",
          includeHidden: false,
          followSymlinks: false,
          respectGitignore: true,
          maxDepth: 0,
          timeAttribute: "mtime",
          nameGlobInclude: "",
          nameGlobExclude: "",
          nameRegexInclude: "",
          nameRegexExclude: "",
          excludeDuplicates: false,
          copyStructure: "flat",
          photoMode: false,
        })),

      resetToBlank: () =>
        set({
          includeExtensions: "",
          excludeExtensions: "",
          sizeFilter: "all",
          timeFilter: "none",
          selectedFileTypes: new Set(),
          selectedProjectTypes: new Set(),
          excludedFolders: new Set(), // Clears defaults too
          customExcludedFolders: new Set(),
          deepScan: false,
          deepScanTerms: [],
          deepScanMode: "any",
          includeHidden: false,
          followSymlinks: false,
          respectGitignore: true,
          maxDepth: 0,
          timeAttribute: "mtime",
          nameGlobInclude: "",
          nameGlobExclude: "",
          nameRegexInclude: "",
          nameRegexExclude: "",
          excludeDuplicates: false,
          copyStructure: "flat",
          photoMode: false,
        }),

      // =========================================
      // API PAYLOAD GENERATION
      // =========================================
      getFilterConfig: () => {
        const s = get();
        // Helper to split CSV strings
        const splitCSV = (str) =>
          str
            ? str
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
            : [];

        // Parse Size
        const { min: sizeMin, max: sizeMax } = parseSize(s.sizeFilter);

        // Parse Time
        const { min: timeMin, max: timeMax } = parseTime(
          s.timeFilter,
          s.timeAttribute
        );

        return {
          // Core
          folder: s.sourceFolder,
          destination: s.destinationFolder,
          output_folder_name: s.outputFolderName,
          dry_run: s.dryRun,
          photo_mode: s.photoMode, // SENT TO API

          // Filters
          include_exts: splitCSV(s.includeExtensions), // Maps to API 'include_exts'
          exclude_exts: splitCSV(s.excludeExtensions), // Maps to API 'exclude_exts'
          size_min: sizeMin,
          size_max: sizeMax,
          time_min: timeMin,
          time_max: timeMax,
          time_attribute: s.timeAttribute,

          selected_types: Array.from(s.selectedFileTypes), // Maps to API 'selected_types'
          project_types: Array.from(s.selectedProjectTypes),

          // Combine defaults + custom for the API
          excluded_folders: [
            ...Array.from(s.excludedFolders),
            ...Array.from(s.customExcludedFolders),
          ],

          // Deep Scan
          deep_scan: s.deepScan,
          deep_scan_terms: s.deepScanTerms,
          deep_scan_mode: s.deepScanMode,
          deep_scan_max_size_bytes: (s.deepScanMaxSizeMB || 50) * 1024 * 1024,

          // Advanced
          include_hidden: s.includeHidden,
          follow_symlinks: s.followSymlinks,
          respect_gitignore: s.respectGitignore,
          max_depth:
            typeof s.maxDepth === "string" ? parseInt(s.maxDepth) : s.maxDepth,

          // Matchers (Send array if split, or null)
          name_glob_include: splitCSV(s.nameGlobInclude),
          name_glob_exclude: splitCSV(s.nameGlobExclude),
          name_regex_include: s.nameRegexInclude || null,
          name_regex_exclude: s.nameRegexExclude || null,

          // New Fields
          exclude_duplicates: s.excludeDuplicates,
          structure: s.copyStructure,
        };
      },

      // =========================================
      // PRESET LOADING
      // =========================================
      loadPresetConfig: (config) => {
        if (!config) return;

        // Helpers to join arrays back to CSV
        const joinCSV = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");

        // 1. Direct State Updates
        set({
          // Paths (if present in preset)
          sourceFolder: config.folder || config.sourceFolder || "",
          destinationFolder:
            config.destination || config.destinationFolder || "",
          outputFolderName:
            config.output_folder_name || config.outputFolderName || "Output",

          // Strings / Booleans
          dryRun: config.dry_run ?? true,
          photoMode: config.photo_mode ?? false,
          deepScan: config.deep_scan ?? false,
          deepScanMode: config.deep_scan_mode || "any",
          deepScanMaxSizeMB: config.deep_scan_max_size_bytes
            ? Math.round(config.deep_scan_max_size_bytes / (1024 * 1024))
            : 50,

          includeHidden: config.include_hidden ?? false,
          followSymlinks: config.follow_symlinks ?? false,
          respectGitignore: config.respect_gitignore ?? true,
          maxDepth: config.max_depth || 0,
          timeAttribute: config.time_attribute || "mtime",

          nameRegexInclude: config.name_regex_include || "",
          nameRegexExclude: config.name_regex_exclude || "",

          // New Fields
          excludeDuplicates: config.exclude_duplicates ?? false,
          copyStructure: config.structure || "flat",

          // Arrays -> CSV Strings
          includeExtensions: joinCSV(
            config.include_exts || config.includeExtensions
          ),
          excludeExtensions: joinCSV(
            config.exclude_exts || config.excludeExtensions
          ),
          nameGlobInclude: joinCSV(config.name_glob_include),
          nameGlobExclude: joinCSV(config.name_glob_exclude),

          // Arrays -> Sets
          selectedFileTypes: new Set(
            config.selected_types || config.file_types || []
          ),
          selectedProjectTypes: new Set(config.project_types || []),
          excludedFolders: new Set(config.excluded_folders || []),
          // Presets usually store specific exclusions, we can load them into custom or override default.
          // For safety, let's load them into excludedFolders (the combined set).

          // Deep scan terms
          deepScanTerms: config.deep_scan_terms || [],
        });

        // 2. Complex Filter Logic (Size/Time)
        // Attempt to reconstruct preset values if they match known keys,
        // otherwise default to 'custom' or 'all'.
        if (config.size_filter) {
          set({ sizeFilter: config.size_filter });
        } else if (
          config.size_min !== undefined ||
          config.size_max !== undefined
        ) {
          // If manual bytes are present, set to custom string
          const min = config.size_min || 0;
          const max = config.size_max || "inf";
          // Basic reconstruction for UI display
          set({ sizeFilter: `custom:${min}-${max}` });
        }

        if (config.time_filter) {
          set({ timeFilter: config.time_filter });
        }
      },
    }),
    {
      name: "file-filter-storage",
      // Define which parts of state to persist
      partialize: (state) => ({
        sourceFolder: state.sourceFolder,
        destinationFolder: state.destinationFolder,
        outputFolderName: state.outputFolderName,
        includeExtensions: state.includeExtensions,
        excludeExtensions: state.excludeExtensions,
        sizeFilter: state.sizeFilter,
        timeFilter: state.timeFilter,
        photoMode: state.photoMode,
        // Convert Sets to Arrays for JSON storage
        selectedFileTypes: Array.from(state.selectedFileTypes),
        selectedProjectTypes: Array.from(state.selectedProjectTypes),
        excludedFolders: Array.from(state.excludedFolders),
        customExcludedFolders: Array.from(state.customExcludedFolders),
        deepScan: state.deepScan,
        deepScanTerms: state.deepScanTerms,
        deepScanMode: state.deepScanMode,
        includeHidden: state.includeHidden,
        followSymlinks: state.followSymlinks,
        respectGitignore: state.respectGitignore,
        maxDepth: state.maxDepth,
        timeAttribute: state.timeAttribute,
        nameGlobInclude: state.nameGlobInclude,
        nameGlobExclude: state.nameGlobExclude,
        nameRegexInclude: state.nameRegexInclude,
        nameRegexExclude: state.nameRegexExclude,
        deepScanMaxSizeMB: state.deepScanMaxSizeMB,
        excludeDuplicates: state.excludeDuplicates,
        copyStructure: state.copyStructure,
      }),
      onRehydrateStorage: () => (state) => {
        // Convert Arrays back to Sets upon hydration
        if (state) {
          if (Array.isArray(state.excludedFolders))
            state.excludedFolders = new Set(state.excludedFolders);
          if (Array.isArray(state.customExcludedFolders))
            state.customExcludedFolders = new Set(state.customExcludedFolders);
          if (Array.isArray(state.selectedFileTypes))
            state.selectedFileTypes = new Set(state.selectedFileTypes);
          if (Array.isArray(state.selectedProjectTypes))
            state.selectedProjectTypes = new Set(state.selectedProjectTypes);
        }
      },
    }
  )
);

// =========================================
// HELPER FUNCTIONS (Internal)
// =========================================

function parseSize(filter) {
  if (!filter || filter === "all") return { min: null, max: null };

  // Standard Presets
  if (filter === "small") return { min: 0, max: 1024 * 1024 }; // 1MB
  if (filter === "medium") return { min: 1024 * 1024, max: 10 * 1024 * 1024 }; // 10MB
  if (filter === "large")
    return { min: 10 * 1024 * 1024, max: 100 * 1024 * 1024 }; // 100MB
  if (filter === "huge") return { min: 100 * 1024 * 1024, max: null };

  // Custom "custom:min-max"
  if (filter.startsWith("custom:")) {
    const [minStr, maxStr] = filter.replace("custom:", "").split("-");

    // Helper to parse "5MB", "10KB" etc.
    const parseBytes = (str) => {
      if (!str || str === "inf") return null;
      const units = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 };
      const match = str.toLowerCase().match(/^(\d+(?:\.\d+)?)([a-z]+)?$/);
      if (!match) return 0;
      const val = parseFloat(match[1]);
      const unit = match[2] || "b";
      return Math.floor(val * (units[unit] || 1));
    };

    return { min: parseBytes(minStr), max: parseBytes(maxStr) };
  }
  return { min: null, max: null };
}

function parseTime(filter) {
  if (!filter || filter === "none") return { min: null, max: null };

  const now = Date.now() / 1000; // seconds
  const parseOffset = (str) => {
    const match = str.match(/^(\d+)([hdwmy])$/);
    if (!match) return 0;
    const val = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers = {
      h: 3600,
      d: 86400,
      w: 604800,
      m: 2592000, // approx 30 days
      y: 31536000,
    };
    return val * (multipliers[unit] || 0);
  };

  // Presets like "<24h" means min=now-24h, max=now
  if (filter.startsWith("<")) {
    const offset = parseOffset(filter.substring(1));
    return { min: now - offset, max: null }; // "Since X time ago"
  }
  // Presets like ">30d" means min=null, max=now-30d
  if (filter.startsWith(">")) {
    const offset = parseOffset(filter.substring(1));
    return { min: null, max: now - offset }; // "Older than X time"
  }

  // Custom handling could go here if implemented in UI
  return { min: null, max: null };
}

export default useFilterStore;
