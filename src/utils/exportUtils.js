import { getFileLabelFromName } from "./fileTypes";

/**
 * Export Utilities
 * Handles exporting preview results to various formats: TXT, CSV, JSON, Markdown, PDF
 */

/**
 * Export preview data as plain text
 * @param {Array} files - Array of file objects
 * @param {Object} duplicates - Object of duplicate files
 * @param {Object} options - Export options
 * @returns {string} Formatted text content
 */
export const exportAsText = (files, duplicates = {}, options = {}) => {
  const {
    groupByType = false,
    includeMetadata = true,
    useTimestamp = true
  } = options;

  let output = '🔎 Preview Results\n';
  output += '========================================\n\n';

  if (groupByType) {
    // Group files by semantic type
    const grouped = groupFilesByType(files);
    
    Object.entries(grouped).forEach(([type, typeFiles]) => {
      output += `\n[${type}] (${typeFiles.length} files)\n`;
      output += '-'.repeat(40) + '\n';
      
      typeFiles.forEach(file => {
        output += `${file.name}`;
        if (includeMetadata) {
          output += `  ←  ${file.path}`;
          output += `  [${file.size_formatted}`;
          if (file.modified) {
            output += `, Modified: ${file.modified}`;
          }
          if (file.created) {
            output += `, Created: ${file.created}`;
          }
          output += ']';
        }
        output += '\n';
      });
    });
  } else {
    // Flat list
    files.forEach(file => {
      const type = file.semantic_type || 'Unclassified';
      const label = getFileLabelFromName(file.name || file.path);
      const searchType = (Array.isArray(file.search_tags) && file.search_tags.length)
        ? file.search_tags.join(', ')
        : (file.semantic_type || 'Unclassified');
      output += `${file.name}  ←  ${file.path}  [Search: ${searchType} | Type: ${type} | Label: ${label}`;
      if (includeMetadata) {
        const bits = [];
        if (file.size_formatted) bits.push(`Size: ${file.size_formatted}`);
        if (file.modified) bits.push(`Modified: ${file.modified}`);
        if (file.created) bits.push(`Created: ${file.created}`);
        if (bits.length) output += ` | ${bits.join(' | ')}`;
      }
      output += ']\n';
    });
  }

  // Add duplicates section
  if (Object.keys(duplicates).length > 0) {
    output += '\n⚠️  Duplicate Files Detected\n';
    output += '========================================\n';
    Object.entries(duplicates).forEach(([name, paths]) => {
      output += `${name} (${paths.length} copies)\n`;
      paths.forEach(path => output += `  → ${path}\n`);
    });
  }

  output += `\n📊 Total Files: ${files.length}\n`;
  
  if (useTimestamp) {
    output += `\n Generated: ${new Date().toLocaleString()}\n`;
  }

  return output;
};

/**
 * Export preview data as CSV
 * @param {Array} files - Array of file objects
 * @param {Object} options - Export options
 * @returns {string} CSV content
 */
export const exportAsCSV = (files, options = {}) => {
  const { includeMetadata = true } = options;

  // Base columns
  let csv = 'Name,Path,SearchType,FileType';
  // Optional metadata columns (do not duplicate Path)
  if (includeMetadata) {
    csv += ',Size,Size (Formatted),Modified,Created';
  }
  csv += '\n';

  files.forEach(file => {
    const searchType = (Array.isArray(file.search_tags) && file.search_tags.length)
      ? file.search_tags.join(', ')
      : (file.semantic_type || 'Unclassified');
    const row = [
      escapeCSV(file.name),
      escapeCSV(file.path),
      escapeCSV(searchType),
      escapeCSV(getFileLabelFromName(file.name || file.path)),
    ];

    if (includeMetadata) {
      row.push(
        file.size || 0,
        escapeCSV(file.size_formatted || ''),
        escapeCSV(file.modified || ''),
        escapeCSV(file.created || '')
      );
    }

    csv += row.join(',') + '\n';
  });

  return csv;
};

/**
 * Export preview data as JSON
 * @param {Array} files - Array of file objects
 * @param {Object} duplicates - Object of duplicate files
 * @param {Object} options - Export options
 * @returns {string} JSON content
 */
export const exportAsJSON = (files, duplicates = {}, options = {}) => {
  const { includeMetadata = true, pretty = true } = options;

  const data = {
    generated: new Date().toISOString(),
    total_files: files.length,
    files: includeMetadata ? files : files.map(f => ({
      name: f.name,
      path: f.path,
      type: f.semantic_type || 'Unclassified',
      search_tags: Array.isArray(f.search_tags) ? f.search_tags : [],
      label: getFileLabelFromName(f.name || f.path)
    })),
    duplicates: Object.keys(duplicates).length > 0 ? duplicates : undefined
  };

  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
};

/**
 * Export preview data as Markdown
 * @param {Array} files - Array of file objects
 * @param {Object} duplicates - Object of duplicate files
 * @param {Object} options - Export options
 * @returns {string} Markdown content
 */
export const exportAsMarkdown = (files, duplicates = {}, options = {}) => {
  const {
    groupByType = false,
    includeMetadata = true,
    useTimestamp = true
  } = options;

  let md = '# 🔎 Preview Results\n\n';
  if (useTimestamp) {
    md += `*Generated: ${new Date().toLocaleString()}*\n\n`;
  }
  md += `**Total Files:** ${files.length}\n\n`;
  md += '---\n\n';

  if (groupByType) {
    // Group files by semantic type
    const grouped = groupFilesByType(files);
    Object.entries(grouped).forEach(([type, typeFiles]) => {
      md += `## ${type} (${typeFiles.length} files)\n\n`;
      typeFiles.forEach(file => {
        const label = getFileLabelFromName(file.name || file.path);
        md += `- \`${file.name}\` ← \`${file.path}\` [Type: ${type} | Label: ${label}`;
        if (includeMetadata) {
          const bits = [];
          if (file.size_formatted) bits.push(`Size: ${file.size_formatted}`);
          if (file.modified) bits.push(`Modified: ${file.modified}`);
          if (file.created) bits.push(`Created: ${file.created}`);
          if (bits.length) md += ` | ${bits.join(' | ')}`;
          if (file.path) md += ` | Path: ${file.path}`;
        }
        md += ']\n';
      });
      md += '\n';
    });
  } else {
    md += '## Files\n\n';
    files.forEach(file => {
      const type = file.semantic_type || 'Unclassified';
      const label = getFileLabelFromName(file.name || file.path);
      const searchType = (Array.isArray(file.search_tags) && file.search_tags.length)
        ? file.search_tags.join(', ')
        : (file.semantic_type || 'Unclassified');
      md += `- \`${file.name}\` ← \`${file.path}\` [Search: ${searchType} | Type: ${type} | Label: ${label}`;
      if (includeMetadata) {
        const bits = [];
        if (file.size_formatted) bits.push(`Size: ${file.size_formatted}`);
        if (file.modified) bits.push(`Modified: ${file.modified}`);
        if (file.created) bits.push(`Created: ${file.created}`);
        if (bits.length) md += ` | ${bits.join(' | ')}`;
        if (file.path) md += ` | Path: ${file.path}`;
      }
      md += ']\n';
    });
  }

  if (Object.keys(duplicates).length > 0) {
    md += '\n---\n\n';
    md += '## ⚠️ Duplicate Files\n\n';
    Object.entries(duplicates).forEach(([name, paths]) => {
      md += `### ${name} (${paths.length} copies)\n\n`;
      paths.forEach(p => (md += `- \`${p}\`\n`));
      md += '\n';
    });
  }

  return md;
};

/**
 * Export preview data as HTML (for PDF conversion)
 * @param {Array} files - Array of file objects
 * @param {Object} duplicates - Object of duplicate files
 * @param {Object} options - Export options
 * @returns {string} HTML content
 */
export const exportAsHTML = (files, duplicates = {}, options = {}) => {
  const {
    groupByType = false,
    includeMetadata = true,
    useTimestamp = true,
    title = 'File Filter Copier - Preview Results'
  } = options;

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHTML(title)}</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f5f5f5; color: #333; }
  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
  h1 { margin: 0 0 10px 0; }
  .meta { opacity: 0.9; font-size: 14px; }
  .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  h2 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
  th { background: #667eea; color: white; font-weight: 600; }
  tr:hover { background: #f5f5f5; }
  @media print { body { background: white; } .section { box-shadow: none; border: 1px solid #ddd; } }
</style>
</head>
<body>
<div class="header">
  <h1>🔎 ${escapeHTML(title)}</h1>
  <div class="meta"><strong>Total Files:</strong> ${files.length}${useTimestamp ? ` | <strong>Generated:</strong> ${escapeHTML(new Date().toLocaleString())}` : ""}</div>
</div>
`;

  const renderTable = (list) => {
    let t = `
<div class="section">
  <h2>Files</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Search</th>
        <th>Type</th>
        <th>Label</th>
        ${includeMetadata ? `<th>Size</th><th>Modified</th><th>Created</th><th>Path</th>` : ``}
      </tr>
    </thead>
    <tbody>
`;
    list.forEach(file => {
      const type = file.semantic_type || 'Unclassified';
      const label = getFileLabelFromName(file.name || file.path);
      const searchType = (Array.isArray(file.search_tags) && file.search_tags.length)
        ? file.search_tags.join(', ')
        : (file.semantic_type || 'Unclassified');
      t += `
      <tr>
        <td>${escapeHTML(file.name)}</td>
        <td>${escapeHTML(searchType)}</td>
        <td>${escapeHTML(type)}</td>
        <td>${escapeHTML(label)}</td>
        ${includeMetadata ? `
          <td>${escapeHTML(file.size_formatted || '')}</td>
          <td>${escapeHTML(file.modified || '')}</td>
          <td>${escapeHTML(file.created || '')}</td>
          <td>${escapeHTML(file.path || '')}</td>
        ` : ``}
      </tr>
`;
    });
    t += `
    </tbody>
  </table>
</div>
`;
    return t;
  };

  if (groupByType) {
    const grouped = groupFilesByType(files);
    Object.entries(grouped).forEach(([type, typeFiles]) => {
      html += `<div class="section"><h2>${escapeHTML(type)} (${typeFiles.length})</h2>${renderTable(typeFiles)}</div>`;
    });
  } else {
    html += renderTable(files);
  }

  if (Object.keys(duplicates).length > 0) {
    html += `
<div class="section">
  <h2>⚠️ Duplicate Files</h2>
`;
    Object.entries(duplicates).forEach(([name, paths]) => {
      html += `<h3>${escapeHTML(name)} (${paths.length} copies)</h3><ul>`;
      paths.forEach(p => (html += `<li>${escapeHTML(p)}</li>`));
      html += `</ul>`;
    });
    html += `</div>`;
  }

  html += `
</body>
</html>`;
  return html;
};

export const exportPreview = (files, duplicates = {}, format = 'txt', options = {}) => {
  let content = '';
  let filename = `file-filter-results-${Date.now()}`;
  let mimeType = 'text/plain';

  switch (String(format || '').toLowerCase()) {
    case 'csv':
      content = exportAsCSV(files, options);
      filename += '.csv';
      mimeType = 'text/csv';
      break;
    case 'json':
      content = exportAsJSON(files, duplicates, options);
      filename += '.json';
      mimeType = 'application/json';
      break;
    case 'md':
    case 'markdown':
      content = exportAsMarkdown(files, duplicates, options);
      filename += '.md';
      mimeType = 'text/markdown';
      break;
    case 'html':
      content = exportAsHTML(files, duplicates, options);
      filename += '.html';
      mimeType = 'text/html';
      break;
    case 'txt':
    case 'text':
    default:
      content = exportAsText(files, duplicates, options);
      filename += '.txt';
      mimeType = 'text/plain';
      break;
  }

  downloadFile(content, filename, mimeType);
};

// Helper functions

const groupFilesByType = (files) => {
  const grouped = {};
  files.forEach(file => {
    const type = file.semantic_type || 'Unclassified';
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(file);
  });
  return grouped;
};

const escapeCSV = (str) => {
  if (str === null || str === undefined) return '';
  const stringValue = String(str);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const escapeHTML = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Add missing download helper (renderer-safe)
const downloadFile = (content, filename, mimeType = 'text/plain') => {
  try {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    // Ensure it works in Electron renderer
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('downloadFile failed:', err);
  }
};