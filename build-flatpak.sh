rm -rf mimiri-flathub-test
git clone git@github.com:innonova/mimiri-flathub-test.git
cp ./generated-sources.json ./mimiri-flathub-test/
cd mimiri-flathub-test
git add .
git commit -m"update generated-sources"
git push
flatpak-builder build io.mimiri.notes.yml --install-deps-from=flathub --force-clean --user --repo=flatpak-repo --install
flatpak build-bundle flatpak-repo io.mimiri.notes.flatpak io.mimiri.notes --runtime-repo=https://flathub.org/repo/flathub.flatpakrepo
cd ..