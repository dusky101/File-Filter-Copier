/**
 * Electron Main Process
 * 
 * Handles window creation, IPC communication, and native OS integrations
 * Provides folder selection dialog through IPC
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let backendProcess;

const isDev = Boolean(process.env.ELECTRON_START_URL || typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== 'undefined');

function resolveDevVenvPython() {
  // Common virtual environment folder names
  const venvNames = ['.venv', 'venv'];
  const backendDir = path.join(__dirname, 'backend');
  for (const name of venvNames) {
    const venvPath = path.join(backendDir, name);
    const pythonPath = process.platform === 'win32'
      ? path.join(venvPath, 'Scripts', 'python.exe')
      : path.join(venvPath, 'bin', 'python');
    if (fs.existsSync(pythonPath)) return pythonPath;
  }
  // Fallback to system python
  return process.platform === 'win32' ? 'python' : 'python3';
}

function getProdBackendExecutable() {
  // Expect a PyInstaller-built binary named 'file-filter-backend' (or .exe on Windows)
  const exeName = process.platform === 'win32' ? 'file-filter-backend.exe' : 'file-filter-backend';
  // When packaged, process.resourcesPath points to .../Contents/Resources (mac) or resources (win/linux)
  const candidate = path.join(process.resourcesPath, 'backend', exeName);
  return candidate;
}

function waitForBackend({ url = 'http://127.0.0.1:8000/api/health', timeoutMs = 15000, intervalMs = 500 }) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
          res.resume();
          resolve();
        } else {
          res.resume();
          retry();
        }
      });
      req.on('error', retry);
      req.setTimeout(2000, () => {
        req.destroy(new Error('Timeout'));
      });
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) return reject(new Error('Backend did not start in time'));
      setTimeout(check, intervalMs);
    };
    check();
  });
}

async function startBackend() {
  const backendPort = 8000; // Must match src/services/api.js
  const env = { ...process.env, PORT: String(backendPort) };
  let command;
  let args;
  let cwd;

  if (isDev) {
    const python = resolveDevVenvPython();
    cwd = path.join(__dirname, 'backend');
    command = python;
    args = ['main.py'];
  } else {
    const exePath = getProdBackendExecutable();
    cwd = app.getPath('userData'); // writable for JSON files used by backend
    command = exePath;
    args = [];
  }

  backendProcess = spawn(command, args, {
    cwd,
    env,
    stdio: 'pipe',
    windowsHide: true,
  });

  backendProcess.stdout.on('data', (d) => console.log(`[backend] ${d.toString().trim()}`));
  backendProcess.stderr.on('data', (d) => console.error(`[backend] ${d.toString().trim()}`));
  backendProcess.on('exit', (code, signal) => {
    console.log(`🔚 Backend exited code=${code} signal=${signal}`);
  });

  // Wait until backend is ready
  await waitForBackend({ url: 'http://127.0.0.1:8000/api/health' }).catch((e) => {
    console.error('Backend readiness check failed:', e.message);
  });
}

/**
 * Create the main application window
 */
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    backgroundColor: '#f8fafc',
    show: false, // Don't show until ready
    titleBarStyle: 'default'
  });

  // Load the app
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }
};

/**
 * IPC Handler: Open folder selection dialog
 */
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Folder',
    buttonLabel: 'Select'
  });
  
  return result;
});

/**
 * IPC Handler: Get app version
 */
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

/**
 * App ready event
 */
app.on('ready', async () => {
  try {
    await startBackend();
  } catch (e) {
    console.error('Failed to start backend:', e);
  }
  createWindow();
});

/**
 * Quit when all windows are closed (except on macOS)
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * On macOS, re-create window when dock icon is clicked
 */
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Ensure backend is terminated when app quits
app.on('before-quit', () => {
  if (backendProcess && !backendProcess.killed) {
    try { backendProcess.kill(); } catch {}
  }
});

/**
 * Additional app configurations
 */

// Disable hardware acceleration if needed for compatibility
// app.disableHardwareAcceleration();

// Set app user model ID for Windows
if (process.platform === 'win32') {
  app.setAppUserModelId('com.filefiltercopier.app');
}

console.log('✅ Electron main process started');
console.log('📁 App path:', app.getAppPath());
console.log('🖥️  Platform:', process.platform);