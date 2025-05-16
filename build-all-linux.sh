npm install
npm run generate-sources
rm -rf ./app
rm -f ./bundle.json
rm -rf ./dist
rm -rf ./dist-bin
mkdir ./dist-bin
npm run download-bundle
npm run unpack-bundle -- ./bundle.json
arch=$(uname -m)
if [ "$arch" = "aarch64" ]; then
	sed -i '/allowNativeWayland/d' package.json
fi
npm run dist
sh ./build-targz.sh
sh ./build-flatpak.sh
npm run rename-packages
ls -al ./dist-bin
