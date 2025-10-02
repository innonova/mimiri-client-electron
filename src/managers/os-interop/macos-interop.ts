import { app, BrowserWindow, dialog, nativeTheme } from "electron";
import { OSInterop, PlatformRules } from "./os-interop";
import { FileData, FileHandler } from "./file-handler";

export class MacOSInterop implements OSInterop {
  private mainWindow!: BrowserWindow;
  private _fileHandler: FileHandler = new FileHandler();

  public init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
  }

  public platformRules(): PlatformRules {
    return {
      startOnLoginRequiresApproval: false,
      canPreventScreenRecording: true,
      canKeepTrayIconVisible: false,
      needsTrayIconColorControl: false,
    };
  }

  public async setStartOnLogin(enabled: boolean): Promise<boolean> {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      enabled: enabled,
      args: ["--autostart"],
    });
    return enabled;
  }

  public async isStartOnLoginEnabled(): Promise<boolean> {
    const loginSettings = app.getLoginItemSettings({
      args: ["--autostart"],
    });
    return loginSettings.openAtLogin;
  }

  public async allowScreenRecording(enabled: boolean): Promise<void> {
    this.mainWindow.setContentProtection(!enabled);
  }

  public async isScreenRecordingAllowed(): Promise<boolean> {
    return !this.mainWindow.isContentProtected();
  }

  public async keepTrayIconVisible(enabled: boolean): Promise<void> {}

  public async getTheme(): Promise<string> {
    if (nativeTheme.shouldUseDarkColors) {
      return "dark";
    } else {
      return "light";
    }
  }

  public async onThemeChanged(
    callback: (theme: "light" | "dark") => void
  ): Promise<void> {
    nativeTheme.on("updated", () => {
      callback(nativeTheme.shouldUseDarkColors ? "dark" : "light");
    });
  }

  public isAutoStart(): boolean {
    const loginSettings = app.getLoginItemSettings();
    return loginSettings.wasOpenedAtLogin;
  }

  public async loadFile(options?: {
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    multiple?: boolean;
  }): Promise<FileData[]> {
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

    if (result.canceled) {
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
    const result = await dialog.showOpenDialog(this.mainWindow, {
      title: options?.title,
      properties: options?.multiple
        ? ["openDirectory", "multiSelections"]
        : ["openDirectory"],
    });

    if (result.canceled) {
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
    const result = await dialog.showOpenDialog(this.mainWindow, {
      title: options?.title,
      properties: ["openDirectory"],
    });

    if (result.canceled || !result.filePaths[0]) {
      return false;
    }
    return this._fileHandler.saveFolder(result.filePaths[0], data);
  }
}
