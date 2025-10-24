import React, { useEffect, useMemo, useRef, useState } from "react";

export function DeepSearchProgress({
  progress = 0,
  currentFile = "",
  isProcessing = false,
  onCancel,
  progressId,
  streamBaseUrl = "http://localhost:8000/api",
}) {
  const [totalBytes, setTotalBytes] = useState(0);
  const [processedBytes, setProcessedBytes] = useState(0);
  const [current, setCurrent] = useState("");
  const esRef = useRef(null);

  const ssePct = useMemo(() => {
    if (!totalBytes || totalBytes <= 0) return 0;
    return Math.min(100, Math.floor((processedBytes / totalBytes) * 100));
  }, [processedBytes, totalBytes]);

  useEffect(() => {
    if (!isProcessing) {
      setTotalBytes(0);
      setProcessedBytes(0);
      setCurrent("");
    }
  }, [isProcessing]);

  useEffect(() => {
    if (!isProcessing || !progressId) return;
    const url = `${streamBaseUrl}/progress/${progressId}/stream`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data || "{}");
        if (payload.error) return;
        setTotalBytes(payload.total_bytes || 0);
        setProcessedBytes(payload.processed_bytes || 0);
        setCurrent(payload.current || "");
      } catch {}
    };

    es.onerror = () => {
      // leave indeterminate
    };

    return () => {
      try {
        es.close();
      } catch {}
      esRef.current = null;
    };
  }, [isProcessing, progressId, streamBaseUrl]);

  const pct = progressId ? ssePct : Math.max(0, Math.min(100, progress));
  const shownFile = progressId ? current : currentFile;
  const indeterminate = isProcessing && (!progressId || pct === 0);

  const wrapperClasses = `w-full max-w-2xl p-5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-all ${
    isProcessing ? "opacity-100" : "opacity-0 pointer-events-none"
  }`;

  const barInnerStyle = {
    width: indeterminate ? "50%" : `${pct}%`,
  };

  return (
    <div className={wrapperClasses}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Deep Search Progress
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs border rounded px-2 py-1"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
        <div
          className={`h-3 bg-gradient-to-r from-blue-600 to-purple-600 transition-all ${
            indeterminate ? "animate-pulse" : ""
          }`}
          style={barInnerStyle}
        />
      </div>

      <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 truncate">
        {shownFile ? (
          <>
            Currently scanning:{" "}
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {shownFile}
            </span>
          </>
        ) : indeterminate ? (
          "Scanning..."
        ) : (
          "Preparing files..."
        )}
      </p>
    </div>
  );
}
