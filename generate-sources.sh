mv ./node_modules ./node_modules.bak
flatpak-node-generator npm package-lock.json
mv ./node_modules.bak ./node_modules
mv ./generated-sources.json ./flatpak/generated-sources.json
