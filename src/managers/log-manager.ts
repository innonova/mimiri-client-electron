import path from "path";
import { pathInfo } from "../path-info";
import { appendFile } from "fs/promises";

export class LogManager {
  private _logFilePath: string | undefined;

  constructor() {
    if (pathInfo.settings) {
      this._logFilePath = path.join(pathInfo.settings, "mimiri.log");
      process.on("uncaughtException", (error) => {
        this.log(`Uncaught Exception: ${error.message}\n${error.stack}`);
      });
      process.on("unhandledRejection", (reason, promise) => {
        this.log(`Unhandled Rejection at: ${promise}\nReason: ${reason}`);
      });
    }
  }

  public async log(message: string): Promise<void> {
    try {
      if (this._logFilePath) {
        const logMessage = `[${new Date().toISOString()}] ${message}\n`;
        await appendFile(this._logFilePath, logMessage);
      }
    } catch (e) {
      console.error("Failed to write log:", e);
    }
  }
}
