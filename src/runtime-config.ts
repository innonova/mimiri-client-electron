import * as path from "node:path";
import { readFileSync } from "node:fs";

const userDataDirPrefix = "--user-data-dir=";
const userDataDirArg = process.argv.find((arg) =>
  arg.startsWith(userDataDirPrefix),
);

export const testMode: boolean = process.env.APP_TEST_MODE === "1";

export const apiUrlOverride: string | undefined =
  process.env.MIMIRI_API_URL || undefined;

/**
 * Test-mode toggle: make the renderer use its compiled-in dev API host and
 * dev server key pair instead of the production ones. A boolean toggle
 * between baked-in key pairs on purpose — accepting an arbitrary key from
 * the environment would let anyone who controls the env re-key the client.
 */
export const useDevApi: boolean = process.env.MIMIRI_USE_DEV_API === "1";

export const blogApiUrlOverride: string | undefined =
  process.env.MIMIRI_BLOG_API_URL || undefined;

export const updateUrlOverride: string | undefined =
  process.env.MIMIRI_UPDATE_URL || undefined;

export const updateKeyOverride: string | undefined =
  process.env.MIMIRI_UPDATE_KEY || undefined;

/** Test-mode override for store detection: "flathub" | "snapstore". */
export const fakeStoreOverride: string | undefined =
  process.env.MIMIRI_FAKE_STORE || undefined;

/**
 * Whether this install came from flathub, as opposed to a directly
 * downloaded .flatpak bundle. Flathub enforces publishing on the `stable`
 * branch, while our own bundles are built on `master`; the running
 * instance's branch is in /.flatpak-info (readable inside the sandbox).
 */
export function detectFlatHub(): boolean {
  if (process.env.container !== "flatpak") {
    return false;
  }
  try {
    const info = readFileSync("/.flatpak-info", "utf-8");
    const match = /^branch=(.*)$/m.exec(info);
    return match ? match[1].trim() === "stable" : false;
  } catch {
    return false;
  }
}

/**
 * Whether this install came from the snap store, as opposed to a directly
 * downloaded .snap installed with --dangerous. snapd assigns numeric
 * revisions to store installs and x-prefixed ones (x1, x2, ...) to
 * unasserted local installs.
 */
export function detectSnapStore(): boolean {
  return (
    !!process.env.SNAP && /^[0-9]+$/.test(process.env.SNAP_REVISION ?? "")
  );
}

export const userDataDirOverride: string | undefined = userDataDirArg
  ? path.resolve(userDataDirArg.substring(userDataDirPrefix.length))
  : undefined;
