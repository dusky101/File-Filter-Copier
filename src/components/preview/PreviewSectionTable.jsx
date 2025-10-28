import React, { useEffect, useRef, useState } from "react";

const px = (n) => `${Math.max(60, Math.min(1200, n))}px`;

const PreviewSectionTable = ({
  files,
  columns,
  sortBy,
  sortOrder,
  onSort,
  // Selection props (new)
  selectedFiles,
  toggleFileSelection,
  selectAll,
  deselectAll,
  selectionKey = "path",
  totalSelectableCount, // total items in the current processed list (not just the page)
}) => {
  const [colWidths, setColWidths] = useState(() =>
    Object.fromEntries(columns.map((c) => [c.key, 200]))
  );

  // Selection enablement
  const selectionEnabled =
    selectedFiles instanceof Set && typeof toggleFileSelection === "function";

  // Header checkbox state reflects GLOBAL selection across processed list
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

  // Range selection for TSV copy (columns only, excludes the checkbox column)
  const [sel, setSel] = useState(null); // { rs, cs, re, ce }
  const selectingRef = useRef(false);

  useEffect(() => {
    setColWidths((w) => {
      const next = { ...w };
      columns.forEach((c) => {
        if (next[c.key] == null) next[c.key] = 200;
      });
      Object.keys(next).forEach((k) => {
        if (!columns.find((c) => c.key === k)) delete next[k];
      });
      return next;
    });
  }, [columns]);

  const startResize = (key, e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = colWidths[key] || 200;

    const onMove = (me) => {
      const delta = me.clientX - startX;
      setColWidths((w) => ({ ...w, [key]: startW + delta }));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove, true);
      window.removeEventListener("mouseup", onUp, true);
      document.body.style.cursor = "";
    };
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", onMove, true);
    window.addEventListener("mouseup", onUp, true);
  };

  const autoFit = (key) => {
    const col = columns.find((c) => c.key === key);
    if (!col) return;

    const headerLen = (col.label || "").length;
    const sampleSize = Math.min(500, files.length);
    const values = files.slice(0, sampleSize).map((f) => {
      const v = (col.getValue ? col.getValue(f) : f[col.key]) ?? "";
      return String(v);
    });

    const maxLen = Math.max(headerLen, ...values.map((s) => s.length));
    const charWidth = maxLen > 100 ? 8.5 : 9;
    const padding = 48;
    const calculatedWidth = Math.round(maxLen * charWidth + padding);
    const width = Math.min(1200, Math.max(80, calculatedWidth));

    setColWidths((w) => ({ ...w, [key]: width }));
  };

  const headerClick = (key) => {
    if (!onSort) return;
    onSort(key);
  };

  // Cell range selection
  const cellMouseDown = (ri, ci, e) => {
    e.preventDefault();
    selectingRef.current = true;
    setSel({ rs: ri, cs: ci, re: ri, ce: ci });
  };
  const cellMouseEnter = (ri, ci) => {
    if (!selectingRef.current) return;
    setSel((s) => (s ? { ...s, re: ri, ce: ci } : s));
  };
  useEffect(() => {
    const up = () => (selectingRef.current = false);
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  const isSelected = (ri, ci) => {
    if (!sel) return false;
    const rs = Math.min(sel.rs, sel.re);
    const re = Math.max(sel.rs, sel.re);
    const cs = Math.min(sel.cs, sel.ce);
    const ce = Math.max(sel.cs, sel.ce);
    return ri >= rs && ri <= re && ci >= cs && ci <= ce;
  };

  // Copy selection as TSV
  useEffect(() => {
    const onKey = async (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta || e.key.toLowerCase() !== "c" || !sel) return;
      e.preventDefault();
      const rs = Math.min(sel.rs, sel.re);
      const re = Math.max(sel.rs, sel.re);
      const cs = Math.min(sel.cs, sel.ce);
      const ce = Math.max(sel.cs, sel.ce);

      const cols = columns.slice(cs, ce + 1);
      const rows = files.slice(rs, re + 1);
      const lines = [];
      lines.push(cols.map((c) => c.label).join("\t"));
      for (const f of rows) {
        const row = cols.map((c) => {
          const v = c.getValue ? c.getValue(f) : f[c.key];
          return String(v ?? "");
        });
        lines.push(row.join("\t"));
      }
      try {
        await navigator.clipboard.writeText(lines.join("\n"));
      } catch {}
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, columns, files]);

  const headerSortIcon = (key) => {
    if (sortBy !== key) return null;
    return (
      <span className="ml-1 text-slate-500">
        {sortOrder === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto min-h-[320px]">
      <table className="w-full select-none table-fixed">
        <thead className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700">
          <tr>
            {/* Selection header (global select all) */}
            {selectionEnabled ? (
              <th
                className="px-4 py-3 text-left"
                style={{ width: "56px", userSelect: "none" }}
              >
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  checked={allSelectedGlobal}
                  onChange={(e) =>
                    e.target.checked ? selectAll?.() : deselectAll?.()
                  }
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  title={
                    allSelectedGlobal ? "Deselect all rows" : "Select all rows"
                  }
                  aria-label={
                    allSelectedGlobal ? "Deselect all rows" : "Select all rows"
                  }
                />
              </th>
            ) : null}

            {columns.map((c) => (
              <th
                key={c.key}
                role="button"
                tabIndex={0}
                onClick={() => headerClick(c.key)}
                onDoubleClick={() => autoFit(c.key)}
                style={{ width: px(colWidths[c.key]), userSelect: "none" }}
                className="relative px-4 py-3 text-left text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 cursor-pointer"
              >
                <span className="inline-flex items-center w-full">
                  <span className="flex-1 truncate">{c.label}</span>
                  {headerSortIcon(c.key)}
                  {c.headerExtra ? (
                    <span
                      className="ml-1 inline-flex flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {typeof c.headerExtra === "function"
                        ? c.headerExtra()
                        : c.headerExtra}
                    </span>
                  ) : null}
                </span>
                <div
                  onMouseDown={(e) => startResize(c.key, e)}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    autoFit(c.key);
                  }}
                  className="absolute top-0 right-0 h-full w-3 cursor-col-resize hover:bg-blue-400/30"
                  title="Drag to resize. Double‑click to auto‑fit."
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {files.map((f, ri) => (
            <tr
              key={ri}
              className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              {/* Row selection cell (excluded from range selection) */}
              {selectionEnabled ? (
                <td
                  className="px-4 py-3"
                  style={{ width: "56px" }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {(() => {
                    const id = f?.[selectionKey];
                    const checked = selectedFiles.has(id);
                    return (
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          if (id != null) toggleFileSelection(id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        title={checked ? "Deselect row" : "Select row"}
                        aria-label={checked ? "Deselect row" : "Select row"}
                      />
                    );
                  })()}
                </td>
              ) : null}

              {columns.map((c, ci) => {
                const text = c.getValue ? c.getValue(f) : f[c.key];
                const content =
                  typeof c.renderCell === "function"
                    ? c.renderCell(f)
                    : String(text ?? "");
                const selected = isSelected(ri, ci);
                const style = {
                  width: px(colWidths[c.key]),
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
                    className="px-4 py-2 whitespace-nowrap overflow-hidden text-sm text-slate-800 dark:text-slate-200"
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
        </tbody>
      </table>
    </div>
  );
};

export default PreviewSectionTable;
