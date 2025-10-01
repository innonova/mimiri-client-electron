import { BrowserWindow } from "electron";

interface WindowSize {
  width: number;
  height: number;
}

export class WindowManager {
  private ipcClient: any;
  private mainWindow?: BrowserWindow;

  constructor(ipcClient: any) {
    this.ipcClient = ipcClient;
  }

  init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
  }

  setMainWindowSize(value: WindowSize): void {
    if (this.mainWindow) {
      this.mainWindow.setSize(value.width, value.height);
    }
  }

  getMainWindowSize(): WindowSize | null {
    if (this.mainWindow) {
      const [width, height] = this.mainWindow.getSize();
      return { width, height };
    }
    return null;
  }
}
