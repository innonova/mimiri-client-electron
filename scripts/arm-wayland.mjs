import { readFile, writeFile } from 'node:fs/promises';

const run = async () => {
	if (process.arch === 'arm64') {
		try {
			const packageContent = await readFile('./package.json', 'utf-8');
			const packageJson = JSON.parse(packageContent);

			if (packageJson.build?.snap?.allowNativeWayland) {
				delete packageJson.build.snap.allowNativeWayland;
			}

			await writeFile('./package.json', JSON.stringify(packageJson, undefined, '  '));
			console.log('Successfully updated package.json for ARM64 Wayland compatibility');
		} catch (error) {
			console.error('Error updating package.json:', error);
			process.exit(1);
		}
	} else {
		console.log('Not ARM64 architecture, skipping Wayland configuration update');
	}
};

run().catch((error) => {
	console.error('Script execution failed:', error);
	process.exit(1);
});