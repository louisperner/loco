// eslint-disable-next-line @typescript-eslint/no-require-imports
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

// Load identity from environment variables if available
const developerIdentity = process.env.APPLE_DEVELOPMENT_ID;

module.exports = {
  packagerConfig: {
    icon: 'loco-icon',
    asar: true,
    appBundleId: process.env.APPLE_BUNDLE_ID,
    name: process.env.APP_NAME,
    osxSign: {
      identity: developerIdentity,
      entitlements: path.join(__dirname, 'entitlements.plist'),
      'entitlements-inherit': path.join(__dirname, 'entitlements.plist'),
      'signature-flags': 'library',
      'hardened-runtime': true
    },
    osxNotarize: process.env.APPLE_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_ID_PASSWORD ? {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    } : undefined
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
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
