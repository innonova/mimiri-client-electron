const { app } = require('electron');

class WatchDog {

	init(startUrl, mainWindow) {
		this.startUrl = startUrl
		this.mainWindow = mainWindow
		this.reloadCount = 0
		this.lastOk = 0
		this.startTime = Date.now()
		this.interval = setInterval(() => this.check(), 2000)
		process.on('beforeExit', () => {
			this.stop()
		})
		process.on('exit', () => {
			this.stop()
		})
		process.on('SIGINT', () => {
			this.stop()
		});
		process.on('SIGTERM', () => {
			this.stop()
		});
		process.on('SIGHUP', () => {
			this.stop()
		});
	}

	stop() {
		if (this.interval) {
			clearInterval(this.interval)
			this.interval = undefined
		}
	}

	check() {
		console.log('check', this.lastOk, Date.now() - this.lastOk);
		if (this.mainWindow.webContents.getURL().startsWith('chrome-error')) {
			this.lastOk = 0
			if (this.reloadCount++ < 10) {
				mainWindow.loadURL(this.startUrl)
			}
		} else if (this.lastOk > 0 && Date.now() - this.lastOk > 18000) {
			this.lastOk = 0
		} else if (this.lastOk > 0 && Date.now() - this.lastOk > 6000) {
			mainWindow.loadURL(this.startUrl)

		} else {
			this.mainWindow.webContents.send('watch-dog-check');
		}
	}

	ok() {
		this.lastOk = Date.now()
		this.reloadCount = 0
	}

	get isOk() {
		if (Date.now() - this.startTime < 10000) {
			return true
		}
		return this.lastOk > 0
	}
}

module.exports = {
	WatchDog
}
