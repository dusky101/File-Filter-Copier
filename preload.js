/**
 * Electron Preload Script
 * * Exposes secure Electron APIs to the renderer process
 * Provides folder selection dialog functionality
 */

const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electron", {
  /**
   * Open folder selection dialog
   * @returns {Promise<{canceled: boolean, filePaths: string[]}>}
   */
  selectFolder: () => ipcRenderer.invoke("dialog:openFolder"),

  /**
   * Get app version
   * @returns {Promise<string>}
   */
  getAppVersion: () => ipcRenderer.invoke("app:getVersion"),

  /**
   * Listen for "User Guide" menu click
   * Returns a cleanup function to remove the listener
   */
  onOpenHelp: (callback) => {
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on("menu:open-help", subscription);
    return () => ipcRenderer.removeListener("menu:open-help", subscription);
  },

  /**
   * Platform information
   */
  platform: process.platform,

  /**
   * Check if running in Electron
   */
  isElectron: true,
});

// Log preload script loaded
console.log("✅ Preload script loaded successfully");
