const { app } = require('electron');
const { mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const path = require('node:path');
const { pathInfo } = require('./path-info');
const Registry = require('winreg');

class SettingManager {
	constructor(mainWindow, startupManager) {
		this.mainWindow = mainWindow;
		this.startup = startupManager;
	}

	getPath() {
		try {
			mkdirSync(pathInfo.settings);
		} catch { }
		return path.join(pathInfo.settings, 'settings.config');
	}

	load() {
		const settingPath = this.getPath();
		try {
			const settings = readFileSync(settingPath).toString()
			if (settings) {
				return JSON.parse(settings);
			}
		} catch { }
		return undefined
	}

	save(settings) {
		const settingPath = this.getPath();
		this.startup.enabled = settings.openAtLogin;

		if (this.mainWindow.setTitleBarOverlay) {
			this.mainWindow.setTitleBarOverlay({
				color: settings.titleBarColor,
				symbolColor: settings.titleBarSystemColor,
				height: settings.titleBarHeight
			});
		}

		this.mainWindow.setSkipTaskbar(!(settings.showInTaskBar ?? true))

		this.setTrayIconVisible(settings.keepTrayIconVisible)

		this.mainWindow.setContentProtection(!settings.allowScreenSharing);

		try {
			writeFileSync(settingPath, JSON.stringify(settings, undefined, '  '));
		} catch (ex) {
			console.log(ex);
		}
	}

	setTrayIconVisible(visible) {
		if (process.platform === 'win32') {
			const processPath = process.argv[0]
			const targetValue = visible ? '0x1' : '0x0'
			const notifyIconSettings = new Registry({
				hive: Registry.HKCU,
				key: '\\Control Panel\\NotifyIconSettings'
			})

			notifyIconSettings.keys((error, keys) => {
				if (!error) {
					for (const key of keys) {
						key.get('ExecutablePath', (error, executablePath) => {
							if (!error) {
								if (executablePath.value === processPath) {
									key.valueExists('IsPromoted', (error, exists) => {
										if (!error) {
											if (exists) {
												key.get('IsPromoted', (error, isPromoted) => {
													if (isPromoted.value !== targetValue) {
														key.set('IsPromoted', 'REG_DWORD', targetValue, () => { })
													}
												})
											}
											if (!exists) {
												key.set('IsPromoted', 'REG_DWORD', targetValue, () => { })
											}
										}
									})
								}
							}
						})
					}
				}
			})
		}
	}

}

module.exports = {
	SettingManager
}