const shell = require('shelljs');
const { readFileSync, writeFileSync } = require('node:fs');

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
	const electronWinInstallerPath = './out/make/squirrel.windows/x64'
	const artifacts = []
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