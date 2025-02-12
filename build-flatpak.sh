git clone git@github.com:innonova/mimiri-flatpak.git
npm run update-flatpak
cp ./generated-sources.json ./mimiri-flatpak/
cp ./package-lock.json ./mimiri-flatpak/
cd mimiri-flatpak
arch=$(uname -m)
if [ "$arch" != "aarch64" ]; then
	git add .
	git commit -m"update generated-sources and bundle"
	git push
fi
flatpak-builder build io.mimiri.notes.yml --install-deps-from=flathub --force-clean --user --repo=flatpak-repo --install
flatpak build-bundle flatpak-repo io.mimiri.notes.flatpak io.mimiri.notes --runtime-repo=https://flathub.org/repo/flathub.flatpakrepo
cd ..