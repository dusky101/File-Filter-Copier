const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');

// Resolve platform-specific icon paths
const iconsDir = path.resolve(__dirname, 'src', 'assets', 'icons');
// For Windows and macOS, Electron Packager will append the correct extension when
// you omit it. For Linux, a PNG path is expected by makers and BrowserWindow.
const packagerIcon = (() => {
  if (process.platform === 'darwin') return path.join(iconsDir, 'ffcosx'); // .icns
  if (process.platform === 'win32') return path.join(iconsDir, 'ffcw'); // .ico
  return path.join(iconsDir, 'ffcl.png'); // .png for Linux
})();

module.exports = {
  packagerConfig: {
    asar: true,
    // For Windows/macOS, omit the extension and Packager will add .ico/.icns
    // For Linux, providing the .png is fine here, makers will also be set below
    icon: packagerIcon,
    // Include the prebuilt backend binaries/resources inside the packaged app
    // Expectation: you'll build the backend into backend/dist/<platform>/... and/or
    // a single executable named 'file-filter-backend' placed under backend/dist
    extraResource: [
      path.resolve(__dirname, 'backend', 'dist'),
      // Fallback: allow directly under backend/file-filter-backend*
      path.resolve(__dirname, 'backend', 'file-filter-backend'),
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        // The ICO file to use as the icon for the generated Setup.exe
        setupIcon: path.join(iconsDir, 'ffcw.ico'),
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          // Path to PNG icon for Linux packages
          icon: path.join(iconsDir, 'ffcl.png'),
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          // Path to PNG icon for Linux packages
          icon: path.join(iconsDir, 'ffcl.png'),
        },
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
        // If you are familiar with Vite configuration, it will look really familiar.
        build: [
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
            entry: 'main.js',
            config: 'vite.main.config.mjs',
            target: 'main',
          },
          {
            entry: 'preload.js',
            config: 'vite.preload.config.mjs',
            target: 'preload',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs',
          },
        ],
      },
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
