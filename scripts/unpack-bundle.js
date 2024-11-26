const shell = require('shelljs');
const path = require('node:path');
const { readFile, mkdir, writeFile } = require('node:fs/promises');

const bundlePath = './app'
const jsonPath = process.argv[2]

const fromBase64 = (base64) => {
	return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}

const unzip = async (text) => {
	return await new Response(new Blob([fromBase64(text)]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
}

const saveFilesRecursive = async (dir, file) => {
	if (file.files) {
		const subDir = path.join(dir, file.name)
		try {
			await mkdir(subDir)
		} catch { }
		for (const subFile of file.files) {
			await saveFilesRecursive(subDir, subFile)
		}
	} else {
		const filePath = path.join(dir, file.name)
		await writeFile(filePath, Buffer.from(await unzip(file.content)))
	}
}

const save = async () => {
	const bundleData = await readFile(jsonPath)
	const bundle = JSON.parse(bundleData.toString())
	shell.rm('-rf', bundlePath)
	try {
		await mkdir(bundlePath)
	} catch { }
	for (const file of bundle.files) {
		await saveFilesRecursive(bundlePath, file)
	}
}
save()
