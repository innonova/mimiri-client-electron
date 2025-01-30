npm install
npm install -D @electron-forge/cli
npm install -D @electron-forge/maker-dmg
npm install -D @electron-forge/plugin-auto-unpack-natives
npm install -D @electron-forge/plugin-fuses
npm run download-bundle
npm run unpack-bundle -- ./bundle.json
npm run make --  --arch universal
npm run rename-packages
