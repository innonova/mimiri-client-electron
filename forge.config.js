const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('node:path');



const build = {
	packagerConfig: {
		appBundleId: 'io.mimiri.notes',
		name: 'Mimiri Notes',
		asar: true,
		icon: path.resolve(__dirname, 'assets', 'icon'),
		executableName: 'mimiri-notes',
		osxSign: {
			identity: process.env.MAC_SIGN_IDENT,
			hardenedRuntime: true,
			entitlements: "entitlements.plist",
			entitlementsInherit: "entitlements.plist",
			verbose: true,
		},
		osxNotarize: {
			appleId: process.env.MAC_NOTARIZE_APPLE_ID,
			appleIdPassword: process.env.MAC_NOTARIZE_APPLE_ID_PASSWORD,
			teamId: process.env.MAC_NOTARIZE_TEAM_ID
		}
	},
	rebuildConfig: {},
	makers: [
		...(process.platform === 'darwin' ? [
			{
				name: '@electron-forge/maker-dmg',
				config: {
					icon: './assets/icon.icns',
					background: './assets/background.tiff',
					format: 'ULFO'
				}
			},
			{
				name: '@electron-forge/maker-zip',
			}] : []),
		...(process.platform === 'win32' ? [
			{
				name: '@electron-forge/maker-squirrel',
				config: {
					setupIcon: path.resolve(__dirname, 'assets/icon.ico')
				},
			}] : []),
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
// console.log(JSON.stringify(build, undefined, ' '));
module.exports = build;