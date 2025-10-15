import React, { useEffect, useMemo, useRef, useState } from "react";

const percent = (done, total) =>
  total > 0 ? Math.min(100, Math.floor((done / total) * 100)) : 0;

export default function DeepScanProgressModal({
  open,
  progressId,
  onClose,
  streamBaseUrl = "http://localhost:8000/api",
}) {
  const [totalBytes, setTotalBytes] = useState(0);
  const [processedBytes, setProcessedBytes] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [processedFiles, setProcessedFiles] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const [done, setDone] = useState(false);
  const esRef = useRef(null);

  const pct = useMemo(
    () => percent(processedBytes, totalBytes),
    [processedBytes, totalBytes]
  );

  useEffect(() => {
    if (!open || !progressId) return;

    // reset state on each open/progressId
    setTotalBytes(0);
    setProcessedBytes(0);
    setTotalFiles(0);
    setProcessedFiles(0);
    setCurrentFile("");
    setDone(false);

    const url = `${streamBaseUrl}/progress/${progressId}/stream`;
    const es = new EventSource(url, { withCredentials: false });
    esRef.current = es;

    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data || "{}");
        setTotalBytes(data.total_bytes || 0);
        setProcessedBytes(data.processed_bytes || 0);
        setTotalFiles(data.total_files || 0);
        setProcessedFiles(data.processed_files || 0);
        setCurrentFile(data.current || "");
        if (data.done) setDone(true);
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      esRef.current?.close();
      esRef.current = null;
    };

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [open, progressId, streamBaseUrl]);

  useEffect(() => {
    if (done && onClose) {
      // slight delay so users see 100%
      const t = setTimeout(onClose, 500);
      return () => clearTimeout(t);
    }
  }, [done, onClose]);

  if (!open) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <h3 style={{ margin: 0 }}>Deep Scan Progress</h3>
          <button onClick={onClose} style={btnStyle}>
            Close
          </button>
        </div>

        <div
          style={barOuterStyle}
          role="progressbar"
          aria-label="progress-bar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div style={{ ...barInnerStyle, width: `${pct}%` }} />
        </div>

        <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: 12 }}>
          {pct}% • {processedFiles}/{totalFiles} files •{" "}
          {formatBytes(processedBytes)} / {formatBytes(totalBytes)}
        </div>

        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "#666",
            wordBreak: "break-all",
          }}
        >
          {currentFile ? `Scanning: ${currentFile}` : "Preparing..."}
        </div>
      </div>
    </div>
  );
}

function formatBytes(b) {
  if (!b) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};
const modalStyle = {
  background: "#fff",
  borderRadius: 8,
  padding: 16,
  width: 520,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
};
const barOuterStyle = {
  height: 12,
  background: "#eee",
  borderRadius: 6,
  overflow: "hidden",
};
const barInnerStyle = {
  height: "100%",
  background: "#4CAF50",
  transition: "width 200ms linear",
};
const btnStyle = {
  border: "1px solid #ccc",
  background: "#f7f7f7",
  borderRadius: 4,
  padding: "4px 8px",
  cursor: "pointer",
};
