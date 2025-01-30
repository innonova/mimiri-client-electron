npm install
npm install -D @electron-forge/cli
npm install -D @electron-forge/maker-squirrel
npm install -D @electron-forge/plugin-auto-unpack-natives
npm install -D @electron-forge/plugin-fuses
npm run download-bundle
npm run unpack-bundle -- ./bundle.json
npm run make
npm run rename-packages