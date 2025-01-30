const shell = require('shelljs');
const { readFileSync } = require('node:fs');
const yaml = require('js-yaml');


const doc = yaml.load(readFileSync('./mimiri-flatpak/io.mimiri.notes.yml'));

const source = doc.modules.find(m => m.name === 'mimiri-notes').sources.find(s => s['dest-filename'] === 'bundle.json');

console.log(`Download bundle from ${source.url}`)
shell.exec(`curl ${source.url} -o ./bundle.json`)

const res = shell.exec(`sha256sum ./bundle.json`)
const hash = /\w+/.exec(res.stdout)[0]

if (hash !== source.sha256) {
	shell.rm('-f', './bundle.json')
	throw new Error('Hash mismatch')
}



