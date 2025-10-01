npm install
npm run build
npm install -D @electron-forge/cli \
	@electron-forge/maker-squirrel \
	@electron-forge/plugin-auto-unpack-natives \
	@electron-forge/plugin-fuses
npm run download-bundle
npm run unpack-bundle -- ./bundle.json
npm run make
npm run rename-packages