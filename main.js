const { app, BrowserWindow, Menu, Tray, Notification, session, shell } = require('electron');
const path = require('node:path');
const { MimerIpcClient } = require('./mimer-ipc-client');
const { StartupManager } = require('./startup-manager');
const { pathInfo } = require('./path-info');
if (require('electron-squirrel-startup')) app.quit();

const devMode = !!process.defaultApp;

const gotTheLock = devMode ? true : app.requestSingleInstanceLock()

if (process.platform === 'linux') {
	app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
	// app.commandLine.appendSwitch('enable-features', 'WaylandWindowDecorations');
}

if (!gotTheLock) {
	app.quit()
} else {
	const host = devMode ? 'https://app-dev-aek.mimiri.io/' : 'app://app.mimernotes.com/'
	const hostName = devMode ? 'app-dev-aek.mimiri.io' : 'app.mimernotes.com'
	// const host = devMode ? 'http://localhost:5173/' : 'app://app.mimernotes.com/'
	// const hostName = devMode ? 'localhost:5173' : 'app.mimernotes.com'
	const startUrl = `${host}index.html`

	const mimerIpcClient = new MimerIpcClient(hostName, devMode);
	const startupManager = new StartupManager()
	let mainWindow = undefined
	let isAppQuitting = false;

	app.on('second-instance', (event, commandLine, workingDirectory) => {
		if (mainWindow) {
			mainWindow.show()
			if (mainWindow.isMinimized()) myWindow.restore()
			mainWindow.focus()
		}
	})

	const createWindow = () => {
		const show = !startupManager.isStartupLaunch
		mainWindow = new BrowserWindow({
			width: 800,
			height: 700,
			transparent: process.platform === 'linux',
			frame: process.platform !== 'linux',
			icon: pathInfo.appIcon,
			backgroundColor: process.platform !== 'linux' ? '#555' : undefined,
			titleBarStyle: 'hidden',
			titleBarOverlay: {
				color: '#323233',
				symbolColor: '#8E8E8E',
				height: 36
			},
			show,
			webPreferences: {
				partition: devMode ? 'persist:development' : undefined,
				preload: pathInfo.preload
			}
		})
		mainWindow.on('close', (evt) => {
			if (!isAppQuitting) {
				evt.preventDefault();
				if (mainWindow.webContents.getURL().startsWith('chrome-error') || !mimerIpcClient.watchDog.isOk) {
					app.quit()
				}
				mimerIpcClient.menuItemActivated('hide')
				// new Notification({
				// 	title: 'Test',
				// 	body: 'Test',
				// 	// icon: pathInfo.notificationIcon,
				// }).show()
			}
		});
		mainWindow.webContents.setWindowOpenHandler((details) => {
			shell.openExternal(details.url);
			return { action: 'deny' }
		})
		if (devMode) {
			//	mainWindow.webContents.openDevTools();
		}
		// console.log(startUrl);
		mainWindow.loadURL(startUrl)
		// win.loadFile('index.html')
	}

	app.whenReady().then(() => {
		const sessionType = process.env.XDG_SESSION_TYPE;
		const waylandDisplay = process.env.WAYLAND_DISPLAY;

		console.log('Session type:', sessionType);  // 'wayland' or 'x11'
		console.log('Wayland display:', !!waylandDisplay);  // true if Wayland is active

		if (process.platform === 'win32' && !process.isPackaged) {
			app.setAppUserModelId(app.name);
		}
		app.on('before-quit', (evt) => {
			isAppQuitting = true;
		});

		session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
			callback({
				responseHeaders: {
					...details.responseHeaders,
					'Content-Security-Policy': [`script-src 'self' ${host}`]
				}
			})
		})

		mimerIpcClient.appReady()

		createWindow()

		mimerIpcClient.init(mainWindow, startupManager, startUrl)



		app.on('activate', () => {
			// if (BrowserWindow.getAllWindows().length === 0) createWindow()
		})
	})

}