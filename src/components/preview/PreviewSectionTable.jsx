import React, { useEffect, useRef, useState, useMemo } from "react";
import useFilterStore from "../../stores/useFilterStore";
import useSettingsStore from "../../stores/useSettingsStore";

// Helper to sanitize width
const px = (n) => `${Math.max(60, Math.min(1200, n || 150))}px`;

const PreviewSectionTable = ({
  files,
  columns,
  sortBy,
  sortOrder,
  onSort,
  selectedFiles,
  toggleFileSelection,
  selectAll,
  deselectAll,
  selectionKey = "path",
  totalSelectableCount,
}) => {
  const { photoMode } = useFilterStore();
  const {
    showCamera,
    showLens,
    showISO,
    showAperture,
    showShutter,
    showDimensions,
    showLocation,
  } = useSettingsStore();

  // --- DYNAMIC COLUMNS LOGIC ---
  const effectiveColumns = useMemo(() => {
    if (!photoMode) return columns;

    const newCols = [...columns];
    const nameIndex = newCols.findIndex(
      (c) => c.key.toLowerCase() === "name" || c.label?.toLowerCase() === "name"
    );
    const insertIndex = nameIndex >= 0 ? nameIndex + 1 : newCols.length;

    const photoCols = [];
    if (showCamera)
      photoCols.push({
        key: "metadata.model",
        label: "Camera",
        width: 180,
        getValue: (f) => f.metadata?.model || "-",
        sortable: true,
      });
    if (showLens)
      photoCols.push({
        key: "metadata.lens",
        label: "Lens",
        width: 200,
        getValue: (f) => f.metadata?.lens || "-",
        sortable: true,
      });
    if (showISO)
      photoCols.push({
        key: "metadata.iso",
        label: "ISO",
        width: 80,
        getValue: (f) => f.metadata?.iso || "-",
        sortable: true,
      });
    if (showAperture)
      photoCols.push({
        key: "metadata.aperture",
        label: "Aperture",
        width: 90,
        getValue: (f) => f.metadata?.aperture || "-",
        sortable: true,
      });
    if (showShutter)
      photoCols.push({
        key: "metadata.shutter_speed",
        label: "Shutter",
        width: 100,
        getValue: (f) => f.metadata?.shutter_speed || "-",
        sortable: true,
      });
    if (showDimensions)
      photoCols.push({
        key: "metadata.dimensions",
        label: "Dimensions",
        width: 120,
        getValue: (f) => f.metadata?.dimensions || "-",
        sortable: true,
      });
    if (showLocation)
      photoCols.push({
        key: "metadata.location",
        label: "Location",
        width: 180,
        getValue: (f) => f.metadata?.location || "-",
        sortable: true,
      });

    newCols.splice(insertIndex, 0, ...photoCols);
    return newCols;
  }, [
    columns,
    photoMode,
    showCamera,
    showLens,
    showISO,
    showAperture,
    showShutter,
    showDimensions,
    showLocation,
  ]);

  // --- RESIZING LOGIC ---
  const [colWidths, setColWidths] = useState({});

  // Sync widths when columns change
  useEffect(() => {
    setColWidths((prev) => {
      const next = { ...prev };
      effectiveColumns.forEach((c) => {
        if (next[c.key] === undefined) {
          next[c.key] = c.width || 150;
        }
      });
      return next;
    });
  }, [effectiveColumns]);

  // --- NEW: Calculate Total Table Width ---
  // This allows the table to expand beyond 100% and scroll horizontally
  const totalTableWidth = useMemo(() => {
    const checkboxWidth = selectedFiles ? 50 : 0;
    const colsWidth = effectiveColumns.reduce((acc, c) => {
      return acc + (colWidths[c.key] || c.width || 150);
    }, 0);
    return checkboxWidth + colsWidth;
  }, [effectiveColumns, colWidths, selectedFiles]);

  const selectionEnabled =
    selectedFiles instanceof Set && typeof toggleFileSelection === "function";
  const headerCheckboxRef = useRef(null);
  const totalCount = totalSelectableCount ?? files.length;
  const allSelectedGlobal =
    selectionEnabled && totalCount > 0 && selectedFiles.size >= totalCount;
  const someSelectedGlobal =
    selectionEnabled && selectedFiles.size > 0 && !allSelectedGlobal;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelectedGlobal;
    }
  }, [someSelectedGlobal]);

  const [sel, setSel] = useState(null);
  const selectingRef = useRef(false);

  const cellMouseDown = (r, c, e) => {
    if (e.shiftKey && sel) {
      setSel((prev) => ({ ...prev, re: r, ce: c }));
    } else {
      selectingRef.current = true;
      setSel({ rs: r, cs: c, re: r, ce: c });
    }
  };

  const cellMouseEnter = (r, c) => {
    if (selectingRef.current) {
      setSel((prev) => ({ ...prev, re: r, ce: c }));
    }
  };

  const endSelection = () => {
    selectingRef.current = false;
  };

  useEffect(() => {
    window.addEventListener("mouseup", endSelection);
    return () => window.removeEventListener("mouseup", endSelection);
  }, []);

  useEffect(() => {
    const handleCopy = (e) => {
      if (!sel) return;
      const r1 = Math.min(sel.rs, sel.re);
      const r2 = Math.max(sel.rs, sel.re);
      const c1 = Math.min(sel.cs, sel.ce);
      const c2 = Math.max(sel.cs, sel.ce);

      const rows = [];
      for (let i = r1; i <= r2; i++) {
        const rowData = [];
        for (let j = c1; j <= c2; j++) {
          const col = effectiveColumns[j];
          const f = files[i];
          const val = col.getValue ? col.getValue(f) : f[col.key];
          rowData.push(val ?? "");
        }
        rows.push(rowData.join("\t"));
      }
      e.clipboardData.setData("text/plain", rows.join("\n"));
      e.preventDefault();
    };
    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, [sel, files, effectiveColumns]);

  const isSelected = (r, c) => {
    if (!sel) return false;
    const r1 = Math.min(sel.rs, sel.re);
    const r2 = Math.max(sel.rs, sel.re);
    const c1 = Math.min(sel.cs, sel.ce);
    const c2 = Math.max(sel.cs, sel.ce);
    return r >= r1 && r <= r2 && c >= c1 && c <= c2;
  };

  const handleResizeStart = (e, key) => {
    e.preventDefault();
    e.stopPropagation(); // Stop sorting event
    const startX = e.clientX;
    const startW = colWidths[key] || 150;

    const onMove = (mv) => {
      const diff = mv.clientX - startX;
      setColWidths((prev) => ({ ...prev, [key]: Math.max(50, startW + diff) }));
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleHeaderClick = (col) => {
    if (onSort && col.sortable !== false) {
      onSort(col.key);
    }
  };

  const getSortIcon = (key) => {
    if (sortBy !== key) return null;
    return sortOrder === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="flex-1 overflow-auto relative select-none">
      <table
        className="border-collapse text-left relative"
        // --- KEY CHANGE: Fixed layout + calculated width ---
        style={{ width: `${totalTableWidth}px`, tableLayout: "fixed" }}
      >
        <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs uppercase font-semibold shadow-sm">
          <tr>
            {selectionEnabled && (
              <th
                className="sticky left-0 z-20 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-center border-b border-r border-slate-200 dark:border-slate-700"
                style={{ width: "50px" }} // Fixed width for checkbox
              >
                <input
                  type="checkbox"
                  ref={headerCheckboxRef}
                  checked={allSelectedGlobal}
                  onChange={(e) => {
                    if (e.target.checked) selectAll?.();
                    else deselectAll?.();
                  }}
                  className="rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
                />
              </th>
            )}

            {effectiveColumns.map((c) => (
              <th
                key={c.key}
                style={{ width: px(colWidths[c.key] || c.width) }}
                className="group px-4 py-2 border-b border-r border-slate-200 dark:border-slate-700 whitespace-nowrap overflow-hidden relative"
              >
                <div
                  className={`flex items-center gap-1 ${onSort ? "cursor-pointer hover:text-primary" : ""}`}
                  onClick={() => handleHeaderClick(c)}
                >
                  {c.label}
                  <span className="text-xs font-bold text-primary">
                    {getSortIcon(c.key)}
                  </span>
                </div>
                {/* Resizer Handle */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400/50 z-10"
                  onMouseDown={(e) => handleResizeStart(e, c.key)}
                  onClick={(e) => e.stopPropagation()}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
          {files.map((f, ri) => (
            <tr
              key={f.path}
              className={`
                group transition-colors 
                ${
                  selectedFiles?.has(f[selectionKey])
                    ? "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }
              `}
            >
              {selectionEnabled ? (
                <td
                  className="sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 px-3 py-2 text-center border-r border-slate-100 dark:border-slate-800"
                  style={{ width: "50px" }}
                >
                  {(() => {
                    const isSel = selectedFiles.has(f[selectionKey]);
                    return (
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleFileSelection(f[selectionKey])}
                        className="rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
                      />
                    );
                  })()}
                </td>
              ) : null}

              {effectiveColumns.map((c, ci) => {
                const text = c.getValue ? c.getValue(f) : f[c.key];
                const content =
                  typeof c.renderCell === "function"
                    ? c.renderCell(f)
                    : String(text ?? "");
                const selected = isSelected(ri, ci);
                const style = {
                  width: px(colWidths[c.key] || c.width),
                  boxShadow: selected
                    ? "inset 0 0 0 2px rgba(16,185,129,1)"
                    : undefined,
                };

                return (
                  <td
                    key={c.key}
                    onMouseDown={(e) => cellMouseDown(ri, ci, e)}
                    onMouseEnter={() => cellMouseEnter(ri, ci)}
                    style={style}
                    className="px-4 py-2 whitespace-nowrap overflow-hidden text-sm text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 last:border-r-0"
                    title={typeof text === "string" ? text : undefined}
                  >
                    {typeof content === "string" ? (
                      <span className="block truncate">{content}</span>
                    ) : (
                      <div className="min-w-0 overflow-hidden">{content}</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {files.length === 0 && (
            <tr>
              <td
                colSpan={effectiveColumns.length + (selectionEnabled ? 1 : 0)}
                className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
              >
                No files found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PreviewSectionTable;
