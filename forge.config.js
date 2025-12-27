const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");
const nodePath = require("path");

module.exports = {
  packagerConfig: {
    // CRITICAL FIX: Disable ASAR to prevent Windows file locking errors
    asar: false,
    icon: nodePath.join(
      __dirname,
      "src",
      "assets",
      "icons",
      process.platform === "win32" ? "win" : "mac",
      "icon"
    ),
    appBundleId: "com.filefiltercopier.app",
    appCategoryType: "public.app-category.productivity",
    darwinDarkModeSupport: true,
    extraResource: [
      nodePath.join(
        __dirname,
        "backend",
        "dist",
        `file-filter-backend${process.platform === "win32" ? ".exe" : ""}`
      ),
      nodePath.join(__dirname, "src", "assets", "splash.png"),
      nodePath.join(__dirname, "src", "assets", "icon.png"),
    ],
  },
  rebuildConfig: {},
  makers: [
    // -----------------------------------------------------------
    // 1. SQUIRREL (Standard Windows Setup.exe)
    // -----------------------------------------------------------
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        // Internal name (keep it simple, no spaces)
        name: "FileFilterCopier",

        // The name of the installer file the user will see
        setupExe: "FileFilterCopierSetup.exe",

        // Local path to icon (Used for the Setup.exe file itself)
        setupIcon: nodePath.join(
          __dirname,
          "src",
          "assets",
          "icons",
          "win",
          "icon.ico"
        ),

        // Remote URL (Used for "Add/Remove Programs" in Control Panel)
        // I converted your link to the direct "raw" format which is safer for build tools
        iconUrl:
          "https://raw.githubusercontent.com/dusky101/file-filter-copier-assets/main/assets/icons/win/icon.ico",

        // Skip MSI creation to speed up build
        noMsi: true,
      },
    },

    // -----------------------------------------------------------
    // 2. ZIP MAKER (Portable Version)
    // -----------------------------------------------------------
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "win32"],
    },

    // -----------------------------------------------------------
    // 3. MAC & LINUX MAKERS
    // -----------------------------------------------------------
    {
      name: "@electron-forge/maker-dmg",
      config: {
        name: "File Filter Copier",
        icon: nodePath.join(
          __dirname,
          "src",
          "assets",
          "icons",
          "mac",
          "icon.icns"
        ),
        format: "ULFO",
      },
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          name: "file-filter-copier",
          productName: "File Filter Copier",
          icon: nodePath.join(
            __dirname,
            "src",
            "assets",
            "icons",
            "linux",
            "icon.png"
          ),
          categories: ["Utility"],
        },
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        options: {
          name: "file-filter-copier",
          productName: "File Filter Copier",
          icon: nodePath.join(
            __dirname,
            "src",
            "assets",
            "icons",
            "linux",
            "icon.png"
          ),
          categories: ["Utility"],
        },
      },
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-vite",
      config: {
        build: [
          {
            entry: "main.js",
            config: "vite.main.config.mjs",
            target: "main",
          },
          {
            entry: "preload.js",
            config: "vite.preload.config.mjs",
            target: "preload",
          },
        ],
        renderer: [
          {
            name: "main_window",
            config: "vite.renderer.config.mjs",
          },
        ],
      },
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};
