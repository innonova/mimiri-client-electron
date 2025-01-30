git clone git@github.com:innonova/mimiri-flatpak.git
rm package-lock.json
npm install --lockfile-version 2
sh ./generate-sources.sh
npm install -D @electron-forge/cli \
	@electron-forge/maker-deb \
	@electron-forge/maker-rpm \
	@electron-forge/maker-snap \
	@electron-forge/maker-zip \
	@electron-forge/plugin-auto-unpack-natives \
	@electron-forge/plugin-fuses
rm -rf ./app
rm -f ./bundle.json
rm -rf ./dist
rm -rf ./dist-bin
mkdir ./dist-bin
npm run download-bundle
npm run unpack-bundle -- ./bundle.json
npm run dist
sh ./build-targz.sh
sh ./build-flatpak.sh
npm run rename-packages
ls -al ./dist-bin
