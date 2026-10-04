# CLAUDE.md — mimiri-client-electron

Read `readme.md` first: the two version streams, the layout, IPC, the
runtime knobs, the build. This file is what an agent gets wrong
without being told.

## Facts that shape every change

- **The shell is not the app.** UI, settings pages, the update flow's
  screens and all strings are in `mimiri-client`. A visible change is
  usually a client change; the shell changes when the renderer needs a
  new capability (then: a channel in `mimer-ipc-client.ts`, exposed in
  `preload.js`, consumed in `mimiri-client/src/services/ipc-client.ts`,
  gated in the client by `ipcClient.<sub>.isAvailable`).
- **A shell release is rare and deliberate.** Do not bump the version,
  `src/base-version.ts` or `bundle-info.json` as part of a feature;
  those move when a release is cut, by `npm run update-bundle` on a
  build server. Never propose a shell release to "catch up" with the
  bundle.
- **Old bundles must keep working on new shells and vice versa.** The
  renderer reads `mimiri-info` and the IPC surface defensively; keep
  channel names and semantics stable, add rather than change, and
  remember published bundles back to the shell's `minElectronVersion`
  gate will run on this code.
- **Channel names, menu item ids and `data-testid`s are a contract**
  with `mimiri-client` and `mimiri-e2e` (which tests published builds
  only, over CDP, and drives native dialogs for real).
- **The bundle key is a secret that exists only on the build servers.**
  `certs/` here holds the public half. `.env*` is banned
  (`.cursorban`); `app/`, `bundle.json`, `generated-sources.json` and
  `mimiri-flatpak/` are build inputs and gitignored.

## Platform specifics worth knowing

- `os-interop/linux-interop.ts` uses `dbus-native` (patched at
  postinstall to drop `abstract-socket`) for the tray, theme and
  autostart; `windows-interop.ts` uses `winreg`; `macos-interop.ts`
  carries Touch ID and the login item. `PlatformRules` tells the
  renderer which settings exist on this platform.
- Test mode (`APP_TEST_MODE=1`) is a real code path, not a build: the
  window always shows, close quits, `MIMIRI_FAKE_STORE` and
  `MIMIRI_USE_DEV_API` are honoured. `mimiri-e2e/docs/` documents the
  seams and which published versions have them.
- `watch-dog.ts` reloads the renderer when `watch-dog-ok` stops
  arriving; a renderer change that blocks the event loop at startup
  looks like a reload loop here.
- Packaged builds have the Node inspector fused off; debugging a
  published build means `--remote-debugging-port` and CDP, as the e2e
  suite does.

## Verifying

`npm run build` (tsc) is the only automated check. Run the shell with
`npm start` against the dev SPA for behaviour; for a packaged check on
another OS use the test machines described in
`mimiri-e2e/docs/test-machines.md` and the user-level `~/.claude/CLAUDE.md`.
For a change that must be seen in a real packaged build before release,
`mimiri-e2e/docs/testing-unreleased-changes.md` has the recipes.
