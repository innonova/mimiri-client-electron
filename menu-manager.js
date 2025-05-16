const { app, Menu, Tray } = require('electron');
const { pathInfo } = require('./path-info');

class MenuManager {
	constructor(ipcClient) {
		this.ipcClient = ipcClient;
	}


	init(mainWindow) {
		this.mainWindow = mainWindow
	}

	appReady() {
		this.tray = new Tray(pathInfo.trayIcon)
		const trayContextMenu = Menu.buildFromTemplate([
			{
				role: 'quit',
				click: () => {
					app.quit()
				}
			},
		])
		this.tray.setToolTip('Mimiri Notes')
		this.tray.setContextMenu(trayContextMenu)
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
						if (sub.id === 'quit') {
							app.quit()
						} else if (sub.id === 'show-dev-tools') {
							this.mainWindow.webContents.openDevTools();
						} else {
							this.ipcClient.menuItemActivated(sub.id)
						}
					}
				}))
			})))
			Menu.setApplicationMenu(menu)
		} else {
			Menu.setApplicationMenu(null)
		}
	}

	setTrayMenu(value, colors) {
		if (value) {
			if (colors.trayIcon === 'black') {
				this.tray.setImage(pathInfo.trayIconBlack)
			} else if (colors.trayIcon === 'white') {
				this.tray.setImage(pathInfo.trayIconWhite)
			} else {
				this.tray.setImage(pathInfo.trayIcon)
			}
			const menu = Menu.buildFromTemplate(value.map(item => ({
				label: item.title,
				type: item.type,
				checked: item.checked,
				enabled: item.enabled,
				click: () => {
					try {
						this.ipcClient.menuItemActivated(item.id)
					} catch (ex) {
						app.quit()
					}
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