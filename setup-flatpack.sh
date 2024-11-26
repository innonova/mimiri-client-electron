sudo apt-get install flatpak flatpak-builder elfutils -y
flatpak remote-add --if-not-exists --user flathub https://flathub.org/repo/flathub.flatpakrepo
git config --global --add protocol.file.allow always
