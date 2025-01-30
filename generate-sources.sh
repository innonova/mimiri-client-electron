npm install --lockfile-version 2
mv ./node_modules ./node_modules.bak
/home/inno/.local/bin/flatpak-node-generator npm package-lock.json
mv ./node_modules.bak ./node_modules
