import React, { useState, useMemo } from "react";
import {
  FileText,
  Download,
  Settings2,
  ChevronUp,
  ChevronDown,
  Search,
  SortAsc,
  SortDesc,
  Folder,
  Calendar,
  HardDrive,
  FileType,
  X,
  Copy,
  CheckCircle2,
} from "lucide-react";
import usePreviewStore from "../../stores/usePreviewStore";
import useFilterStore from "../../stores/useFilterStore";
import useSettingsStore from "../../stores/useSettingsStore";
import { formatFileSize } from "../../services/api";
import { exportPreview } from "../../utils/exportUtils";

/**
 * PreviewSection Component
 *
 * Displays filtered file results in a paginated, sortable table with enhanced export options.
 * Features inline format selection and metadata toggle with direct link to settings.
 *
 * @component
 */
const PreviewSection = ({ onOpenSettings }) => {
  const { filteredFiles, duplicates } = usePreviewStore();
  const { dryRun } = useFilterStore();
  const {
    animationsEnabled,
    defaultExportFormat,
    setDefaultExportFormat,
    includeMetadataInExport,
    toggleMetadataInExport,
    showFileSize,
    showModifiedDate,
    showCreatedDate,
    showFileType,
    showFullPath,
    defaultItemsPerPage,
  } = useSettingsStore();

  // Local state for table controls
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  // Duplicates dialog state/hooks (must be before any early return)
  const [dupOpen, setDupOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const duplicateEntries = useMemo(() => {
    const obj = duplicates || {};
    return Object.entries(obj).filter(
      ([, paths]) => Array.isArray(paths) && paths.length > 1
    );
  }, [duplicates]);
  const duplicateCount = duplicateEntries.length;
  const copyPaths = async (paths) => {
    try {
      await navigator.clipboard.writeText(paths.join("\n"));
      // show a temporary “Copied” toast
      setCopiedToast(true);
      window.clearTimeout(copyPaths._t);
      copyPaths._t = window.setTimeout(() => setCopiedToast(false), 2000);
    } catch {}
  };

  // Safety check: ensure filteredFiles is an array (must be before early return)
  const safeFilteredFiles = Array.isArray(filteredFiles) ? filteredFiles : [];

  /**
   * Filter and sort files based on search and sort criteria
   */
  const processedFiles = useMemo(() => {
    let result = [...safeFilteredFiles];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (file) =>
          file.name.toLowerCase().includes(term) ||
          file.path.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let compareA, compareB;

      switch (sortBy) {
        case "name":
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
          break;
        case "size":
          compareA = a.size;
          compareB = b.size;
          break;
        case "modified":
          compareA = a.modified;
          compareB = b.modified;
          break;
        case "created":
          compareA = a.created;
          compareB = b.created;
          break;
        case "type":
          compareA = a.name.split(".").pop().toLowerCase();
          compareB = b.name.split(".").pop().toLowerCase();
          break;
        default:
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
      }

      if (compareA < compareB) return sortOrder === "asc" ? -1 : 1;
      if (compareA > compareB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [safeFilteredFiles, searchTerm, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(processedFiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFiles = processedFiles.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Don't show preview if dry run is disabled (after all hooks)
  if (!dryRun) return null;

  /**
   * Handle column header click for sorting
   */
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  /**
   * Export files in the selected format
   */
  const handleExport = async () => {
    try {
      // Use centralized export utility to generate and download the file.
      // It preserves date strings already present on file objects and avoids re-parsing.
      exportPreview(processedFiles, duplicates || {}, defaultExportFormat, {
        includeMetadata: includeMetadataInExport,
        // Keep timestamp and flat listing consistent with current UI
        useTimestamp: true,
        groupByType: false,
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export files. Please try again.");
    }
  };

  /**
   * Render sort icon for column headers
   */
  const SortIcon = ({ column }) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? (
      <SortAsc className="w-4 h-4" />
    ) : (
      <SortDesc className="w-4 h-4" />
    );
  };

  if (safeFilteredFiles.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
        <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          No Files Found
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Adjust your filters or select a source folder to begin scanning.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header with enhanced export controls */}
      <div className="flex items-center justify-between mb-4 p-6 pb-0">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Preview Results
        </h3>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {safeFilteredFiles.length} file
            {safeFilteredFiles.length !== 1 ? "s" : ""} found
          </span>

          {duplicateCount > 0 && (
            <button
              onClick={() => setDupOpen(true)}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 hover:shadow-sm"
              title="View duplicate filenames and their paths"
            >
              View duplicates ({duplicateCount})
            </button>
          )}

          {safeFilteredFiles.length > 0 && (
            <>
              {/* Metadata status badge - click to open settings */}
              <button
                onClick={onOpenSettings}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                  ${
                    includeMetadataInExport
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600"
                  }
                  hover:shadow-sm transition-all cursor-pointer
                `}
                title="Click to change export settings"
              >
                <Settings2 className="w-3.5 h-3.5" />
                {includeMetadataInExport ? "Metadata: On" : "Metadata: Off"}
              </button>

              {/* Format selector */}
              <select
                value={defaultExportFormat}
                onChange={(e) => setDefaultExportFormat(e.target.value)}
                className={`
                  px-3 py-2 text-sm font-medium rounded-lg
                  bg-white dark:bg-slate-800 
                  border border-slate-300 dark:border-slate-600
                  text-slate-700 dark:text-slate-300
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${animationsEnabled ? "transition-all" : ""}
                `}
              >
                <option value="txt">Text (.txt)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="json">JSON (.json)</option>
                <option value="md">Markdown (.md)</option>
                <option value="html">HTML (.html)</option>
              </select>

              {/* Export button */}
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
                Export as {defaultExportFormat.toUpperCase()}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search and controls */}
      <div className="px-6 pb-4 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
          <option value={250}>250 per page</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700">
            <tr>
              <th
                onClick={() => handleSort("name")}
                className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-2">
                  Name
                  <SortIcon column="name" />
                </div>
              </th>

              {showFileSize && (
                <th
                  onClick={() => handleSort("size")}
                  className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2">
                    Size
                    <SortIcon column="size" />
                  </div>
                </th>
              )}

              {showModifiedDate && (
                <th
                  onClick={() => handleSort("modified")}
                  className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2">
                    Modified
                    <SortIcon column="modified" />
                  </div>
                </th>
              )}

              {showCreatedDate && (
                <th
                  onClick={() => handleSort("created")}
                  className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2">
                    Created
                    <SortIcon column="created" />
                  </div>
                </th>
              )}

              {showFileType && (
                <th
                  onClick={() => handleSort("type")}
                  className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2">
                    Semantic Type
                    <SortIcon column="type" />
                  </div>
                </th>
              )}

              {showFileType && (
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Extension
                </th>
              )}

              {showFullPath && (
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Path
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {paginatedFiles.map((file, index) => (
              <tr
                key={index}
                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                  {file.name}
                </td>

                {showFileSize && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {formatFileSize(file.size)}
                  </td>
                )}

                {showModifiedDate && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {file.modified}
                  </td>
                )}

                {showCreatedDate && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {file.created}
                  </td>
                )}

                {showFileType && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                      {file.semantic_type || "Unclassified"}
                    </span>
                  </td>
                )}

                {showFileType && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 uppercase">
                    {file.name.split(".").pop()}
                  </td>
                )}

                {showFullPath && (
                  <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {file.path}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, processedFiles.length)} of{" "}
            {processedFiles.length} results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Previous
            </button>

            <span className="text-sm text-slate-600 dark:text-slate-400">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Duplicates Modal */}
      {dupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDupOpen(false)}
          />
          <div className="relative z-10 w-[90vw] max-w-3xl max-h-[80vh] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Duplicate filenames ({duplicateCount})
              </h4>
              <button
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setDupOpen(false)}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Scrollable body */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-5">
              {duplicateEntries.map(([name, paths]) => (
                <div
                  key={name}
                  className="rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between px-4 py-4 bg-slate-50 dark:bg-slate-800/60">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {name} <span className="text-slate-500">({paths.length})</span>
                    </div>
                    <button
                      onClick={() => copyPaths(paths)}
                      className="flex items-center gap-1 text-xs h-8 px-3 rounded border border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Copy all paths"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy paths
                    </button>
                  </div>
                  <ul className="px-4 py-3 space-y-1">
                    {paths.map((p, i) => (
                      <li key={i} className="font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all">
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {/* Fixed footer */}
            <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-700 text-right">
              <button
                onClick={() => setDupOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm"
              >
                Close
              </button>
            </div>

            {/* Copied toast */}
            {copiedToast && (
              <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs shadow">
                <CheckCircle2 className="w-4 h-4" />
                Paths copied
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewSection;
