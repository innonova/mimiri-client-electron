npm install
npm run build
rm -rf ./app
rm -f ./bundle.json
rm -rf ./dist
rm -rf ./dist-bin
mkdir ./dist-bin
npm run download-bundle
npm run unpack-bundle -- ./bundle.json
npm run arm-wayland
npm run dist
npm run rename-packages
ls -al ./dist-bin
