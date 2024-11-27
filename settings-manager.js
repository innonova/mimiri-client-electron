const { app } = require('electron');
const { mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const path = require('node:path');
const { pathInfo } = require('./path-info');

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

		this.mainWindow.setContentProtection(!settings.allowScreenSharing);

		try {
			writeFileSync(settingPath, JSON.stringify(settings, undefined, '  '));
		} catch (ex) {
			console.log(ex);
		}
	}

}

module.exports = {
	SettingManager
}