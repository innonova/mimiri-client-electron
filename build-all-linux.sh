npm install
sh ./generate-sources.sh
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
