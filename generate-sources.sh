npm install --lockfile-version 2
mv ./node_modules ./node_modules.bak
flatpak-node-generator npm package-lock.json
mv ./node_modules.bak ./node_modules
