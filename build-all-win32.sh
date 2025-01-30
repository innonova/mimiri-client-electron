npm install
npm -D @electron-forge/cli
npm -D @electron-forge/maker-squirrel
npm -D @electron-forge/plugin-auto-unpack-natives
npm -D @electron-forge/plugin-fuses
npm run download-bundle
npm run unpack-bundle -- ./bundle.json
npm run make
npm run rename-packages