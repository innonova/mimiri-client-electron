const { readFile, writeFile } = require('node:fs/promises');

const run = async () => {
	if (process.arch === 'arm64') {
		const package = JSON.parse(await readFile('./package.json'))
		if (package.build.snap.allowNativeWayland) {
			delete package.build.snap.allowNativeWayland
		}
		await writeFile('./package.json', JSON.stringify(package, undefined, '  '))
	}
}

run();