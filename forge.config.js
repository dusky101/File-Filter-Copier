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
    // 1. DELETE or COMMENT OUT this section to stop the crash
    // {
    //   name: "@electron-forge/maker-squirrel",
    //   config: {
    //     name: "file_filter_copier",
    //     setupIcon: nodePath.join(
    //       __dirname,
    //       "src",
    //       "assets",
    //       "icons",
    //       "win",
    //       "icon.ico"
    //     ),
    //   },
    // },

    // 2. UPDATE this section to include "win32"
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "win32"], // <--- This enables ZIP for Windows
    },

    // ... leave the rest (DMG, Deb, RPM) alone ...
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
      // CRITICAL FIX: Must be false when asar is false
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};
