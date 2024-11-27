const shell = require('shelljs');
const { app } = require('electron');
const path = require('node:path');


class PathInfo {

	constructor() {
		// console.log(process.env);
	}

	get isFlatpak() {
		return process.env.container === 'flatpak';
	}

	get isSnap() {
		return !!process.env.SNAP;
	}

	get isAppImage() {
		return !!process.env.APPIMAGE;
	}

	get settings() {
		if (process.platform === 'win32') {
			return path.join(app.getPath('home'), '.mimiri');
		}
		if (process.platform === 'darwin') {
			return path.join(app.getPath('home'), '.mimiri');
		}
		if (process.platform === 'linux') {
			if (this.isFlatpak) {
				return process.env.XDG_CONFIG_HOME;
			}
			return path.join(app.getPath('home'), '.mimiri');
		}
	}

	get database() {
		if (process.platform === 'win32') {
			return path.join(app.getPath('home'), '.mimiri');
		}
		if (process.platform === 'darwin') {
			return path.join(app.getPath('home'), '.mimiri');
		}
		if (process.platform === 'linux') {
			if (this.isFlatpak) {
				return process.env.XDG_DATA_HOME;
			}
			return path.join(app.getPath('home'), '.mimiri');
		}
	}

	get bundles() {
		if (process.platform === 'win32') {
			return path.join(__dirname.replace('\\app.asar', ''), 'bundles')
		}
		if (process.platform === 'darwin') {
			return path.join(__dirname.replace('\\app.asar', ''), 'bundles')
		}
		if (process.platform === 'linux') {
			if (this.isFlatpak) {
				return path.join(process.env.XDG_DATA_HOME, 'bundles');
			}
			return path.join(__dirname.replace('\\app.asar', ''), 'bundles')
		}
	}

	get baseBundle() {
		if (process.platform === 'win32') {
			return path.join(__dirname, 'app')
		}
		if (process.platform === 'darwin') {
			return path.join(__dirname, 'app')
		}
		if (process.platform === 'linux') {
			return path.join(__dirname, 'app')
		}
	}

	get appIcon() {
		if (process.platform === 'win32') {
			return path.join(__dirname, 'assets', 'icon.ico');
		}
		if (process.platform === 'darwin') {
			return path.join(__dirname, 'assets', 'icon.png');
		}
		if (process.platform === 'linux') {
			return path.join(__dirname, 'assets', 'icon.png');
		}
	}

	get trayIcon() {
		if (process.platform === 'win32') {
			return path.join(__dirname, 'assets', 'icon.png');
		}
		if (process.platform === 'darwin') {
			return path.join(__dirname, 'assets', 'trayTemplate.png');
		}
		if (process.platform === 'linux') {
			return path.join(__dirname, 'assets', 'tray-icon.png');
		}
	}

	get preload() {
		if (process.platform === 'win32') {
			return path.join(__dirname, 'preload.js');
		}
		if (process.platform === 'darwin') {
			return path.join(__dirname, 'preload.js');
		}
		if (process.platform === 'linux') {
			return path.join(__dirname, 'preload.js');
		}
	}

	get autostart() {
		if (process.platform === 'win32') {
			return undefined;
		}
		if (process.platform === 'darwin') {
			return undefined;
		}
		if (process.platform === 'linux') {
			return path.join(app.getPath('home'), '.config', 'autostart');
		}
	}

	get temp() {
		if (process.platform === 'win32') {
			return app.getPath("temp");
		}
		if (process.platform === 'darwin') {
			return app.getPath("temp");
		}
		if (process.platform === 'linux') {
			if (this.isFlatpak) {
				return undefined;
			}
			return app.getPath("temp");
		}
	}

	get tests() {
		return undefined;
	}

}

module.exports = {
	pathInfo: new PathInfo()
}