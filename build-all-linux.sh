rm package-lock.json
npm install --lockfile-version 2
sh ./generate-sources.sh
npm install -D @electron-forge/cli
npm install -D @electron-forge/maker-deb
npm install -D @electron-forge/maker-rpm
npm install -D @electron-forge/maker-snap
npm install -D @electron-forge/maker-flatpak
npm install -D @electron-forge/maker-zip
npm install -D @electron-forge/plugin-auto-unpack-natives
npm install -D @electron-forge/plugin-fuses
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
