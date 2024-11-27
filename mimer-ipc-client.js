
const { app, ipcMain } = require('electron');
const { OfflineManager } = require('./offline-manager');
const { SettingManager } = require('./settings-manager');
const { BundleManager } = require('./bundle-manager');
const { MenuManager } = require('./menu-manager');

class MimerIpcClient {

	constructor(host) {
		this.host = host;
		this.offlineManager = new OfflineManager();
		this.bundleManager = new BundleManager();
		this.menuManager = new MenuManager(this);
	}

	validateSender(frame) {
		if ((new URL(frame.url)).host === this.host) return true
		console.log('Sender Rejected', frame.url);
		return false
	}

	appReady() {
		this.bundleManager.appReady()
		this.menuManager.appReady()
	}

	init(mainWindow, startupManager) {
		this.mainWindow = mainWindow;
		this.settingsManager = new SettingManager(mainWindow, startupManager);

		ipcMain.handle('cache-set-test-id', (e, testId) => {
			if (!this.validateSender(e.senderFrame)) return null;
			return this.offlineManager.setTestId(testId);
		});

		ipcMain.handle('cache-tear-down', (e, keepLogs) => {
			if (!this.validateSender(e.senderFrame)) return null;
			return this.offlineManager.tearDown(keepLogs);
		});

		ipcMain.handle('cache-get-pre-login', (e, username) => {
			if (!this.validateSender(e.senderFrame)) return null;
			return this.offlineManager.getPreLogin(username);
		});

		ipcMain.handle('cache-get-user', (e, username) => {
			if (!this.validateSender(e.senderFrame)) return null;
			return this.offlineManager.getUser(username);
		});

		ipcMain.handle('cache-set-user', (e, username, data, preLogin) => {
			if (!this.validateSender(e.senderFrame)) return null;
			return this.offlineManager.setUser(username, data, preLogin);
		});

		ipcMain.handle('cache-delete-user', (e, username) => {
			if (!this.validateSender(e.senderFrame)) return null;
			return this.offlineManager.deleteUser(username);
		});

		ipcMain.handle('cache-set-user-data', (e, username, data) => {
			if (!this.validateSender(e.senderFrame)) return null;
			return this.offlineManager.setUserData(username, data);
		});

		ipcMain.handle('cache-get-key', (e, userId, id) => {
			if (!this.validateSender(e.senderFrame)) return null;
			return this.offlineManager.getKey(userId, id);
		});

		ipcMain.handle('cache-get-all-keys', (e, userId) => {
			if (!this.validateSender(e.senderFrame)) return null;
			return this.offlineManager.getAllKeys(userId);
		});

		ipcMain.handle('cache-set-key', (e, userId, id, data) => {
			if (!this.validateSender(e.senderFrame)) return null;
			return this.offlineManager.setKey(userId, id, data);
		});

		ipcMain.handle('cache-delete-key', (e, id) => {
			if (!this.validateSender(e.senderFrame)) return null;
			return this.offlineManager.deleteKey(id);
		});

		ipcMain.handle('cache-get-note', (e, id) => {
			if (!this.validateSender(e.senderFrame)) return null;
			return this.offlineManager.GetNote(id);
		});

		ipcMain.handle('cache-set-note', (e, id, data) => {
			if (!this.validateSender(e.senderFrame)) return null;
			return this.offlineManager.setNote(id, data);
		});

		ipcMain.handle('cache-delete-note', (e, id) => {
			if (!this.validateSender(e.senderFrame)) return null;
			return this.offlineManager.deleteNote(id);
		});

		ipcMain.on('menu-quit', (e, value) => {
			if (!this.validateSender(e.senderFrame)) return
			app.quit();
		});

		ipcMain.on('menu-show-dev-tools', (e, value) => {
			if (!this.validateSender(e.senderFrame)) return
			this.mainWindow.webContents.openDevTools();
		});

		ipcMain.on('menu-show', (e, value) => {
			if (!this.validateSender(e.senderFrame)) return
			this.mainWindow.show();
		});

		ipcMain.handle('settings-load', (e) => {
			if (!this.validateSender(e.senderFrame)) return null;
			return this.settingsManager.load();
		});

		ipcMain.on('settings-save', (e, value) => {
			if (!this.validateSender(e.senderFrame)) return
			return this.settingsManager.save(value);
		});

		ipcMain.handle('bundle-get-installed-versions', (e) => {
			if (!this.validateSender(e.senderFrame)) return null;
			return this.bundleManager.getInstalledVersions();
		});

		ipcMain.on('bundle-save', (e, version, bundle) => {
			if (!this.validateSender(e.senderFrame)) return
			return this.bundleManager.save(version, bundle);
		});

		ipcMain.on('bundle-use', (e, version) => {
			if (!this.validateSender(e.senderFrame)) return
			return this.bundleManager.use(version, this.mainWindow);
		});

		ipcMain.on('bundle-delete', (e, version) => {
			if (!this.validateSender(e.senderFrame)) return
			return this.bundleManager.delete(version);
		});

		ipcMain.on('bundle-good', (e, version) => {
			if (!this.validateSender(e.senderFrame)) return
			return this.bundleManager.good(version);
		});

		ipcMain.on('bundle-save-electron-update', (e, release, data) => {
			if (!this.validateSender(e.senderFrame)) return
			return this.bundleManager.saveElectronUpdate(release, data);
		});

		ipcMain.on('bundle-update-electron', (e) => {
			if (!this.validateSender(e.senderFrame)) return
			return this.bundleManager.updateElectron();
		});

		ipcMain.on('set-app-menu', (e, value) => {
			if (!this.validateSender(e.senderFrame)) return
			return this.menuManager.setAppMenu(value);
		});

		ipcMain.on('set-tray-menu', (e, value) => {
			if (!this.validateSender(e.senderFrame)) return
			return this.menuManager.setTrayMenu(value);
		});
	}

	menuItemActivated(menuItemId) {
		this.mainWindow.webContents.send('menu-item-activated', menuItemId);
	}

	toggleScreenSharing() {
		this.mainWindow.webContents.send('toggle-screen-sharing');
	}

	toggleOpenAtLogin() {
		this.mainWindow.webContents.send('toggle-open-at-login');
	}
}

module.exports = {
	MimerIpcClient
}