import { app, BrowserWindow, session, shell } from "electron";
import { MimerIpcClient } from "./managers/mimer-ipc-client";
import { pathInfo } from "./path-info";
import { OSInterop } from "./managers/os-interop/os-interop";
import { WindowsInterop } from "./managers/os-interop/windows-interop";
import { LinuxInterop } from "./managers/os-interop/linux-interop";
import { MacOSInterop } from "./managers/os-interop/macos-interop";
import { NoopInterop } from "./managers/os-interop/noop-interop";

// Check for squirrel startup and exit early if needed
if (require("electron-squirrel-startup")) {
  app.quit();
}

console.log(process.env);


const devMode: boolean = !!process.defaultApp;

const gotTheLock: boolean = devMode ? true : app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  const host: string = devMode
    ? "https://app-dev-aek.mimiri.io/"
    : "app://app.mimernotes.com/";
  const hostName: string = devMode
    ? "app-dev-aek.mimiri.io"
    : "app.mimernotes.com";
  // const host = devMode ? 'http://localhost:5173/' : 'app://app.mimernotes.com/'
  // const hostName = devMode ? 'localhost:5173' : 'app.mimernotes.com'
  const startUrl: string = `${host}index.html`;

  // console.log(startUrl);

  const osInterop: OSInterop = // new NoopInterop();
    process.platform === "linux"
      ? new LinuxInterop()
      : process.platform === "win32"
      ? new WindowsInterop()
      : new MacOSInterop();

  // console.log("Platform:", process.platform);

  const mimerIpcClient = new MimerIpcClient(hostName, devMode);
  let mainWindow: BrowserWindow | undefined = undefined;
  let isAppQuitting: boolean = false;

  app.on("second-instance", (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      mainWindow.show();
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  const createWindow = (): void => {
    const show: boolean = !osInterop.isAutoStart();
    mainWindow = new BrowserWindow({
      width: 800,
      height: 700,
      transparent: process.platform === "linux",
      frame: process.platform !== "linux",
      icon: pathInfo.appIcon,
      backgroundColor: process.platform !== "linux" ? "#555" : undefined,
      titleBarStyle: "hidden",
      titleBarOverlay: {
        color: "#323233",
        symbolColor: "#8E8E8E",
        height: 36,
      },
      show,
      webPreferences: {
        partition: devMode ? "persist:development" : undefined,
        preload: pathInfo.preload,
      },
    });

    mainWindow.on("close", (evt) => {
      if (!isAppQuitting) {
        evt.preventDefault();
        if (
          mainWindow &&
          (mainWindow.webContents.getURL().startsWith("chrome-error") ||
            !mimerIpcClient.watchDog.isOk)
        ) {
          app.quit();
        }
        mimerIpcClient.menuItemActivated("hide");
        // new Notification({
        //   title: 'Test',
        //   body: 'Test',
        //   // icon: pathInfo.notificationIcon,
        // }).show()
      }
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: "deny" };
    });

    if (devMode) {
      //mainWindow.webContents.openDevTools();
    }
    mainWindow.loadURL(startUrl);
    // win.loadFile('index.html')
  };

  app.whenReady().then(() => {
    if (process.platform === "win32" && process.defaultApp) {
      app.setAppUserModelId(app.name);
    }

    app.on("before-quit", (evt) => {
      isAppQuitting = true;
    });

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": `script-src 'self' ${host}`,
        },
      });
    });

    mimerIpcClient.appReady();

    createWindow();

    if (mainWindow) {
      osInterop.init(mainWindow);
      mimerIpcClient.init(mainWindow, osInterop, startUrl);
    }

    app.on("activate", () => {
      // if (BrowserWindow.getAllWindows().length === 0) createWindow()
    });
  });
}
