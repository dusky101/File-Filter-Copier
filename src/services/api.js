/**
 * API Service for File Filter Copier
 * 
 * This module provides a clean interface for communicating with the FastAPI backend.
 * All API calls are centralized here for easy maintenance and error handling.
 */

import axios from 'axios';

// Base API URL - FastAPI server
const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 30 second timeout for large folder scans
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🔵 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('🔴 API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`🟢 API Response: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('🔴 API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============================================================
// File Scanning API
// ============================================================

/**
 * Scan a folder with filters and return matching files
 * 
 * @param {Object} filters - Filter configuration
 * @param {string} filters.folder - Source folder path
 * @param {string} filters.size_filter - Size filter (>1KB, <1KB, >500MB, all)
 * @param {string} filters.time_filter - Time filter (<1h, <24h, <7d, <30d, >30d, all)
 * @param {Array<string>} filters.selected_types - Semantic file types to include
 * @param {boolean} filters.deep_scan - Enable deep content scanning
 * @param {Array<string>} filters.deep_scan_terms - Keywords for deep scan
 * @param {string} filters.deep_scan_mode - Match mode (OR/AND)
 * @param {Array<string>} filters.include_exts - Extensions to include
 * @param {Array<string>} filters.exclude_exts - Extensions to exclude
 * @param {Array<string>} filters.excluded_folders - Folder names to exclude
 * @returns {Promise<Object>} Scan results with file list and metadata
 */
export const scanFiles = async (filters) => {
  try {
    const response = await apiClient.post('/scan', {
      folder: filters.folder || '',
      size_filter: filters.size_filter || '>1KB',
      time_filter: filters.time_filter || 'all',
      selected_types: filters.selected_types || [],
      deep_scan: filters.deep_scan || false,
      deep_scan_terms: filters.deep_scan_terms || [],
      deep_scan_mode: filters.deep_scan_mode || 'OR',
      include_exts: filters.include_exts || null,
      exclude_exts: filters.exclude_exts || null,
      excluded_folders: filters.excluded_folders || [],
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Scan failed',
    };
  }
};

// ============================================================
// File Copy API
// ============================================================

/**
 * Copy filtered files to a destination folder
 * 
 * @param {Object} copyRequest - Copy operation details
 * @param {Array<string>} copyRequest.files - List of file paths to copy
 * @param {string} copyRequest.outputFolder - Output folder name
 * @param {string} copyRequest.destination - Destination parent directory
 * @returns {Promise<Object>} Copy operation result
 */
export const copyFiles = async (copyRequest) => {
  try {
    const response = await apiClient.post('/copy', {
      files: copyRequest.files || [],
      output_folder: copyRequest.outputFolder || 'FilteredFiles',
      destination: copyRequest.destination || '',
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Copy operation failed',
    };
  }
};

// ============================================================
// Preset Management API
// ============================================================

/**
 * Save a filter configuration as a preset
 * 
 * @param {string} name - Preset name
 * @param {Object} config - Filter configuration to save
 * @returns {Promise<Object>} Save operation result
 */
export const savePreset = async (name, config) => {
  try {
    const response = await apiClient.post('/presets/save', {
      name,
      config,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to save preset',
    };
  }
};

/**
 * Load a saved preset by name
 * 
 * @param {string} name - Preset name to load
 * @returns {Promise<Object>} Preset configuration
 */
export const loadPreset = async (name) => {
  try {
    const response = await apiClient.get(`/presets/${name}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to load preset',
    };
  }
};

/**
 * Get list of all saved presets
 * 
 * @returns {Promise<Object>} List of preset names
 */
export const listPresets = async () => {
  try {
    const response = await apiClient.get('/presets/list');

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to list presets',
    };
  }
};

/**
 * Delete a saved preset
 * 
 * @param {string} name - Preset name to delete
 * @returns {Promise<Object>} Delete operation result
 */
export const deletePreset = async (name) => {
  try {
    const response = await apiClient.delete(`/presets/${name}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to delete preset',
    };
  }
};

// ============================================================
// Health Check API
// ============================================================

/**
 * Check if the backend API is healthy and responding
 * 
 * @returns {Promise<Object>} Health status
 */
export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/health');

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Backend is not responding',
    };
  }
};

// ============================================================
// Utility Functions
// ============================================================

/**
 * Parse comma-separated extensions into array
 * 
 * @param {string} extensionsString - Comma-separated extensions (e.g., ".py, .js, .txt")
 * @returns {Array<string>|null} Array of normalised extensions or null
 */
export const parseExtensions = (extensionsString) => {
  if (!extensionsString || !extensionsString.trim()) {
    return null;
  }

  return extensionsString
    .split(',')
    .map((ext) => {
      const trimmed = ext.trim().toLowerCase();
      return trimmed.startsWith('.') ? trimmed : `.${trimmed}`;
    })
    .filter((ext) => ext.length > 1); // Remove empty extensions
};

/**
 * Format file size from bytes to human-readable string
 * 
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
};

/**
 * Format timestamp to British English date/time
 * 
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted date/time
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// Export everything as default as well for convenience
export default {
  scanFiles,
  copyFiles,
  savePreset,
  loadPreset,
  listPresets,
  deletePreset,
  healthCheck,
  parseExtensions,
  formatFileSize,
  formatTimestamp,
};