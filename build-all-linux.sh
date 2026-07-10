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
# A snap without desktop-init.sh fails at launch for every user (all x64
# snaps 2.6.2-2.6.7 shipped like this) — fail the build. Both build paths
# stage the script to the snap root (template on x64/armv7l, snapcraft on
# arm64), so inspect the artifact itself when unsquashfs is available. The
# extracted-template cache is only a fallback proxy, and only meaningful on
# the template arches — arm64 never creates it.
SNAP_FILE=$(ls dist/mimiri-notes_*.snap 2>/dev/null | head -n 1)
if command -v unsquashfs >/dev/null 2>&1 && [ -n "$SNAP_FILE" ]; then
  if ! unsquashfs -l "$SNAP_FILE" 2>/dev/null | grep -q 'desktop-init\.sh'; then
    echo "ERROR: $SNAP_FILE is missing desktop-init.sh and would fail to launch" >&2
    exit 1
  fi
else
  case "$(uname -m)" in
    x86_64 | armv7l)
      if ! ls "$EB_CACHE"/snap-template-*/*/desktop-init.sh >/dev/null 2>&1; then
        echo "ERROR: snap template was not extracted correctly; the built snap would be missing desktop-init.sh and fail to launch" >&2
        exit 1
      fi
      ;;
  esac
fi
sh ./build-targz.sh
sh ./build-flatpak.sh
npm run rename-packages
ls -al ./dist-bin
