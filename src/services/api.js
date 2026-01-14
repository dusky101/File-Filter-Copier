/**
 * API Service for File Filter Copier
 * * This module provides a clean interface for communicating with the FastAPI backend.
 * All API calls are centralized here for easy maintenance and error handling.
 */

import axios from "axios";
import useSettingsStore from "../stores/useSettingsStore";

const API_BASE_URL = "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // default to no timeout; we will provide per-request timeouts from settings
  timeout: 0,
  headers: {
    "Content-Type": "application/json",
  },
});

const getTimeoutFromSettings = (fallback = 300000) => {
  try {
    const state = useSettingsStore.getState();
    if (!state) return fallback;
    const t = state.getRequestTimeout ? state.getRequestTimeout() : fallback;
    return typeof t === "number" ? t : fallback;
  } catch {
    return fallback;
  }
};

// --- Helper: Standardize File Objects (FIXED) ---
const mapFileResult = (item) => {
  if (!item) return null;

  // 1. Handle Backend "FileResult" Object (New Backend Format)
  // The backend now returns rich objects: { path: "...", name: "...", metadata: {...} }
  if (typeof item === "object" && !Array.isArray(item)) {
    // Safety check: if path is missing, we can't use this file
    if (!item.path) return null;

    return {
      name: item.name || String(item.path).split(/[/\\]/).pop(),
      path: item.path,
      semantic_type: item.semantic_type || "Unclassified",
      search_tags: item.search_tags || [],
      metadata: item.metadata || {},
      size: item.size || 0,
      size_formatted: item.size_formatted || "0 B",
      modified: item.modified || "",
      created: item.created || "",
    };
  }

  // 2. Handle Legacy Tuple format [path, type, tags, metadata] (Fallback)
  // Used if backend logic falls back to raw filter tuples
  if (Array.isArray(item) && item.length > 0) {
    const path = item[0];
    const type = item[1];
    const tags = item[2];
    const metadata = item[3] || {};

    return {
      name: String(path).split(/[/\\]/).pop(),
      path: String(path),
      semantic_type: type || "Unclassified",
      search_tags: tags || [],
      metadata: metadata,
      size: 0,
      size_formatted: "0 B",
      modified: metadata?.date_taken || "",
      created: "",
    };
  }

  return null;
};

// Request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    // console.log(`🔵 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("🔴 API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // console.log(`🟢 API Response: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(
      "🔴 API Response Error:",
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

// ============================================================
// Folder Operations API
// ============================================================

/**
 * List all subdirectories in a given folder path
 * * @param {string} folderPath - Path to the source folder
 * @returns {Promise<Object>} Result with folder list
 */
export const listFolders = async (folderPath) => {
  try {
    const response = await apiClient.get("/folders", {
      params: { path: folderPath },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.detail ||
        error.message ||
        "Failed to list folders",
    };
  }
};

/**
 * Get default excluded folders from backend
 * @returns {Promise<Object>} Result with defaults list
 */
export const getExcludedFoldersDefaults = async () => {
  try {
    const response = await apiClient.get("/excluded-folders/defaults");
    return response.data;
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.detail ||
        error.message ||
        "Failed to fetch defaults",
    };
  }
};

// ============================================================
// File Scanning API
// ============================================================

/**
 * Scan a folder with filters and return matching files
 * Supports optional options.progressId to stream SSE progress.
 *
 * @param {Object} filters - filter configuration (includes photo_mode)
 * @param {Object} [options] - extra options
 * @param {string} [options.progressId] - progress channel id
 * @param {number} [options.timeout] - override timeout ms
 */
export const scanFiles = async (filters, options = {}) => {
  const { progressId, timeout } = options;
  const headers = {};
  if (progressId) headers["x-progress-id"] = progressId;

  const effectiveTimeout =
    typeof timeout === "number" ? timeout : getTimeoutFromSettings(0); // 0 = no timeout if disabled in settings

  try {
    const res = await apiClient.post("/scan", filters, {
      headers,
      timeout: effectiveTimeout,
    });

    const rawData = res.data;

    // Backend returns ScanResponse: { success: true, files: [...], duplicates: {...}, ... }
    if (rawData && rawData.success !== false) {
      const rawFiles = rawData.files || [];

      // Robustly map files, filtering out any errors
      const mappedFiles = rawFiles.map(mapFileResult).filter((f) => f !== null);

      return {
        success: true, // Explicitly return success for App.jsx
        files: mappedFiles,
        total_files: rawData.total_files || mappedFiles.length,
        duplicates: rawData.duplicates || {},
      };
    }

    return {
      success: false,
      error: rawData.error || "Scan failed",
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || "Scan failed",
    };
  }
};

/**
 * Create a progress channel for deep scans (SSE)
 * @returns {Promise<{success:boolean, data:{progress_id:string}}>}
 */
export const startProgress = async () => {
  try {
    const res = await apiClient.post("/progress/start");
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============================================================
// File Copy API
// ============================================================

/**
 * Copy filtered files to a destination folder
 * * @param {Object} copyRequest - Copy operation details
 * @param {Array<string>} copyRequest.files - List of file paths to copy
 * @param {string} copyRequest.outputFolder - Output folder name
 * @param {string} copyRequest.destination - Destination parent directory
 * @param {string} [copyRequest.structure] - Organisation structure (flat, date, type, preserve)
 * @param {string} [copyRequest.source_folder] - Root source folder (needed for 'preserve')
 * @returns {Promise<Object>} Copy operation result
 */
export const copyFiles = async (copyRequest) => {
  try {
    const timeout = getTimeoutFromSettings();
    const response = await apiClient.post(
      "/copy",
      {
        files: copyRequest.files || [],
        output_folder: copyRequest.outputFolder || "FilteredFiles",
        destination: copyRequest.destination || "",
        structure: copyRequest.structure || "flat",
        source_folder: copyRequest.source_folder || null,
      },
      { timeout }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.detail ||
        error.message ||
        "Copy operation failed",
    };
  }
};

// ============================================================
// Preset Management API
// ============================================================

/**
 * Save a filter configuration as a preset
 * * @param {string} name - Preset name
 * @param {Object} config - Filter configuration to save
 * @returns {Promise<Object>} Save operation result
 */
export const savePreset = async (name, config) => {
  try {
    const response = await apiClient.post("/presets/save", { name, config });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.detail ||
        error.message ||
        "Failed to save preset",
    };
  }
};

/**
 * Load a preset by name
 * * @param {string} name - Preset name
 * @returns {Promise<Object>} Preset configuration
 */
export const loadPreset = async (name) => {
  try {
    const response = await apiClient.get(`/presets/${name}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.detail ||
        error.message ||
        "Failed to load preset",
    };
  }
};

/**
 * List all available presets
 * * @returns {Promise<Object>} List of preset names
 */
export const listPresets = async () => {
  try {
    const response = await apiClient.get("/presets/list");
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.detail ||
        error.message ||
        "Failed to list presets",
    };
  }
};

/**
 * Delete a preset by name
 * * @param {string} name - Preset name to delete
 * @returns {Promise<Object>} Delete operation result
 */
export const deletePreset = async (name) => {
  try {
    const response = await apiClient.delete(`/presets/${name}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.detail ||
        error.message ||
        "Failed to delete preset",
    };
  }
};

/**
 * Get the default preset configuration
 * * @returns {Promise<Object>} Default preset configuration
 */
export const getDefaultPreset = async () => {
  try {
    const response = await apiClient.get("/presets/default");
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Set the default preset by name
 * * @param {string} name - Preset name to set as default
 * @returns {Promise<Object>} Set operation result
 */
export const setDefaultPreset = async (name) => {
  try {
    const response = await apiClient.post("/presets/default", { name });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Clear the default preset
 * * @returns {Promise<Object>} Clear operation result
 */
export const clearDefaultPreset = async () => {
  try {
    const response = await apiClient.delete("/presets/default");
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============================================================
// Health Check API
// ============================================================

/**
 * Check if the backend is running and healthy
 * * @returns {Promise<Object>} Health check result
 */
export const healthCheck = async () => {
  try {
    const response = await apiClient.get("/health");
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.detail || error.message || "Health check failed",
    };
  }
};

// ============================================================
// Utility Functions
// ============================================================

/**
 * Parse comma-separated extensions into an array
 * * @param {string} extensionString - Comma-separated extensions
 * @returns {Array<string>|null} Array of extensions or null if empty
 */
export const parseExtensions = (extensionString) => {
  if (!extensionString || !extensionString.trim()) return null;

  return extensionString
    .split(",")
    .map((ext) => ext.trim())
    .filter((ext) => ext.length > 0)
    .map((ext) => (ext.startsWith(".") ? ext : `.${ext}`));
};

/**
 * Format file size in human-readable format
 * * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
};

/**
 * Format timestamp in human-readable format
 * * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date and time
 */
export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  startProgress,
  listFolders,
  getDefaultPreset,
  setDefaultPreset,
  clearDefaultPreset,
  getExcludedFoldersDefaults, // Added to default export
};
