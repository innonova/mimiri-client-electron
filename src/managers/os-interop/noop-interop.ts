import { BrowserWindow } from "electron";
import { OSInterop, PlatformRules } from "./os-interop";
import { FileData } from "./file-handler";

export class NoopInterop implements OSInterop {
  private mainWindow!: BrowserWindow;

  public init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
  }

  public platformRules(): PlatformRules {
    return {
      startOnLoginRequiresApproval: false,
      canPreventScreenRecording: false,
      canKeepTrayIconVisible: false,
      needsTrayIconColorControl: false,
    };
  }

  public async setStartOnLogin(enabled: boolean): Promise<boolean> {
    return false;
  }

  public async isStartOnLoginEnabled(): Promise<boolean> {
    return false;
  }

  public async allowScreenRecording(enabled: boolean): Promise<void> {}

  public async isScreenRecordingAllowed(): Promise<boolean> {
    return true;
  }

  public async getTheme(): Promise<string> {
    return "light";
  }

  public async onThemeChanged(): Promise<void> {}

  public async keepTrayIconVisible(enabled: boolean): Promise<void> {}

  public isAutoStart(): boolean {
    return false;
  }

  public desktopEnvironment(): string {
    return "none";
  }

  public displayServer(): string {
    return "none";
  }

  public async loadFile(options?: {
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    multiple?: boolean;
  }): Promise<FileData[]> {
    return [];
  }

  public async saveFile(
    data: FileData,
    options?: {
      title?: string;
      defaultName?: string;
      filters?: Array<{ name: string; extensions: string[] }>;
    }
  ): Promise<boolean> {
    return false;
  }

  public async loadFolder(options?: {
    title?: string;
    multiple?: boolean;
  }): Promise<FileData[]> {
    return [];
  }

  public async saveFolder(
    data: FileData[],
    options?: {
      title?: string;
    }
  ): Promise<boolean> {
    return false;
  }
}
