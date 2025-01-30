cp ./generated-sources.json ./mimiri-flatpak/
cd mimiri-flatpak
git add .
git commit -m"update generated-sources"
git push
lf -al
flatpak-builder build io.mimiri.notes.yml --install-deps-from=flathub --force-clean --user --repo=flatpak-repo --install
lf -al
flatpak build-bundle flatpak-repo io.mimiri.notes.flatpak io.mimiri.notes --runtime-repo=https://flathub.org/repo/flathub.flatpakrepo
cd ..