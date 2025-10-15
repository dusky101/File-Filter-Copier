/**
 * Zustand Store for Preview Data Management
 * Manages file preview results, sorting, filtering, and pagination
 */

import { create } from 'zustand';

const usePreviewStore = create((set, get) => ({
  // Preview data
  files: [],
  filteredFiles: [],
  totalFiles: 0,
  duplicates: {},
  
  // Loading and error states
  isLoading: false,
  error: null,
  
  // Sort configuration
  sortBy: 'name', // 'name', 'size', 'modified', 'created', 'type'
  sortOrder: 'asc', // 'asc', 'desc'
  
  // Search filter
  searchQuery: '',
  
  // Pagination
  currentPage: 1,
  itemsPerPage: 50,
  
  // Selection
  selectedFiles: new Set(),
  
  // Actions: Set preview data
  setFiles: (files) => {
    set({
      files,
      filteredFiles: files,
      totalFiles: files.length,
      currentPage: 1
    });
    // Apply current search and sort
    get().applyFiltersAndSort();
  },
  
  setDuplicates: (duplicates) => set({ duplicates }),
  
  // Actions: Loading states
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  // Actions: Sorting
  setSortBy: (field) => {
    const currentSortBy = get().sortBy;
    const currentSortOrder = get().sortOrder;
    
    // If clicking the same field, toggle order
    if (currentSortBy === field) {
      set({ sortOrder: currentSortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      set({ sortBy: field, sortOrder: 'asc' });
    }
    
    get().applyFiltersAndSort();
  },
  
  setSortOrder: (order) => {
    set({ sortOrder: order });
    get().applyFiltersAndSort();
  },
  
  // Actions: Search
  setSearchQuery: (query) => {
    set({ searchQuery: query, currentPage: 1 });
    get().applyFiltersAndSort();
  },
  
  // Actions: Pagination
  setCurrentPage: (page) => set({ currentPage: page }),
  setItemsPerPage: (count) => {
    set({ itemsPerPage: count, currentPage: 1 });
  },
  
  nextPage: () => {
    const { currentPage, filteredFiles, itemsPerPage } = get();
    const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
    if (currentPage < totalPages) {
      set({ currentPage: currentPage + 1 });
    }
  },
  
  previousPage: () => {
    const { currentPage } = get();
    if (currentPage > 1) {
      set({ currentPage: currentPage - 1 });
    }
  },
  
  // Actions: Selection
  toggleFileSelection: (filePath) => {
    const selectedFiles = new Set(get().selectedFiles);
    if (selectedFiles.has(filePath)) {
      selectedFiles.delete(filePath);
    } else {
      selectedFiles.add(filePath);
    }
    set({ selectedFiles });
  },
  
  selectAll: () => {
    const { filteredFiles } = get();
    set({ selectedFiles: new Set(filteredFiles.map(f => f.path)) });
  },
  
  deselectAll: () => {
    set({ selectedFiles: new Set() });
  },
  
  // Utility: Apply filters and sorting
  applyFiltersAndSort: () => {
    const { files, searchQuery, sortBy, sortOrder } = get();
    
    // Filter by search query
    let filtered = files;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = files.filter(file =>
        file.name.toLowerCase().includes(query) ||
        file.path.toLowerCase().includes(query) ||
        (file.semantic_type && file.semantic_type.toLowerCase().includes(query))
      );
    }
    
    // Sort files
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'modified':
          comparison = new Date(a.modified) - new Date(b.modified);
          break;
        case 'created':
          comparison = new Date(a.created) - new Date(b.created);
          break;
        case 'type':
          const typeA = a.semantic_type || '';
          const typeB = b.semantic_type || '';
          comparison = typeA.localeCompare(typeB);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    set({ filteredFiles: sorted });
  },
  
  // Utility: Get paginated files
  getPaginatedFiles: () => {
    const { filteredFiles, currentPage, itemsPerPage } = get();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredFiles.slice(startIndex, endIndex);
  },
  
  // Utility: Get pagination info
  getPaginationInfo: () => {
    const { filteredFiles, currentPage, itemsPerPage } = get();
    const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(startIndex + itemsPerPage - 1, filteredFiles.length);
    
    return {
      totalPages,
      currentPage,
      startIndex,
      endIndex,
      totalItems: filteredFiles.length,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    };
  },
  
  // Utility: Get selected file paths
  getSelectedFilePaths: () => {
    return Array.from(get().selectedFiles);
  },
  
  // Utility: Clear all preview data
  clearPreview: () =>
    set({
      files: [],
      filteredFiles: [],
      totalFiles: 0,
      duplicates: {},
      error: null,
      searchQuery: '',
      currentPage: 1,
      selectedFiles: new Set()
    }),
  
  // Utility: Export preview data as text
  exportAsText: () => {
    const { filteredFiles, duplicates } = get();
    
    let output = '🔎 Preview Results\n';
    output += '----------------------------------------\n';
    
    filteredFiles.forEach(file => {
      const type = file.semantic_type ? `[${file.semantic_type}]` : '[Unclassified]';
      output += `${file.name}  ←  ${file.path}  ${type}\n`;
    });
    
    if (Object.keys(duplicates).length > 0) {
      output += '\n⚠️  Duplicate Files Detected\n';
      output += '----------------------------------------\n';
      Object.entries(duplicates).forEach(([name, paths]) => {
        output += `${name} (${paths.length} copies)\n`;
        paths.forEach(path => output += `  → ${path}\n`);
      });
    }
    
    output += `\n📊 Total Files: ${filteredFiles.length}\n`;
    
    return output;
  },
  
  // Utility: Export preview data as CSV
  exportAsCSV: () => {
    const { filteredFiles } = get();
    
    let csv = 'Name,Path,Size,Size (Formatted),Modified,Created,Type\n';
    
    filteredFiles.forEach(file => {
      const row = [
        `"${file.name}"`,
        `"${file.path}"`,
        file.size,
        `"${file.size_formatted}"`,
        `"${file.modified}"`,
        `"${file.created}"`,
        `"${file.semantic_type}"`
      ];
      csv += row.join(',') + '\n';
    });
    
    return csv;
  }
}));

export default usePreviewStore;