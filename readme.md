# Mimiri Electron Client

The desktop host for [Mimiri Notes](https://mimiri.io) on Windows,
macOS and Linux. The app itself is the web bundle built from
`mimiri-client`; this repository is the Electron shell that embeds a
signed bundle, serves it from an internal origin, swaps it for newer
signed bundles at runtime, and provides what a browser cannot: the
tray, start-on-login, native file dialogs, Touch ID, D-Bus, host
updates. Project map: `mimiri-project/README.md`; the release path
across repositories: `mimiri-project/docs/release-path.md`.

## Two version streams

| Stream | Where | Today |
|---|---|---|
| Host (this repository) | `package.json` `version`, `hostVersion` in `src/base-version.ts` | 2.6.2x |
| Bundle it embeds | `bundle-info.json` (url + sha256), `baseVersion` in `src/base-version.ts` | 2.6.25 |

The bundle is the unit of release and moves with every merged client
PR; the host moves when Electron, a native integration or an OS
requirement does. A host far behind the bundle is the design, not a
backlog. A running host replaces its bundle with any newer signed one
from `update.mimiri.io` that the bundle's `minElectronVersion*` gate
allows; when the gate excludes the host, the client offers a host
update instead.

## Layout

- `main.js` loads `src/main.ts` through ts-node in development
  (`process.defaultApp`, or `--dev`) and `dist/main.js` in a packaged
  app. `preload.js` is the context bridge.
- `src/main.ts`: single instance, window, the `mimiri-info` argument the
  renderer reads (host and base version, channel, platform, test mode,
  overrides, store detection), close-to-tray.
- `src/managers/`: `mimer-ipc-client.ts` (every IPC channel),
  `bundle-manager.ts` (installed bundles, activation, rollback, host
  updates), `menu-manager.ts` (app and tray menus from the renderer's
  configuration), `settings-manager.ts`, `window-manager.ts`,
  `log-manager.ts`, `watch-dog.ts` (reloads the renderer if it stops
  reporting), and `os-interop/` with one implementation per platform
  behind `OSInterop`.
- `src/runtime-config.ts`: the environment knobs (below).
- `app/` (gitignored) is the unpacked bundle, served as
  `app://app.mimernotes.com/`. In development the window loads
  `https://app-dev-aek.mimiri.io/` instead.
- `scripts/`: the bundle and packaging helpers; `build-all-*.sh`: the
  per-platform builds run on the build servers; `patches/`: a
  patch-package fix for electron-builder's snap template;
  `io.mimiri.notes.*`: the Flatpak desktop entry and metainfo.

## IPC

The renderer talks to the host through channels registered in
`mimer-ipc-client.ts` and exposed by `preload.js`; the client side is
`mimiri-client/src/services/ipc-client.ts`. Groups: `menu-*`,
`settings-*`, `bundle-*`, `window-*`, `session-*` (in-memory and
persistent values, the persistent ones through `safeStorage`),
`filesystem-*`, `os-*` (autostart, platform rules, Touch ID),
`set-app-menu`, `set-tray-menu`, `watch-dog-ok`. Channel names, menu
item ids and `data-testid`s are a contract with `mimiri-client` and
`mimiri-e2e`; keep existing ones stable.

## Runtime configuration

Read in `src/runtime-config.ts`; most are for tests.

| Setting | Effect |
|---|---|
| `APP_TEST_MODE=1` | Test mode: window always shown, close quits, store and dev-API overrides allowed |
| `--user-data-dir=<path>` | Isolated profile (settings, bundles, session) |
| `MIMIRI_USE_DEV_API=1` | The renderer uses its compiled-in dev hosts and dev server key (a boolean on purpose; the key is never taken from the environment) |
| `MIMIRI_API_URL`, `MIMIRI_BLOG_API_URL`, `MIMIRI_UPDATE_URL`, `MIMIRI_UPDATE_KEY` | Overrides passed to the renderer |
| `MIMIRI_FAKE_STORE=flathub\|snapstore` | Pretend to be a store install (test mode) |

Store detection is real otherwise: Flathub from the `stable` branch in
`/.flatpak-info`, Snap Store from a numeric snap revision. Store
installs leave host updates to the store.

## Development

```sh
nvm use                 # .nvmrc: Node 24
npm install             # postinstall: patch-package, dbus-native fix, app deps
npm run build           # tsc
npm start               # electron . --hidden, dev mode, loads app-dev-aek.mimiri.io
```

Unset `ELECTRON_RUN_AS_NODE` if it is in your environment (VS Code
descended shells), or Electron starts as plain Node. On Linux the
Chromium sandbox may need unprivileged user namespaces enabled.
Development state lives in `dev-state/` (gitignored).

## Building a release

Everything below runs on the build servers (one per platform plus an
arm64 Linux box), from a clean clone, and is scripted in
`build-all-linux.sh`, `build-all-win32.sh`, `build-all-darwin.sh`,
`build-snap-arm.sh`.

1. `npm run update-bundle`: fetch the current canary from
   `update.mimiri.io`, verify its signature with `certs/<key>.pub`,
   write `bundle-info.json` and `src/base-version.ts`, add a release
   entry to `io.mimiri.notes.metainfo.xml`. Bump `package.json`.
   Commit and push: the Flatpak build pins this commit.
2. Each build script: `download-bundle` (sha256 checked),
   `unpack-bundle -- ./bundle.json` into `app/`, then the packager:
   - Windows: Electron Forge, Squirrel installer. Fuses: RunAsNode off,
     Node CLI inspect off, asar integrity on (which is why `mimiri-e2e`
     can only attach over CDP). `Setup.exe` is Authenticode-signed in a
     manual signtool step with a hardware key; the inner binaries are
     not. `rename-packages` signs the update manifest with the bundle
     key from `CERT_PATH`.
   - macOS: Forge, universal binary, DMG and zip; signing and
     notarization from `MAC_SIGN_IDENT`, `MAC_NOTARIZE_APPLE_ID`,
     `MAC_NOTARIZE_APPLE_ID_PASSWORD`, `MAC_NOTARIZE_TEAM_ID`.
   - Linux: electron-builder (snap, AppImage, unpacked dir), then
     `build-targz.sh` (tarball with `run.sh`, `autostart.sh`, desktop
     entry and icons from `tar-gz/`), `build-flatpak.sh` (clones
     `mimiri-flatpak`, `update-flatpak` rewrites the manifest to this
     commit and this bundle, commits and pushes on x86_64, builds the
     `.flatpak`), and `rename-packages` into `dist-bin/` with
     `artifacts.json`. The build fails if the snap lacks
     `desktop-init.sh` (a regression that shipped in 2.6.2 to 2.6.7).
3. The artifacts and `latest.json` go to `update.mimiri.io`. Snap Store
   promotion (`promote-snap`) and the Flathub PR
   (`flathub/io.mimiri.notes`, manifest from `mimiri-flatpak`) follow.

## Contributing

Issues and discussion: [Discord](https://discord.gg/pg69qPAVZR).
Changes land by pull request to `main`. `.env*` files are banned from
the tree (`.cursorban`).
