
class WindowManager {

	constructor(ipcClient) {
		this.ipcClient = ipcClient;
	}

	init(mainWindow) {
		this.mainWindow = mainWindow;
	}

	setMainWindowSize(value) {
		this.mainWindow.setSize(value.width, value.height)
	}

	getMainWindowSize() {
		const [width, height] = this.mainWindow.getSize()
		return { width, height }
	}

}

module.exports = {
	WindowManager
}