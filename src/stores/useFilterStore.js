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
      
      // Time filter (for future implementation)
      timeFilter: 'all', // 'all', 'today', 'week', 'month', 'year'
      
      // File type selection (semantic types)
      selectedFileTypes: new Set(),
      
      // Folder exclusions
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
      
      // Deep scan options
      deepScan: false,
      deepScanTerms: [''],
      deepScanMode: 'any', // 'any' or 'all'
      
      // UI state
      showAdvancedFilters: false,
      showFileTypeSelector: false,
      showFolderExclusions: false,
      showDeepScan: false,
      
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
      setTimeFilter: (time) => set({ timeFilter: time }),
      
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
      
      // Actions: Folder Exclusions
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
      
      // Utility: Get filter configuration for API
      getFilterConfig: () => {
        const state = get();
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
          excluded_folders: Array.from(state.excludedFolders)
        };
      },
      
      // Utility: Reset all filters to default
      resetFilters: () =>
        set({
          includeExtensions: '',
          excludeExtensions: '',
          sizeFilter: 'all',
          timeFilter: 'all',
          selectedFileTypes: new Set(),
          deepScan: false,
          deepScanTerms: [],
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
          ])
        }),
      
      // Utility: Load preset configuration
      loadPresetConfig: (config) =>
        set({
          includeExtensions: config.include_exts?.join(', ') || '',
          excludeExtensions: config.exclude_exts?.join(', ') || '',
          sizeFilter: config.size_filter || 'all',
          timeFilter: config.time_filter || 'all',
          selectedFileTypes: new Set(config.selected_types || []),
          deepScan: config.deep_scan || false,
          deepScanTerms: config.deep_scan_terms || [],
          deepScanMode: config.deep_scan_mode || 'any',
          excludedFolders: new Set(config.excluded_folders || [])
        })
    }),
    {
      name: 'file-filter-store',
      partialize: (state) => ({
        // Only persist these values, not UI state
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
      }
    }
  )
);

export default useFilterStore;