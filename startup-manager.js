const shell = require('shelljs');
const { app } = require('electron');
const path = require('node:path');
const { mkdirSync, rmSync, writeFileSync, existsSync } = require('node:fs');
const { pathInfo } = require('./path-info');
const { sessionBus } = require('dbus-next');


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

	async dBusSetAutostart(enabled) {
		console.log('dBusSetAutostart', enabled);
		try {
			const bus = sessionBus();
			const service = await bus.getProxyObject(
				'org.freedesktop.portal.Desktop',
				'/org/freedesktop/portal/desktop'
			);
			const bg = service.getInterface('org.freedesktop.portal.Background');
			const options = {
				reason: new Variant('s', 'Start at login'),
				autostart: new Variant('b', enabled),
				commandline: new Variant('as', ['io.mimiri.notes', '--autostart']),
			};
			const handlePath = await bg.RequestBackground('', options);
			const req = await bus.getProxyObject('org.freedesktop.portal.Desktop', handlePath);
			const reqIface = req.getInterface('org.freedesktop.portal.Request');
			return new Promise((resolve) => {
				reqIface.on((_code, results) => {
					resolve({
						background: results.background?.value === true,
						autostart: results.autostart?.value === true,
					});
				});
			});
		} catch (ex) {
			console.log(ex);
		}
	}

	async enable() {
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

		if (process.platform === 'linux' && pathInfo.isSandboxed && await pathInfo.supportsBus()) {
			await dBusSetAutostart(true);
		}
		else if (process.platform === 'linux' && !pathInfo.isSandboxed) {
			try {
				mkdirSync(pathInfo.autostart);
				await bus.getNameOwner('org.freedesktop.portal.Desktop');
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

	async disable() {
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
		if (process.platform === 'linux' && pathInfo.isSandboxed && await pathInfo.supportsBus()) {
			await dBusSetAutostart(false);
		}
		else if (process.platform === 'linux' && !pathInfo.isSandboxed) {
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