const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');

// Base icons directory
const iconsDir = path.resolve(__dirname, 'src', 'assets', 'icons');

// Platform-specific icon resolution
const packagerIcon = (() => {
  switch (process.platform) {
    case 'darwin':
      return path.join(iconsDir, 'mac', 'icon.icns');
    case 'win32':
      return path.join(iconsDir, 'win', 'icon.ico');
    default:
      return path.join(iconsDir, 'linux', 'icon.png');
  }
})();

module.exports = {
  packagerConfig: {
    asar: true,
    icon: packagerIcon,
    extraResource: [
      // Only the single-file PyInstaller binary is needed
      path.resolve(__dirname, 'backend', 'dist', 'file-filter-backend'),
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: path.join(iconsDir, 'win', 'icon.ico'),
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        icon: path.join(iconsDir, 'mac', 'icon.icns'),
      },
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: path.join(iconsDir, 'linux', 'icon.png'),
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          icon: path.join(iconsDir, 'linux', 'icon.png'),
        },
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
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
