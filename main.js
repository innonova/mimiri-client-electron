// Development/Production loader for TypeScript
// This file stays as main.js to maintain compatibility with existing build scripts

const isDev = process.defaultApp || process.argv.includes('--dev');

if (isDev) {
	// Development: Load TypeScript directly using ts-node
	require('ts-node').register({
		transpileOnly: true,
		compilerOptions: {
			module: 'commonjs',
			target: 'es2020',
			esModuleInterop: true,
			allowSyntheticDefaultImports: true,
			skipLibCheck: true
		}
	});
	require('./src/main.ts');
} else {
	// Production: Use compiled JavaScript
	require('./dist/main.js');
}