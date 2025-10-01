import ssri from 'ssri';
import crypto from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const existing = {};
const fileEntries = [];
const inlineEntries = [];
const electronArchitectures = [
	{ name: 'arm64', arch: 'aarch64' },
	{ name: 'armv7l', arch: 'arm' },
	{ name: 'x64', arch: 'x86_64' }
];

const createElectronFileEntry = async (url, fileName, onlyArches) => {
	console.log(url);
	const data = await fetch(url).then(res => res.bytes());
	const sha256 = crypto
		.createHash('sha256')
		.update(data)
		.digest('hex');

	return {
		type: 'file',
		url,
		sha256,
		'dest-filename': fileName,
		dest: 'flatpak-node/cache/electron',
		'only-arches': onlyArches
	};
};

const createFileEntry = async (url, data) => {
	const sha512 = crypto
		.createHash('sha512')
		.update(data)
		.digest('hex');

	return {
		type: 'file',
		url,
		sha512,
		'dest-filename': sha512.substring(4),
		dest: `flatpak-node/npm-cache/_cacache/content-v2/sha512/${sha512.substring(0, 2)}/${sha512.substring(2, 4)}`
	};
};

const createInlineEntry = async (url, data) => {
	const integrity = ssri.fromData(data, { algorithms: ['sha512'] });
	const key = `make-fetch-happen:request-cache:${url}`;
	const cacheEntry = {
		key,
		integrity,
		time: 0,
		size: data.length,
		metadata: { url, reqHeaders: {}, resHeaders: {} }
	};

	const cacheEntryString = JSON.stringify(cacheEntry);

	const entryFileName = crypto
		.createHash('sha256')
		.update(key)
		.digest('hex');

	const entryHash = crypto
		.createHash('sha1')
		.update(cacheEntryString)
		.digest('hex');

	const contents = `${entryHash}\t${cacheEntryString}`;
	return {
		type: 'inline',
		contents,
		'dest-filename': entryFileName.substring(4),
		dest: `flatpak-node/npm-cache/_cacache/index-v5/${entryFileName.substring(0, 2)}/${entryFileName.substring(2, 4)}`
	};
};

const addUrl = async (url) => {
	if (url) {
		if (url.startsWith('git+ssh://git@')) {
			url = url.replace('git+ssh://git@', 'https://codeload.').replace('.git#', '/tar.gz/');
		}
		if (url.startsWith('git+https://')) {
			url = url.replace('git+https://', 'https://codeload.').replace('.git#', '/tar.gz/');
		}
		if (!existing[url]) {
			console.log(url);
			existing[url] = true;
			const data = await fetch(url).then(res => res.bytes());
			inlineEntries.push(await createInlineEntry(url, data));
			fileEntries.push(await createFileEntry(url, data));
		}
	}
};

const main = async () => {
	try {
		const packageLock = JSON.parse((await readFile('package-lock.json')).toString());
		const electronVersion = packageLock.packages['node_modules/electron'].version;

		fileEntries.push(await createElectronFileEntry(
			`https://github.com/electron/electron/releases/download/v${electronVersion}/SHASUMS256.txt`,
			`SHASUMS256.txt-${electronVersion}`
		));

		for (const cpuArch of electronArchitectures) {
			fileEntries.push(await createElectronFileEntry(
				`https://github.com/electron/electron/releases/download/v${electronVersion}/electron-v${electronVersion}-linux-${cpuArch.name}.zip`,
				`electron-v${electronVersion}-linux-${cpuArch.name}.zip`
			));
		}

		for (const item of Object.keys(packageLock.packages)) {
			await addUrl(packageLock.packages[item].resolved);
			const dependencies = packageLock.packages[item].dependencies;
			if (dependencies) {
				for (const key of Object.keys(dependencies)) {
					const value = dependencies[key];
					if (value.startsWith('git+ssh://') || value.startsWith('git+https://') || value.startsWith('ssh://') || value.startsWith('https://')) {
						await addUrl(value);
					}
				}
			}
		}

		const generatedSources = [];

		generatedSources.push(...fileEntries);
		generatedSources.push(...inlineEntries);

		generatedSources.push({
			type: 'script',
			commands: [
				'case "$FLATPAK_ARCH" in',
				'"i386")',
				'  export ELECTRON_BUILDER_ARCH_ARGS="--ia32"',
				'  ;;',
				'"x86_64")',
				'  export ELECTRON_BUILDER_ARCH_ARGS="--x64"',
				"  ;;",
				'"arm")',
				'  export ELECTRON_BUILDER_ARCH_ARGS="--armv7l"',
				'  ;;',
				'"aarch64")',
				'  export ELECTRON_BUILDER_ARCH_ARGS="--arm64"',
				'  ;;',
				'esac'
			],
			'dest-filename': "electron-builder-arch-args.sh",
			dest: "flatpak-node"
		});

		const electronCacheDir = crypto
			.createHash('sha256')
			.update(`https://github.com/electron/electron/releases/download/v${electronVersion}`)
			.digest('hex');

		generatedSources.push({
			type: "shell",
			commands: [
				`mkdir -p "${electronCacheDir}"`,
				`ln -s "../SHASUMS256.txt-${electronVersion}" "${electronCacheDir}/SHASUMS256.txt"`,
			],
			dest: "flatpak-node/cache/electron",
		});

		for (const cpuArch of electronArchitectures) {
			generatedSources.push({
				type: "shell",
				commands: [
					`mkdir -p "${electronCacheDir}"`,
					`ln -s "../electron-v${electronVersion}-linux-${cpuArch.name}.zip" "${electronCacheDir}/electron-v${electronVersion}-linux-${cpuArch.name}.zip"`,
				],
				dest: "flatpak-node/cache/electron",
				"only-arches": [cpuArch.arch],
			});
		}

		await writeFile('generated-sources.json', JSON.stringify(generatedSources, undefined, '  '));
		console.log('Generated sources file created successfully');
	} catch (error) {
		console.error('Error generating sources:', error);
		process.exit(1);
	}
};

main();