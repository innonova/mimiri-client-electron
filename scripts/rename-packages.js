const shell = require('shelljs');
const { readFileSync, writeFileSync, readdirSync, statSync } = require('node:fs');
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

	const toBase64 = (data) => {
		if (data instanceof Uint8Array) {
			return fromUint8Array(data)
		}
		return fromUint8Array(new Uint8Array(data))
	}

	const fromBase64 = (base64) => {
		return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
	}

	const pemToArrayBuffer = (pem) => {
		const lines = pem.split('\n')
		let encoded = ''
		for (let i = 0; i < lines.length; i++) {
			if (
				lines[i].trim().length > 0 &&
				lines[i].indexOf('-----BEGIN PRIVATE KEY-----') < 0 &&
				lines[i].indexOf('-----BEGIN PUBLIC KEY-----') < 0 &&
				lines[i].indexOf('-----END PRIVATE KEY-----') < 0 &&
				lines[i].indexOf('-----END PUBLIC KEY-----') < 0
			) {
				encoded += lines[i].trim()
			}
		}
		return fromBase64(encoded)
	}

	const privatePem = readFileSync(`1./certs/${bundleKey}.key`).toString()

	const privateKey = await crypto.subtle.importKey(
		'pkcs8',
		pemToArrayBuffer(privatePem),
		{
			name: 'RSASSA-PKCS1-v1_5',
			hash: 'SHA-256',
		},
		true,
		['sign'],
	)


	const electronWinInstallerPath = './out/make/squirrel.windows/x64'
	const releaseJson = {
		release: readFileSync(Path.join(electronWinInstallerPath, "RELEASES")).toString().replace(/^\uFEFF/, ''),
		size: 0,
		signatureKey: bundleKey,
		signature: ''
	}
	// TODO get the right version here
	const releasePath = Path.join(electronWinInstallerPath, `electron-win.${package.version}.json`);

	const artifacts = [releasePath]
	for (const file of readdirSync(electronWinInstallerPath)) {
		if (file.endsWith('.exe')) {
			artifacts.push(Path.join(electronWinInstallerPath, file))
		}
		if (file.endsWith('.nupkg')) {
			const nupkgPath = Path.join(electronWinInstallerPath, file);
			artifacts.push(nupkgPath)
			var stats = statSync(nupkgPath);
			releaseJson.size = stats.size;
			releaseJson.signature = toBase64(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, readFileSync(nupkgPath)))
		}
	}
	writeFileSync(releasePath, JSON.stringify(releaseJson));
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