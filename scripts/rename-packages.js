const shell = require('shelljs');
const { readFileSync, writeFileSync, readdirSync } = require('node:fs');
const Path = require('node:path');

const package = JSON.parse(readFileSync('./package.json'))

if (process.platform === 'linux') {
	shell.mv('./dist/mimiri-notes.tar.gz', `./dist-bin/mimiri-notes_${package.version}_amd64.tar.gz`)
	shell.mv(`./dist/mimiri-notes_${package.version}_amd64.snap`, `./dist-bin/mimiri-notes_${package.version}_amd64.snap`)
	shell.mv(`./dist/Mimiri Notes-${package.version}.AppImage`, `./dist-bin/mimiri-notes_${package.version}_amd64.AppImage`)
	shell.mv('./flatpak/io.mimiri.notes.flatpak', `./dist-bin/io.mimiri.notes_${package.version}_amd64.flatpak`)

	writeFileSync('./artifacts.json', JSON.stringify([
		`dist-bin/mimiri-notes_${package.version}_amd64.tar.gz`,
		`dist-bin/mimiri-notes_${package.version}_amd64.snap`,
		`dist-bin/mimiri-notes_${package.version}_amd64.AppImage`,
		`dist-bin/io.mimiri.notes_${package.version}_amd64.flatpak`,
	], undefined, '  '))
}

if (process.platform === 'win32') {
	const bundleKey = '2024101797F6C918'
	const electronWinInstallerPath = './out/make/squirrel.windows/x64'
	const releaseJson = {
		release: readFileSync(Path.join(electronWinInstallerPath, "RELEASES")).toString().replace(/^\uFEFF/, ''),
		size: 0,
		signatureKey: bundleKey,
		signature: ''
	}
	const releasePath = Path.join(electronWinInstallerPath, `electron-win.${vuePackage.version}.json`);
	writeFileSync(releasePath, JSON.stringify(releaseJson));

	const artifacts = [releasePath]
	for (const file of readdirSync(electronWinInstallerPath)) {
		if (file.endsWith('.exe')) {
			artifacts.push(Path.join(electronWinInstallerPath, file))
		}
		if (file.endsWith('.nupkg')) {
			artifacts.push(Path.join(electronWinInstallerPath, file))
		}
	}
	writeFileSync('./artifacts.json', JSON.stringify(artifacts, undefined, '  '))
}

if (process.platform === 'darwin') {
	const electronWinInstallerPath = './out/make'
	const artifacts = []
	for (const file of readdirSync(electronWinInstallerPath)) {
		if (file.endsWith('.dmg')) {
			artifacts.push(Path.join(electronWinInstallerPath, file))
		}
	}
	writeFileSync('./artifacts.json', JSON.stringify(artifacts, undefined, '  '))
}