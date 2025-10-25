/**
 * Zustand Store for Filter State Management
 * Manages all filter configurations including size, extensions, file types, and exclusions
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialState = {
  // Minimal baseline — adjust to your store keys as needed
  sourceFolder: "",
  include_exts: [],
  exclude_exts: [],
  selected_types: [],
  size_filter: "all",
  time_filter: "none",
  deep_scan: false,
  deep_scan_terms: [],
  deep_scan_mode: "OR",
  follow_symlinks: false,
  include_hidden: false,
  max_depth: 0,
  name_glob_include: [],
  name_glob_exclude: [],
  name_regex_include: "",
  name_regex_exclude: "",
  time_attribute: "mtime",
  deep_scan_max_size_bytes: 0,
  dryRun: true,
};

const useFilterStore = create(
  persist(
    (set, get) => ({
      // Source and destination configuration
      sourceFolder: '',
      destinationFolder: '',
      outputFolderName: '',
      
      // Dry run mode
      dryRun: false,
      
      // Extension filters
      includeExtensions: '',
      excludeExtensions: '',
      
      // Size filter
      sizeFilter: 'all', // 'all', 'small', 'medium', 'large', 'huge'
      
      // Time filter
      timeFilter: "none",
      
      // File type selection (semantic types)
      selectedFileTypes: new Set(),
  // Project Type selection (semantic roles like Models, Views, Controllers)
  selectedProjectTypes: new Set(),
      
      // Folder exclusions (default persistent exclusions)
      excludedFolders: new Set([
        'node_modules',
        'venv',
        '.git',
        '__pycache__',
        '.idea',
        'dist',
        'build',
        '.vscode'
      ]),
      
      // Custom folder exclusions (temporary, session-only)
      customExcludedFolders: new Set(),
      
      // Deep scan options
      deepScan: false,
      deepScanTerms: [''],
      deepScanMode: 'any', // 'any' or 'all'
      
      // UI state
      showAdvancedFilters: false,
      showFileTypeSelector: false,
      showFolderExclusions: false,
      showDeepScan: false,
      showCustomFolderModal: false,
      
      // Advanced options
      includeHidden: false,
      followSymlinks: false,
      maxDepth: 0, // 0 = unlimited
      timeAttribute: 'mtime', // 'mtime' | 'ctime' | 'atime'
      respectGitignore: false,
      nameGlobInclude: '',
      nameGlobExclude: '',
      nameRegexInclude: '',
      nameRegexExclude: '',
      deepScanMaxSizeMB: 0,

      // Actions: Source and Destination
      setSourceFolder: (folder) => set({ sourceFolder: folder }),
      setDestinationFolder: (folder) => set({ destinationFolder: folder }),
      setOutputFolderName: (name) => set({ outputFolderName: name }),
      
      // Actions: Dry Run
      setDryRun: (value) => set({ dryRun: value }),
      toggleDryRun: () => set((state) => ({ dryRun: !state.dryRun })),
      
      // Actions: Extensions
      setIncludeExtensions: (exts) => set({ includeExtensions: exts }),
      setExcludeExtensions: (exts) => set({ excludeExtensions: exts }),
      
      // Actions: Size Filter
      setSizeFilter: (size) => set({ sizeFilter: size }),
      
      // Actions: Time Filter
      setTimeFilter: (val) => set({ timeFilter: val }),
      
      // Actions: File Types
      addFileType: (type) =>
        set((state) => ({
          selectedFileTypes: new Set([...state.selectedFileTypes, type])
        })),
      
      removeFileType: (type) =>
        set((state) => {
          const newTypes = new Set(state.selectedFileTypes);
          newTypes.delete(type);
          return { selectedFileTypes: newTypes };
        }),
      
      toggleFileType: (type) =>
        set((state) => {
          const newTypes = new Set(state.selectedFileTypes);
          if (newTypes.has(type)) {
            newTypes.delete(type);
          } else {
            newTypes.add(type);
          }
          return { selectedFileTypes: newTypes };
        }),
      
      clearFileTypes: () => set({ selectedFileTypes: new Set() }),
      
      setFileTypes: (types) => set({ selectedFileTypes: new Set(types) }),

      // Actions: Project Types (semantic roles)
      addProjectType: (type) =>
        set((state) => ({
          selectedProjectTypes: new Set([...state.selectedProjectTypes, type])
        })),

      removeProjectType: (type) =>
        set((state) => {
          const newTypes = new Set(state.selectedProjectTypes);
          newTypes.delete(type);
          return { selectedProjectTypes: newTypes };
        }),

      toggleProjectType: (type) =>
        set((state) => {
          const newTypes = new Set(state.selectedProjectTypes);
          if (newTypes.has(type)) newTypes.delete(type); else newTypes.add(type);
          return { selectedProjectTypes: newTypes };
        }),

      clearProjectTypes: () => set({ selectedProjectTypes: new Set() }),

      setProjectTypes: (types) => set({ selectedProjectTypes: new Set(types) }),
      
      // Actions: Default Folder Exclusions (persistent)
      addExcludedFolder: (folder) =>
        set((state) => ({
          excludedFolders: new Set([...state.excludedFolders, folder])
        })),
      
      removeExcludedFolder: (folder) =>
        set((state) => {
          const newFolders = new Set(state.excludedFolders);
          newFolders.delete(folder);
          return { excludedFolders: newFolders };
        }),
      
      toggleExcludedFolder: (folder) =>
        set((state) => {
          const newFolders = new Set(state.excludedFolders);
          if (newFolders.has(folder)) {
            newFolders.delete(folder);
          } else {
            newFolders.add(folder);
          }
          return { excludedFolders: newFolders };
        }),
      
      setExcludedFolders: (folders) => set({ excludedFolders: new Set(folders) }),
      
      // Actions: Custom Folder Exclusions (temporary, session-only)
      addCustomExcludedFolder: (folder) =>
        set((state) => ({
          customExcludedFolders: new Set([...state.customExcludedFolders, folder])
        })),
      
      removeCustomExcludedFolder: (folder) =>
        set((state) => {
          const newFolders = new Set(state.customExcludedFolders);
          newFolders.delete(folder);
          return { customExcludedFolders: newFolders };
        }),
      
      toggleCustomExcludedFolder: (folder) =>
        set((state) => {
          const newFolders = new Set(state.customExcludedFolders);
          if (newFolders.has(folder)) {
            newFolders.delete(folder);
          } else {
            newFolders.add(folder);
          }
          return { customExcludedFolders: newFolders };
        }),
      
      setCustomExcludedFolders: (folders) => set({ customExcludedFolders: new Set(folders) }),
      
      clearCustomExcludedFolders: () => set({ customExcludedFolders: new Set() }),
      
      // Actions: Deep Scan
      setDeepScan: (value) => set({ deepScan: value }),
      setDeepScanTerms: (terms) => set({ deepScanTerms: terms }),
      updateDeepScanTerm: (index, value) =>
        set((state) => {
          const newTerms = [...state.deepScanTerms];
          newTerms[index] = value;
          return { deepScanTerms: newTerms };
        }),
      addDeepScanTerm: () =>
        set((state) => ({
          deepScanTerms: [...state.deepScanTerms, '']
        })),
      removeDeepScanTerm: (index) =>
        set((state) => ({
          deepScanTerms: state.deepScanTerms.filter((_, i) => i !== index)
        })),
      setDeepScanMode: (mode) => set({ deepScanMode: mode }),
      toggleDeepScan: () => set((state) => ({ deepScan: !state.deepScan })),
      
      // Actions: UI State
      toggleAdvancedFilters: () =>
        set((state) => ({ showAdvancedFilters: !state.showAdvancedFilters })),
      
      setShowAdvancedFilters: (value) => set({ showAdvancedFilters: value }),
      
      toggleFileTypeSelector: () =>
        set((state) => ({ showFileTypeSelector: !state.showFileTypeSelector })),
      
      setShowFileTypeSelector: (value) => set({ showFileTypeSelector: value }),
      
      toggleFolderExclusions: () =>
        set((state) => ({ showFolderExclusions: !state.showFolderExclusions })),
      
      setShowFolderExclusions: (value) => set({ showFolderExclusions: value }),
      
      // UI: toggle visibility of the Deep Scan panel
      toggleShowDeepScan: () =>
        set((state) => ({ showDeepScan: !state.showDeepScan })),
      
      setShowDeepScan: (value) => set({ showDeepScan: value }),
      
      toggleCustomFolderModal: () =>
        set((state) => ({ showCustomFolderModal: !state.showCustomFolderModal })),
      
      setShowCustomFolderModal: (value) => set({ showCustomFolderModal: value }),
      
      // Advanced setters
      setIncludeHidden: (v) => set({ includeHidden: !!v }),
      setFollowSymlinks: (v) => set({ followSymlinks: !!v }),
      setMaxDepth: (v) => set({ maxDepth: Math.max(0, Number(v) || 0) }),
      setTimeAttribute: (v) => set({ timeAttribute: v }),
      setRespectGitignore: (v) => set({ respectGitignore: !!v }),
      setNameGlobInclude: (s) => set({ nameGlobInclude: s }),
      setNameGlobExclude: (s) => set({ nameGlobExclude: s }),
      setNameRegexInclude: (s) => set({ nameRegexInclude: s }),
      setNameRegexExclude: (s) => set({ nameRegexExclude: s }),
      setDeepScanMaxSizeMB: (v) => set({ deepScanMaxSizeMB: Math.max(0, Number(v) || 0) }),

      // Utility: Get filter configuration for API
      getFilterConfig: () => {
        const state = get();
        const allExcludedFolders = new Set([
          ...state.excludedFolders,
          ...state.customExcludedFolders
        ]);
        const splitList = (s) =>
          (s || "")
            .split(/\s*(?:,|\n)\s*/)
            .map((x) => x.trim())
            .filter(Boolean);

        return {
          folder: state.sourceFolder,
          destination: state.destinationFolder,
          output_folder_name: state.outputFolderName,
          size_filter: state.sizeFilter,
          time_filter: state.timeFilter,
          selected_types: Array.from(state.selectedFileTypes || []),
          project_types: Array.from(state.selectedProjectTypes || []),
          deep_scan: !!state.deepScan,
          deep_scan_terms: (state.deepScanTerms || []).filter((t) => (t || "").trim()),
          deep_scan_mode: (state.deepScanMode || "any").toUpperCase(),
          include_exts: (state.includeExtensions || "")
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean),
          exclude_exts: (state.excludeExtensions || "")
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean),
          excluded_folders: Array.from(allExcludedFolders),

          // Advanced
          follow_symlinks: !!state.followSymlinks,
          include_hidden: !!state.includeHidden,
          max_depth: Number(state.maxDepth) || 0,
          time_attribute: state.timeAttribute || "mtime",
          respect_gitignore: !!state.respectGitignore,
          name_glob_include: splitList(state.nameGlobInclude),
          name_glob_exclude: splitList(state.nameGlobExclude),
          name_regex_include: state.nameRegexInclude || null,
          name_regex_exclude: state.nameRegexExclude || null,
          deep_scan_max_size_bytes: Math.max(0, Number(state.deepScanMaxSizeMB) || 0) * 1024 * 1024,
        };
      },

      // Utility: Reset all filters to default
      resetFilters: () =>
        set({
          includeExtensions: '',
          excludeExtensions: '',
          sizeFilter: 'all',
          timeFilter: 'none',
          selectedFileTypes: new Set(),
          selectedProjectTypes: new Set(),
          deepScan: false,
          deepScanTerms: [''],
          deepScanMode: 'any',
          excludedFolders: new Set([
            'node_modules',
            'venv',
            '.git',
            '__pycache__',
            '.idea',
            'dist',
            'build',
            '.vscode'
          ]),
          customExcludedFolders: new Set(),

          // Advanced resets
          includeHidden: false,
          followSymlinks: false,
          maxDepth: 0,
          timeAttribute: 'mtime',
          respectGitignore: false,
          nameGlobInclude: '',
          nameGlobExclude: '',
          nameRegexInclude: '',
          nameRegexExclude: '',
          deepScanMaxSizeMB: 0,
        }),

      // Utility: Load preset configuration
      loadPresetConfig: (config) =>
        set((state) => ({
          // top-level I/O folders
          sourceFolder: config.folder ?? state.sourceFolder,
          destinationFolder: config.destination ?? state.destinationFolder,
          outputFolderName: config.output_folder_name ?? state.outputFolderName,
          includeExtensions: Array.isArray(config.include_exts)
            ? config.include_exts.join(', ')
            : (config.includeExtensions ?? state.includeExtensions ?? ''),
          excludeExtensions: Array.isArray(config.exclude_exts)
            ? config.exclude_exts.join(', ')
            : (config.excludeExtensions ?? state.excludeExtensions ?? ''),
          sizeFilter: config.size_filter ?? state.sizeFilter ?? 'all',
          timeFilter: config.time_filter ?? state.timeFilter ?? 'none',
          selectedFileTypes: new Set(config.selected_types || Array.from(state.selectedFileTypes || [])),
          selectedProjectTypes: new Set(config.project_types || Array.from(state.selectedProjectTypes || [])),
          deepScan: config.deep_scan ?? state.deepScan ?? false,
          deepScanTerms: config.deep_scan_terms || state.deepScanTerms || [''],
          deepScanMode: (config.deep_scan_mode?.toLowerCase?.() || state.deepScanMode || 'any'),
          excludedFolders: new Set(config.excluded_folders || Array.from(state.excludedFolders || [])),
          customExcludedFolders: new Set()
        })),
      resetToBlank: () => set(() => ({ ...initialState })),
    }),
    {
      name: 'file-filter-store',
      partialize: (state) => ({
        // Only persist these values, not UI state or custom exclusions
        includeExtensions: state.includeExtensions,
        excludeExtensions: state.excludeExtensions,
        sizeFilter: state.sizeFilter,
        timeFilter: state.timeFilter,
        excludedFolders: Array.from(state.excludedFolders),
        deepScanMode: state.deepScanMode,
        selectedProjectTypes: Array.from(state.selectedProjectTypes),
        selectedFileTypes: Array.from(state.selectedFileTypes),

        // Persist advanced
        includeHidden: state.includeHidden,
        followSymlinks: state.followSymlinks,
        maxDepth: state.maxDepth,
        timeAttribute: state.timeAttribute,
        respectGitignore: state.respectGitignore,
        nameGlobInclude: state.nameGlobInclude,
        nameGlobExclude: state.nameGlobExclude,
        nameRegexInclude: state.nameRegexInclude,
        nameRegexExclude: state.nameRegexExclude,
        deepScanMaxSizeMB: state.deepScanMaxSizeMB,
      }),
      onRehydrateStorage: () => (state) => {
        // Convert arrays back to Sets when loading from storage
        if (state && state.excludedFolders && Array.isArray(state.excludedFolders)) {
          state.excludedFolders = new Set(state.excludedFolders);
        }
        if (state && state.selectedFileTypes && Array.isArray(state.selectedFileTypes)) {
          state.selectedFileTypes = new Set(state.selectedFileTypes);
        }
        if (state && state.selectedProjectTypes && Array.isArray(state.selectedProjectTypes)) {
          state.selectedProjectTypes = new Set(state.selectedProjectTypes);
        }
        // Ensure custom exclusions start empty
        if (state) {
          state.customExcludedFolders = new Set();
        }
      }
    }
  )
);

export default useFilterStore;