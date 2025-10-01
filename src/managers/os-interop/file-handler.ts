import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import Path from "path";

export interface FileData {
  path: string;
  isFolder: boolean;
  content: string; // base64 encoded
}

export class FileHandler {
  public async loadFile(filePaths: string[]): Promise<FileData[]> {
    const files: FileData[] = [];
    for (const filePath of filePaths) {
      const data = await readFile(filePath);
      const base64Data = data.toString("base64");
      const fileData: FileData = {
        path: Path.basename(filePath),
        isFolder: false,
        content: base64Data,
      };
      files.push(fileData);
    }
    return files;
  }

  public async saveFile(filePath: string, data: FileData): Promise<boolean> {
    const buffer = Buffer.from(data.content, "base64");
    await writeFile(filePath, buffer);
    return true;
  }

  private async recursiveReadDirectory(
    basePath: string,
    relativePath: string = ""
  ): Promise<FileData[]> {
    const results: FileData[] = [];
    const fullPath = Path.join(basePath, relativePath);

    try {
      const entries = await readdir(fullPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryRelativePath = relativePath
          ? Path.join(relativePath, entry.name)
          : entry.name;
        const entryFullPath = Path.join(fullPath, entry.name);

        const normalizedPath = entryRelativePath.split(Path.sep).join("/");

        if (entry.isDirectory()) {
          results.push({
            path: normalizedPath,
            isFolder: true,
            content: "",
          });

          const subResults = await this.recursiveReadDirectory(
            basePath,
            entryRelativePath
          );
          results.push(...subResults);
        } else if (entry.isFile()) {
          const data = await readFile(entryFullPath);
          const base64Data = data.toString("base64");

          results.push({
            path: normalizedPath,
            isFolder: false,
            content: base64Data,
          });
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${fullPath}:`, error);
    }

    return results;
  }

  public async loadFolder(filePaths: string[]): Promise<FileData[]> {
    const allFiles: FileData[] = [];

    for (const folderPath of filePaths) {
      const folderName = Path.basename(folderPath);

      allFiles.push({
        path: folderName,
        isFolder: true,
        content: "",
      });

      const contents = await this.recursiveReadDirectory(folderPath, "");

      for (const item of contents) {
        allFiles.push({
          path: `${folderName}/${item.path}`,
          isFolder: item.isFolder,
          content: item.content,
        });
      }
    }
    return allFiles;
  }

  public async saveFolder(path: string, data: FileData[]): Promise<boolean> {
    try {
      const normalizedBasePath = Path.resolve(path);

      const sortedData = [...data].sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return 0;
      });

      for (const item of sortedData) {
        const fullPath = Path.resolve(Path.join(path, item.path));

        const relativePath = Path.relative(normalizedBasePath, fullPath);
        if (relativePath.startsWith("..") || Path.isAbsolute(relativePath)) {
          console.error(
            `Security violation: Attempted to write outside base path: ${item.path}`
          );
          return false;
        }

        if (item.isFolder) {
          await mkdir(fullPath, { recursive: true });
        } else {
          const parentDir = Path.dirname(fullPath);
          await mkdir(parentDir, { recursive: true });

          const buffer = Buffer.from(item.content, "base64");
          await writeFile(fullPath, buffer);
        }
      }

      return true;
    } catch (error) {
      console.error(`Error saving folder to ${path}:`, error);
      return false;
    }
  }
}
