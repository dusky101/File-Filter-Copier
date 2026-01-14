import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  FileText,
  Download,
  Settings2,
  Search,
  Filter,
  X,
  Copy,
  CheckCircle2,
  Loader2,
  FolderCheck,
} from "lucide-react";
import usePreviewStore from "../../stores/usePreviewStore";
import useFilterStore from "../../stores/useFilterStore";
import useSettingsStore from "../../stores/useSettingsStore";
import { exportPreview } from "../../utils/exportUtils";
import PreviewSectionTable from "./PreviewSectionTable";
import { copyFiles } from "../../services/api";

/**
 * PreviewSection Component
 *
 * Displays filtered file results in a paginated, sortable table with enhanced export options.
 * "Copy Selected" action now uses the global Organisation setting from the main app.
 */
const PreviewSection = ({ onOpenSettings }) => {
  const { filteredFiles, duplicates } = usePreviewStore();

  const {
    dryRun,
    destinationFolder,
    outputFolderName,
    sourceFolder, // Needed for 'preserve' mode
    copyStructure, // Use global structure setting
  } = useFilterStore();

  const {
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
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage || 50);

  // Selection state (by file.path)
  const [selectedFiles, setSelectedFiles] = useState(() => new Set());

  // Copy Selected State
  const [isCopyingSelected, setIsCopyingSelected] = useState(false);
  const [copyResult, setCopyResult] = useState(null);

  // Duplicates dialog state
  const [dupOpen, setDupOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Extension filter UI state
  const [extFilterOpen, setExtFilterOpen] = useState(false);
  const [extFilterQuery, setExtFilterQuery] = useState("");
  const [extSelected, setExtSelected] = useState(() => new Set());
  const [extAll, setExtAll] = useState(true);
  const extPopoverRef = useRef(null);

  // Helpers
  const getExtLower = (f) => {
    if (!f?.name) return "";
    const i = f.name.lastIndexOf(".");
    return i > 0 ? f.name.slice(i + 1).toLowerCase() : "";
  };
  const getExtUpper = (f) => getExtLower(f).toUpperCase();

  // Safety check
  const safeFilteredFiles = Array.isArray(filteredFiles) ? filteredFiles : [];

  // Sync itemsPerPage
  useEffect(() => {
    setItemsPerPage(defaultItemsPerPage || 50);
  }, [defaultItemsPerPage]);

  // Close popover
  useEffect(() => {
    const onDocClick = (e) => {
      if (!extFilterOpen) return;
      if (extPopoverRef.current && !extPopoverRef.current.contains(e.target)) {
        setExtFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [extFilterOpen]);

  // Compute available extensions
  const allExtensions = useMemo(() => {
    const s = new Set();
    for (const f of safeFilteredFiles) {
      const ext = getExtUpper(f);
      if (ext) s.add(ext);
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [safeFilteredFiles]);

  // Sync selection with options
  useEffect(() => {
    if (extAll) {
      setExtSelected(new Set(allExtensions));
    } else {
      setExtSelected(
        (prev) => new Set([...prev].filter((e) => allExtensions.includes(e)))
      );
    }
  }, [allExtensions, extAll]);

  const filteredExtOptions = useMemo(() => {
    const q = extFilterQuery.trim().toLowerCase();
    if (!q) return allExtensions;
    return allExtensions.filter((e) => e.toLowerCase().includes(q));
  }, [extFilterQuery, allExtensions]);

  const extFilterIsActive = !extAll;

  // Filter and sort
  const processedFiles = useMemo(() => {
    let result = [...safeFilteredFiles];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (file) =>
          file.name.toLowerCase().includes(term) ||
          file.path.toLowerCase().includes(term)
      );
    }

    if (!extAll) {
      if (extSelected.size === 0) result = [];
      else result = result.filter((f) => extSelected.has(getExtUpper(f)));
    }

    result.sort((a, b) => {
      let valA, valB;

      // --- UPDATED SORTING LOGIC ---
      if (sortBy.startsWith("metadata.")) {
        // Handle metadata keys like "metadata.model" or "metadata.iso"
        const key = sortBy.split(".")[1];
        valA = a.metadata?.[key] || "";
        valB = b.metadata?.[key] || "";
      } else {
        switch (sortBy) {
          case "name":
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
            break;
          case "size":
            valA = a.size;
            valB = b.size;
            break;
          case "modified":
            valA = a.modified;
            valB = b.modified;
            break;
          case "created":
            valA = a.created;
            valB = b.created;
            break;
          case "ext":
            valA = getExtLower(a);
            valB = getExtLower(b);
            break;
          case "searchType":
            const st = (f) =>
              (Array.isArray(f.search_tags) && f.search_tags.length
                ? f.search_tags.join(", ")
                : f.semantic_type || "Unclassified"
              ).toLowerCase();
            valA = st(a);
            valB = st(b);
            break;
          default:
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
        }
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [safeFilteredFiles, searchTerm, sortBy, sortOrder, extSelected, extAll]);

  // Maintain selection validity
  useEffect(() => {
    if (selectedFiles.size === 0) return;
    const valid = new Set(processedFiles.map((f) => f.path));
    setSelectedFiles((prev) => {
      let changed = false;
      const next = new Set();
      for (const p of prev) {
        if (valid.has(p)) next.add(p);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [processedFiles]);

  const totalPages = Math.ceil(processedFiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFiles = processedFiles.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // --- Handlers ---

  const toggleFileSelection = (path) =>
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const deselectAll = () => setSelectedFiles(new Set());
  const selectAll = (all = []) =>
    setSelectedFiles(new Set(all.map((f) => f.path)));

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleExport = async () => {
    try {
      exportPreview(processedFiles, duplicates || {}, defaultExportFormat, {
        includeMetadata: includeMetadataInExport,
        useTimestamp: true,
        groupByType: false,
        selectedPaths: selectedFiles,
        selectionKey: "path",
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export files. Please try again.");
    }
  };

  const handleCopySelected = async () => {
    try {
      if (!destinationFolder || !outputFolderName) {
        alert(
          "Please select a Destination Folder and Output Name in the main configuration above."
        );
        return;
      }
      const filesToCopy = processedFiles
        .filter((f) => selectedFiles.has(f.path))
        .map((f) => f.path);

      if (filesToCopy.length === 0) {
        alert("No selected rows to copy.");
        return;
      }

      setIsCopyingSelected(true);
      const res = await copyFiles({
        files: filesToCopy,
        destination: destinationFolder,
        outputFolder: outputFolderName,
        // Uses the global structure setting from store
        structure: copyStructure || "flat",
        source_folder: sourceFolder,
      });

      if (res?.success) {
        setCopyResult({
          count: res.data.copied_count,
          path: res.data.output_path,
        });
        setSelectedFiles(new Set());
      } else {
        alert(`❌ Copy failed: ${res?.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error("Copy selected failed:", e);
      alert("❌ Failed to copy selected files. Please try again.");
    } finally {
      setIsCopyingSelected(false);
    }
  };

  // --- Duplicate Logic ---
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
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    } catch {}
  };

  // --- Standard Columns Definition (Memoized) ---
  // This prevents column regeneration on every render
  const standardColumns = useMemo(() => {
    return [
      { key: "name", label: "Name", getValue: (f) => f.name },
      {
        key: "searchType",
        label: "Search Type",
        getValue: (f) =>
          Array.isArray(f.search_tags) && f.search_tags.length
            ? f.search_tags.join(", ")
            : f.semantic_type || "Unclassified",
        renderCell: (f) =>
          Array.isArray(f.search_tags) && f.search_tags.length ? (
            <div className="flex flex-wrap gap-1">
              {f.search_tags.map((t, i) => (
                <span
                  key={i}
                  className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {f.semantic_type || "Unclassified"}
            </span>
          ),
      },
      ...(showFileSize
        ? [
            {
              key: "size",
              label: "Size",
              getValue: (f) => f.size_formatted || "",
            },
          ]
        : []),
      ...(showModifiedDate
        ? [
            {
              key: "modified",
              label: "Modified",
              getValue: (f) => f.modified || "",
            },
          ]
        : []),
      ...(showCreatedDate
        ? [
            {
              key: "created",
              label: "Created",
              getValue: (f) => f.created || "",
            },
          ]
        : []),
      ...(showFileType
        ? [
            {
              key: "ext",
              label: "Extension",
              getValue: (f) => getExtUpper(f),
              headerExtra: () => (
                <span className="ml-1 inline-flex items-center">
                  <button
                    title="Filter by extension"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExtFilterOpen((v) => !v);
                    }}
                    className={`p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60 ${
                      extFilterIsActive ? "text-blue-600" : "text-slate-500"
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                  </button>
                  {extFilterOpen && (
                    <div
                      ref={extPopoverRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-full right-6 mt-2 z-50 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-3"
                    >
                      <div className="text-xs font-semibold mb-2 text-slate-900 dark:text-white">
                        Filter: Extension
                      </div>
                      <div className="mb-2">
                        <input
                          value={extFilterQuery}
                          onChange={(e) => setExtFilterQuery(e.target.value)}
                          placeholder="Search extensions..."
                          className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="max-h-56 overflow-auto pr-1">
                        <label className="flex items-center gap-2 py-1 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 px-1 rounded text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={extAll}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setExtAll(checked);
                              setExtSelected(
                                checked ? new Set(allExtensions) : new Set()
                              );
                            }}
                          />
                          <span>(Show All)</span>
                        </label>
                        {filteredExtOptions.map((ext) => {
                          const checked = extAll ? true : extSelected.has(ext);
                          return (
                            <label
                              key={ext}
                              className="flex items-center gap-2 py-1 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 px-1 rounded text-slate-700 dark:text-slate-300"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setExtSelected((prev) => {
                                    const next = extAll
                                      ? new Set(allExtensions)
                                      : new Set(prev);
                                    if (e.target.checked) next.add(ext);
                                    else next.delete(ext);
                                    const allOn =
                                      next.size >= allExtensions.length;
                                    setExtAll(allOn);
                                    return allOn
                                      ? new Set(allExtensions)
                                      : next;
                                  });
                                }}
                              />
                              <span>{ext}</span>
                            </label>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex gap-2">
                          <button
                            className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            onClick={() => {
                              setExtAll(true);
                              setExtSelected(new Set(allExtensions));
                            }}
                          >
                            Select All
                          </button>
                          <button
                            className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            onClick={() => {
                              setExtAll(false);
                              setExtSelected(new Set());
                            }}
                          >
                            Clear
                          </button>
                        </div>
                        <button
                          className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                          onClick={() => setExtFilterOpen(false)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </span>
              ),
            },
          ]
        : []),
      ...(showFullPath
        ? [{ key: "path", label: "Path", getValue: (f) => f.path }]
        : []),
    ];
  }, [
    showFileSize,
    showModifiedDate,
    showCreatedDate,
    showFileType,
    showFullPath,
    extFilterIsActive,
    extFilterOpen,
    extFilterQuery,
    filteredExtOptions,
    allExtensions,
    extAll,
    extSelected,
  ]);

  // --- Render ---

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

  // Only show if Dry Run is enabled
  if (!dryRun) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
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
            >
              View duplicates ({duplicateCount})
            </button>
          )}

          {/* Export Controls */}
          <div className="flex items-center gap-2">
            <select
              value={defaultExportFormat}
              onChange={(e) => setDefaultExportFormat(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="html">HTML Report</option>
              <option value="csv">CSV Spreadsheet</option>
              <option value="json">JSON Data</option>
              <option value="txt">Text List</option>
              <option value="md">Markdown</option>
            </select>

            <button
              onClick={toggleMetadataInExport}
              title={`Metadata is ${includeMetadataInExport ? "ON" : "OFF"}`}
              className={`p-2 rounded-lg border transition-all ${
                includeMetadataInExport
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400"
              }`}
            >
              <Settings2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium shadow hover:shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>

          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search & Pagination Controls */}
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
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
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

      {/* Copy Selected Toolbar */}
      <div className="px-6 pb-3 flex items-center justify-between">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {selectedFiles.size > 0
            ? `${selectedFiles.size} selected`
            : "No rows selected"}
          {selectedFiles.size > 0
            ? ` of ${processedFiles.length} result${
                processedFiles.length !== 1 ? "s" : ""
              }`
            : ""}
        </div>

        <div className="flex items-center gap-2">
          {selectedFiles.size > 0 && (
            <button
              onClick={handleCopySelected}
              disabled={isCopyingSelected}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Copy selected files using the Organisation setting above"
            >
              {isCopyingSelected ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Copying...
                </>
              ) : (
                <>
                  <FolderCheck className="w-4 h-4" />
                  Copy Selected
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <PreviewSectionTable
        files={paginatedFiles}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        selectedFiles={selectedFiles}
        toggleFileSelection={toggleFileSelection}
        selectAll={() => selectAll(processedFiles)}
        deselectAll={deselectAll}
        selectionKey="path"
        totalSelectableCount={processedFiles.length}
        columns={standardColumns}
      />

      {/* Pagination Footer */}
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

      {/* Success Toast */}
      {copyResult && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in">
          <div className="bg-white dark:bg-slate-800 border border-green-200 dark:border-green-900/50 shadow-lg rounded-xl p-4 flex items-start gap-3 max-w-sm">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">
                Files Copied Successfully
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Copied <strong>{copyResult.count}</strong> files to:
              </p>
              <div className="mt-2 text-xs font-mono bg-slate-100 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 break-all">
                {copyResult.path}
              </div>
              <button
                onClick={() => setCopyResult(null)}
                className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicates Modal */}
      {dupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Copy className="w-5 h-5 text-amber-500" />
                  Duplicate Filenames
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Files with identical names in different locations
                </p>
              </div>
              <button
                onClick={() => setDupOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {duplicateEntries.map(([name, paths]) => (
                <div
                  key={name}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 overflow-hidden"
                >
                  <div className="bg-white dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      {name}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(paths.join("\n"));
                        setCopiedToast(true);
                        setTimeout(() => setCopiedToast(false), 2000);
                      }}
                      className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded transition-colors"
                      title="Copy all paths"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy paths
                    </button>
                  </div>
                  <ul className="px-4 py-3 space-y-1">
                    {paths.map((p, i) => (
                      <li
                        key={i}
                        className="font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all"
                      >
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
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>

            {/* Copied toast */}
            {copiedToast && (
              <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs shadow-lg animate-in slide-in-from-bottom-2 fade-in">
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
