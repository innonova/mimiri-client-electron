import { BrowserWindow } from "electron";
import { FileData } from "./file-handler";

export interface PlatformRules {
  startOnLoginRequiresApproval: boolean;
  canPreventScreenRecording: boolean;
  canKeepTrayIconVisible: boolean;
  needsTrayIconColorControl: boolean;
}

export interface OSInterop {
  init(mainWindow: BrowserWindow): void;
  platformRules(): PlatformRules;
  setStartOnLogin(enabled: boolean): Promise<boolean>;
  isStartOnLoginEnabled(): Promise<boolean>;
  allowScreenRecording(enabled: boolean): Promise<void>;
  isScreenRecordingAllowed(): Promise<boolean>;
  keepTrayIconVisible(enabled: boolean): Promise<void>;
  getTheme(): Promise<string>;
  onThemeChanged(callback: (theme: "light" | "dark") => void): Promise<void>;
  isAutoStart(): boolean;
  loadFile(options?: {
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    multiple?: boolean;
  }): Promise<FileData[]>;
  saveFile(
    data: FileData,
    options?: {
      title?: string;
      defaultName?: string;
      filters?: Array<{ name: string; extensions: string[] }>;
    }
  ): Promise<boolean>;
  loadFolder(options?: {
    title?: string;
    multiple?: boolean;
  }): Promise<FileData[]>;
  saveFolder(data: FileData[], options?: { title?: string }): Promise<boolean>;
}
