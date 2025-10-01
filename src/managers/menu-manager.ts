import { app, Menu, Tray, BrowserWindow, MenuItem } from "electron";
import { pathInfo } from "../path-info";

export interface MenuItemConfig {
  title: string;
  id: string;
  type?: "normal" | "separator" | "submenu" | "checkbox" | "radio";
  checked?: boolean;
  enabled?: boolean;
  shortcut?: string;
  submenu?: MenuItemConfig[];
}

export interface AppMenuConfig {
  title: string;
  submenu?: MenuItemConfig[];
}

export interface TrayColors {
  trayIcon?: "black" | "white" | "default";
}

export class MenuManager {
  private ipcClient: any; // Will type this properly when we fully convert MimerIpcClient
  private mainWindow?: BrowserWindow;
  private tray?: Tray;

  constructor(ipcClient: any) {
    this.ipcClient = ipcClient;
  }

  init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
  }

  appReady(): void {
    if (!pathInfo.trayIcon) {
      console.error("Tray icon path not available");
      return;
    }

    console.log("pathInfo.trayIcon", pathInfo.trayIcon);

    this.tray = new Tray(pathInfo.trayIcon);

    console.log("tray created", this.tray);

    const trayContextMenu = Menu.buildFromTemplate([
      {
        role: "quit",
        click: () => {
          app.quit();
        },
      },
    ]);

    this.tray.setToolTip("Mimiri Notes");
    this.tray.setContextMenu(trayContextMenu);

    this.tray.on("double-click", () => {
      this.ipcClient.menuItemActivated("tray-double-click");
    });

    this.tray.on("click", () => {
      this.ipcClient.menuItemActivated("tray-click");
    });
    console.log("tray initialized");
  }

  setAppMenu(value: AppMenuConfig[] | null): void {
    if (value) {
      const menu = Menu.buildFromTemplate(
        value.map((item) => ({
          label: item.title,
          submenu: item.submenu?.map((sub) => ({
            label: sub.title,
            type: sub.type || "normal",
            checked: sub.checked,
            enabled: sub.enabled,
            accelerator: sub.shortcut?.replace(/Ctrl/, "CommandOrControl"),
            click: () => {
              if (sub.id === "quit") {
                app.quit();
              } else if (sub.id === "show-dev-tools") {
                if (this.mainWindow) {
                  this.mainWindow.webContents.openDevTools();
                }
              } else {
                this.ipcClient.menuItemActivated(sub.id);
              }
            },
          })),
        }))
      );
      Menu.setApplicationMenu(menu);
    } else {
      Menu.setApplicationMenu(null);
    }
  }

  setTrayMenu(value: MenuItemConfig[] | null, colors: TrayColors): void {
    if (!this.tray) {
      console.error("Tray not initialized");
      return;
    }

    if (value) {
      // Set tray icon based on color preference
      if (colors.trayIcon === "black" && pathInfo.trayIconBlack) {
        this.tray.setImage(pathInfo.trayIconBlack);
      } else if (colors.trayIcon === "white" && pathInfo.trayIconWhite) {
        this.tray.setImage(pathInfo.trayIconWhite);
      } else if (pathInfo.trayIcon) {
        this.tray.setImage(pathInfo.trayIcon);
      }

      const menu = Menu.buildFromTemplate(
        value.map((item) => ({
          label: item.title,
          type: item.type || "normal",
          checked: item.checked,
          enabled: item.enabled,
          click: () => {
            try {
              this.ipcClient.menuItemActivated(item.id);
            } catch (ex) {
              console.error("Menu item activation failed:", ex);
              app.quit();
            }
          },
        }))
      );

      this.tray.setContextMenu(menu);
    } else {
      this.tray.setContextMenu(null);
    }
  }

  // Method to handle menu item activation from other parts of the app
  menuItemActivated(menuItemId: string): void {
    // This can be extended based on specific menu item handling needs
    console.log(`Menu item activated: ${menuItemId}`);

    // Handle common menu actions
    switch (menuItemId) {
      case "show":
        if (this.mainWindow) {
          this.mainWindow.show();
          if (this.mainWindow.isMinimized()) {
            this.mainWindow.restore();
          }
          this.mainWindow.focus();
        }
        break;
      case "hide":
        if (this.mainWindow) {
          this.mainWindow.hide();
        }
        break;
      case "quit":
        app.quit();
        break;
      default:
        // Forward to main window if it exists
        if (this.mainWindow) {
          this.mainWindow.webContents.send("menu-item-activated", menuItemId);
        }
    }
  }
}
