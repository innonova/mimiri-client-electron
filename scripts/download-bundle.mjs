import shell from 'shelljs';
import { readFileSync } from 'node:fs';

const downloadBundle = () => {
	try {
		// Read bundle info
		const bundleInfoContent = readFileSync('./bundle-info.json', 'utf-8');
		const info = JSON.parse(bundleInfoContent);

		console.log(`Download bundle from ${info.url}`);

		// Download the bundle
		const downloadResult = shell.exec(`curl ${info.url} -o ./bundle.json`);
		if (downloadResult.code !== 0) {
			throw new Error(`Failed to download bundle: ${downloadResult.stderr}`);
		}

		// Verify hash
		const hashResult = shell.exec(`sha256sum ./bundle.json`);
		if (hashResult.code !== 0) {
			throw new Error(`Failed to calculate hash: ${hashResult.stderr}`);
		}

		const hashMatch = /\w+/.exec(hashResult.stdout);
		if (!hashMatch) {
			throw new Error('Could not extract hash from sha256sum output');
		}

		const calculatedHash = hashMatch[0];

		if (calculatedHash !== info.hash) {
			shell.rm('-f', './bundle.json');
			throw new Error(`Hash mismatch: expected ${info.hash}, got ${calculatedHash}`);
		}

		console.log('Bundle downloaded and verified successfully');
	} catch (error) {
		console.error('Error downloading bundle:', error);
		process.exit(1);
	}
};

downloadBundle();