import { getFileLabelFromName } from "./fileTypes";

/**
 * Export Utilities
 * Handles generating export files (Text, CSV, JSON, Markdown, HTML)
 * with updated merged columns and interactive HTML features.
 * Now supports Photo Mode metadata.
 */

// --- Shared Helpers ---

const getCombinedTypeLabel = (file) => {
  const semantic = file.semantic_type || "Unclassified";
  // If search tags exist (e.g. "Size", "Time"), use them.
  // Otherwise default to the semantic type.
  const tags =
    Array.isArray(file.search_tags) && file.search_tags.length > 0
      ? file.search_tags.join(", ")
      : "";

  if (tags && tags !== semantic) {
    return `${semantic} (${tags})`;
  }
  return semantic;
};

const groupFilesByType = (files) => {
  const grouped = {};
  files.forEach((file) => {
    const type = file.semantic_type || "Unclassified";
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(file);
  });
  return grouped;
};

const escapeCSV = (str) => {
  if (str === null || str === undefined) return "";
  const stringValue = String(str);
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const escapeHTML = (str) => {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const downloadFile = (content, filename, mimeType = "text/plain") => {
  try {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("downloadFile failed:", err);
  }
};

// --- Export Functions ---

export const exportAsText = (files, duplicates = {}, options = {}) => {
  const {
    groupByType = false,
    includeMetadata = true,
    useTimestamp = true,
  } = options;

  let output = "🔎 Preview Results\n";
  output += "========================================\n\n";

  if (groupByType) {
    const grouped = groupFilesByType(files);
    Object.entries(grouped).forEach(([type, typeFiles]) => {
      output += `\n[${type}] (${typeFiles.length} files)\n`;
      output += "-".repeat(40) + "\n";
      typeFiles.forEach((file) => {
        output += `${file.name}`;
        if (includeMetadata) {
          output += `  ←  ${file.path}`;
          output += `  [${file.size_formatted}`;
          if (file.modified) output += `, Modified: ${file.modified}`;
          // Photo Metadata
          if (file.metadata?.model) output += `, Cam: ${file.metadata.model}`;
          if (file.metadata?.iso) output += `, ISO: ${file.metadata.iso}`;
          output += "]";
        }
        output += "\n";
      });
    });
  } else {
    files.forEach((file) => {
      const classification = getCombinedTypeLabel(file);
      const label = getFileLabelFromName(file.name || file.path);

      output += `${file.name}`;
      output += `  [Type: ${classification} | Ext: ${label}]`;
      output += `\n   Path: ${file.path}`;

      if (includeMetadata) {
        const bits = [];
        if (file.size_formatted) bits.push(`Size: ${file.size_formatted}`);
        if (file.modified) bits.push(`Modified: ${file.modified}`);

        // Photo Mode Bits
        if (file.metadata) {
          if (file.metadata.model) bits.push(`Camera: ${file.metadata.model}`);
          if (file.metadata.lens) bits.push(`Lens: ${file.metadata.lens}`);
          if (file.metadata.iso) bits.push(`ISO: ${file.metadata.iso}`);
          if (file.metadata.aperture)
            bits.push(`Aperture: ${file.metadata.aperture}`);
          if (file.metadata.shutter_speed)
            bits.push(`Shutter: ${file.metadata.shutter_speed}`);
        }

        if (bits.length) output += `\n   Metadata: ${bits.join(" | ")}`;
      }
      output += "\n\n";
    });
  }

  if (Object.keys(duplicates).length > 0) {
    output += "\n⚠️  Duplicate Files Detected\n";
    output += "========================================\n";
    Object.entries(duplicates).forEach(([name, paths]) => {
      output += `${name} (${paths.length} copies)\n`;
      paths.forEach((path) => (output += `  → ${path}\n`));
    });
  }

  output += `\n📊 Total Files: ${files.length}\n`;
  if (useTimestamp) {
    output += `Generated: ${new Date().toLocaleString()}\n`;
  }

  return output;
};

export const exportAsCSV = (files, options = {}) => {
  const { includeMetadata = true } = options;

  // Merged "SearchType" and "FileType" into "Classification"
  let csv = "Name,Path,Classification,Extension";
  if (includeMetadata) {
    // Added Photo Mode Columns
    csv +=
      ",Camera,Lens,ISO,Aperture,Shutter,Size,Size (Formatted),Modified,Created";
  }
  csv += "\n";

  files.forEach((file) => {
    const classification = getCombinedTypeLabel(file);
    const label = getFileLabelFromName(file.name || file.path);
    const m = file.metadata || {};

    const row = [
      escapeCSV(file.name),
      escapeCSV(file.path),
      escapeCSV(classification),
      escapeCSV(label),
    ];

    if (includeMetadata) {
      row.push(
        escapeCSV(m.model || ""),
        escapeCSV(m.lens || ""),
        escapeCSV(m.iso || ""),
        escapeCSV(m.aperture || ""),
        escapeCSV(m.shutter_speed || ""),
        file.size || 0,
        escapeCSV(file.size_formatted || ""),
        escapeCSV(file.modified || ""),
        escapeCSV(file.created || "")
      );
    }

    csv += row.join(",") + "\n";
  });

  return csv;
};

export const exportAsJSON = (files, duplicates = {}, options = {}) => {
  const { includeMetadata = true, pretty = true } = options;

  const data = {
    generated: new Date().toISOString(),
    total_files: files.length,
    files: includeMetadata
      ? files
      : files.map((f) => ({
          name: f.name,
          path: f.path,
          classification: getCombinedTypeLabel(f),
          label: getFileLabelFromName(f.name || f.path),
        })),
    duplicates: Object.keys(duplicates).length > 0 ? duplicates : undefined,
  };

  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
};

export const exportAsMarkdown = (files, duplicates = {}, options = {}) => {
  const {
    groupByType = false,
    includeMetadata = true,
    useTimestamp = true,
  } = options;

  let md = "# 🔎 Preview Results\n\n";
  if (useTimestamp) {
    md += `*Generated: ${new Date().toLocaleString()}*\n\n`;
  }
  md += `**Total Files:** ${files.length}\n\n`;
  md += "---\n\n";

  if (groupByType) {
    const grouped = groupFilesByType(files);
    Object.entries(grouped).forEach(([type, typeFiles]) => {
      md += `## ${type} (${typeFiles.length} files)\n\n`;
      typeFiles.forEach((file) => {
        md += `- **${file.name}**\n  - Path: \`${file.path}\`\n`;
        if (includeMetadata) {
          if (file.size_formatted) md += `  - Size: ${file.size_formatted}\n`;
          const m = file.metadata || {};
          if (m.model) md += `  - Camera: ${m.model}\n`;
        }
      });
      md += "\n";
    });
  } else {
    md += "## Files\n\n";
    files.forEach((file) => {
      const classification = getCombinedTypeLabel(file);
      const label = getFileLabelFromName(file.name || file.path);

      md += `- **${file.name}** \`${classification}\`\n`;
      md += `  - Path: \`${file.path}\`\n`;
      md += `  - Ext: ${label}\n`;

      if (includeMetadata) {
        const bits = [];
        if (file.size_formatted) bits.push(`Size: ${file.size_formatted}`);
        if (file.modified) bits.push(`Modified: ${file.modified}`);

        // Photo Bits
        const m = file.metadata || {};
        if (m.model) bits.push(`📷 ${m.model}`);
        if (m.iso) bits.push(`ISO ${m.iso}`);

        if (bits.length) md += `  - ${bits.join(" | ")}\n`;
      }
    });
  }

  if (Object.keys(duplicates).length > 0) {
    md += "\n---\n\n";
    md += "## ⚠️ Duplicate Files\n\n";
    Object.entries(duplicates).forEach(([name, paths]) => {
      md += `### ${name} (${paths.length} copies)\n\n`;
      paths.forEach((p) => (md += `- \`${p}\`\n`));
      md += "\n";
    });
  }

  return md;
};

export const exportAsHTML = (files, duplicates = {}, options = {}) => {
  const {
    includeMetadata = true,
    useTimestamp = true,
    title = "File Filter Copier - Results",
  } = options;

  // Extract unique semantic types for the filter dropdown
  const allTypes = Array.from(
    new Set(files.map((f) => f.semantic_type || "Unclassified"))
  ).sort();

  // Create the main table rows
  let rows = "";
  files.forEach((file) => {
    // Logic to merge Search & Type
    const semantic = file.semantic_type || "Unclassified";
    // Badges for search tags
    const tags = Array.isArray(file.search_tags) ? file.search_tags : [];

    // Create HTML badges
    const tagBadges = tags
      .map((t) => `<span class="badge search-badge">${escapeHTML(t)}</span>`)
      .join("");
    const typeBadge = `<span class="badge type-badge">${escapeHTML(semantic)}</span>`;

    const label = getFileLabelFromName(file.name || file.path);
    const m = file.metadata || {};

    rows += `
      <tr data-type="${escapeHTML(semantic)}">
        <td class="primary-col">
            <div class="filename">${escapeHTML(file.name)}</div>
            <div class="filepath" title="${escapeHTML(file.path)}">${escapeHTML(file.path)}</div>
        </td>
        <td>
            <div class="badges">
                ${typeBadge}
                ${tagBadges}
            </div>
        </td>
        <td><span class="ext-label">${escapeHTML(label)}</span></td>
        ${
          includeMetadata
            ? `
          <td>${escapeHTML(m.model || "-")}</td>
          <td>${escapeHTML(m.lens || "-")}</td>
          <td>${escapeHTML(m.iso || "-")}</td>
          <td>${escapeHTML(m.aperture || "-")}</td>
          <td>${escapeHTML(m.shutter_speed || "-")}</td>
          <td data-val="${file.size || 0}">${escapeHTML(file.size_formatted || "")}</td>
          <td>${escapeHTML(file.modified || "")}</td>
        `
            : ""
        }
      </tr>
    `;
  });

  // Duplicate section (if any)
  let dupSection = "";
  if (Object.keys(duplicates).length > 0) {
    let dupRows = "";
    Object.entries(duplicates).forEach(([name, paths]) => {
      dupRows += `
        <div class="dup-group">
            <div class="dup-name">${escapeHTML(name)} <span class="dup-count">(${paths.length} copies)</span></div>
            ${paths.map((p) => `<div class="dup-path">${escapeHTML(p)}</div>`).join("")}
        </div>`;
    });

    dupSection = `
      <div class="section mt-8">
        <h2 class="text-red">⚠️ Duplicate Files Detected</h2>
        <div class="dup-list">
          ${dupRows}
        </div>
      </div>
    `;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHTML(title)}</title>
<style>
  :root {
    --bg: #f8fafc;
    --card-bg: #ffffff;
    --text-main: #0f172a;
    --text-sub: #64748b;
    --border: #e2e8f0;
    --primary: #4f46e5;
    --primary-light: #eef2ff;
    --badge-bg: #f1f5f9;
    --badge-text: #475569;
  }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text-main); margin: 0; padding: 40px 20px; line-height: 1.5; }
  .container { max-width: 1400px; margin: 0 auto; }
  
  /* Header */
  .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 40px; border-radius: 16px; margin-bottom: 32px; box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.3); }
  h1 { margin: 0 0 12px 0; font-size: 28px; font-weight: 700; }
  .meta { font-size: 14px; opacity: 0.9; display: flex; gap: 24px; }
  
  /* Controls */
  .controls { display: flex; gap: 16px; margin-bottom: 24px; background: white; padding: 16px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid var(--border); flex-wrap: wrap; }
  .search-box { flex: 1; min-width: 250px; position: relative; }
  .search-input { width: 100%; padding: 10px 16px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
  .search-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }
  .filter-select { padding: 10px 32px 10px 16px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; outline: none; background: white url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") no-repeat right 0.5rem center/1.5em 1.5em; appearance: none; cursor: pointer; }
  .filter-select:focus { border-color: var(--primary); }

  /* Table */
  .table-container { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid var(--border); }
  table { width: 100%; border-collapse: collapse; text-align: left; }
  th { background: #f8fafc; padding: 16px; font-size: 13px; font-weight: 600; color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); cursor: pointer; user-select: none; }
  th:hover { background: #f1f5f9; color: var(--text-main); }
  td { padding: 16px; border-bottom: 1px solid var(--border); vertical-align: top; font-size: 14px; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #fcfcfc; }
  
  .primary-col { max-width: 400px; }
  .filename { font-weight: 600; color: var(--text-main); margin-bottom: 4px; word-break: break-all; }
  .filepath { font-size: 12px; color: var(--text-sub); font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; direction: rtl; text-align: left; }
  
  .badges { display: flex; gap: 6px; flex-wrap: wrap; }
  .badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; letter-spacing: 0.025em; }
  .type-badge { background: #e0e7ff; color: #4338ca; }
  .search-badge { background: #ecfccb; color: #3f6212; }
  
  .ext-label { display: inline-block; padding: 2px 8px; background: #f3f4f6; border-radius: 4px; font-family: monospace; font-size: 12px; color: #374151; border: 1px solid #e5e7eb; }
  
  /* Duplicates */
  .mt-8 { margin-top: 32px; }
  .text-red { color: #dc2626; }
  .dup-list { background: white; border-radius: 12px; border: 1px solid var(--border); padding: 24px; }
  .dup-group { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed var(--border); }
  .dup-group:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  .dup-name { font-weight: 600; margin-bottom: 8px; }
  .dup-count { color: var(--text-sub); font-weight: 400; font-size: 13px; margin-left: 8px; }
  .dup-path { font-family: monospace; font-size: 12px; color: var(--text-sub); padding-left: 16px; border-left: 2px solid #e2e8f0; margin-top: 4px; }

  @media print {
    body { background: white; padding: 0; }
    .header, .controls { box-shadow: none; border: 1px solid black; }
    .table-container { box-shadow: none; border: 1px solid black; }
  }
</style>
</head>
<body>

<div class="container">
  <div class="header">
    <h1>🔎 ${escapeHTML(title)}</h1>
    <div class="meta">
        <span><strong>Total Files:</strong> <span id="totalCount">${files.length}</span></span>
        ${useTimestamp ? `<span><strong>Generated:</strong> ${escapeHTML(new Date().toLocaleString())}</span>` : ""}
    </div>
  </div>

  <div class="controls">
    <div class="search-box">
        <input type="text" id="searchInput" class="search-input" placeholder="Search filename, path, or extension...">
    </div>
    <select id="typeFilter" class="filter-select">
        <option value="all">All Types</option>
        ${allTypes.map((t) => `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`).join("")}
    </select>
  </div>

  <div class="table-container">
    <table id="fileTable">
      <thead>
        <tr>
          <th onclick="sortTable(0)">Name / Path ↕</th>
          <th onclick="sortTable(1)">Classification ↕</th>
          <th onclick="sortTable(2)">Ext ↕</th>
          ${
            includeMetadata
              ? `
          <th onclick="sortTable(3)">Camera ↕</th>
          <th onclick="sortTable(4)">Lens ↕</th>
          <th onclick="sortTable(5)">ISO ↕</th>
          <th onclick="sortTable(6)">Aperture ↕</th>
          <th onclick="sortTable(7)">Shutter ↕</th>
          <th onclick="sortTable(8, 'num')">Size ↕</th>
          <th onclick="sortTable(9)">Modified ↕</th>
          `
              : ""
          }
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
  
  ${dupSection}
  
  <div style="text-align: center; margin-top: 40px; color: #94a3b8; font-size: 13px;">
    Exported by File Filter Copier
  </div>
</div>

<script>
    // --- Interactive Logic ---
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const table = document.getElementById('fileTable');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.getElementsByTagName('tr'));
    const totalCountEl = document.getElementById('totalCount');

    function filterTable() {
        const term = searchInput.value.toLowerCase();
        const type = typeFilter.value;
        let visible = 0;

        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            const rowType = row.getAttribute('data-type');
            
            const matchesTerm = text.includes(term);
            const matchesType = type === 'all' || rowType === type;

            if (matchesTerm && matchesType) {
                row.style.display = '';
                visible++;
            } else {
                row.style.display = 'none';
            }
        });
        
        // Update count if filtered
        if (term || type !== 'all') {
             totalCountEl.textContent = visible + ' (filtered)';
        } else {
             totalCountEl.textContent = '${files.length}';
        }
    }

    searchInput.addEventListener('keyup', filterTable);
    typeFilter.addEventListener('change', filterTable);

    function sortTable(n, type = 'str') {
      let switching = true;
      let dir = "asc"; 
      let switchcount = 0;
      
      while (switching) {
        switching = false;
        const b = tbody.rows;
        
        for (let i = 0; i < (b.length - 1); i++) {
          if (b[i].style.display === 'none') continue; // skip hidden

          let shouldSwitch = false;
          let x = b[i].getElementsByTagName("TD")[n];
          let y = b[i + 1].getElementsByTagName("TD")[n];
          
          let xVal = x.innerText.toLowerCase();
          let yVal = y.innerText.toLowerCase();
          
          // Use data-val if available (for size sorting)
          if (x.hasAttribute('data-val')) {
             xVal = parseFloat(x.getAttribute('data-val'));
             yVal = parseFloat(y.getAttribute('data-val'));
          }

          if (dir === "asc") {
            if (xVal > yVal) { shouldSwitch = true; break; }
          } else if (dir === "desc") {
            if (xVal < yVal) { shouldSwitch = true; break; }
          }
        }
        
        if (shouldSwitch) {
          b[i].parentNode.insertBefore(b[i + 1], b[i]);
          switching = true;
          switchcount++;
        } else {
          if (switchcount === 0 && dir === "asc") {
            dir = "desc";
            switching = true;
          }
        }
      }
    }
</script>

</body>
</html>`;
  return html;
};

/**
 * Main export entry point
 */
export const exportPreview = (
  files,
  duplicates = {},
  format = "txt",
  options = {}
) => {
  const {
    selectedPaths,
    selectionKey = "path",
    includeMetadata,
    groupByType,
    useTimestamp,
    title,
    pretty,
  } = options || {};

  // Handle selected files filtering
  let selectedSet = null;
  if (selectedPaths && typeof selectedPaths === "object") {
    if (selectedPaths instanceof Set) selectedSet = selectedPaths;
    else if (Array.isArray(selectedPaths)) selectedSet = new Set(selectedPaths);
  }

  const effectiveFiles =
    selectedSet && selectedSet.size > 0
      ? files.filter((f) => selectedSet.has(f?.[selectionKey]))
      : files;

  let content = "";
  let filename = `file-filter-results-${Date.now()}`;
  let mimeType = "text/plain";

  const pass = {
    includeMetadata,
    groupByType,
    useTimestamp,
    title,
    pretty,
  };

  switch (String(format || "").toLowerCase()) {
    case "csv":
      content = exportAsCSV(effectiveFiles, pass);
      filename += ".csv";
      mimeType = "text/csv";
      break;
    case "json":
      content = exportAsJSON(effectiveFiles, duplicates, pass);
      filename += ".json";
      mimeType = "application/json";
      break;
    case "md":
    case "markdown":
      content = exportAsMarkdown(effectiveFiles, duplicates, pass);
      filename += ".md";
      mimeType = "text/markdown";
      break;
    case "html":
      content = exportAsHTML(effectiveFiles, duplicates, pass);
      filename += ".html";
      mimeType = "text/html";
      break;
    case "txt":
    case "text":
    default:
      content = exportAsText(effectiveFiles, duplicates, pass);
      filename += ".txt";
      mimeType = "text/plain";
      break;
  }

  downloadFile(content, filename, mimeType);
};
