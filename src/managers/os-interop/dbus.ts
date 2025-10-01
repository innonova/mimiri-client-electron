import dbus from "dbus-next";

export class DBus {
  private _bus: dbus.MessageBus | undefined;

  constructor() {
    try {
      if (!!process.env.FLATPAK_ID) {
        this._bus = dbus.sessionBus();
      }
    } catch (error) {
      console.error("Failed to initialize DBus:", error);
    }
  }

  private async backgroundInterface() {
    const proxyObject = await this._bus!.getProxyObject(
      "org.freedesktop.portal.Desktop",
      "/org/freedesktop/portal/desktop"
    );
    return proxyObject.getInterface("org.freedesktop.portal.Background");
  }

  private async propertiesInterface() {
    const proxyObject = await this._bus!.getProxyObject(
      "org.freedesktop.portal.Desktop",
      "/org/freedesktop/portal/desktop"
    );
    return proxyObject.getInterface("org.freedesktop.DBus.Properties");
  }

  private async fileChooserInterface() {
    const proxyObject = await this._bus!.getProxyObject(
      "org.freedesktop.portal.Desktop",
      "/org/freedesktop/portal/desktop"
    );
    return proxyObject.getInterface("org.freedesktop.portal.FileChooser");
  }

  private async expectResponse<T>(
    handlePath: string,
    portalName: string = "Portal"
  ): Promise<T> {
    const requestObject = await this._bus!.getProxyObject(
      "org.freedesktop.portal.Desktop",
      handlePath
    );
    const requestInterface = requestObject.getInterface(
      "org.freedesktop.portal.Request"
    );

    return new Promise<T>((resolve, reject) => {
      let timeoutId: NodeJS.Timeout;

      const responseHandler = (code: number, results: any) => {
        clearTimeout(timeoutId);
        requestInterface.removeListener("Response", responseHandler);

        // console.log(
        //   `${portalName} response:`,
        //   code,
        //   JSON.stringify(results, null, 2)
        // );
        if (code === 0) {
          resolve(results as T);
        } else {
          reject(new Error(`${portalName} request failed with code: ${code}`));
        }
      };

      requestInterface.on("Response", responseHandler);

      timeoutId = setTimeout(() => {
        requestInterface.removeListener("Response", responseHandler);
        reject(new Error(`${portalName} request timeout`));
      }, 30000);
    });
  }

  public async setAutoStart(enabled: boolean): Promise<boolean> {
    if (!this._bus) {
      throw new Error("DBus is not initialized or supported on this platform.");
    }
    const backgroundInterface = await this.backgroundInterface();
    const handlePath = await backgroundInterface.RequestBackground("", {
      reason: new dbus.Variant("s", "Start Mimiri Notes on login"),
      autostart: new dbus.Variant("b", enabled),
    });
    const response = await this.expectResponse<{
      background: {
        signature: string;
        value: boolean;
      };
      autostart: {
        signature: string;
        value: boolean;
      };
    }>(handlePath, "Background");
    return response.autostart.value;
  }

  public async loadFile(options?: {
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    multiple?: boolean;
  }): Promise<string[]> {
    if (!this._bus) {
      throw new Error("DBus is not initialized or supported on this platform.");
    }

    const fileChooserInterface = await this.fileChooserInterface();
    const filters: Array<[string, Array<[number, string]>]> = [];

    if (options?.filters) {
      for (const filter of options.filters) {
        const patterns: Array<[number, string]> = filter.extensions.map(
          (ext) => [0, `*.${ext}`]
        );
        filters.push([filter.name, patterns]);
      }
    }

    const handlePath = await fileChooserInterface.OpenFile(
      "",
      options?.title || "Open File",
      {
        filters: new dbus.Variant("a(sa(us))", filters),
        multiple: new dbus.Variant("b", options?.multiple || false),
      }
    );

    const results = await this.expectResponse<any>(handlePath, "FileChooser");
    return results.uris?.value || [];
  }

  public async saveFile(options?: {
    title?: string;
    defaultName?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }): Promise<string[]> {
    if (!this._bus) {
      throw new Error("DBus is not initialized or supported on this platform.");
    }

    const fileChooserInterface = await this.fileChooserInterface();
    const filters: Array<[string, Array<[number, string]>]> = [];

    if (options?.filters) {
      for (const filter of options.filters) {
        const patterns: Array<[number, string]> = filter.extensions.map(
          (ext) => [0, `*.${ext}`]
        );
        filters.push([filter.name, patterns]);
      }
    }

    const dbusOptions: any = {
      filters: new dbus.Variant("a(sa(us))", filters),
    };

    if (options?.defaultName) {
      dbusOptions.current_name = new dbus.Variant("s", options.defaultName);
    }

    const handlePath = await fileChooserInterface.SaveFile(
      "",
      options?.title || "Save File",
      dbusOptions
    );

    const results = await this.expectResponse<any>(handlePath, "FileChooser");
    return results.uris?.value || [];
  }

  public async chooseFolder(options?: {
    title?: string;
    multiple?: boolean;
  }): Promise<string[]> {
    if (!this._bus) {
      throw new Error("DBus is not initialized or supported on this platform.");
    }

    const fileChooserInterface = await this.fileChooserInterface();

    const handlePath = await fileChooserInterface.OpenFile(
      "",
      options?.title || "Choose Folder",
      {
        directory: new dbus.Variant("b", true),
        multiple: new dbus.Variant("b", options?.multiple || false),
      }
    );

    const results = await this.expectResponse<any>(handlePath, "FileChooser");
    return results.uris?.value || [];
  }

  public get supported(): boolean {
    return !!this._bus;
  }
}
