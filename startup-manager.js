const shell = require('shelljs');
const { app } = require('electron');
const path = require('node:path');
const { mkdirSync, rmSync, writeFileSync, existsSync } = require('node:fs');
const { pathInfo } = require('./path-info');
const dbus = require('@homebridge/dbus-native');

const bus = dbus.sessionBus();

function parentWindow(win) {
	try {
		if (!win) return '';
		const handle = win.getNativeWindowHandle();
		return 'x11:' + handle.readUInt32LE(0).toString(16);
	} catch {
		return '';
	}
}

function callPortal(iface, method, body) {
	return new Promise((resolve, reject) => {
		bus.invoke(
			{
				destination: 'org.freedesktop.portal.Desktop',
				path: '/org/freedesktop/portal/desktop',
				interface: iface,
				member: method,
				signature: 'sa{sv}', // (parent_window s, options a{sv})
				body
			},
			(err, handlePath) => {
				console.log('callPortal', err, handlePath);

				if (err) return reject(err);

				// const match = `type='signal',interface='org.freedesktop.portal.Request',member='Response',path='${handlePath}'`;
				// bus.addMatch(match, mErr => { if (mErr) reject(mErr); });

				function onMsg(msg) {
					if (
						msg.interface === 'org.freedesktop.portal.Request' &&
						msg.member === 'Response' &&
						msg.path === handlePath
					) {
						bus.connection.removeListener('message', onMsg);
						const [code, results] = msg.body;
						resolve({ code, results });
					}
				}
				bus.connection.on('message', onMsg);
			}
		);
	});
}


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
			// const bus = sessionBus();
			// const service = await bus.getService('org.freedesktop.portal.Desktop');
			// const bg = service.getInterface('org.freedesktop.portal.Background');
			const options = {
				reason: ['s', 'Start at login'],
				autostart: ['b', enabled],
				// commandline: ['as', ['io.mimiri.notes', '--autostart']],
			};
			const a = await callPortal(
				'org.freedesktop.portal.Background',
				'RequestBackground',
				['', options]
			).then(({ code, results }) => {
				if (code !== 0) throw new Error('User denied or portal error');
				return {
					backgroundAllowed: !!results.background,
					autostartEnabled: !!results.autostart
				};
			});
			console.log(a);

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

		console.log('Enable autostart on Linux', process.platform === 'linux', pathInfo.isSandboxed, await pathInfo.supportsBus());


		if (process.platform === 'linux' && (pathInfo.isSandboxed || true) && await pathInfo.supportsBus()) {
			await this.dBusSetAutostart(true);
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