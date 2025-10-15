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
            output += `, modified: ${file.modified}`;
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
      output += `${file.name}  ←  ${file.path}  [${type}`;
      if (includeMetadata) {
        output += `, ${file.size_formatted}`;
        if (file.modified) {
          output += `, modified: ${file.modified}`;
        }
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

  let csv = 'Name,Path,Type';
  
  if (includeMetadata) {
    csv += ',Size,Size (Formatted),Modified,Created';
  }
  
  csv += '\n';

  files.forEach(file => {
    const row = [
      escapeCSV(file.name),
      escapeCSV(file.path),
      escapeCSV(file.semantic_type || 'Unclassified')
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
      type: f.semantic_type || 'Unclassified'
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
        md += `- \`${file.name}\``;
        if (includeMetadata) {
          md += `  \n  📁 \`${file.path}\``;
          md += `  \n  📏 ${file.size_formatted}`;
          if (file.modified) {
            md += `  \n  📅 Modified: ${file.modified}`;
          }
        }
        md += '\n\n';
      });
    });
  } else {
    // Flat list
    md += '## Files\n\n';
    files.forEach(file => {
      const type = file.semantic_type || 'Unclassified';
      md += `- \`${file.name}\` ← \`${file.path}\` [${type}`;
      if (includeMetadata) {
        md += `, ${file.size_formatted}`;
        if (file.modified) {
          md += `, modified: ${file.modified}`;
        }
      }
      md += ']\n';
    });
  }

  // Add duplicates section
  if (Object.keys(duplicates).length > 0) {
    md += '\n---\n\n';
    md += '## ⚠️ Duplicate Files\n\n';
    Object.entries(duplicates).forEach(([name, paths]) => {
      md += `### ${name} (${paths.length} copies)\n\n`;
      paths.forEach(path => md += `- \`${path}\`\n`);
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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
      color: #333;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    h1 { margin: 0 0 10px 0; }
    .meta { opacity: 0.9; font-size: 14px; }
    .section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h2 {
      color: #667eea;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
      margin-top: 0;
    }
    .file-item {
      padding: 10px;
      border-left: 3px solid #667eea;
      margin: 10px 0;
      background: #f9f9f9;
    }
    .file-name {
      font-weight: bold;
      color: #333;
      font-family: 'Courier New', monospace;
    }
    .file-path {
      color: #666;
      font-size: 13px;
      margin: 5px 0;
    }
    .file-meta {
      color: #999;
      font-size: 12px;
    }
    .type-badge {
      display: inline-block;
      padding: 3px 8px;
      background: #667eea;
      color: white;
      border-radius: 3px;
      font-size: 11px;
      margin-right: 5px;
    }
    .duplicate {
      background: #fff3cd;
      border-left-color: #ffc107;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #667eea;
      color: white;
      font-weight: 600;
    }
    tr:hover {
      background: #f5f5f5;
    }
    @media print {
      body { background: white; }
      .section { box-shadow: none; border: 1px solid #ddd; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔎 ${title}</h1>
    <div class="meta">
      <strong>Total Files:</strong> ${files.length}`;
  
  if (useTimestamp) {
    html += ` | <strong>Generated:</strong> ${new Date().toLocaleString()}`;
  }
  
  html += `
    </div>
  </div>`;

  if (groupByType) {
    const grouped = groupFilesByType(files);
    
    Object.entries(grouped).forEach(([type, typeFiles]) => {
      html += `
  <div class="section">
    <h2>${type} <span style="font-weight: normal; font-size: 14px;">(${typeFiles.length} files)</span></h2>`;
      
      typeFiles.forEach(file => {
        html += `
    <div class="file-item">
      <div class="file-name">${escapeHTML(file.name)}</div>`;
        if (includeMetadata) {
          html += `
      <div class="file-path">📁 ${escapeHTML(file.path)}</div>
      <div class="file-meta">
        📏 ${file.size_formatted}`;
          if (file.modified) {
            html += ` | 📅 Modified: ${file.modified}`;
          }
          html += `
      </div>`;
        }
        html += `
    </div>`;
      });
      
      html += `
  </div>`;
    });
  } else {
    html += `
  <div class="section">
    <h2>Files</h2>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>`;
    if (includeMetadata) {
      html += `
          <th>Size</th>
          <th>Modified</th>`;
    }
    html += `
        </tr>
      </thead>
      <tbody>`;
    
    files.forEach(file => {
      html += `
        <tr>
          <td><code>${escapeHTML(file.name)}</code></td>
          <td><span class="type-badge">${escapeHTML(file.semantic_type || 'Unclassified')}</span></td>`;
      if (includeMetadata) {
        html += `
          <td>${file.size_formatted}</td>
          <td>${file.modified || 'N/A'}</td>`;
      }
      html += `
        </tr>`;
    });
    
    html += `
      </tbody>
    </table>
  </div>`;
  }

  // Duplicates section
  if (Object.keys(duplicates).length > 0) {
    html += `
  <div class="section">
    <h2>⚠️ Duplicate Files</h2>`;
    
    Object.entries(duplicates).forEach(([name, paths]) => {
      html += `
    <div class="file-item duplicate">
      <div class="file-name">${escapeHTML(name)} <span style="color: #856404;">(${paths.length} copies)</span></div>`;
      paths.forEach(path => {
        html += `
      <div class="file-path">→ ${escapeHTML(path)}</div>`;
      });
      html += `
    </div>`;
    });
    
    html += `
  </div>`;
  }

  html += `
</body>
</html>`;

  return html;
};

/**
 * Trigger file download in browser
 * @param {string} content - File content
 * @param {string} filename - Filename with extension
 * @param {string} mimeType - MIME type
 */
export const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export files with specified format
 * @param {Array} files - Array of file objects
 * @param {Object} duplicates - Duplicate files object
 * @param {string} format - Export format ('txt', 'csv', 'json', 'md', 'html')
 * @param {Object} options - Export options
 */
export const exportPreview = (files, duplicates = {}, format = 'txt', options = {}) => {
  let content = '';
  let filename = `file-filter-results-${Date.now()}`;
  let mimeType = 'text/plain';

  switch (format.toLowerCase()) {
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