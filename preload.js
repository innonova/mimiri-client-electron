const { contextBridge, ipcRenderer } = require('electron')

function isFlatpak() {
	return process.platform === 'linux' && process.env.container === 'flatpak';
}

function isSnap() {
	return process.platform === 'linux' && !!process.env.SNAP;
}

function isAppImage() {
	return process.platform === 'linux' && !!process.env.APPIMAGE;
}

function isFlatHub() {
	return false;
}

function isSnapStore() {
	return false;
}

function isTarGz() {
	return process.platform === 'linux' && !isFlatpak() && !isSnap() && !isAppImage();
}


contextBridge.exposeInMainWorld(
	'mimiri',
	{
		menu: {
			quit: () => ipcRenderer.send('menu-quit'),
			show: () => ipcRenderer.send('menu-show'),
			hide: () => ipcRenderer.send('menu-hide'),
			showDevTools: () => ipcRenderer.send('menu-show-dev-tools'),
			onToggleScreenSharing: (callback) => ipcRenderer.on('toggle-screen-sharing', () => callback()),
			onToggleOpenAtLogin: (callback) => ipcRenderer.on('toggle-open-at-login', () => callback()),
			setAppMenu: (value) => ipcRenderer.send('set-app-menu', value),
			seTrayMenu: (value, colors) => ipcRenderer.send('set-tray-menu', value, colors),
			onMenuItemActivated: (callback) => ipcRenderer.on('menu-item-activated', (_sender, menuItemId) => callback(menuItemId)),
		},
		settings: {
			load: () => ipcRenderer.invoke('settings-load'),
			save: (value) => ipcRenderer.send('settings-save', value),
		},
		bundle: {
			getInstalledVersions: () => ipcRenderer.invoke('bundle-get-installed-versions'),
			save: (version, bundle) => ipcRenderer.invoke('bundle-save', version, bundle),
			use: (version, noActivate) => ipcRenderer.send('bundle-use', version, noActivate),
			activate: () => ipcRenderer.send('bundle-activate'),
			delete: (version) => ipcRenderer.send('bundle-delete', version),
			good: (version) => ipcRenderer.send('bundle-good', version),
			saveElectronUpdate: (release, data) => ipcRenderer.send('bundle-save-electron-update', release, data),
			updateElectron: (noRestart) => ipcRenderer.send('bundle-update-electron', noRestart),
		},
		window: {
			setMainWindowSize: (value) => ipcRenderer.send('window-set-size', value),
			getMainWindowSize: () => ipcRenderer.invoke('window-get-size'),
			getIsVisible: () => ipcRenderer.invoke('window-get-is-visible'),
		},
		watchDog: {
			ok: () => ipcRenderer.send('watch-dog-ok'),
			onCheck: (callback) => ipcRenderer.on('watch-dog-check', () => callback()), // not used?
		},
		session: {
			set: (name, value) => ipcRenderer.invoke('session-set-value', name, value),
			get: (name) => ipcRenderer.invoke('session-get-value', name),
		},
		fileSystem: {
			loadFile: (options) => ipcRenderer.invoke('filesystem-load-file', options),
			saveFile: (data, options) => ipcRenderer.invoke('filesystem-save-file', data, options),
			loadFolder: (options) => ipcRenderer.invoke('filesystem-load-folder', options),
			saveFolder: (data, options) => ipcRenderer.invoke('filesystem-save-folder', data, options),
		},
		os: {
			setAutoStart: (enabled) => ipcRenderer.invoke('os-set-autostart', enabled),
			getAutoStart: () => ipcRenderer.invoke('os-get-autostart'),
			rules: () => ipcRenderer.invoke('os-rules'),
		},
		platform: process.platform,
		isFlatpak: isFlatpak(),
		isSnap: isSnap(),
		isAppImage: isAppImage(),
		isTarGz: isTarGz(),
		isFlatHub: isFlatHub(),
		isSnapStore: isSnapStore()
	}
)
