/**
 * Zustand Store for Application Settings
 * Manages theme, language, display preferences, and UI configuration
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
  persist(
    (set, get) => ({
      // Theme settings
      theme: 'system', // 'light', 'dark', 'system'
      
      // Language settings
      language: 'en-GB', // 'en-GB', 'en-US'
      
      // Preview display options
      showFileSize: true,
      showModifiedDate: true,
      showCreatedDate: false,
      showFileType: true,
      showFullPath: false,
      
      // UI preferences
      animationsEnabled: true,
      compactMode: false,
      
      // Table/Preview settings
      defaultItemsPerPage: 50,
      defaultSortBy: 'name',
      defaultSortOrder: 'asc',
      
      // Export settings
      defaultExportFormat: 'txt', // 'txt', 'csv', 'json'
      includeMetadataInExport: true,
      
      // Window settings (for Electron)
      windowWidth: 1200,
      windowHeight: 800,
      windowMaximised: false,
      
      // Recent folders (for quick access)
      recentSourceFolders: [],
      recentDestinationFolders: [],
      maxRecentFolders: 10,
      
      // Actions: Theme
      setTheme: (theme) => {
        set({ theme });
        get().applyTheme(theme);
      },
      
      applyTheme: (theme) => {
        const root = document.documentElement;
        
        if (theme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.toggle('dark', prefersDark);
        } else {
          root.classList.toggle('dark', theme === 'dark');
        }
      },
      
      // Actions: Language
      setLanguage: (language) => set({ language }),
      
      // Actions: Display options
      toggleFileSize: () => set((state) => ({ showFileSize: !state.showFileSize })),
      toggleModifiedDate: () => set((state) => ({ showModifiedDate: !state.showModifiedDate })),
      toggleCreatedDate: () => set((state) => ({ showCreatedDate: !state.showCreatedDate })),
      toggleFileType: () => set((state) => ({ showFileType: !state.showFileType })),
      toggleFullPath: () => set((state) => ({ showFullPath: !state.showFullPath })),
      
      setShowFileSize: (value) => set({ showFileSize: value }),
      setShowModifiedDate: (value) => set({ showModifiedDate: value }),
      setShowCreatedDate: (value) => set({ showCreatedDate: value }),
      setShowFileType: (value) => set({ showFileType: value }),
      setShowFullPath: (value) => set({ showFullPath: value }),
      
      // Actions: UI preferences
      toggleAnimations: () => set((state) => ({ animationsEnabled: !state.animationsEnabled })),
      toggleCompactMode: () => set((state) => ({ compactMode: !state.compactMode })),
      
      setAnimationsEnabled: (value) => set({ animationsEnabled: value }),
      setCompactMode: (value) => set({ compactMode: value }),
      
      // Actions: Table settings
      setDefaultItemsPerPage: (count) => set({ defaultItemsPerPage: count }),
      setDefaultSortBy: (field) => set({ defaultSortBy: field }),
      setDefaultSortOrder: (order) => set({ defaultSortOrder: order }),
      
      // Actions: Export settings
      setDefaultExportFormat: (format) => set({ defaultExportFormat: format }),
      toggleMetadataInExport: () =>
        set((state) => ({ includeMetadataInExport: !state.includeMetadataInExport })),
      
      // Actions: Window settings
      setWindowSize: (width, height) => set({ windowWidth: width, windowHeight: height }),
      setWindowMaximised: (maximised) => set({ windowMaximised: maximised }),
      
      // Actions: Recent folders
      addRecentSourceFolder: (folder) => {
        const { recentSourceFolders, maxRecentFolders } = get();
        const filtered = recentSourceFolders.filter(f => f !== folder);
        const updated = [folder, ...filtered].slice(0, maxRecentFolders);
        set({ recentSourceFolders: updated });
      },
      
      addRecentDestinationFolder: (folder) => {
        const { recentDestinationFolders, maxRecentFolders } = get();
        const filtered = recentDestinationFolders.filter(f => f !== folder);
        const updated = [folder, ...filtered].slice(0, maxRecentFolders);
        set({ recentDestinationFolders: updated });
      },
      
      clearRecentFolders: () =>
        set({
          recentSourceFolders: [],
          recentDestinationFolders: []
        }),
      
      // Utility: Reset all settings to defaults
      resetSettings: () =>
        set({
          theme: 'system',
          language: 'en-GB',
          showFileSize: true,
          showModifiedDate: true,
          showCreatedDate: false,
          showFileType: true,
          showFullPath: false,
          animationsEnabled: true,
          compactMode: false,
          defaultItemsPerPage: 50,
          defaultSortBy: 'name',
          defaultSortOrder: 'asc',
          defaultExportFormat: 'txt',
          includeMetadataInExport: true
        }),
      
      // Utility: Get display columns configuration
      getDisplayColumns: () => {
        const state = get();
        return {
          name: true, // Always show name
          size: state.showFileSize,
          modified: state.showModifiedDate,
          created: state.showCreatedDate,
          type: state.showFileType,
          path: state.showFullPath
        };
      },
      
      // Utility: Get theme class for components
      getThemeClass: () => {
        const { theme } = get();
        if (theme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          return prefersDark ? 'dark' : 'light';
        }
        return theme;
      },
      
      // Utility: Format text based on language settings
      formatText: (key) => {
        const { language } = get();
        
        // Simple text dictionary (can be expanded or moved to separate file)
        const texts = {
          'en-GB': {
            'folder': 'Folder',
            'colour': 'Colour',
            'initialise': 'Initialise',
            'organisation': 'Organisation',
            'analyse': 'Analyse',
            'optimise': 'Optimise',
            'centre': 'Centre'
          },
          'en-US': {
            'folder': 'Folder',
            'colour': 'Color',
            'initialise': 'Initialize',
            'organisation': 'Organization',
            'analyse': 'Analyze',
            'optimise': 'Optimize',
            'centre': 'Center'
          }
        };
        
        return texts[language]?.[key] || key;
      }
    }),
    {
      name: 'file-filter-settings',
      onRehydrateStorage: () => (state) => {
        // Apply theme when settings are loaded from storage
        if (state) {
          state.applyTheme(state.theme);
        }
      }
    }
  )
);

// Apply theme on initial load and listen for system theme changes
if (typeof window !== 'undefined') {
  const store = useSettingsStore.getState();
  store.applyTheme(store.theme);
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const currentTheme = useSettingsStore.getState().theme;
    if (currentTheme === 'system') {
      useSettingsStore.getState().applyTheme('system');
    }
  });
}

export default useSettingsStore;