nmv use
npm install
npm run build
npm run generate-sources
rm -rf ./app
rm -f ./bundle.json
rm -rf ./dist
rm -rf ./dist-bin
mkdir ./dist-bin
npm run download-bundle
npm run unpack-bundle -- ./bundle.json
npm run arm-wayland
# Builds made before patches/app-builder-lib+26.15.3.patch poisoned the
# extracted snap-template cache (the inner tar left unextracted); on a cache
# hit the patched extraction never runs, so clear it to force a redo.
EB_CACHE="${ELECTRON_BUILDER_CACHE:-$HOME/.cache/electron-builder}"
rm -rf "$EB_CACHE"/snap-template-*
npm run dist
# A bad template extraction ships a snap without desktop-init.sh that fails
# at launch for every user (all snaps 2.6.2-2.6.7 had this) — fail the build.
if ! ls "$EB_CACHE"/snap-template-*/*/desktop-init.sh >/dev/null 2>&1; then
  echo "ERROR: snap template was not extracted correctly; the built snap would be missing desktop-init.sh and fail to launch" >&2
  exit 1
fi
sh ./build-targz.sh
sh ./build-flatpak.sh
npm run rename-packages
ls -al ./dist-bin
