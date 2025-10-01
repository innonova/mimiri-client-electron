import { app, ipcMain, BrowserWindow } from "electron";
import { SettingManager } from "./settings-manager";
import { MenuManager } from "./menu-manager";
import { WindowManager } from "./window-manager";
import { WatchDog } from "./watch-dog";
import { BundleManager } from "./bundle-manager";
import { OSInterop } from "./os-interop/os-interop";

export class MimerIpcClient {
  public host: string;
  private bundleManager: BundleManager;
  private menuManager: MenuManager;
  private windowManager: WindowManager;
  public watchDog: WatchDog;
  private session: any;
  private mainWindow?: BrowserWindow;
  private settingsManager?: SettingManager;
  private _osInterop?: OSInterop;

  constructor(host: string, devMode: boolean) {
    this.host = host;
    this.bundleManager = new BundleManager(devMode);
    this.menuManager = new MenuManager(this);
    this.windowManager = new WindowManager(this);
    this.watchDog = new WatchDog();
    this.session = {};
  }

  validateSender(frame: any): boolean {
    try {
      if (new URL(frame.url).host === this.host) return true;
    } catch (e) {
      // Invalid URL
    }
    console.log("Sender Rejected", frame.url);
    return false;
  }

  appReady(): void {
    this.bundleManager.appReady();
    this.menuManager.appReady();
  }

  init(
    mainWindow: BrowserWindow,
    osInterop: OSInterop,
    startUrl: string
  ): void {
    this.mainWindow = mainWindow;
    this._osInterop = osInterop;
    this.settingsManager = new SettingManager(mainWindow, osInterop);

    this.bundleManager.init(mainWindow);
    this.windowManager.init(mainWindow);
    this.menuManager.init(mainWindow);
    this.watchDog.init(startUrl, mainWindow);

    this.setupIpcHandlers();
  }

  menuItemActivated(menuItemId: string): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send("menu-item-activated", menuItemId);
    }
  }

  toggleScreenSharing(): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send("toggle-screen-sharing");
    }
  }

  toggleOpenAtLogin(): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send("toggle-open-at-login");
    }
  }

  private setupIpcHandlers(): void {
    ipcMain.on("menu-quit", (e) => {
      if (!this.validateSender(e.senderFrame)) return;
      app.quit();
    });

    ipcMain.on("menu-show-dev-tools", (e) => {
      if (!this.validateSender(e.senderFrame)) return;
      if (this.mainWindow) {
        this.mainWindow.webContents.openDevTools();
      }
    });

    ipcMain.on("menu-show", (e) => {
      if (!this.validateSender(e.senderFrame)) return;
      if (this.mainWindow) {
        this.mainWindow.show();
      }
    });

    ipcMain.on("menu-hide", (e) => {
      if (!this.validateSender(e.senderFrame)) return;
      if (this.mainWindow) {
        this.mainWindow.hide();
      }
    });

    ipcMain.handle("settings-load", (e) => {
      if (!this.validateSender(e.senderFrame)) return null;
      return this.settingsManager?.load();
    });

    ipcMain.on("settings-save", (e, value) => {
      if (!this.validateSender(e.senderFrame)) return;
      return this.settingsManager?.save(value);
    });

    ipcMain.handle("bundle-get-installed-versions", (e) => {
      if (!this.validateSender(e.senderFrame)) return null;
      return this.bundleManager.getInstalledVersions();
    });

    ipcMain.handle("bundle-save", (e, version, bundle) => {
      if (!this.validateSender(e.senderFrame)) return;
      return this.bundleManager.save(version, bundle);
    });

    ipcMain.on("bundle-use", (e, version, noActivate) => {
      if (!this.validateSender(e.senderFrame)) return;
      return this.bundleManager.use(version, this.mainWindow!, noActivate);
    });

    ipcMain.on("bundle-activate", (e) => {
      if (!this.validateSender(e.senderFrame)) return;
      return this.bundleManager.activate(this.mainWindow!);
    });

    ipcMain.on("bundle-delete", (e, version) => {
      if (!this.validateSender(e.senderFrame)) return;
      return this.bundleManager.delete(version);
    });

    ipcMain.on("bundle-good", (e, version) => {
      if (!this.validateSender(e.senderFrame)) return;
      return this.bundleManager.good(version);
    });

    ipcMain.on("bundle-save-electron-update", (e, release, data) => {
      if (!this.validateSender(e.senderFrame)) return;
      return this.bundleManager.saveElectronUpdate(release, data);
    });

    ipcMain.on("bundle-update-electron", (e, noRestart) => {
      if (!this.validateSender(e.senderFrame)) return;
      return this.bundleManager.updateElectron(noRestart);
    });

    ipcMain.on("set-app-menu", (e, value) => {
      if (!this.validateSender(e.senderFrame)) return;
      this.menuManager.setAppMenu(value);
    });

    ipcMain.on("set-tray-menu", (e, value, colors) => {
      if (!this.validateSender(e.senderFrame)) return;
      this.menuManager.setTrayMenu(value, colors);
    });

    ipcMain.on("window-set-size", (e, value) => {
      if (!this.validateSender(e.senderFrame)) return;
      this.windowManager.setMainWindowSize(value);
    });

    ipcMain.handle("window-get-size", (e) => {
      if (!this.validateSender(e.senderFrame)) return;
      return this.windowManager.getMainWindowSize();
    });

    ipcMain.handle("window-get-is-visible", (e) => {
      if (!this.validateSender(e.senderFrame)) return;
      return this.mainWindow?.isVisible();
    });

    ipcMain.on("watch-dog-ok", (e) => {
      if (!this.validateSender(e.senderFrame)) return;
      this.watchDog.ok();
    });

    ipcMain.handle("session-set-value", (e, name, value) => {
      if (!this.validateSender(e.senderFrame)) return;
      return (this.session[name] = value);
    });

    ipcMain.handle("session-get-value", (e, name) => {
      if (!this.validateSender(e.senderFrame)) return;
      return this.session[name];
    });

    ipcMain.handle("filesystem-load-file", (e, options) => {
      if (!this.validateSender(e.senderFrame)) return;
      return this._osInterop?.loadFile(options);
    });

    ipcMain.handle("filesystem-save-file", (e, data, options) => {
      if (!this.validateSender(e.senderFrame)) return;
      return this._osInterop?.saveFile(data, options);
    });

    ipcMain.handle("filesystem-load-folder", (e, options) => {
      if (!this.validateSender(e.senderFrame)) return;
      return this._osInterop?.loadFolder(options);
    });

    ipcMain.handle("filesystem-save-folder", (e, data, options) => {
      if (!this.validateSender(e.senderFrame)) return;
      return this._osInterop?.saveFolder(data, options);
    });

    ipcMain.handle("os-set-autostart", (e, enabled) => {
      if (!this.validateSender(e.senderFrame)) return;
      return this._osInterop?.setStartOnLogin(enabled);
    });

    ipcMain.handle("os-get-autostart", (e) => {
      if (!this.validateSender(e.senderFrame)) return;
      return this._osInterop?.isAutoStart();
    });

    ipcMain.handle("os-rules", (e) => {
      if (!this.validateSender(e.senderFrame)) return;
      return this._osInterop?.platformRules();
    });
  }
}
