npm install
sh ./generate-sources.sh
npm -D @electron-forge/cli
npm -D @electron-forge/maker-deb
npm -D @electron-forge/maker-rpm
npm -D @electron-forge/maker-snap
npm -D @electron-forge/maker-flatpak
npm -D @electron-forge/maker-zip
npm -D @electron-forge/plugin-auto-unpack-natives
npm -D @electron-forge/plugin-fuses
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
