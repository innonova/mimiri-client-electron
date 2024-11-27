const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld(
	'mimiri',
	{
		cache: {
			setTestId: (testId) => ipcRenderer.invoke('cache-set-test-id', testId),
			tearDown: (keepLogs) => ipcRenderer.invoke('cache-tear-down', keepLogs),
			getPreLogin: (username) => ipcRenderer.invoke('cache-get-pre-login', username),
			getUser: (username) => ipcRenderer.invoke('cache-get-user', username),
			setUser: (username, data, preLogin) => ipcRenderer.invoke('cache-set-user', username, data, preLogin),
			deleteUser: (username) => ipcRenderer.invoke('cache-delete-user', username),
			setUserData: (username, data) => ipcRenderer.invoke('cache-set-user-data', username, data),
			getKey: (userId, id) => ipcRenderer.invoke('cache-get-key', userId, id),
			getAllKeys: (userId) => ipcRenderer.invoke('cache-get-all-keys', userId),
			setKey: (userId, id, data) => ipcRenderer.invoke('cache-set-key', userId, id, data),
			deleteKey: () => ipcRenderer.invoke('cache-delete-key', id),
			getNote: (id) => ipcRenderer.invoke('cache-get-note', id),
			setNote: (id, data) => ipcRenderer.invoke('cache-set-note', id, data),
			deleteNote: (id) => ipcRenderer.invoke('cache-delete-note', id),
		},
		menu: {
			quit: () => ipcRenderer.send('menu-quit'),
			show: () => ipcRenderer.send('menu-show'),
			showDevTools: () => ipcRenderer.send('menu-show-dev-tools'),
			setTheme: (theme) => ipcRenderer.send('menu-set-theme', theme),
			setScreenSharing: (value) => ipcRenderer.send('menu-set-screen-sharing', value),
			onToggleScreenSharing: (callback) => ipcRenderer.on('toggle-screen-sharing', () => callback()),
			onToggleOpenAtLogin: (callback) => ipcRenderer.on('toggle-open-at-login', () => callback()),
			setAppMenu: (value) => ipcRenderer.send('set-app-menu', value),
			seTrayMenu: (value) => ipcRenderer.send('set-tray-menu', value),
			onMenuItemActivated: (callback) => ipcRenderer.on('menu-item-activated', (_sender, menuItemId) => callback(menuItemId)),
		},
		settings: {
			load: () => ipcRenderer.invoke('settings-load'),
			save: (value) => ipcRenderer.send('settings-save', value),
		},
		bundle: {
			getInstalledVersions: () => ipcRenderer.invoke('bundle-get-installed-versions'),
			save: (version, bundle) => ipcRenderer.send('bundle-save', version, bundle),
			use: (version) => ipcRenderer.send('bundle-use', version),
			delete: (version) => ipcRenderer.send('bundle-delete', version),
			good: (version) => ipcRenderer.send('bundle-good', version),
			saveElectronUpdate: (release, data) => ipcRenderer.send('bundle-save-electron-update', release, data),
			updateElectron: () => ipcRenderer.send('bundle-update-electron'),
		},
		platform: process.platform
	}
)
