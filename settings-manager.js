const { app } = require('electron');
const { mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const path = require('node:path');
const { pathInfo } = require('./path-info');

class SettingManager {
	constructor(mainWindow, trayContextMenu, tray, startupManager) {
		this.mainWindow = mainWindow;
		this.trayContextMenu = trayContextMenu;
		this.tray = tray;
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

		this.mainWindow.setTitleBarOverlay({
			color: settings.titleBarColor,
			symbolColor: settings.titleBarSystemColor,
			height: settings.titleBarHeight
		});

		this.mainWindow.setContentProtection(!settings.allowScreenSharing);

		const screenSharingItem = this.trayContextMenu.items.find(item => item.id === 'allow-screen-sharing')
		if (screenSharingItem) {
			screenSharingItem.checked = settings.allowScreenSharing;
		}
		this.trayContextMenu.items.find(item => item.id === 'open-at-login').checked = settings.openAtLogin;

		this.tray.setContextMenu(this.trayContextMenu);

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