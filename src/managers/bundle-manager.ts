import { protocol, net, autoUpdater, BrowserWindow } from "electron";
import url from "node:url";
import Path from "node:path";
import { randomUUID } from "node:crypto";
import {
  mkdirSync,
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import {
  writeFile,
  mkdir,
  readdir,
  readFile,
  rm,
  rename,
  stat,
} from "node:fs/promises";
import { pathInfo } from "../path-info";
import { baseVersion, hostVersion, releaseDate } from "../base-version";

interface BundleConfig {
  activeVersion: string;
  previousActiveVersion?: string;
}

interface BundleInfo {
  version: string;
  hostVersion: string;
  base: boolean;
  description?: string;
  releaseDate: string;
  active: boolean;
  previous: boolean;
  good?: boolean;
}

interface BundleFile {
  name: string;
  content?: string;
  files?: BundleFile[];
}

interface Bundle {
  version: string;
  releaseDate: string;
  files: BundleFile[];
  signatures?: any[];
}

interface UseRequest {
  version: string;
  mainWindow: BrowserWindow;
  noActivate: boolean;
}

interface MacOSRelease {
  url: string;
}

const fromBase64 = (base64: string): Uint8Array => {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
};

const unzip = async (text: string): Promise<ArrayBuffer> => {
  return await new Response(
    new Blob([fromBase64(text)])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"))
  ).arrayBuffer();
};

export class BundleManager {
  private devMode: boolean;
  private doInstallUpdate: boolean = false;
  private savePromise: Promise<void> = Promise.resolve();
  private configPath: string;
  private bundleSaveInProgress: boolean = false;
  private config: BundleConfig;
  private activePath: string;
  private mainWindow?: BrowserWindow;
  private useRequested?: UseRequest;
  private updateTempDir?: string;
  private lastActivate: number = 0;
  private activateCount: number = 0;

  constructor(devMode: boolean) {
    this.devMode = devMode;
    this.configPath = Path.join(pathInfo.bundles!, "config.json");
    this.config = {
      activeVersion: "base",
    };

    try {
      mkdirSync(pathInfo.bundles!);
    } catch {}

    // Sweep temp dirs left behind by interrupted downloads — they must
    // never be mistaken for (or block) a real bundle.
    try {
      for (const item of readdirSync(pathInfo.bundles!)) {
        if (item.includes(".downloading")) {
          rmSync(Path.join(pathInfo.bundles!, item), {
            recursive: true,
            force: true,
          });
        }
      }
    } catch {}

    if (existsSync(this.configPath)) {
      this.config = JSON.parse(readFileSync(this.configPath, "utf-8"));
    }

    if (this.config.activeVersion === "base") {
      this.activePath = pathInfo.baseBundle!;
    } else {
      this.activePath = Path.join(pathInfo.bundles!, this.config.activeVersion);
      if (this.compareVersions(baseVersion, this.config.activeVersion) > 0) {
        this.activePath = pathInfo.baseBundle!;
      } else if (!this.bundleDirIsHealthy(this.activePath)) {
        // Missing or partially written (e.g. an interrupted download that
        // got promoted by an older version) — serve the base bundle rather
        // than a broken page.
        this.activePath = pathInfo.baseBundle!;
      }
    }

    protocol.registerSchemesAsPrivileged([
      {
        scheme: "app",
        privileges: {
          secure: true,
          standard: true,
          supportFetchAPI: true,
          allowServiceWorkers: true,
        },
      },
    ]);

    autoUpdater.on("update-downloaded", () => {
      if (this.doInstallUpdate && this.mainWindow) {
        this.mainWindow.removeAllListeners("close");
        autoUpdater.quitAndInstall();
      }
    });
  }

  compareVersions(a: string, b: string): number {
    const matchA = /([0-9]+)\.([0-9]+)\.([0-9]+)(?:-(beta|rc)([0-9]+))?/.exec(
      a
    );
    const matchB = /([0-9]+)\.([0-9]+)\.([0-9]+)(?:-(beta|rc)([0-9]+))?/.exec(
      b
    );

    if (!matchA || !matchB) {
      return a.localeCompare(b);
    }

    const majorA = parseInt(matchA[1]);
    const minorA = parseInt(matchA[2]);
    const patchA = parseInt(matchA[3]);
    const labelTypeA = matchA[4];
    const labelA = parseInt(matchA[5]);
    const majorB = parseInt(matchB[1]);
    const minorB = parseInt(matchB[2]);
    const patchB = parseInt(matchB[3]);
    const labelTypeB = matchB[4];
    const labelB = parseInt(matchB[5]);

    if (majorA !== majorB) {
      return majorA - majorB;
    }
    if (minorA !== minorB) {
      return minorA - minorB;
    }
    if (patchA !== patchB) {
      return patchA - patchB;
    }
    if (labelTypeA !== labelTypeB) {
      return labelTypeA === "rc" ? 1 : -1;
    }
    if (labelA !== labelB) {
      if (!isNaN(labelA) && !isNaN(labelB)) {
        return labelA - labelB;
      }
      if (!isNaN(labelA) && isNaN(labelB)) {
        return 1;
      }
      if (isNaN(labelA) && !isNaN(labelB)) {
        return -1;
      }
    }
    return 0;
  }

  init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
  }

  appReady(): void {
    protocol.handle("app", (request) => {
      const uri = /app:\/\/+([^/]+)\/([^#]+)/.exec(request.url);
      if (!uri) {
        return new Response(null, { status: 404 });
      }

      const domain = uri[1];
      const filePath = uri[2];
      if (domain === "app.mimernotes.com") {
        const absPath = url
          .pathToFileURL(Path.join(this.activePath, filePath))
          .toString();
        // A rejected handler surfaces as the opaque net::ERR_UNEXPECTED;
        // report missing files as an honest 404 instead.
        return net.fetch(absPath).catch(() => new Response(null, { status: 404 }));
      }
      return new Response(null, { status: 404 });
    });
  }

  async getInstalledVersions(): Promise<BundleInfo[]> {
    const bundles: BundleInfo[] = [
      {
        version: baseVersion,
        hostVersion,
        base: true,
        description: "base",
        releaseDate,
        active: this.config.activeVersion === "base" || this.devMode,
        previous: this.config.previousActiveVersion === "base" || this.devMode,
      },
    ];
    try {
      try {
        await mkdir(pathInfo.bundles!, { recursive: true });
      } catch {}
      for (const item of await readdir(pathInfo.bundles!)) {
        // In-flight/interrupted downloads and partially written bundles
        // must not present as installed — an older client once treated a
        // half-saved dir as installed, skipped re-downloading and kept
        // activating a broken bundle.
        if (item.includes(".downloading")) {
          continue;
        }
        if (!this.bundleDirIsHealthy(Path.join(pathInfo.bundles!, item))) {
          continue;
        }
        const infoPath = Path.join(pathInfo.bundles!, item, "info.json");
        if (existsSync(infoPath)) {
          const info = JSON.parse(await readFile(infoPath, "utf-8"));
          if (info.version !== baseVersion) {
            bundles.push({
              ...info,
              hostVersion,
              base: false,
              active: this.config.activeVersion === info.version,
              previous: this.config.previousActiveVersion === info.version,
            });
          }
        }
      }
    } catch (ex) {
      console.log(ex);
    }
    return bundles;
  }

  private async saveFilesRecursive(
    dir: string,
    file: BundleFile,
    written: { path: string; size: number }[]
  ): Promise<void> {
    if (file.files) {
      const subDir = Path.join(dir, file.name);
      try {
        await mkdir(subDir);
      } catch {}
      for (const subFile of file.files) {
        await this.saveFilesRecursive(subDir, subFile, written);
      }
    } else if (file.content) {
      const filePath = Path.join(dir, file.name);
      const data = Buffer.from(await unzip(file.content));
      await writeFile(filePath, data);
      written.push({ path: filePath, size: data.length });
    }
  }

  /** Confirms every written file exists on disk with the expected size. */
  private async verifySavedBundle(
    bundlePath: string,
    written: { path: string; size: number }[]
  ): Promise<void> {
    for (const file of written) {
      const info = await stat(file.path); // throws if missing
      if (info.size !== file.size) {
        throw new Error(
          `bundle verification failed: ${file.path} has ${info.size} bytes, expected ${file.size}`
        );
      }
    }
    if (!existsSync(Path.join(bundlePath, "index.html"))) {
      throw new Error("bundle verification failed: no index.html");
    }
  }

  /**
   * Whether a bundle dir on disk is complete enough to serve. Bundles saved
   * by this version carry .bundle-manifest.json (every file + size); for
   * bundles saved by older versions, fall back to checking that the local
   * assets index.html references actually exist — a partially written
   * bundle typically has index.html but is missing hashed assets.
   */
  bundleDirIsHealthy(dir: string): boolean {
    try {
      const indexPath = Path.join(dir, "index.html");
      if (!existsSync(indexPath)) {
        return false;
      }
      const manifestPath = Path.join(dir, ".bundle-manifest.json");
      if (existsSync(manifestPath)) {
        const manifest: { path: string; size: number }[] = JSON.parse(
          readFileSync(manifestPath, "utf-8")
        );
        for (const file of manifest) {
          const filePath = Path.join(dir, file.path);
          if (!existsSync(filePath)) {
            return false;
          }
          if (statSync(filePath).size !== file.size) {
            return false;
          }
        }
        return true;
      }
      const html = readFileSync(indexPath, "utf-8");
      for (const match of html.matchAll(
        /(?:src|href)="\/((?:assets|wasm|img)\/[^"]+)"/g
      )) {
        if (!existsSync(Path.join(dir, match[1]))) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  async save(version: string, bundle: Bundle): Promise<void> {
    // Serialize saves: concurrent calls (e.g. an automatic update racing a
    // manual one) used to write into the same temp dir and could promote a
    // partially written bundle.
    const run = this.savePromise.then(() => this.doSave(version, bundle));
    this.savePromise = run.catch(() => {});
    return run;
  }

  private async doSave(version: string, bundle: Bundle): Promise<void> {
    try {
      this.bundleSaveInProgress = true;
      this.useRequested = undefined;
      // Unique temp dir per download, so no two saves can ever collide.
      const bundlePath = Path.join(
        pathInfo.bundles!,
        `${version}.downloading-${randomUUID()}`
      );

      try {
        await mkdir(bundlePath, { recursive: true });

        const written: { path: string; size: number }[] = [];
        for (const file of bundle.files) {
          await this.saveFilesRecursive(bundlePath, file, written);
        }

        await writeFile(
          Path.join(bundlePath, "info.json"),
          JSON.stringify(
            { ...bundle, files: undefined, signatures: undefined },
            undefined,
            "  "
          )
        );
        // Manifest of everything written, so later health checks (startup,
        // activation, getInstalledVersions) can detect a damaged bundle.
        await writeFile(
          Path.join(bundlePath, ".bundle-manifest.json"),
          JSON.stringify(
            written.map((file) => ({
              path: Path.relative(bundlePath, file.path),
              size: file.size,
            }))
          )
        );

        // Only verified bundles get promoted to their real name.
        await this.verifySavedBundle(bundlePath, written);

        const finalPath = Path.join(pathInfo.bundles!, version);
        await rm(finalPath, { recursive: true, force: true });
        await rename(bundlePath, finalPath);
      } catch (ex) {
        try {
          await rm(bundlePath, { recursive: true, force: true });
        } catch {}
        throw ex;
      }

      if (this.useRequested) {
        const { version, mainWindow, noActivate } = this.useRequested;
        this.useRequested = undefined;
        await this.use(version, mainWindow, noActivate);
      }
    } finally {
      this.bundleSaveInProgress = false;
    }
  }

  async use(
    version: string,
    mainWindow: BrowserWindow,
    noActivate?: boolean
  ): Promise<void> {
    if (this.bundleSaveInProgress) {
      this.useRequested = {
        version,
        mainWindow,
        noActivate: noActivate || false,
      };
      return;
    }

    if (this.config.activeVersion !== version) {
      this.config.previousActiveVersion = this.config.activeVersion;
      this.config.activeVersion = version;
      await writeFile(
        this.configPath,
        JSON.stringify(this.config, undefined, "  ")
      );

      if (!noActivate) {
        this.activate(mainWindow);
      }
    } else if (!noActivate) {
      this.activate(mainWindow);
    }
  }

  async activate(mainWindow: BrowserWindow): Promise<void> {
    const timeSinceLast = Date.now() - this.lastActivate;
    if (timeSinceLast < 10000) {
      if (this.activateCount++ > 5) {
        return;
      }
    } else {
      this.activateCount = 0;
    }
    this.lastActivate = Date.now();
    this.activePath =
      this.config.activeVersion === "base"
        ? pathInfo.baseBundle!
        : Path.join(pathInfo.bundles!, this.config.activeVersion);
    if (
      this.config.activeVersion !== "base" &&
      !this.bundleDirIsHealthy(this.activePath)
    ) {
      // Never point the window at a missing/partial bundle — the base
      // bundle always exists and keeps the app usable for a re-update.
      this.activePath = pathInfo.baseBundle!;
    }
    // Drop cached responses from the previous bundle before navigating.
    // Without this, a navigation shortly after activation (e.g. the watch
    // dog reloading a slow-booting window) can be served the previous
    // bundle's index.html from the HTTP cache, reviving the old version.
    try {
      await mainWindow.webContents.session.clearCache();
    } catch {
      // never let cache maintenance block activation
    }
    mainWindow.reload();
  }

  async delete(version: string): Promise<void> {
    if (this.config.activeVersion !== version && version !== "base") {
      const bundlePath = Path.join(pathInfo.bundles!, version);
      if (existsSync(bundlePath)) {
        await rm(bundlePath, { recursive: true });
      }
    }
  }

  async good(version: string): Promise<void> {
    const bundlePath = Path.join(pathInfo.bundles!, version);
    const infoPath = Path.join(bundlePath, "info.json");
    if (existsSync(infoPath)) {
      const info = JSON.parse(await readFile(infoPath, "utf-8"));
      if (!info.good) {
        info.good = true;
        await writeFile(infoPath, JSON.stringify(info, undefined, "  "));
      }
    }
  }

  async saveElectronUpdate(release: string, data: Buffer): Promise<void> {
    if (process.platform === "win32") {
      this.updateTempDir = Path.join(pathInfo.temp!, "MimiriUpdate");
      if (!existsSync(this.updateTempDir)) {
        mkdirSync(this.updateTempDir);
      }
      await writeFile(Path.join(this.updateTempDir, "RELEASES"), release);
      await writeFile(
        Path.join(this.updateTempDir, release.split(" ")[1]),
        data
      );
    } else if (process.platform === "darwin") {
      this.updateTempDir = Path.join(pathInfo.temp!, "MimiriUpdate");
      if (!existsSync(this.updateTempDir)) {
        mkdirSync(this.updateTempDir);
      }
      const releaseInfo: MacOSRelease = {
        url: `file://${Path.join(this.updateTempDir, release)}`,
      };
      await writeFile(
        Path.join(this.updateTempDir, "releases.json"),
        JSON.stringify(releaseInfo)
      );
      await writeFile(Path.join(this.updateTempDir, release), data);
    }
  }

  async updateElectron(noRestart?: boolean): Promise<void> {
    try {
      if (process.platform === "win32" && this.updateTempDir) {
        this.doInstallUpdate = !noRestart;
        autoUpdater.setFeedURL({ url: this.updateTempDir });
        autoUpdater.checkForUpdates();
      } else if (process.platform === "darwin" && this.updateTempDir) {
        this.doInstallUpdate = !noRestart;
        autoUpdater.setFeedURL({
          url: `file://${Path.join(this.updateTempDir, "releases.json")}`,
        });
        autoUpdater.checkForUpdates();
      }
    } catch (ex) {
      console.log(ex);
    }
  }
}
