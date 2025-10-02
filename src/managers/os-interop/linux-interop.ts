import { pathInfo } from "../../path-info";
import { OSInterop, PlatformRules } from "./os-interop";
import path from "path";
import { chmod, mkdir, rm, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { BrowserWindow, dialog, nativeTheme } from "electron";
import { FileData, FileHandler } from "./file-handler";
import { DBus } from "./dbus";

export class LinuxInterop implements OSInterop {
  private mainWindow!: BrowserWindow;
  private _fileHandler: FileHandler = new FileHandler();
  private _dbus: DBus = new DBus();
  private _rules: PlatformRules = {
    startOnLoginRequiresApproval: !!process.env.FLATPAK_ID,
    canPreventScreenRecording: false,
    canKeepTrayIconVisible: false,
    needsTrayIconColorControl: true,
  };

  public init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
  }

  public platformRules(): PlatformRules {
    return this._rules;
  }

  private async enableStartOnLogin(): Promise<boolean> {
    if (this._dbus.supported) {
      try {
        return await this._dbus.setAutoStart(true);
      } catch (error) {
        console.error("Failed to enable start on login via portal:", error);
        throw error;
      }
    } else {
      try {
        if (pathInfo.autostart) {
          await mkdir(pathInfo.autostart);
        }
      } catch {}

      if (pathInfo.autostart) {
        const autostart = path.join(pathInfo.autostart, "mimiri-notes.desktop");
        let desktop = "";

        if (pathInfo.isSnap) {
          desktop = `[Desktop Entry]
Type=Application
Name=Mimiri Notes
Terminal=false
Exec=/usr/bin/mimiri-notes --autostart
`;
        } else if (pathInfo.isFlatpak) {
          desktop = `[Desktop Entry]
Type=Application
Name=Mimiri Notes
Terminal=false
Exec=flatpak run io.mimiri.notes --autostart
`;
        } else if (pathInfo.isAppImage) {
          desktop = `[Desktop Entry]
Type=Application
Terminal=false
Name=Mimiri Notes
StartupWMClass=mimiri-notes
Exec=${process.env.APPIMAGE} --no-sandbox --autostart
`;
        } else {
          desktop = `[Desktop Entry]
Type=Application
Terminal=false
Name=Mimiri Notes
StartupWMClass=mimiri-notes
Exec=sh ${path.join(process.cwd(), "autostart.sh")}
`;
          try {
            await chmod(path.join(process.cwd(), "autostart.sh"), 0o755);
          } catch {}
        }

        if (desktop) {
          try {
            await writeFile(autostart, desktop);
            await chmod(autostart, 0o755);
            return true;
          } catch (ex) {
            console.log(ex);
          }
        }
      }
    }
    return false;
  }

  private async disableStartOnLogin(): Promise<boolean> {
    if (this._dbus.supported) {
      try {
        return await this._dbus.setAutoStart(false);
      } catch (error) {
        console.error("Failed to enable start on login via portal:", error);
        throw error;
      }
    } else {
      if (pathInfo.autostart) {
        const autostart = path.join(pathInfo.autostart, "mimiri-notes.desktop");
        try {
          await rm(autostart);
        } catch {}
      }
      return false;
    }
  }

  public async setStartOnLogin(enabled: boolean): Promise<boolean> {
    if (enabled) {
      return await this.enableStartOnLogin();
    } else {
      return await this.disableStartOnLogin();
    }
  }

  public async isStartOnLoginEnabled(): Promise<boolean> {
    if (this._rules.startOnLoginRequiresApproval && this._dbus.supported) {
      throw new Error(
        "Cannot determine start on login status when approval is required."
      );
    } else {
      if (pathInfo.autostart) {
        const autostart = path.join(pathInfo.autostart, "mimiri-notes.desktop");
        return existsSync(autostart);
      }
    }
    return false;
  }

  public async getTheme(): Promise<string> {
    if (this._dbus.supported) {
      try {
        return await this._dbus.getTheme();
      } catch (error) {
        console.error("Failed to get theme via portal:", error);
      }
    }
    if (nativeTheme.shouldUseDarkColors) {
      return "dark";
    } else {
      return "light";
    }
  }

  public async onThemeChanged(
    callback: (theme: "light" | "dark") => void
  ): Promise<void> {
    if (this._dbus.supported) {
      this._dbus.onThemeChanged((theme: string) => {
        callback(theme === "dark" ? "dark" : "light");
      });
    } else {
      nativeTheme.on("updated", () => {
        callback(nativeTheme.shouldUseDarkColors ? "dark" : "light");
      });
    }
  }

  public async allowScreenRecording(enabled: boolean): Promise<void> {}

  public async isScreenRecordingAllowed(): Promise<boolean> {
    return true;
  }

  public async keepTrayIconVisible(enabled: boolean): Promise<void> {}

  public isAutoStart(): boolean {
    return (
      process.argv.includes("--autostart") ||
      !!process.env.DESKTOP_AUTOSTART_ID ||
      !!process.env.XDP_AUTOSTART_ID ||
      !!process.env.MEMORY_PRESSURE_WATCH?.includes("autostart")
    );
  }

  public async loadFile(options?: {
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    multiple?: boolean;
  }): Promise<FileData[]> {
    if (this._dbus.supported) {
      try {
        const files = await this._dbus.loadFile(options);
        if (files.length === 0) {
          return [];
        }
        return this._fileHandler.loadFile(
          files.map((f) => f.replace("file://", ""))
        );
      } catch (error) {
        console.error(
          "Failed to load file via portal, falling back to Electron dialog:",
          error
        );
      }
    }

    const result = await dialog.showOpenDialog(this.mainWindow, {
      title: options?.title,
      filters: options?.filters?.map((f) => ({
        name: f.name,
        extensions: f.extensions,
      })),
      properties: options?.multiple
        ? ["openFile", "multiSelections"]
        : ["openFile"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return [];
    }
    return this._fileHandler.loadFile(result.filePaths);
  }

  public async saveFile(
    data: FileData,
    options?: {
      title?: string;
      defaultName?: string;
      filters?: Array<{ name: string; extensions: string[] }>;
    }
  ): Promise<boolean> {
    if (this._dbus.supported) {
      try {
        const files = await this._dbus.saveFile(options);
        if (files.length === 0) {
          return false;
        }
        return this._fileHandler.saveFile(
          files[0].replace("file://", ""),
          data
        );
      } catch (error) {
        console.error(
          "Failed to save file via portal, falling back to Electron dialog:",
          error
        );
      }
    }

    const result = await dialog.showSaveDialog(this.mainWindow, {
      title: options?.title,
      defaultPath: options?.defaultName,
      filters: options?.filters?.map((f) => ({
        name: f.name,
        extensions: f.extensions,
      })),
    });

    if (result.canceled || !result.filePath) {
      return false;
    }
    return this._fileHandler.saveFile(result.filePath, data);
  }

  public async loadFolder(options?: {
    title?: string;
    multiple?: boolean;
  }): Promise<FileData[]> {
    if (this._dbus.supported) {
      try {
        const folders = await this._dbus.chooseFolder(options);
        if (folders.length === 0) {
          return [];
        }
        return this._fileHandler.loadFolder(
          folders.map((f) => f.replace("file://", ""))
        );
      } catch (error) {
        console.error(
          "Failed to choose folder via portal, falling back to Electron dialog:",
          error
        );
      }
    }

    const result = await dialog.showOpenDialog(this.mainWindow, {
      title: options?.title,
      properties: options?.multiple
        ? ["openDirectory", "multiSelections"]
        : ["openDirectory"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return [];
    }

    return this._fileHandler.loadFolder(result.filePaths);
  }

  public async saveFolder(
    data: FileData[],
    options?: {
      title?: string;
    }
  ): Promise<boolean> {
    if (this._dbus.supported) {
      try {
        const folders = await this._dbus.chooseFolder({
          ...options,
          multiple: false,
        });
        if (folders.length === 0) {
          return false;
        }
        return this._fileHandler.saveFolder(
          folders[0].replace("file://", ""),
          data
        );
      } catch (error) {
        console.error(
          "Failed to choose folder via portal, falling back to Electron dialog:",
          error
        );
      }
    }

    const result = await dialog.showOpenDialog(this.mainWindow, {
      title: options?.title,
      properties: ["openDirectory"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return false;
    }
    return this._fileHandler.saveFolder(result.filePaths[0], data);
  }
}
