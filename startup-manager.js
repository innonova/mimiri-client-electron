const shell = require('shelljs');
const { app } = require('electron');
const path = require('node:path');
const { mkdirSync, rmSync, writeFileSync, existsSync } = require('node:fs');
const { pathInfo } = require('./path-info');


class StartupManager {

	constructor() {
		this._isStartupLaunch = false;
		if (process.platform === 'win32' || process.platform === 'linux') {
			this._isStartupLaunch = process.argv.includes('--autostart');
		}
		if (process.platform === 'darwin') {
			const loginSettings = app.getLoginItemSettings();
			this._isStartupLaunch = loginSettings.wasOpenedAtLogin;
		}
	}

	enable() {
		if (process.platform === 'win32') {
			app.setLoginItemSettings({
				openAtLogin: true,
				enabled: true,
				args: ['--autostart']
			})
		}
		if (process.platform === 'darwin') {
			app.setLoginItemSettings({
				openAtLogin: true,
			})
		}
		if (process.platform === 'linux') {
			try {
				mkdirSync(pathInfo.autostart);
			} catch { }
			const autostart = path.join(pathInfo.autostart, 'mimiri-notes.desktop');
			let desktop = ''
			if (pathInfo.isSnap) {
				desktop = `[Desktop Entry]
Type=Application
Name=Mimiri Notes
Terminal=false
Exec=/usr/bin/mimiri-notes --autostart
`;
			} else if (pathInfo.isFlatpak) {
				desktop = `[Desktop Entry]
Type=Application
Name=Mimiri Notes
Terminal=false
Exec=flatpak run io.mimiri.notes --autostart
`;
			} else if (pathInfo.isAppImage) {
				desktop = `[Desktop Entry]
Type=Application
Terminal=false
Name=Mimiri Notes
StartupWMClass=mimiri-notes
Exec=${process.env.APPIMAGE} --no-sandbox --autostart
`;
			} else {
				desktop = `[Desktop Entry]
Type=Application
Terminal=false
Name=Mimiri Notes
StartupWMClass=mimiri-notes
Exec=sh ${path.join(process.cwd(), 'autostart.sh')}
`;
				try {
					shell.chmod('+x', path.join(process.cwd(), 'autostart.sh'));
				} catch { }
			}

			if (desktop) {
				try {
					writeFileSync(autostart, desktop);
					shell.chmod('+x', autostart);
				} catch (ex) {
					console.log(ex);
				}
			}
		}
	}

	disable() {
		if (process.platform === 'win32') {
			app.setLoginItemSettings({
				openAtLogin: false,
				enabled: false
			})
		}
		if (process.platform === 'darwin') {
			app.setLoginItemSettings({
				openAtLogin: false,
			})
		}
		if (process.platform === 'linux') {
			const autostart = path.join(pathInfo.autostart, 'mimiri-notes.desktop');
			try {
				rmSync(autostart);
			} catch { }
		}
	}

	get enabled() {
		if (process.platform === 'win32') {
			const loginSettings = app.getLoginItemSettings();
			return loginSettings.enabled;
		}
		if (process.platform === 'darwin') {
			const loginSettings = app.getLoginItemSettings();
			return loginSettings.openAtLogin;
		}
		if (process.platform === 'linux') {
			const autostart = path.join(pathInfo.autostart, 'mimiri-notes.desktop');
			return existsSync(autostart)
		}
	}

	set enabled(value) {
		if (value) {
			this.enable();
		} else {
			this.disable();
		}
	}

	get isStartupLaunch() {
		return this._isStartupLaunch;
	}
}

module.exports = {
	StartupManager
}