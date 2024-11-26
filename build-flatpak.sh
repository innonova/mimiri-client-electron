cd flatpak
rm -rf ./.flatpak-builder/build/*
rm -rf ./repo
rm -rf ./build
rm -f ./io.mimiri.notes.flatpak
flatpak-builder build io.mimiri.notes.yml --install-deps-from=flathub --force-clean --user --repo=flatpak-repo --install
flatpak build-bundle flatpak-repo io.mimiri.notes.flatpak io.mimiri.notes --runtime-repo=https://flathub.org/repo/flathub.flatpakrepo
cd ..