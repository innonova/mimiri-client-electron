# Draft: electron-builder upstream issue

Repo: https://github.com/electron-userland/electron-builder/issues/new
Suggested title: **Snap template builds produce broken snaps since 26.15.x: template .tar.7z is only 7z-extracted, desktop-init.sh missing**

---

## Summary

Since the snap template handling moved from the Go `app-builder` binary into
`app-builder-lib` (observed in 26.15.3; still present in 26.15.6 and
27.0.0-alpha.5), every snap built with the default template path
(`useTemplateApp`) is **dead on arrival**:

```
$ snap run <app>
/snap/<app>/x1/command.sh: line 2: /snap/<app>/x1/desktop-init.sh: No such file or directory
```

## Root cause

`buildWithTemplate()` in `targets/snap/coreLegacy.js` downloads
`snap-template-electron-4.0-2-amd64.tar.7z` via `downloadBuilderToolset()` and
then feeds the toolset dir's top-level entries directly to `mksquashfs`.

`extractArchive()` in `util/electronGet.js` has no case for `.tar.7z`:
it falls through to the plain `.7z` branch, which strips only the 7z layer.
The toolset dir then contains a single file —
`snap-template-electron-4.0-2-amd64.tar` — instead of the template contents,
and the built snap ships that tar at its root while `desktop-init.sh`,
`desktop-common.sh`, `desktop-gnome-specific.sh`, and the template's
`usr/`, `lib/`, `gnome-platform/` trees are all missing.

Easy to confirm on any affected snap:

```
$ unsquashfs -l app.snap | grep -E 'desktop-init|snap-template'
squashfs-root/snap-template-electron-4.0-2-amd64.tar      # tar packed as-is
                                                          # no desktop-init.sh
```

The old Go `app-builder` handled `--template-url electron4:<arch>` itself and
extracted both layers, which is why ≤26.0.x snaps were fine.

(A secondary nit: `downloadBuilderToolset`'s cache `folderName` regex
`/\.(tar\.gz|tgz|tar\.xz|txz|zip|7z)$/` also doesn't know `tar.7z`, so the
cache dir name ends in `.tar-<hash>` — harmless but same blind spot.)

## Fix

Route `.tar.7z` through the same two-step used for `.tar.xz` (7za to get the
inner tar, then `tar.extract({ strip: 1 })`):

```diff
-        else if (file.endsWith(".tar.xz") || file.endsWith(".txz")) {
+        else if (file.endsWith(".tar.xz") || file.endsWith(".txz") || file.endsWith(".tar.7z")) {
```

Verified locally (patch-package on 26.15.3): the built snap contains the
desktop scripts at the root, no stray tar, and installs/launches/passes our
e2e suite under strict confinement.

Note for affected users: after applying a fix, the extracted-toolset cache is
poisoned and must be cleared once
(`~/.cache/electron-builder/snap-template-4.0-2/`), otherwise the bad
extraction is reused.

## Environment

- electron-builder / app-builder-lib 26.15.3 (repro also in 26.15.6, 27.0.0-alpha.5 by code inspection)
- Linux x64, `snap` target with default template (`useTemplateApp`)
