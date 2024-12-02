const { protocol, net, autoUpdater, app, dialog } = require('electron');
const url = require('node:url')
const Path = require('node:path');
const { mkdirSync, existsSync, readFileSync, writeFileSync } = require('node:fs');
const { writeFile, mkdir, readdir, readFile, rmdir } = require('node:fs').promises;
const { baseVersion, hostVersion, releaseDate } = require('./base-version');
const { log } = require('node:console');
const { pathInfo } = require('./path-info');

const fromBase64 = (base64) => {
	return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}

const unzip = async (text) => {
	return await new Response(new Blob([fromBase64(text)]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
}

class BundleManager {

	compareVersions(a, b) {
		const matchA = /([0-9]+)\.([0-9]+)\.([0-9]+)(?:-(beta|rc)([0-9]+))?/.exec(a)
		const matchB = /([0-9]+)\.([0-9]+)\.([0-9]+)(?:-(beta|rc)([0-9]+))?/.exec(b)
		const majorA = parseInt(matchA[1])
		const minorA = parseInt(matchA[2])
		const patchA = parseInt(matchA[3])
		const labelTypeA = matchA[4]
		const labelA = parseInt(matchA[5])
		const majorB = parseInt(matchB[1])
		const minorB = parseInt(matchB[2])
		const patchB = parseInt(matchB[3])
		const labelTypeB = matchB[4]
		const labelB = parseInt(matchB[5])

		if (majorA !== majorB) {
			return majorA - majorB
		}
		if (minorA !== minorB) {
			return minorA - minorB
		}
		if (patchA !== patchB) {
			return patchA - patchB
		}
		if (labelTypeA !== labelTypeB) {
			return labelTypeA === 'rc' ? 1 : -1
		}
		if (labelA !== labelB) {
			return labelA - labelB
		}
		return 0
	}

	constructor() {
		this.doInstallUpdate = false
		this.configPath = Path.join(pathInfo.bundles, 'config.json');
		this.config = {
			activeVersion: 'base'
		}
		try {
			mkdirSync(pathInfo.bundles)
		} catch { }
		if (existsSync(this.configPath)) {
			this.config = JSON.parse(readFileSync(this.configPath))
		}
		if (this.config.activeVersion === 'base') {
			this.activePath = pathInfo.baseBundle;
		} else {
			this.activePath = Path.join(pathInfo.bundles, this.config.activeVersion);
			if (this.compareVersions(baseVersion, this.config.activeVersion) > 0) {
				this.activePath = pathInfo.baseBundle;
			}
			else if (!existsSync(this.activePath)) {
				this.activePath = pathInfo.baseBundle;
			}
		}

		protocol.registerSchemesAsPrivileged([
			{
				scheme: 'app',
				privileges: {
					secure: true,
					standard: true,
					supportFetchAPI: true,
					allowServiceWorkers: true,
				},
			},
		])

		autoUpdater.on('update-downloaded', () => {
			if (this.doInstallUpdate) {
				autoUpdater.quitAndInstall()
			}
		})
	}

	appReady() {
		protocol.handle('app', (request) => {
			const uri = /app:\/+([^/]+)\/([^#]+)/.exec(request.url);
			const domain = uri[1];
			const filePath = uri[2];
			if (domain === 'app.mimernotes.com') {
				const absPath = url.pathToFileURL(Path.join(this.activePath, filePath)).toString();
				return net.fetch(absPath)
			}
			return null;
		})
	}

	async getInstalledVersions() {
		const bundles = [{
			version: baseVersion,
			hostVersion,
			base: true,
			description: 'base',
			releaseDate,
			active: this.config.activeVersion === 'base',
			previous: this.config.previousActiveVersion === 'base',
		}]
		for (const item of await readdir(pathInfo.bundles)) {
			const infoPath = Path.join(pathInfo.bundles, item, 'info.json');
			if (existsSync(infoPath)) {
				const info = JSON.parse(await readFile(infoPath))
				if (info.version !== baseVersion) {
					bundles.push({
						...info,
						hostVersion,
						base: false,
						active: this.config.activeVersion === info.version,
						previous: this.config.previousActiveVersion === info.version,
					})
				}
			}
		}
		return bundles;
	}

	async saveFilesRecursive(dir, file) {
		if (file.files) {
			const subDir = Path.join(dir, file.name)
			try {
				mkdir(subDir)
			} catch { }
			for (const subFile of file.files) {
				await this.saveFilesRecursive(subDir, subFile)
			}
		} else {
			const filePath = Path.join(dir, file.name)
			await writeFile(filePath, Buffer.from(await unzip(file.content)))
		}
	}

	async save(version, bundle) {
		const bundlePath = Path.join(pathInfo.bundles, version)
		try {
			await mkdir(bundlePath)
		} catch { }
		for (const file of bundle.files) {
			await this.saveFilesRecursive(bundlePath, file)
		}
		await writeFile(Path.join(bundlePath, 'info.json'), JSON.stringify({ ...bundle, files: undefined, signatures: undefined }, undefined, '  '))
	}

	async use(version, mainWindow) {
		if (this.config.activeVersion !== version) {
			this.config.previousActiveVersion = this.config.activeVersion
			this.config.activeVersion = version
			await writeFile(this.configPath, JSON.stringify(this.config, undefined, '  '));
			this.activePath = Path.join(pathInfo.bundles, this.config.activeVersion)
			mainWindow.reload()
		}
	}

	async delete(version) {
		if (this.config.activeVersion !== version && version !== 'base') {
			const bundlePath = Path.join(pathInfo.bundles, version)
			if (existsSync(bundlePath)) {
				await rmdir(bundlePat, { recursive: true })
			}
		}
	}

	async good(version) {
		const bundlePath = Path.join(pathInfo.bundles, version)
		const infoPath = Path.join(bundlePath, 'info.json');
		if (existsSync(infoPath)) {
			const info = JSON.parse(await readFile(infoPath))
			if (!info.good) {
				info.good = true
				await writeFile(infoPath, JSON.stringify(info, undefined, '  '));
			}
		}
	}

	async saveElectronUpdate(release, data) {
		if (process.platform === 'win32') {
			this.updateTempDir = Path.join(pathInfo.temp, "MimiriUpdate")
			if (!existsSync(this.updateTempDir)) {
				mkdirSync(this.updateTempDir);
			}
			await writeFile(Path.join(this.updateTempDir, 'RELEASES'), release);
			await writeFile(Path.join(this.updateTempDir, release.split(' ')[1]), data);
		} else if (process.platform === 'darwin') {
			this.updateTempDir = Path.join(pathInfo.temp, "MimiriUpdate")
			if (!existsSync(this.updateTempDir)) {
				mkdirSync(this.updateTempDir);
			}
			await writeFile(Path.join(this.updateTempDir, 'releases.json'), JSON.stringify({
				url: `file://${Path.join(this.updateTempDir, 'update.zip')}`
			}));
			await writeFile(Path.join(this.updateTempDir, 'update.zip'), data);
		}
	}

	async updateElectron() {
		try {
			if (process.platform === 'win32') {
				this.doInstallUpdate = true
				autoUpdater.setFeedURL(this.updateTempDir);
				autoUpdater.checkForUpdates();
			} else if (process.platform === 'darwin') {
				this.doInstallUpdate = true
				autoUpdater.setFeedURL({ url: `file://${Path.join(this.updateTempDir, 'releases.json')}` });
				autoUpdater.checkForUpdates();
			}
		} catch (ex) {
			console.log(ex);
		}
	}

}


module.exports = {
	BundleManager
}