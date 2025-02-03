const shell = require('shelljs');
const { readFile, writeFile } = require('node:fs/promises');
const yaml = require('js-yaml');


const execute = async () => {
	const commitHash = shell.exec('git rev-parse HEAD').stdout.trim()
	const info = JSON.parse(await readFile('./bundle-info.json'));
	const doc = yaml.load(await readFile('./mimiri-flatpak/io.mimiri.notes.yml'));

	const electronSource = doc.modules.find(m => m.name === 'mimiri-notes').sources.find(s => s['url'] === 'https://github.com/innonova/mimiri-client-electron');
	let changed = false
	if (electronSource.commit !== commitHash) {
		electronSource.commit = commitHash
		changed = true
		console.log('Updated commit to', electronSource.commit, commitHash);
	} else {
		console.log('Already on commit', commitHash);
	}

	const bundleSource = doc.modules.find(m => m.name === 'mimiri-notes').sources.find(s => s['dest-filename'] === 'bundle.json');
	if (bundleSource.url !== info.url || bundleSource.sha256 !== info.hash) {
		bundleSource.url = info.url;
		bundleSource.sha256 = info.hash;
		changed = true
		console.log('Updated bundle to', info.url);
	} else {
		console.log('Already on latest', info.url);
	}

	if (changed) {
		await writeFile('./mimiri-flatpak/io.mimiri.notes.yml', yaml.dump(doc, {
			noCompatMode: true,
			forceQuotes: false,
			lineWidth: -1,
			quotingType: '"',
		}))
	}

}

execute();