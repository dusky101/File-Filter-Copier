const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    // CRITICAL: Path without extension, exactly as per Electron Forge docs
    icon: path.join(__dirname, 'src', 'assets', 'icons', 'mac', 'icon'),
    appBundleId: 'com.filefiltercopier.app',
    appCategoryType: 'public.app-category.productivity',
    darwinDarkModeSupport: true,
    extraResource: [
      path.join(__dirname, 'backend', 'dist', 'file-filter-backend'),
      path.join(__dirname, 'src', 'assets', 'splash.png'),
      path.join(__dirname, 'src', 'assets', 'icon.png'),
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'file_filter_copier',
        setupIcon: path.join(__dirname, 'src', 'assets', 'icons', 'win', 'icon.ico'),
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        name: 'File Filter Copier',
        icon: path.join(__dirname, 'src', 'assets', 'icons', 'mac', 'icon.icns'),
        format: 'ULFO',
      },
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          name: 'file-filter-copier',
          productName: 'File Filter Copier',
          icon: path.join(__dirname, 'src', 'assets', 'icons', 'linux', 'icon.png'),
          categories: ['Utility'],
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          name: 'file-filter-copier',
          productName: 'File Filter Copier',
          icon: path.join(__dirname, 'src', 'assets', 'icons', 'linux', 'icon.png'),
          categories: ['Utility'],
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