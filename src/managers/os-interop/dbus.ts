// @ts-ignore
import dbus from "dbus-native";

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeoutId: NodeJS.Timeout;
  portalName: string;
}

interface BufferedMessage {
  path: string;
  code: number;
  results: any;
}

export class DBus {
  private _bus: any | undefined;
  private _pendingRequests: Map<string, PendingRequest> = new Map();
  private _bufferedMessages: BufferedMessage[] = [];

  constructor() {
    try {
      this._bus = dbus.sessionBus();
      if (this._bus) {
        console.log("DBus session bus connected");
        this._bus.connection.on("message", (msg: any) => {
          if (
            msg.type === 4 && // signal
            msg.member === "Response" &&
            msg.interface === "org.freedesktop.portal.Request"
          ) {
            const requestPath = msg.path;
            const [code, results] = msg.body;

            const pending = this._pendingRequests.get(requestPath);

            if (pending) {
              clearTimeout(pending.timeoutId);
              this._pendingRequests.delete(requestPath);

              console.log(
                `${pending.portalName} response:`,
                code,
                JSON.stringify(results, null, 2)
              );

              if (code === 0) {
                pending.resolve(results);
              } else {
                pending.reject(
                  new Error(
                    `${pending.portalName} request failed with code: ${code}`
                  )
                );
              }
            } else {
              this._bufferedMessages.push({ path: requestPath, code, results });
            }
          }
        });
      }
    } catch (error) {
      console.error("Failed to initialize DBus:", error);
    }
  }

  private getInterface(
    objectPath: string,
    interfaceName: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const service = this._bus!.getService("org.freedesktop.portal.Desktop");
      service.getInterface(
        objectPath,
        interfaceName,
        (err: any, iface: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(iface);
          }
        }
      );
    });
  }

  private expectResponse<T>(
    handlePath: string,
    portalName: string = "Portal"
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const bufferedIndex = this._bufferedMessages.findIndex(
        (msg) => msg.path === handlePath
      );

      if (bufferedIndex !== -1) {
        const buffered = this._bufferedMessages[bufferedIndex];
        this._bufferedMessages.splice(bufferedIndex, 1);

        console.log(
          `${portalName} response (from buffer):`,
          buffered.code,
          JSON.stringify(buffered.results, null, 2)
        );

        if (buffered.code === 0) {
          resolve(buffered.results as T);
        } else {
          reject(
            new Error(
              `${portalName} request failed with code: ${buffered.code}`
            )
          );
        }
        return;
      }

      const timeoutId = setTimeout(() => {
        this._pendingRequests.delete(handlePath);
        reject(new Error(`${portalName} request timeout`));
      }, 30000);

      this._pendingRequests.set(handlePath, {
        resolve,
        reject,
        timeoutId,
        portalName,
      });
    });
  }

  private getValue<T>(response: any, key: string): T | undefined {
    const entry = response.find((item: any) => item[0] === key);
    return entry ? entry[1][1][0] : undefined;
  }

  private getValues<T>(response: any, key: string): T[] {
    const entry = response.find((item: any) => item[0] === key);
    return entry ? entry[1][1][0] : [];
  }

  public async onThemeChanged(
    callback: (theme: "light" | "dark") => void
  ): Promise<void> {
    if (!this._bus) {
      throw new Error("DBus is not initialized or supported on this platform.");
    }
    const settingsInterface = await this.getInterface(
      "/org/freedesktop/portal/desktop",
      "org.freedesktop.portal.Settings"
    );

    settingsInterface.on(
      "SettingChanged",
      (namespace: string, key: string, value: any) => {
        if (
          namespace === "org.freedesktop.appearance" &&
          key === "color-scheme"
        ) {
          const themeValue = value[1][0] as number;
          if (themeValue === 1) {
            callback("dark");
          } else if (themeValue === 2) {
            callback("light");
          }
        }
      }
    );
  }

  public async getTheme(): Promise<"light" | "dark" | "error"> {
    if (!this._bus) {
      throw new Error("DBus is not initialized or supported on this platform.");
    }

    const settingsInterface = await this.getInterface(
      "/org/freedesktop/portal/desktop",
      "org.freedesktop.portal.Settings"
    );

    return new Promise((resolve, reject) => {
      settingsInterface.Read(
        "org.freedesktop.appearance",
        "color-scheme",
        (err: any, themeVariant: any) => {
          if (err) {
            reject(err);
            return;
          }
          const themeValue = themeVariant[1][0][1][0];
          if (themeValue === 1) {
            resolve("dark");
          } else if (themeValue === 2) {
            resolve("light");
          } else {
            resolve("error");
          }
        }
      );
    });
  }

  public async setAutoStart(enabled: boolean): Promise<boolean> {
    console.log("Setting autostart to", enabled);
    if (!this._bus) {
      throw new Error("DBus is not initialized or supported on this platform.");
    }

    const backgroundInterface = await this.getInterface(
      "/org/freedesktop/portal/desktop",
      "org.freedesktop.portal.Background"
    );

    return new Promise((resolve, reject) => {
      backgroundInterface.RequestBackground(
        "",
        [
          ["reason", ["s", "Start Mimiri Notes on login"]],
          ["autostart", ["b", enabled]],
        ],
        async (err: any, handlePath: string) => {
          if (err) {
            reject(err);
            return;
          }

          try {
            const response = await this.expectResponse<any>(
              handlePath,
              "Background"
            );
            resolve(this.getValue(response, "autostart") || false);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  public async loadFile(options?: {
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    multiple?: boolean;
  }): Promise<string[]> {
    if (!this._bus) {
      throw new Error("DBus is not initialized or supported on this platform.");
    }

    const fileChooserInterface = await this.getInterface(
      "/org/freedesktop/portal/desktop",
      "org.freedesktop.portal.FileChooser"
    );
    const filters: Array<[string, Array<[number, string]>]> = [];

    if (options?.filters) {
      for (const filter of options.filters) {
        const patterns: Array<[number, string]> = filter.extensions.map(
          (ext) => [0, `*.${ext}`]
        );
        filters.push([filter.name, patterns]);
      }
    }

    return new Promise((resolve, reject) => {
      fileChooserInterface.OpenFile(
        "",
        options?.title || "Open File",
        [
          ["filters", ["a(sa(us))", filters]],
          ["multiple", ["b", options?.multiple || false]],
        ],
        async (err: any, handlePath: string) => {
          if (err) {
            reject(err);
            return;
          }

          try {
            const results = await this.expectResponse<any>(
              handlePath,
              "FileChooser"
            );
            resolve(this.getValues(results, "uris"));
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  public async saveFile(options?: {
    title?: string;
    defaultName?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }): Promise<string[]> {
    if (!this._bus) {
      throw new Error("DBus is not initialized or supported on this platform.");
    }

    const fileChooserInterface = await this.getInterface(
      "/org/freedesktop/portal/desktop",
      "org.freedesktop.portal.FileChooser"
    );
    const filters: Array<[string, Array<[number, string]>]> = [];

    if (options?.filters) {
      for (const filter of options.filters) {
        const patterns: Array<[number, string]> = filter.extensions.map(
          (ext) => [0, `*.${ext}`]
        );
        filters.push([filter.name, patterns]);
      }
    }

    const dbusOptions: Array<[string, [string, any]]> = [
      ["filters", ["a(sa(us))", filters]],
    ];

    if (options?.defaultName) {
      dbusOptions.push(["current_name", ["s", options.defaultName]]);
    }

    return new Promise((resolve, reject) => {
      fileChooserInterface.SaveFile(
        "",
        options?.title || "Save File",
        dbusOptions,
        async (err: any, handlePath: string) => {
          if (err) {
            reject(err);
            return;
          }

          try {
            const results = await this.expectResponse<any>(
              handlePath,
              "FileChooser"
            );
            resolve(this.getValue(results, "uris") || []);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  public async chooseFolder(options?: {
    title?: string;
    multiple?: boolean;
  }): Promise<string[]> {
    if (!this._bus) {
      throw new Error("DBus is not initialized or supported on this platform.");
    }

    const fileChooserInterface = await this.getInterface(
      "/org/freedesktop/portal/desktop",
      "org.freedesktop.portal.FileChooser"
    );

    return new Promise((resolve, reject) => {
      fileChooserInterface.OpenFile(
        "",
        options?.title || "Choose Folder",
        [
          ["directory", ["b", true]],
          ["multiple", ["b", options?.multiple || false]],
        ],
        async (err: any, handlePath: string) => {
          if (err) {
            reject(err);
            return;
          }

          try {
            const results = await this.expectResponse<any>(
              handlePath,
              "FileChooser"
            );
            resolve(this.getValues(results, "uris"));
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  public get supported(): boolean {
    return !!this._bus;
  }
}
