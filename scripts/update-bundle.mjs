import shell from 'shelljs';
import { readFile, writeFile } from 'node:fs/promises';

const fromBase64 = (base64) => {
	return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
};

const pemToArrayBuffer = (pem) => {
	const lines = pem.split('\n');
	let encoded = '';
	for (let i = 0; i < lines.length; i++) {
		if (
			lines[i].trim().length > 0 &&
			lines[i].indexOf('-----BEGIN PUBLIC KEY-----') < 0 &&
			lines[i].indexOf('-----END PUBLIC KEY-----') < 0
		) {
			encoded += lines[i].trim();
		}
	}
	return fromBase64(encoded);
};

const verify = async (name, data) => {
	const signature = data.signatures.find(sig => sig.name === name);
	const payload = JSON.stringify({ ...data, signatures: undefined });
	const publicPem = (await readFile(`./certs/${name}.pub`)).toString();

	const publicKey = await crypto.subtle.importKey(
		'spki',
		pemToArrayBuffer(publicPem),
		{
			name: 'RSASSA-PKCS1-v1_5',
			hash: 'SHA-256',
		},
		true,
		['verify'],
	);

	return await crypto.subtle.verify(
		'RSASSA-PKCS1-v1_5',
		publicKey,
		fromBase64(signature.signature),
		new TextEncoder().encode(payload),
	);
};

const updateMetainfo = async (version) => {
	const metainfoPath = './io.mimiri.notes.metainfo.xml';
	let metainfo = (await readFile(metainfoPath)).toString();
	const topRelease = /<release version="([^"]+)"/.exec(metainfo);
	if (!topRelease) {
		console.error('No <release> entry found in io.mimiri.notes.metainfo.xml');
		process.exit(1);
	}
	if (topRelease[1] === version) {
		return;
	}
	const date = new Date().toISOString().substring(0, 10);
	const entry = [
		`    <release version="${version}" date="${date}">`,
		'      <description>',
		'        <p>Fixes and minor improvements</p>',
		'      </description>',
		'    </release>',
		'',
	].join('\n');
	metainfo = metainfo.replace(/(<releases>\r?\n)/, `$1${entry}`);
	await writeFile(metainfoPath, metainfo);
	console.log(`Added release ${version} (${date}) to io.mimiri.notes.metainfo.xml`);
	console.log('=> Edit the release description before committing');
};

const execute = async () => {
	try {
		const keyName = '2024101797F6C918';
		const latest = await fetch(`https://update.mimiri.io/${keyName}.canary.json`).then(res => res.json());
		const bundleUrl = `https://update.mimiri.io/${keyName}.${latest.version}.json`;

		shell.exec(`curl ${bundleUrl} -o ./bundle.json`);
		const bundle = JSON.parse(await readFile('./bundle.json'));

		const verified = await verify(keyName, bundle);
		if (verified) {
			const sha256 = /\w+/.exec(shell.exec(`sha256sum ./bundle.json`).stdout)[0];
			console.log('verified', sha256);

			const info = {
				url: bundleUrl,
				hash: sha256
			};
			await writeFile('./bundle-info.json', JSON.stringify(info, undefined, '  '));

			const pack = JSON.parse(await readFile('./package.json'));
			const baseVersionTs = `export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '${latest.version}';
export const hostVersion = '${pack.version}';
export const releaseDate = '${bundle.releaseDate}';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;`;
			await writeFile('./src/base-version.ts', baseVersionTs);

			await updateMetainfo(pack.version);

		} else {
			console.error('Bundle verification failed');
			process.exit(1);
		}
	} catch (error) {
		console.error('Error updating bundle:', error);
		process.exit(1);
	}
};

execute();