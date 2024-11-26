const shell = require('shelljs');
const { readFileSync, writeFileSync } = require('node:fs');

const package = JSON.parse(readFileSync('./package.json'))

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