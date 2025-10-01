import { app, BrowserWindow } from "electron";
import * as path from "node:path";
import { pathInfo } from "../path-info";
import { OSInterop } from "./os-interop/os-interop";
import { mkdir, readFile, writeFile } from "node:fs/promises";

export interface Settings {
  openAtLogin?: boolean;
  titleBarColor?: string;
  titleBarSystemColor?: string;
  titleBarHeight?: number;
  showInTaskBar?: boolean;
  keepTrayIconVisible?: boolean;
  allowScreenSharing?: boolean;
  [key: string]: any;
}

export class SettingManager {
  private mainWindow: BrowserWindow;
  private _osInterop: OSInterop;

  constructor(mainWindow: BrowserWindow, osInterop: OSInterop) {
    this.mainWindow = mainWindow;
    this._osInterop = osInterop;
  }

  private async getPath(): Promise<string> {
    if (pathInfo.settings) {
      try {
        await mkdir(pathInfo.settings);
      } catch {}
      return path.join(pathInfo.settings, "settings.config");
    }
    return path.join(app.getPath("userData"), "settings.config");
  }

  async load(): Promise<Settings | undefined> {
    const settingPath = await this.getPath();
    try {
      let settings;
      try {
        settings = await readFile(settingPath);
      } catch {}
      if (settings) {
        const parsedSettings = JSON.parse(settings.toString());
        if (!this._osInterop.platformRules().startOnLoginRequiresApproval) {
          parsedSettings.openAtLogin =
            await this._osInterop.isStartOnLoginEnabled();
        }
        return parsedSettings;
      }
    } catch (ex) {
      console.log(ex);
    }
    return undefined;
  }

  async save(settings: Settings): Promise<void> {
    const settingPath = await this.getPath();
    if (this._osInterop.platformRules().startOnLoginRequiresApproval) {
      let oldSettings;
      try {
        oldSettings = await readFile(settingPath);
      } catch {}
      if (oldSettings) {
        const parsedSettings = JSON.parse(oldSettings.toString());
        if (parsedSettings.openAtLogin !== settings.openAtLogin) {
          try {
            settings.openAtLogin = await this._osInterop.setStartOnLogin(
              settings.openAtLogin || false
            );
          } catch (error) {
            console.error("Failed to set start on login:", error);
          }
        }
      }
    } else {
      const autoStart = settings.openAtLogin || false;
      if ((await this._osInterop.isStartOnLoginEnabled()) !== autoStart) {
        this._osInterop.setStartOnLogin(autoStart);
      }
      settings.openAtLogin = await this._osInterop.isStartOnLoginEnabled();
    }

    if (this.mainWindow.setTitleBarOverlay && settings.titleBarColor) {
      this.mainWindow.setTitleBarOverlay({
        color: settings.titleBarColor,
        symbolColor: settings.titleBarSystemColor,
        height: settings.titleBarHeight,
      });
    }

    this.mainWindow.setSkipTaskbar(!(settings.showInTaskBar ?? true));

    this._osInterop.keepTrayIconVisible(settings.keepTrayIconVisible || false);

    this.mainWindow.setContentProtection(!settings.allowScreenSharing);

    try {
      await writeFile(settingPath, JSON.stringify(settings, undefined, "  "));
    } catch (ex) {
      console.log(ex);
    }
  }
}
