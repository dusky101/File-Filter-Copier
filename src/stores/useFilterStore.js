/**
 * Zustand Store for Filter State Management
 * Manages all filter configurations including size, extensions, file types, and exclusions
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
      
      toggleDeepScan: () =>
        set((state) => ({ showDeepScan: !state.showDeepScan })),
      
      setShowDeepScan: (value) => set({ showDeepScan: value }),
      
      toggleCustomFolderModal: () =>
        set((state) => ({ showCustomFolderModal: !state.showCustomFolderModal })),
      
      setShowCustomFolderModal: (value) => set({ showCustomFolderModal: value }),
      
      // Utility: Get filter configuration for API
      getFilterConfig: () => {
        const state = get();
        // Combine both default and custom excluded folders
        const allExcludedFolders = new Set([
          ...state.excludedFolders,
          ...state.customExcludedFolders
        ]);
        
        return {
          folder: state.sourceFolder,
          size_filter: state.sizeFilter,
          time_filter: state.timeFilter,
          selected_types: Array.from(state.selectedFileTypes),
          deep_scan: state.deepScan,
          deep_scan_terms: state.deepScanTerms.filter(t => t.trim()),
          deep_scan_mode: state.deepScanMode.toUpperCase(), // Convert 'any' to 'OR', 'all' to 'AND'
          include_exts: state.includeExtensions
            .split(',')
            .map(e => e.trim())
            .filter(Boolean),
          exclude_exts: state.excludeExtensions
            .split(',')
            .map(e => e.trim())
            .filter(Boolean),
          excluded_folders: Array.from(allExcludedFolders)
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
          customExcludedFolders: new Set()
        }),
      
      // Utility: Load preset configuration
      loadPresetConfig: (config) =>
        set({
          includeExtensions: config.include_exts?.join(', ') || '',
          excludeExtensions: config.exclude_exts?.join(', ') || '',
          sizeFilter: config.size_filter || 'all',
          timeFilter: config.time_filter || 'none',
          selectedFileTypes: new Set(config.selected_types || []),
          deepScan: config.deep_scan || false,
          deepScanTerms: config.deep_scan_terms || [''],
          deepScanMode: config.deep_scan_mode?.toLowerCase() || 'any',
          excludedFolders: new Set(config.excluded_folders || []),
          customExcludedFolders: new Set()
        })
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
        deepScanMode: state.deepScanMode
      }),
      onRehydrateStorage: () => (state) => {
        // Convert arrays back to Sets when loading from storage
        if (state && state.excludedFolders && Array.isArray(state.excludedFolders)) {
          state.excludedFolders = new Set(state.excludedFolders);
        }
        if (state && state.selectedFileTypes && Array.isArray(state.selectedFileTypes)) {
          state.selectedFileTypes = new Set(state.selectedFileTypes);
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