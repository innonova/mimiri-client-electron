import { protocol, net, autoUpdater, BrowserWindow } from "electron";
import url from "node:url";
import Path from "node:path";
import { mkdirSync, existsSync, readFileSync } from "node:fs";
import {
  writeFile,
  mkdir,
  readdir,
  readFile,
  rm,
  rename,
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
  private configPath: string;
  private bundleSaveInProgress: boolean = false;
  private config: BundleConfig;
  private activePath: string;
  private mainWindow?: BrowserWindow;
  private useRequested?: UseRequest;
  private updateTempDir?: string;

  constructor(devMode: boolean) {
    this.devMode = devMode;
    this.configPath = Path.join(pathInfo.bundles!, "config.json");
    this.config = {
      activeVersion: "base",
    };

    try {
      mkdirSync(pathInfo.bundles!);
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
      } else if (!existsSync(this.activePath)) {
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
        return net.fetch(absPath);
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
        await rm(pathInfo.bundles!, { recursive: true });
      } catch {}
      for (const item of await readdir(pathInfo.bundles!)) {
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
    file: BundleFile
  ): Promise<void> {
    if (file.files) {
      const subDir = Path.join(dir, file.name);
      try {
        await mkdir(subDir);
      } catch {}
      for (const subFile of file.files) {
        await this.saveFilesRecursive(subDir, subFile);
      }
    } else if (file.content) {
      const filePath = Path.join(dir, file.name);
      await writeFile(filePath, Buffer.from(await unzip(file.content)));
    }
  }

  async save(version: string, bundle: Bundle): Promise<void> {
    try {
      this.bundleSaveInProgress = true;
      this.useRequested = undefined;
      const bundlePath = Path.join(pathInfo.bundles!, version + ".downloading");

      try {
        await rm(bundlePath, { recursive: true });
      } catch {}

      try {
        await mkdir(bundlePath);
      } catch {}

      for (const file of bundle.files) {
        await this.saveFilesRecursive(bundlePath, file);
      }

      await writeFile(
        Path.join(bundlePath, "info.json"),
        JSON.stringify(
          { ...bundle, files: undefined, signatures: undefined },
          undefined,
          "  "
        )
      );

      await rename(bundlePath, Path.join(pathInfo.bundles!, version));

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
    this.activePath = Path.join(pathInfo.bundles!, this.config.activeVersion);
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
        autoUpdater.setFeedURL({ url: `file://${this.updateTempDir}` });
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
