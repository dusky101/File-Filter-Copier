/**
 * Electron Main Process
 *
 * Handles window creation, IPC communication, and native OS integrations
 * Provides folder selection dialog through IPC
 */

const { app, BrowserWindow, ipcMain, dialog, nativeImage, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (process.platform === 'win32') {
  try {
    if (require('electron-squirrel-startup')) {
      app.quit();
    }
  } catch (e) {
    // Module not found — ignore
  }
}

let mainWindow;
let backendProcess;
let selectedIconPath = null;

// ---------- App Icon resolution ----------
function findFirstExisting(paths) {
  for (const p of paths) {
    try { if (p && fs.existsSync(p)) return p; } catch {}
  }
  return null;
}

function baseDirs() {
  return [
    app.getAppPath(),
    __dirname,
    path.join(__dirname, '..'),
    process.cwd(),
    process.resourcesPath || '',
  ];
}

function iconCandidates(platform) {
  const subdir = platform === 'darwin' ? 'mac' : platform === 'win32' ? 'win' : 'linux';
  const filename = platform === 'darwin' ? 'icon.icns'
                 : platform === 'win32' ? 'icon.ico'
                 : 'icon.png';

  const dirs = baseDirs().flatMap(b => [
    path.join(b, 'src', 'assets', 'icons', subdir),
    path.join(b, 'assets', 'icons', subdir),
    path.join(b, 'icons', subdir),
    path.join(b, 'src', 'assets', 'icons'),
    path.join(b, 'assets', 'icons'),
    path.join(b, 'icons'),
    b,
  ]);

  return dirs.map(d => path.join(d, filename));
}

function appIconPath() {
  const candidates = iconCandidates(process.platform);
  const found = findFirstExisting(candidates);
  if (!found) console.warn('Icon not found. Tried:', candidates.slice(0, 6), '… total:', candidates.length);
  else console.log('Using icon:', found);
  return found;
}

function appNativeIcon() {
  const icnsPath = appIconPath();
  let img = null;

  if (icnsPath && icnsPath.endsWith('.icns')) {
    img = nativeImage.createFromPath(icnsPath);
    if (img.isEmpty()) {
      console.warn('⚠️ .icns file is empty, falling back to PNG');
      const pngFallback = path.join(__dirname, 'src', 'assets', 'icons', 'mac', 'icon.png');
      if (fs.existsSync(pngFallback)) {
        img = nativeImage.createFromPath(pngFallback);
        selectedIconPath = pngFallback;
      }
    } else {
      selectedIconPath = icnsPath;
    }
  }

  return img && !img.isEmpty() ? img : null;
}

function applyMacDockIcon() {
  if (process.platform !== 'darwin') return;
  const img = appNativeIcon();
  if (img) {
    console.log('🧪 Native image size:', img.getSize());
    try {
      app.dock.setIcon(img);
    } catch (err) {
      console.error('❌ Failed to set dock icon:', err);
    }
  } else {
    console.warn('⚠️ No native image found for dock icon.');
  }
  console.log('🖼️  Dock icon:', selectedIconPath || '(not found)');
}
// ---------- end App Icon resolution ----------

/**
 * Seed default JSON config files into userData on first run
 */
function ensureUserDataConfig() {
  const userData = app.getPath('userData');
  const backendDir = path.join(app.getAppPath(), 'backend');
  const files = ['filter_presets.json', 'excluded_folders.json'];

  try {
    fs.mkdirSync(userData, { recursive: true });
  } catch {}

  for (const f of files) {
    const dest = path.join(userData, f);
    if (!fs.existsSync(dest)) {
      const srcCandidates = [
        path.join(backendDir, f),
        path.join(__dirname, 'backend', f),
        path.join(__dirname, '..', 'backend', f),
        path.join(process.resourcesPath || '', 'backend', f),
      ];
      const src = srcCandidates.find((p) => {
        try { return p && fs.existsSync(p); } catch { return false; }
      });
      try {
        if (src) {
          fs.copyFileSync(src, dest);
        } else {
          fs.writeFileSync(dest, f === 'filter_presets.json' ? '{}' : '[]', 'utf-8');
        }
      } catch (e) {
        console.error('Failed to seed userData config', f, e);
      }
    }
  }
}

// ---------- Backend helpers ----------

function backendRoot() {
  return app.getAppPath();
}
function backendDir() {
  return path.join(backendRoot(), 'backend');
}
function backendDistBinaryPath() {
  const exe = process.platform === 'win32' ? 'file-filter-backend.exe' : 'file-filter-backend';
  const candidates = [
    path.join(backendDir(), 'dist', exe),
    path.join(__dirname, 'backend', 'dist', exe),
    path.join(__dirname, '..', 'backend', 'dist', exe),
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch {}
  }
  return null;
}
function prodBackendBinaryPath() {
  const exe = process.platform === 'win32' ? 'file-filter-backend.exe' : 'file-filter-backend';
  const candidates = [
    path.join(process.resourcesPath || '', 'backend', exe),
    path.join(process.resourcesPath || '', 'dist', exe),
    path.join(process.resourcesPath || '', exe),
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch {}
  }
  return null;
}
function resolveDevBackendEntry() {
  const candidates = [
    path.join(app.getAppPath(), 'backend', 'main.py'),
    path.join(__dirname, '..', 'backend', 'main.py'),
    path.join(__dirname, 'backend', 'main.py'),
    path.join(process.cwd(), 'backend', 'main.py'),
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch {}
  }
  return candidates[0];
}
function requirementsFiles() {
  const req = path.join(backendDir(), 'requirements.txt');
  const reqDev = path.join(backendDir(), 'requirements-dev.txt');
  return [req, fs.existsSync(reqDev) ? reqDev : null].filter(Boolean);
}
function userVenvDir() {
  return path.join(app.getPath('userData'), 'backend-venv');
}
function venvPython(venvPath) {
  return process.platform === 'win32'
    ? path.join(venvPath, 'Scripts', 'python.exe')
    : path.join(venvPath, 'bin', 'python');
}
function whichSync(cmds) {
  const PATH = process.env.PATH || '';
  const exts = process.platform === 'win32'
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';')
    : [''];
  for (const cmd of (Array.isArray(cmds) ? cmds : [cmds])) {
    for (const p of PATH.split(path.delimiter)) {
      for (const e of exts) {
        const full = path.join(p, cmd + e);
        try { if (fs.existsSync(full)) return full; } catch {}
      }
    }
  }
  return null;
}
function isBackendAlive(url = 'http://127.0.0.1:8000/api/health', timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      try { req.destroy(); } catch {}
      resolve(false);
    });
  });
}
function waitForBackend({ url = 'http://127.0.0.1:8000/api/health', timeoutMs = 20000, intervalMs = 500 }) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        const ok = res.statusCode && res.statusCode >= 200 && res.statusCode < 500;
        res.resume();
        if (ok) return resolve(true);
        if (Date.now() - start > timeoutMs) return reject(new Error('Backend not responding'));
        setTimeout(tick, intervalMs);
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) return reject(new Error('Backend not responding'));
        setTimeout(tick, intervalMs);
      });
      req.setTimeout(3000, () => req.destroy());
    };
    tick();
  });
}

async function ensureVenvAndDeps() {
  const venvPath = userVenvDir();
  const py = venvPython(venvPath);
  if (fs.existsSync(py)) return py;

  // pick a system python
  let sysPy = null;
  if (process.platform === 'win32') {
    const pyLauncher = whichSync('py');
    if (pyLauncher) sysPy = pyLauncher; // we will pass -3
  }
  if (!sysPy) {
    sysPy = whichSync(process.platform === 'win32' ? 'python' : 'python3') || whichSync('python');
  }
  if (!sysPy) throw new Error('No system Python found to create backend venv');

  // create venv
  await new Promise((resolve, reject) => {
    const args = (process.platform === 'win32' && path.basename(sysPy).toLowerCase() === 'py')
      ? ['-3', '-m', 'venv', venvPath]
      : ['-m', 'venv', venvPath];
    const p = spawn(sysPy, args, { stdio: 'inherit' });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('venv creation failed'))));
  });

  // install deps
  for (const req of requirementsFiles()) {
    await new Promise((resolve) => {
      const p = spawn(py, ['-m', 'pip', 'install', '--upgrade', 'pip'], { stdio: 'inherit' });
      p.on('exit', () => resolve());
    });
    await new Promise((resolve, reject) => {
      const p = spawn(py, ['-m', 'pip', 'install', '-r', req], { stdio: 'inherit' });
      p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`pip install failed for ${req}`))));
    });
  }
  return py;
}

async function startBackend() {
  // Skip spawn if already running (e.g., developer started it manually)
  if (await isBackendAlive('http://127.0.0.1:8000/api/health')) {
    console.log('[backend] Detected running backend at 127.0.0.1:8000, skipping spawn.');
    return;
  }

  ensureUserDataConfig();

  const env = { ...process.env, PORT: '8000' };
  let command = null;
  let args = [];
  let cwd = app.getPath('userData');

  if (isDev) {
    // Prefer dev PyInstaller binary if present
    const devExe = backendDistBinaryPath();
    const envPython = process.env.FLC_PYTHON;
    const envEntry = process.env.FLC_BACKEND_ENTRY;

    if (devExe) {
      command = devExe;
      args = [];
      console.log('[backend] using dev binary =', devExe);
    } else {
      let py = envPython && fs.existsSync(envPython) ? envPython : null;
      if (!py) {
        try {
          py = await ensureVenvAndDeps();
        } catch (e) {
          // Fallback to system python if venv bootstrap fails
          py = whichSync(process.platform === 'win32' ? 'python' : 'python3') || 'python3';
        }
      }
      command = py;
      const entry = envEntry && fs.existsSync(envEntry) ? envEntry : resolveDevBackendEntry();
      args = [entry];
      console.log('[backend] dev entry =', entry);
      if (envPython) console.log('[backend] env python =', envPython);
    }
  } else {
    const exe = prodBackendBinaryPath();
    if (!exe) {
      console.error('[backend] No packaged backend binary found in resources.');
      return;
    }
    command = exe;
    args = [];
  }

  backendProcess = spawn(command, args, {
    cwd,
    env,
    stdio: 'pipe',
    windowsHide: true,
  });

  backendProcess.stdout.on('data', (d) => process.stdout.write(`[backend] ${d}`));
  backendProcess.stderr.on('data', (d) => process.stderr.write(`[backend] ${d}`));
  backendProcess.on('exit', (code, signal) => {
    console.log(`🔚 Backend exited code=${code} signal=${signal}`);
  });

  await waitForBackend({ url: 'http://127.0.0.1:8000/api/health' }).catch((e) => {
    console.error('Backend readiness check failed:', e.message);
  });
}

// ---------- Window / IPC ----------
const createWindow = () => {
  const iconPath = appIconPath();
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    backgroundColor: '#f8fafc',
    show: false,
    titleBarStyle: 'default',
    // Window icon for Windows/Linux
    icon: process.platform === 'linux' || process.platform === 'win32' ? iconPath || undefined : undefined,
  });

  // About panel icon (macOS)
  if (process.platform === 'darwin') {
    const dockIcon = appNativeIcon();
    if (dockIcon) {
      try {
        app.setAboutPanelOptions({
          applicationName: app.name,
          applicationVersion: app.getVersion(),
          icon: dockIcon,
        });
      } catch {}
    }
  }

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // ensure dock icon is applied in dev too
    applyMacDockIcon();
  });
};

// Renderer can request the icon (for “files found” popup)
ipcMain.handle('app:getIconDataUrl', () => {
  const img = appNativeIcon();
  if (!img) return null;
  try {
    const png = img.toPNG();
    return `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
  } catch {
    return null;
  }
});

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Folder',
    buttonLabel: 'Select',
  });
  return result;
});

ipcMain.handle('app:getVersion', () => app.getVersion());

app.on('ready', async () => {
  try {
    await startBackend();
  } catch (e) {
    console.error('Failed to start backend:', e);
  }
  applyMacDockIcon();
  createWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
  applyMacDockIcon();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess && !backendProcess.killed) {
    try { backendProcess.kill(); } catch {}
  }
});

// Windows app ID
if (process.platform === 'win32') {
  app.setAppUserModelId('com.filefiltercopier.app');
}

console.log('✅ Electron main process started');
console.log('📁 App path:', app.getAppPath());
console.log('🖥️  Platform:', process.platform);
console.log('🔎 Icon search bases:', baseDirs());