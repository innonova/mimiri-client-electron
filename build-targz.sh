echo "Creating tag.gz"
arch=$(uname -m)
if [ "$arch" != "aarch64" ]; then
	cp -r ./dist/linux-arm64-unpacked ./dist/linux-unpacked
fi
cp ./tar-gz/autostart.sh ./dist/linux-unpacked/autostart.sh
cp ./tar-gz/run.sh ./dist/linux-unpacked/run.sh
cp ./tar-gz/mimiri-notes.desktop ./dist/linux-unpacked/mimiri-notes.desktop
mkdir ./dist/linux-unpacked/resources/hicolor
mkdir ./dist/linux-unpacked/resources/hicolor/256x256
mkdir ./dist/linux-unpacked/resources/hicolor/512x512
cp -r ./assets/hicolor/256x256/io.mimiri.notes.png ./dist/linux-unpacked/resources/hicolor/256x256/mimiri-notes.png
cp -r ./assets/hicolor/512x512/io.mimiri.notes.png ./dist/linux-unpacked/resources/hicolor/512x512/mimiri-notes.png
chmod +x ./dist/linux-unpacked/autostart.sh
chmod +x ./dist/linux-unpacked/run.sh
chmod +x ./dist/linux-unpacked/mimiri-notes.desktop
cd ./dist
mkdir ./mimiri-notes
cp -r ./linux-unpacked/* ./mimiri-notes/
tar -czvf ./mimiri-notes.tar.gz ./mimiri-notes
cd ..
