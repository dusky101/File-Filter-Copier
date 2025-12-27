/**
 * Electron Main Process
 *
 * Handles window creation, IPC communication, and native OS integrations
 * Provides folder selection dialog through IPC
 */

const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  nativeImage,
  screen,
  Menu, // <-- Added for Menu
  shell, // <-- Added for links
} = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { spawn, exec } = require("child_process");

// dev flag works with Vite/Forge globals and NODE_ENV
const isDev =
  process.env.NODE_ENV === "development" ||
  !!process.env.VITE_DEV_SERVER_URL ||
  (typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== "undefined" &&
    !!MAIN_WINDOW_VITE_DEV_SERVER_URL);

// Handle creating/removing shortcuts on Windows (Squirrel only)
if (process.platform === "win32") {
  try {
    if (require("electron-squirrel-startup")) app.quit();
  } catch (_) {
    // module not present on non-Squirrel runs – ignore
  }
}

let mainWindow;
let backendProcess = null; // Initialize as null
let selectedIconPath = null;

// ---------- App Icon resolution ----------
function findFirstExisting(paths) {
  for (const p of paths) {
    try {
      if (p && fs.existsSync(p)) return p;
    } catch {}
  }
  return null;
}

function baseDirs() {
  return [
    app.getAppPath(),
    __dirname,
    path.join(__dirname, ".."),
    process.cwd(),
    process.resourcesPath || "",
  ];
}

function iconCandidates(platform) {
  const subdir =
    platform === "darwin" ? "mac" : platform === "win32" ? "win" : "linux";
  const filename =
    platform === "darwin"
      ? "icon.icns"
      : platform === "win32"
        ? "icon.ico"
        : "icon.png";

  const dirs = baseDirs().flatMap((b) => [
    path.join(b, "src", "assets", "icons", subdir),
    path.join(b, "assets", "icons", subdir),
    path.join(b, "icons", subdir),
    path.join(b, "src", "assets", "icons"),
    path.join(b, "assets", "icons"),
    path.join(b, "icons"),
    b,
  ]);

  return dirs.map((d) => path.join(d, filename));
}

function appIconPath() {
  const candidates = iconCandidates(process.platform);
  const found = findFirstExisting(candidates);
  if (!found)
    console.warn(
      "Icon not found. Tried:",
      candidates.slice(0, 6),
      "… total:",
      candidates.length
    );
  else console.log("Using icon:", found);
  return found;
}

function appNativeIcon() {
  const p = appIconPath();
  if (!p) return null;
  try {
    const img = nativeImage.createFromPath(p);
    if (img && !img.isEmpty()) {
      selectedIconPath = p;
      return img;
    }
  } catch {}
  return null;
}

// Only set Dock icon if .icns is available in dev; never override in production
function applyMacDockIcon() {
  if (process.platform !== "darwin") return;
  if (app.isPackaged) return; // let macOS use the bundled .icns so sizing looks native
  const p = appIconPath();
  if (!p || path.extname(p).toLowerCase() !== ".icns") return; // skip PNGs (they can look oversized)
  try {
    const img = nativeImage.createFromPath(p);
    if (img && !img.isEmpty()) app.dock.setIcon(img);
  } catch {}
}
// ---------- end App Icon resolution ----------

/**
 * Seed default JSON config files into userData on first run
 */
function ensureUserDataConfig() {
  const userData = app.getPath("userData");
  const backendDir = path.join(app.getAppPath(), "backend");
  const files = ["filter_presets.json", "excluded_folders.json"];

  try {
    fs.mkdirSync(userData, { recursive: true });
  } catch {}

  for (const f of files) {
    const dest = path.join(userData, f);
    if (!fs.existsSync(dest)) {
      const srcCandidates = [
        path.join(backendDir, f),
        path.join(__dirname, "backend", f),
        path.join(__dirname, "..", "backend", f),
        path.join(process.resourcesPath || "", "backend", f),
      ];
      const src = srcCandidates.find((p) => {
        try {
          return p && fs.existsSync(p);
        } catch {
          return false;
        }
      });
      try {
        if (src) {
          fs.copyFileSync(src, dest);
        } else {
          fs.writeFileSync(
            dest,
            f === "filter_presets.json" ? "{}" : "[]",
            "utf-8"
          );
        }
      } catch (e) {
        console.error("Failed to seed userData config", f, e);
      }
    }
  }
}

// ---------- Backend helpers ----------

function backendRoot() {
  return app.getAppPath();
}
function backendDir() {
  return path.join(backendRoot(), "backend");
}
function backendDistBinaryPath() {
  const exe =
    process.platform === "win32"
      ? "file-filter-backend.exe"
      : "file-filter-backend";
  const candidates = [
    path.join(backendDir(), "dist", exe),
    path.join(__dirname, "backend", "dist", exe),
    path.join(__dirname, "..", "backend", "dist", exe),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {}
  }
  return null;
}
function prodBackendBinaryPath() {
  const names =
    process.platform === "win32"
      ? ["file-filter-backend.exe", "file-filter-backend"]
      : ["file-filter-backend"];
  const bases = [
    path.join(process.resourcesPath || "", "backend"),
    path.join(process.resourcesPath || "", "dist"),
    process.resourcesPath || "",
  ];
  for (const base of bases) {
    for (const name of names) {
      const c = path.join(base, name);
      try {
        if (fs.existsSync(c)) return c;
      } catch {}
    }
  }
  return null;
}
function resolveDevBackendEntry() {
  const candidates = [
    path.join(app.getAppPath(), "backend", "main.py"),
    path.join(__dirname, "..", "backend", "main.py"),
    path.join(__dirname, "backend", "main.py"),
    path.join(process.cwd(), "backend", "main.py"),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {}
  }
  return candidates[0];
}
function requirementsFiles() {
  const req = path.join(backendDir(), "requirements.txt");
  const reqDev = path.join(backendDir(), "requirements-dev.txt");
  return [req, fs.existsSync(reqDev) ? reqDev : null].filter(Boolean);
}
function userVenvDir() {
  return path.join(app.getPath("userData"), "backend-venv");
}
function venvPython(venvPath) {
  return process.platform === "win32"
    ? path.join(venvPath, "Scripts", "python.exe")
    : path.join(venvPath, "bin", "python");
}
function whichSync(cmds) {
  const PATH = process.env.PATH || "";
  const exts =
    process.platform === "win32"
      ? (process.env.PATHEXT || ".EXE;.CMD;.BAT").split(";")
      : [""];
  for (const cmd of Array.isArray(cmds) ? cmds : [cmds]) {
    for (const p of PATH.split(path.delimiter)) {
      for (const e of exts) {
        const full = path.join(p, cmd + e);
        try {
          if (fs.existsSync(full)) return full;
        } catch {}
      }
    }
  }
  return null;
}
function isBackendAlive(
  url = "http://127.0.0.1:8000/api/health",
  timeoutMs = 1500
) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      try {
        req.destroy();
      } catch {}
      resolve(false);
    });
  });
}
function waitForBackend({
  url = "http://127.0.0.1:8000/api/health",
  timeoutMs = 35000,
  intervalMs = 500,
}) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        const ok =
          res.statusCode && res.statusCode >= 200 && res.statusCode < 500;
        res.resume();
        if (ok) return resolve(true);
        if (Date.now() - start > timeoutMs)
          return reject(new Error("Backend not responding"));
        setTimeout(tick, intervalMs);
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs)
          return reject(new Error("Backend not responding"));
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
  if (process.platform === "win32") {
    const pyLauncher = whichSync("py");
    if (pyLauncher) sysPy = pyLauncher; // we will pass -3
  }
  if (!sysPy) {
    sysPy =
      whichSync(process.platform === "win32" ? "python" : "python3") ||
      whichSync("python");
  }
  if (!sysPy) throw new Error("No system Python found to create backend venv");

  // create venv
  await new Promise((resolve, reject) => {
    const args =
      process.platform === "win32" &&
      path.basename(sysPy).toLowerCase() === "py"
        ? ["-3", "-m", "venv", venvPath]
        : ["-m", "venv", venvPath];
    const p = spawn(sysPy, args, { stdio: "inherit" });
    p.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error("venv creation failed"))
    );
  });

  // install deps
  for (const req of requirementsFiles()) {
    await new Promise((resolve) => {
      const p = spawn(py, ["-m", "pip", "install", "--upgrade", "pip"], {
        stdio: "inherit",
      });
      p.on("exit", () => resolve());
    });
    await new Promise((resolve, reject) => {
      const p = spawn(py, ["-m", "pip", "install", "-r", req], {
        stdio: "inherit",
      });
      p.on("exit", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`pip install failed for ${req}`))
      );
    });
  }
  return py;
}

async function startBackend() {
  // Skip spawn if already running (e.g., developer started it manually)
  if (await isBackendAlive("http://127.0.0.1:8000/api/health")) {
    console.log(
      "[backend] Detected running backend at 127.0.0.1:8000, skipping spawn."
    );
    return;
  }

  ensureUserDataConfig();

  // Pass the AppData folder to the Python backend so it knows where to save
  const env = {
    ...process.env,
    PORT: "8000",
    FFC_CONFIG_DIR: app.getPath("userData"),
  };

  let command = null;
  let args = [];
  let cwd = app.getPath("userData");

  if (isDev) {
    // Prefer dev PyInstaller binary if present
    const devExe = backendDistBinaryPath();
    const envPython = process.env.FLC_PYTHON;
    const envEntry = process.env.FLC_BACKEND_ENTRY;

    if (devExe) {
      command = devExe;
      args = [];
      console.log("[backend] using dev binary =", devExe);
    } else {
      let py = envPython && fs.existsSync(envPython) ? envPython : null;
      if (!py) {
        try {
          py = await ensureVenvAndDeps();
        } catch (e) {
          // Fallback to system python if venv bootstrap fails
          py =
            whichSync(process.platform === "win32" ? "python" : "python3") ||
            "python3";
        }
      }
      command = py;
      const entry =
        envEntry && fs.existsSync(envEntry)
          ? envEntry
          : resolveDevBackendEntry();
      args = [entry];
      console.log("[backend] dev entry =", entry);
      if (envPython) console.log("[backend] env python =", envPython);
    }
  } else {
    const exe = prodBackendBinaryPath();
    if (!exe) {
      console.error("[backend] No packaged backend binary found in resources.");
      return;
    }
    console.log("[backend] using packaged binary =", exe);
    command = exe;
    args = [];
  }

  backendProcess = spawn(command, args, {
    cwd,
    env,
    stdio: "pipe",
    windowsHide: true,
  });

  backendProcess.stdout.on("data", (d) =>
    process.stdout.write(`[backend] ${d}`)
  );
  backendProcess.stderr.on("data", (d) =>
    process.stderr.write(`[backend] ${d}`)
  );
  backendProcess.on("exit", (code, signal) => {
    console.log(`📚 Backend exited code=${code} signal=${signal}`);
  });

  await waitForBackend({ url: "http://127.0.0.1:8000/api/health" }).catch(
    (e) => {
      console.error("Backend readiness check failed:", e.message);
    }
  );
}

// ---------- Splash (progress) ----------
// helper: resolve an asset absolute path (dev or packaged)
function resolveAssetPath(basename) {
  const candidates = [
    path.join(__dirname, "src", "assets", basename), // dev (Vite)
    path.join(__dirname, "assets", basename), // alt dev
    path.join(process.resourcesPath || "", basename), // packaged via extraResource
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  return null;
}
// helper to read packaged or dev asset and return data URL
function readAssetDataUrl(basename) {
  const p = resolveAssetPath(basename);
  if (!p) return null;
  const ext = path.extname(p).slice(1) || "png";
  return `data:image/${ext};base64,${fs.readFileSync(p).toString("base64")}`;
}

// Size splash to the image aspect ratio and a bit larger, then centre it
function getSplashWindowSize() {
  const imgPath = resolveAssetPath("splash.png");
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  // allow up to 80% of the work area
  const maxW = Math.min(Math.floor(sw * 0.8), 1280);
  const maxH = Math.min(Math.floor(sh * 0.8), 820);

  if (imgPath) {
    const ns = nativeImage.createFromPath(imgPath).getSize();
    const iw = ns.width || 1152,
      ih = ns.height || 768; // your splash is 1152×768 (3:2)
    const scale = Math.min(maxW / iw, maxH / ih, 1);
    const w = Math.round(iw * scale);
    const h = Math.round(ih * scale);
    return { width: w, height: h };
  }
  // fallback 3:2
  return { width: 960, height: 640 };
}

function createSplashWindow() {
  const { width, height } = getSplashWindowSize();
  const splash = new BrowserWindow({
    width,
    height,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    show: false,
    backgroundColor: "#0b1220",
    center: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const bg = readAssetDataUrl("splash.png"); // full-background image
  const logo = readAssetDataUrl("icon.png"); // centred logo

  const html = `<!doctype html><html><head><meta charset="utf-8" />
  <style>
    html,body{margin:0;height:100%;font-family:ui-sans-serif,system-ui,Arial;background:#0b1220;overflow:hidden;}
    .wrap{
      position:relative;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      height:100%;
    }
    .bg {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      object-fit: contain;
      object-position: center center;
      pointer-events: none;
    }
    .overlay{
      position:absolute;
      inset:0;
      pointer-events:none;
      background-image: radial-gradient(1200px 600px at 20% -20%,rgba(31,42,68,.7) 0%,transparent 60%),
                        radial-gradient(1000px 500px at 120% 120%,rgba(27,43,74,.7) 0%,transparent 60%);
    }
    .content{
      position:relative;
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:32px;
      /* Fine-tune positioning relative to background */
      transform: translate(-2%, -8%);
    }
    .logo{
      width:140px;
      height:140px;
      border-radius:24px;
      box-shadow:0 10px 30px rgba(0,0,0,.35);
      object-fit:contain;
      background:#0e1628;
    }
    .title{
      color:#e5e7eb;
      font-weight:600;
      font-size:18px;
      letter-spacing:.3px;
      text-shadow:0 1px 2px rgba(0,0,0,.35);
      margin-top:8px;
    }
    .bar{
      width:280px;
      height:10px;
      border-radius:999px;
      background:rgba(31,41,55,.75);
      overflow:hidden;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);
      margin-top:12px;
    }
    .fill{
      height:100%;
      width:0%;
      background:linear-gradient(90deg,#3b82f6,#8b5cf6);
      transition:width .2s ease;
    }
    .label{
      color:#c7d2fe;
      font-size:13px;
      text-shadow:0 1px 2px rgba(0,0,0,.35);
      margin-top:8px;
    }
  </style></head><body>
    <div class="wrap">
      ${bg ? `<img class="bg" src="${bg}" alt="splash" />` : ""}
      <div class="overlay"></div>
      <div class="content">
        ${logo ? `<img class="logo" src="${logo}" alt="icon" />` : ""}
        <div class="title">Starting File Filter Copier…</div>
        <div class="bar"><div id="pfill" class="fill"></div></div>
        <div id="plabel" class="label">Initialising backend…</div>
      </div>
    </div>
  </body></html>`;
  splash.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
  splash.once("ready-to-show", () => splash.show());
  return splash;
}

function setSplashProgress(win, ratio, label) {
  const p = Math.max(0, Math.min(1, ratio || 0));
  // DO NOT call win.setProgressBar() - it affects the Dock icon on macOS
  const js = `(function(){const f=document.getElementById('pfill');if(f)f.style.width='${Math.round(p * 100)}%';
    const l=document.getElementById('plabel');if(l)l.textContent=${JSON.stringify(label || "")};})();`;
  try {
    win.webContents.executeJavaScript(js).catch(() => {});
  } catch {}
}
// ---------- end Splash ----------

// ---------- Window / IPC ----------
const createWindow = () => {
  const iconPath = appIconPath();
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    backgroundColor: "#f8fafc",
    show: false,
    titleBarStyle: "default",
    // Window icon for Windows/Linux
    icon:
      process.platform === "linux" || process.platform === "win32"
        ? iconPath || undefined
        : undefined,
  });

  // About panel icon (macOS)
  if (process.platform === "darwin") {
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
    if (isDev) mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  return mainWindow;
};

// Renderer can request the icon (for "files found" popup)
ipcMain.handle("app:getIconDataUrl", () => {
  const img = appNativeIcon();
  if (!img) return null;
  try {
    const png = img.toPNG();
    return `data:image/png;base64,${Buffer.from(png).toString("base64")}`;
  } catch {
    return null;
  }
});

ipcMain.handle("dialog:openFolder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory", "createDirectory"],
    title: "Select Folder",
    buttonLabel: "Select",
  });
  return result;
});

ipcMain.handle("app:getVersion", () => app.getVersion());

// Gate renderer behind backend readiness with splash progress
app.on("ready", async () => {
  const splash = createSplashWindow();

  // Animate splash progress while backend starts
  const started = Date.now();
  const timeout = 20000;
  const tick = setInterval(() => {
    const r = Math.min(0.9, (Date.now() - started) / timeout);
    setSplashProgress(splash, r, "Initialising backend…");
  }, 200);

  try {
    await startBackend(); // waits for /api/health internally
    clearInterval(tick);
    setSplashProgress(splash, 1, "Backend ready");
  } catch (e) {
    clearInterval(tick);
    setSplashProgress(splash, 0.95, "Backend did not start in time");
    console.error("❌ Failed to start backend:", e);
  }

  // Apply macOS Dock icon once (only in dev if .icns available)
  applyMacDockIcon();

  // Create the application menu (hides dev tools in production)
  createApplicationMenu(isDev);

  // Create main window but keep it hidden
  mainWindow = createWindow();

  // Wait for main window to be ready, then transition smoothly
  mainWindow.once("ready-to-show", () => {
    // Brief delay to ensure smooth transition
    setTimeout(() => {
      mainWindow.show();
      splash.close(); // Use close() instead of destroy() for smoother transition
    }, 100);
  });
});

// Recreate window on macOS when dock icon is clicked
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const win = createWindow();
    win.once("ready-to-show", () => win.show());
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// CRITICAL FIX: Kill backend process robustly on Windows
const killBackend = () => {
  if (backendProcess) {
    console.log("Shutting down backend...");
    try {
      if (process.platform === "win32") {
        // Force kill the entire process tree on Windows
        // /F = force, /T = tree (kills children), /PID = process id
        exec(`taskkill /F /T /PID ${backendProcess.pid}`);
      } else {
        // Standard signal for macOS/Linux
        backendProcess.kill("SIGTERM");
      }
    } catch (e) {
      console.error("Failed to kill backend:", e);
    }
    backendProcess = null;
  }
};

app.on("before-quit", killBackend);
app.on("will-quit", killBackend); // Double safety

// Windows app ID
if (process.platform === "win32") {
  app.setAppUserModelId("com.filefiltercopier.app");
}

console.log("Electron main process started");
console.log("App path:", app.getAppPath());
console.log("Platform:", process.platform);
console.log("Icon search bases:", baseDirs());

// --------------------------------------------------------
// APPLICATION MENU CONFIGURATION (INLINED FOR RELIABILITY)
// --------------------------------------------------------
function createApplicationMenu(isDev = false) {
  const isMac = process.platform === "darwin";
  const { BrowserWindow } = require("electron"); // Ensure we have access to this

  const template = [
    // 1. App Menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),

    // 2. File Menu
    {
      label: "File",
      submenu: [isMac ? { role: "close" } : { role: "quit" }],
    },

    // 3. Edit Menu
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(isMac
          ? [
              { role: "pasteAndMatchStyle" },
              { role: "delete" },
              { role: "selectAll" },
              { type: "separator" },
              {
                label: "Speech",
                submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
              },
            ]
          : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
      ],
    },

    // 4. View Menu
    {
      label: "View",
      submenu: [
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        // Only show Reload/DevTools in Development mode
        ...(isDev
          ? [
              { type: "separator" },
              { role: "reload" },
              { role: "forceReload" },
              { role: "toggleDevTools" },
            ]
          : []),
      ],
    },

    // 5. Window Menu
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" },
              { role: "front" },
              { type: "separator" },
              { role: "window" },
            ]
          : [{ role: "close" }]),
      ],
    },

    // 6. Help Menu
    {
      role: "help",
      submenu: [
        {
          label: "User Guide", // <--- CHANGED THIS
          click: () => {
            // <--- CHANGED THIS LOGIC
            const win = BrowserWindow.getFocusedWindow();
            if (win) {
              win.webContents.send("menu:open-help");
            }
          },
        },
        {
          label: "Report an Issue",
          click: async () => {
            await shell.openExternal(
              "https://github.com/dusky101/file-filter-copier/issues"
            );
          },
        },
        { type: "separator" },
        {
          label: "Open Settings Folder",
          click: async () => {
            await shell.openPath(app.getPath("userData"));
          },
        },
        // About (Windows/Linux)
        ...(!isMac
          ? [
              { type: "separator" },
              {
                label: "About File Filter Copier",
                click: () => {
                  dialog.showMessageBox({
                    type: "info",
                    title: "About File Filter Copier",
                    message: "File Filter Copier",
                    detail: `Version: ${app.getVersion()}\n\nDeveloped by FCM Tech`,
                    buttons: ["OK"],
                    // Tries to find icon in assets
                    icon: path.join(__dirname, "assets", "icon.png"),
                  });
                },
              },
            ]
          : []),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  console.log(`Application menu created (dev mode: ${isDev})`);
}
