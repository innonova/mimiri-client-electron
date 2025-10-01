git add .
git commit -m "Prepare flatpak build"
git push
npm run download-bundle
npm run unpack-bundle -- ./bundle.json
rm -rf ./mimiri-flatpak/.flatpak-builder
rm -rf ./mimiri-flatpak/build
rm -rf ./mimiri-flatpak/flatpak-repo
npm run build
npm run generate-sources
git clone git@github.com:innonova/mimiri-flatpak.git

CURRENT_COMMIT=$(git rev-parse HEAD)
sed -i "s/commit: .*/commit: $CURRENT_COMMIT/" mimiri-flatpak/io.mimiri.notes.yml

npm run update-flatpak
cp ./generated-sources.json ./mimiri-flatpak/
cp ./package-lock.json ./mimiri-flatpak/
cd mimiri-flatpak
flatpak-builder build io.mimiri.notes.yml --install-deps-from=flathub --force-clean --user --repo=flatpak-repo
flatpak build-bundle flatpak-repo io.mimiri.notes.flatpak io.mimiri.notes --runtime-repo=https://flathub.org/repo/flathub.flatpakrepo