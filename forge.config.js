const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('node:path');



const build = {
	packagerConfig: {
		asar: true,
		icon: path.resolve(__dirname, 'assets', 'icon'),
		executableName: 'mimiri-notes'
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