/**
 * Preview Section Component
 * Displays filtered file results with sorting, searching, and pagination
 */

import React from "react";
import {
  FileText,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
} from "lucide-react";
import usePreviewStore from "../../stores/usePreviewStore";
import useFilterStore from "../../stores/useFilterStore";
import useSettingsStore from "../../stores/useSettingsStore";
import { exportPreview } from "../../utils/exportUtils";

const PreviewSection = () => {
  const {
    filteredFiles,
    duplicates,
    isLoading,
    error,
    sortBy,
    sortOrder,
    searchQuery,
    currentPage,
    selectedFiles,
    setSearchQuery,
    setSortBy,
    getPaginatedFiles,
    getPaginationInfo,
    toggleFileSelection,
    selectAll,
    deselectAll,
    exportAsText,
    exportAsCSV,
  } = usePreviewStore();

  const { dryRun } = useFilterStore();
  const {
    showFileSize,
    showModifiedDate,
    showCreatedDate,
    showFileType,
    showFullPath,
    animationsEnabled,
    defaultExportFormat,
  } = useSettingsStore();

  const paginatedFiles = getPaginatedFiles();
  const paginationInfo = getPaginationInfo();

  // Don't show if dry run is disabled
  if (!dryRun) {
    return null;
  }

  /**
   * Handle export functionality
   */
  const handleExport = () => {
    try {
      let content = "";
      let filename = "";
      let mimeType = "";

      if (defaultExportFormat === "csv") {
        content = exportAsCSV();
        filename = `file-filter-results-${Date.now()}.csv`;
        mimeType = "text/csv";
      } else if (defaultExportFormat === "json") {
        content = JSON.stringify({ files: filteredFiles, duplicates }, null, 2);
        filename = `file-filter-results-${Date.now()}.json`;
        mimeType = "application/json";
      } else {
        content = exportAsText();
        filename = `file-filter-results-${Date.now()}.txt`;
        mimeType = "text/plain";
      }

      // Create blob and download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export preview results.");
    }
  };

  /**
   * Render sort indicator
   */
  const renderSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 inline ml-1" />
    );
  };

  return (
    <div
      className={`
        bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-6 
        border border-slate-200 dark:border-slate-700
        ${animationsEnabled ? "animate-in slide-in-from-top duration-300" : ""}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Preview Results
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {filteredFiles.length} file{filteredFiles.length !== 1 ? "s" : ""}{" "}
            found
          </span>
          {filteredFiles.length > 0 && (
            <button
              onClick={handleExport}
              className={`
                flex items-center gap-2 px-4 py-2 
                bg-gradient-to-r from-green-600 to-emerald-600 text-white 
                rounded-lg hover:from-green-700 hover:to-emerald-700 
                shadow-md hover:shadow-lg text-sm font-medium
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                ${animationsEnabled ? "transition-all" : ""}
              `}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Duplicates Warning */}
      {Object.keys(duplicates).length > 0 && (
        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                {Object.keys(duplicates).length} duplicate filename
                {Object.keys(duplicates).length !== 1 ? "s" : ""} detected
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Files with the same name will be renamed automatically during
                copy
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {filteredFiles.length > 0 && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files by name, path, or type..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-12 text-center border-2 border-dashed border-slate-300 dark:border-slate-700">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">
            Loading preview results...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center border border-red-200 dark:border-red-800">
          <p className="text-red-900 dark:text-red-200 font-semibold">
            Error loading preview
          </p>
          <p className="text-red-700 dark:text-red-300 text-sm mt-2">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredFiles.length === 0 && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-12 text-center border-2 border-dashed border-slate-300 dark:border-slate-700">
          <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
            No files to preview yet
          </p>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
            Configure your filters and run a scan to see matching files
          </p>
        </div>
      )}

      {/* Results Table */}
      {!isLoading && !error && paginatedFiles.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedFiles.size === filteredFiles.length &&
                        filteredFiles.length > 0
                      }
                      onChange={(e) =>
                        e.target.checked ? selectAll() : deselectAll()
                      }
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th
                    onClick={() => setSortBy("name")}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Name {renderSortIcon("name")}
                  </th>
                  {showFileSize && (
                    <th
                      onClick={() => setSortBy("size")}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Size {renderSortIcon("size")}
                    </th>
                  )}
                  {showModifiedDate && (
                    <th
                      onClick={() => setSortBy("modified")}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Modified {renderSortIcon("modified")}
                    </th>
                  )}
                  {showCreatedDate && (
                    <th
                      onClick={() => setSortBy("created")}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Created {renderSortIcon("created")}
                    </th>
                  )}
                  {showFileType && (
                    <th
                      onClick={() => setSortBy("type")}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Type {renderSortIcon("type")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {paginatedFiles.map((file, index) => (
                  <tr
                    key={`${file.path}-${index}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.path)}
                        onChange={() => toggleFileSelection(file.path)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {file.name}
                        </div>
                        {showFullPath && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                            {file.path}
                          </div>
                        )}
                      </div>
                    </td>
                    {showFileSize && (
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {file.size_formatted}
                      </td>
                    )}
                    {showModifiedDate && (
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {file.modified}
                      </td>
                    )}
                    {showCreatedDate && (
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {file.created}
                      </td>
                    )}
                    {showFileType && (
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                          {file.semantic_type || "Unclassified"}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {paginationInfo.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Showing {paginationInfo.startIndex} to {paginationInfo.endIndex}{" "}
                of {paginationInfo.totalItems} files
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => usePreviewStore.getState().previousPage()}
                  disabled={!paginationInfo.hasPreviousPage}
                  className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Page {paginationInfo.currentPage} of{" "}
                  {paginationInfo.totalPages}
                </span>
                <button
                  onClick={() => usePreviewStore.getState().nextPage()}
                  disabled={!paginationInfo.hasNextPage}
                  className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PreviewSection;
