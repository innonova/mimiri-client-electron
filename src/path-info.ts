import { app, nativeTheme } from "electron";
import { readFileSync } from "node:fs";
import * as path from "node:path";

const isDev = process.defaultApp || process.argv.includes("--dev");

class PathInfo {
  private _isFlatHub: boolean = false;
  private _isSnapStore: boolean = false;

  constructor() {
    if (this.isFlatpak) {
      const flatpakInfo = readFileSync("/.flatpak-info").toString();
      if (flatpakInfo?.includes("origin=flathub")) {
        this._isFlatHub = true;
      }
    }
    if (this.isSnap) {
      if (process.env.SNAP_NAME === "mimiri-notes") {
        this._isSnapStore = true;
      }
    }
  }

  get isFlatpak(): boolean {
    return process.platform === "linux" && process.env.container === "flatpak";
  }

  get isSnap(): boolean {
    return process.platform === "linux" && !!process.env.SNAP;
  }

  get isAppImage(): boolean {
    return process.platform === "linux" && !!process.env.APPIMAGE;
  }

  get isFlatHub(): boolean {
    return this._isFlatHub;
  }

  get isSnapStore(): boolean {
    return this._isSnapStore;
  }

  get isTarGz(): boolean {
    return (
      process.platform === "linux" &&
      !this.isFlatpak &&
      !this.isSnap &&
      !this.isAppImage
    );
  }

  get settings(): string | undefined {
    if (isDev) {
      return path.join(__dirname, "dev-state");
    }
    if (process.platform === "win32") {
      return path.join(app.getPath("home"), ".mimiri");
    }
    if (process.platform === "darwin") {
      return path.join(app.getPath("home"), ".mimiri");
    }
    if (process.platform === "linux") {
      if (this.isFlatpak) {
        return process.env.XDG_CONFIG_HOME;
      }
      return path.join(app.getPath("home"), ".mimiri");
    }
    return undefined;
  }

  get database(): string | undefined {
    if (isDev) {
      return path.join(__dirname, "dev-state");
    }
    if (process.platform === "win32") {
      return path.join(app.getPath("home"), ".mimiri");
    }
    if (process.platform === "darwin") {
      return path.join(app.getPath("home"), ".mimiri");
    }
    if (process.platform === "linux") {
      if (this.isFlatpak) {
        return process.env.XDG_DATA_HOME;
      }
      return path.join(app.getPath("home"), ".mimiri");
    }
    return undefined;
  }

  get bundles(): string | undefined {
    if (process.platform === "win32") {
      return path.join(__dirname.replace("\\app.asar\\dist", ""), "bundles");
    }
    if (process.platform === "darwin") {
      return path.join(app.getPath("home"), ".mimiri", "bundles");
    }
    if (process.platform === "linux") {
      if (this.isFlatpak) {
        return path.join(process.env.XDG_DATA_HOME || "", "bundles");
      }
      return path.join(app.getPath("home"), ".mimiri", "bundles");
    }
    return undefined;
  }

  get baseBundle(): string | undefined {
    const basePath = this.getBasePath();

    if (process.platform === "win32") {
      return path.join(basePath, "app");
    }
    if (process.platform === "darwin") {
      return path.join(basePath, "app");
    }
    if (process.platform === "linux") {
      return path.join(basePath, "app");
    }
    return undefined;
  }

  private getBasePath(): string {
    const isDev = process.defaultApp || process.argv.includes("--dev");
    if (isDev) {
      // In development with ts-node, __dirname will be in src/
      return path.resolve(__dirname, "..");
    } else {
      // In production, __dirname will be in dist/
      return path.resolve(__dirname, "..");
    }
  }

  get appIcon(): string | undefined {
    const basePath = this.getBasePath();

    if (process.platform === "win32") {
      return path.join(basePath, "assets", "icon.ico");
    }
    if (process.platform === "darwin") {
      return path.join(basePath, "assets", "icon.png");
    }
    if (process.platform === "linux") {
      return path.join(basePath, "assets", "icon.png");
    }
    return undefined;
  }

  get trayIcon(): string | undefined {
    const basePath = this.getBasePath();

    if (process.platform === "win32") {
      return path.join(basePath, "assets", "icon.png");
    }
    if (process.platform === "darwin") {
      return path.join(basePath, "assets", "trayTemplate.png");
    }
    if (process.platform === "linux") {
      return path.join(basePath, "assets", "tray-icon-symbolic.png");
    }
    return undefined;
  }

  get trayIconBlack(): string | undefined {
    const basePath = this.getBasePath();

    if (process.platform === "linux") {
      return path.join(basePath, "assets", "tray-icon-dark.png");
    }
    return this.trayIcon;
  }

  get trayIconWhite(): string | undefined {
    const basePath = this.getBasePath();

    if (process.platform === "linux") {
      return path.join(basePath, "assets", "tray-icon.png");
    }
    return this.trayIcon;
  }

  get preload(): string | undefined {
    if (process.platform === "win32") {
      return path.join(__dirname, "..", "preload.js");
    }
    if (process.platform === "darwin") {
      return path.join(__dirname, "..", "preload.js");
    }
    if (process.platform === "linux") {
      return path.join(__dirname, "..", "preload.js");
    }
    return undefined;
  }

  get autostart(): string | undefined {
    if (process.platform === "win32") {
      return undefined;
    }
    if (process.platform === "darwin") {
      return undefined;
    }
    if (process.platform === "linux") {
      return path.join(app.getPath("home"), ".config", "autostart");
    }
    return undefined;
  }

  get temp(): string | undefined {
    if (process.platform === "win32") {
      return app.getPath("temp");
    }
    if (process.platform === "darwin") {
      return app.getPath("temp");
    }
    if (process.platform === "linux") {
      if (this.isFlatpak) {
        return undefined;
      }
      return app.getPath("temp");
    }
    return undefined;
  }

  get tests(): string | undefined {
    if (this.temp) {
      return path.join(this.temp, "mimiri-tests");
    }
    return undefined;
  }
}

export const pathInfo = new PathInfo();
