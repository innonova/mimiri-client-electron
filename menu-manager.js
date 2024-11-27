const { app, Menu, Tray } = require('electron');
const { pathInfo } = require('./path-info');

class MenuManager {
	constructor(ipcClient) {
		this.ipcClient = ipcClient;
	}

	appReady() {
		this.tray = new Tray(pathInfo.trayIcon)
		this.tray.setToolTip('Mimiri Notes')
		this.tray.on('double-click', () => {
			this.ipcClient.menuItemActivated('tray-double-click')
		})
		this.tray.on('click', () => {
			this.ipcClient.menuItemActivated('tray-click')
		})
	}

	setAppMenu(value) {
		if (value) {
			const menu = Menu.buildFromTemplate(value.map(item => ({
				label: item.title,
				submenu: item.submenu?.map(sub => ({
					label: sub.title,
					type: sub.type,
					checked: sub.checked,
					enabled: sub.enabled,
					accelerator: sub.shortcut?.replace(/Ctrl/, 'CommandOrControl'),
					click: () => {
						this.ipcClient.menuItemActivated(sub.id)
					}
				}))
			})))
			Menu.setApplicationMenu(menu)
		} else {
			Menu.setApplicationMenu(null)
		}
	}

	setTrayMenu(value) {
		if (value) {
			const menu = Menu.buildFromTemplate(value.map(item => ({
				label: item.title,
				type: item.type,
				checked: item.checked,
				enabled: item.enabled,
				click: () => {
					this.ipcClient.menuItemActivated(item.id)
				}
			})))
			this.tray.setContextMenu(menu)
		} else {
			this.tray.setContextMenu(null)
		}
	}

}

module.exports = {
	MenuManager
}