import React, { useState, useMemo, useRef, useEffect } from "react";
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
  Filter, // + add filter icon
} from "lucide-react";
import usePreviewStore from "../../stores/usePreviewStore";
import useFilterStore from "../../stores/useFilterStore";
import useSettingsStore from "../../stores/useSettingsStore";
import { formatFileSize } from "../../services/api";
import { exportPreview } from "../../utils/exportUtils";
import PreviewSectionTable from "./PreviewSectionTable";

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

  // Helper: consistent extension extraction (upper for display, lower for logic)
  const getExtLower = (f) => {
    if (!f?.name) return "";
    const i = f.name.lastIndexOf(".");
    return i > 0 ? f.name.slice(i + 1).toLowerCase() : "";
  };
  const getExtUpper = (f) => getExtLower(f).toUpperCase();

  // Extension filter UI state (Excel-like for the header)
  const [extFilterOpen, setExtFilterOpen] = useState(false);
  const [extFilterQuery, setExtFilterQuery] = useState("");
  // Selected extensions + "all selected" flag
  const [extSelected, setExtSelected] = useState(() => new Set());
  const [extAll, setExtAll] = useState(true); // NEW: true = all ticks shown
  const extPopoverRef = useRef(null);

  // Close popover on outside click
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

  // All extensions present in current result set (pre-filter)
  const allExtensions = useMemo(() => {
    const s = new Set();
    for (const f of safeFilteredFiles) {
      const ext = getExtUpper(f);
      if (ext) s.add(ext);
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [safeFilteredFiles]);

  // Keep selection in sync with available options
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

  /**
   * Filter and sort files based on search, extension filter and sort criteria
   */
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

    // Apply extension filter
    if (!extAll) {
      if (extSelected.size === 0) {
        result = [];
      } else {
        result = result.filter((f) => extSelected.has(getExtUpper(f)));
      }
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
        case "type": // legacy alias, keep for safety
        case "ext": // fix: allow sorting by the Extension column key
          compareA = getExtLower(a);
          compareB = getExtLower(b);
          break;
        case "searchType":
          const st = (f) =>
            (Array.isArray(f.search_tags) && f.search_tags.length
              ? f.search_tags.join(", ")
              : f.semantic_type || "Unclassified"
            ).toLowerCase();
          compareA = st(a);
          compareB = st(b);
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
  }, [safeFilteredFiles, searchTerm, sortBy, sortOrder, extSelected, extAll]);

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

  const searchTypeFor = (f) => {
    if (Array.isArray(f.search_tags) && f.search_tags.length) {
      return f.search_tags.join(", ");
    }
    return f.semantic_type || "Unclassified";
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
                onClick={() => toggleMetadataInExport()} // click toggles ON/OFF
                onContextMenu={(e) => {
                  e.preventDefault();
                  onOpenSettings
                    ? onOpenSettings()
                    : window.dispatchEvent(new CustomEvent("open-settings"));
                }}
                onMouseDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && onOpenSettings) {
                    e.preventDefault();
                    onOpenSettings(); // Cmd/Ctrl+Click opens Settings
                  }
                }}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                  ${includeMetadataInExport ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600"}
                  hover:shadow-sm transition-all cursor-pointer
                `}
                title="Click to toggle metadata. Right‑click or Cmd/Ctrl+Click to open Settings."
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
      <PreviewSectionTable
        files={paginatedFiles}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        columns={[
          { key: "name", label: "Name", getValue: (f) => f.name },
          {
            key: "searchType",
            label: "Search Type",
            getValue: (f) => searchTypeFor(f),
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
                  {searchTypeFor(f)}
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
                  // Header extra: Excel-like filter control
                  headerExtra: () => (
                    <span className="ml-1 inline-flex items-center">
                      <button
                        title="Filter by extension"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExtFilterOpen((v) => !v);
                        }}
                        className={`p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60 ${extFilterIsActive ? "text-blue-600" : "text-slate-500"}`}
                      >
                        <Filter className="w-3.5 h-3.5" />
                      </button>
                      {extFilterOpen && (
                        <div
                          ref={extPopoverRef}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-full right-6 mt-2 z-50 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-3"
                        >
                          <div className="text-xs font-semibold mb-2">
                            Filter: Extension
                          </div>
                          <div className="mb-2">
                            <input
                              value={extFilterQuery}
                              onChange={(e) =>
                                setExtFilterQuery(e.target.value)
                              }
                              placeholder="Search extensions..."
                              className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                            />
                          </div>
                          <div className="max-h-56 overflow-auto pr-1">
                            <label className="flex items-center gap-2 py-1 text-sm">
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
                              const checked = extAll
                                ? true
                                : extSelected.has(ext);
                              return (
                                <label
                                  key={ext}
                                  className="flex items-center gap-2 py-1 text-sm"
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
                                className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600"
                                onClick={() => {
                                  setExtAll(true);
                                  setExtSelected(new Set(allExtensions));
                                }}
                              >
                                Select All
                              </button>
                              <button
                                className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600"
                                onClick={() => {
                                  setExtAll(false);
                                  setExtSelected(new Set());
                                }}
                              >
                                Clear
                              </button>
                            </div>
                            <button
                              className="text-xs px-3 py-1 rounded bg-blue-600 text-white"
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
        ]}
      />

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
                      {name}{" "}
                      <span className="text-slate-500">({paths.length})</span>
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
