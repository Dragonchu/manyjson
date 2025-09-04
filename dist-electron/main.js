"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const isDev = process.env.NODE_ENV === "development";
function logInfo(message, ...args) {
  console.log(`[INFO] ${(/* @__PURE__ */ new Date()).toISOString()} - ${message}`, ...args);
}
function logError(message, error) {
  console.error(`[ERROR] ${(/* @__PURE__ */ new Date()).toISOString()} - ${message}`, error);
}
function logDebug(message, ...args) {
  if (isDev) {
    console.log(`[DEBUG] ${(/* @__PURE__ */ new Date()).toISOString()} - ${message}`, ...args);
  }
}
function validateFilename(filename) {
  if (!filename || typeof filename !== "string") {
    return { isValid: false, error: "Filename is required and must be a string" };
  }
  const trimmedFilename = filename.trim();
  if (!trimmedFilename) {
    return { isValid: false, error: "Filename cannot be empty" };
  }
  if (trimmedFilename.includes("..") || trimmedFilename.includes("/") || trimmedFilename.includes("\\")) {
    return { isValid: false, error: "Filename cannot contain path separators or relative path references" };
  }
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
  if (invalidChars.test(trimmedFilename)) {
    return { isValid: false, error: "Filename contains invalid characters" };
  }
  if (Buffer.byteLength(trimmedFilename, "utf8") > 255) {
    return { isValid: false, error: "Filename is too long" };
  }
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
  if (reservedNames.test(trimmedFilename)) {
    return { isValid: false, error: "Filename uses a reserved name" };
  }
  return { isValid: true };
}
async function ensureConfigDirectoryWithRetry(maxRetries = 3) {
  const configDir = getConfigDirectory();
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logDebug(`Ensuring config directory exists (attempt ${attempt}/${maxRetries}):`, configDir);
      try {
        await fs.promises.access(configDir, fs.constants.F_OK);
        logDebug("Config directory already exists");
      } catch (error) {
        logInfo("Creating config directory:", configDir);
        await fs.promises.mkdir(configDir, { recursive: true });
        logInfo("Config directory created successfully");
      }
      try {
        await fs.promises.access(configDir, fs.constants.W_OK);
        logDebug("Config directory is writable");
        return configDir;
      } catch (error) {
        logError("Config directory is not writable", error);
        throw new Error(`Config directory is not writable: ${configDir}`);
      }
    } catch (error) {
      logError(`Failed to create or access config directory (attempt ${attempt}/${maxRetries})`, error);
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
    }
  }
  throw new Error("Failed to ensure config directory after all retries");
}
function createMainWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1e3,
    minHeight: 700,
    title: "ManyJson - JSON Schema Manager",
    backgroundColor: electron.nativeTheme.shouldUseDarkColors ? "#0a0a0a" : "#ffffff",
    webPreferences: {
      // 使用 preload 注入安全的 API，而非直接开启 nodeIntegration
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  });
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    const htmlPath = path.join(__dirname, "../dist/index.html");
    logInfo("Loading HTML file from:", htmlPath);
    mainWindow.loadFile(htmlPath).catch((error) => {
      logError("Failed to load HTML file", { htmlPath, error });
      mainWindow.webContents.openDevTools();
    });
  }
  return mainWindow;
}
function getConfigDirectory() {
  const userDataPath = electron.app.getPath("userData");
  const configDir = path.join(userDataPath, "schemas");
  logDebug("Config directory path:", configDir);
  return configDir;
}
async function ensureConfigDirectory() {
  return ensureConfigDirectoryWithRetry();
}
electron.ipcMain.handle("read-file-sync", async (event, filename) => {
  logInfo("IPC: read-file-sync called", { filename });
  try {
    const content = await fs.promises.readFile(filename, "utf-8");
    const parsedContent = JSON.parse(content);
    logInfo("File read successfully", { filename, contentLength: content.length });
    return parsedContent;
  } catch (error) {
    logError("Failed to read file", { filename, error });
    throw error;
  }
});
electron.ipcMain.handle("read-text-file", async (event, filename) => {
  logInfo("IPC: read-text-file called", { filename });
  try {
    const content = await fs.promises.readFile(filename, "utf-8");
    logInfo("Text file read successfully", { filename, contentLength: content.length });
    return { success: true, content };
  } catch (error) {
    logError("Failed to read text file", { filename, error });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});
electron.ipcMain.handle("get-file-stats", async (event, filePath) => {
  logInfo("IPC: get-file-stats called", { filePath });
  try {
    const stats = await fs.promises.stat(filePath);
    return {
      success: true,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      size: stats.size,
      modified: stats.mtime
    };
  } catch (error) {
    logError("Failed to get file stats", { filePath, error });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});
electron.ipcMain.handle("list-directory", async (event, dirPath) => {
  logInfo("IPC: list-directory called", { dirPath });
  try {
    const entries = await fs.promises.readdir(dirPath);
    const entryInfos = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry);
        try {
          const stats = await fs.promises.stat(fullPath);
          return {
            name: entry,
            path: fullPath,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            size: stats.size,
            modified: stats.mtime
          };
        } catch (error) {
          logError("Failed to stat entry", { entry, error });
          return null;
        }
      })
    );
    const validEntries = entryInfos.filter((entry) => entry !== null);
    return { success: true, entries: validEntries };
  } catch (error) {
    logError("Failed to list directory", { dirPath, error });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});
electron.ipcMain.handle("write-json-file", async (event, filePath, content) => {
  logInfo("write-json-file requested", { filePath, contentLength: content.length });
  try {
    const directory = path.join(filePath, "..");
    try {
      await fs.promises.access(directory, fs.constants.W_OK);
      logDebug("Target directory is writable:", directory);
    } catch (error) {
      logError("Target directory is not writable", { directory, error });
      throw new Error(`Directory is not writable: ${directory}`);
    }
    await fs.promises.writeFile(filePath, content, "utf8");
    logInfo("File written successfully:", filePath);
    return { success: true };
  } catch (error) {
    logError("Failed to write file", { filePath, error: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : void 0 });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});
electron.ipcMain.handle("get-config-directory", async () => {
  logInfo("get-config-directory requested");
  try {
    const configDir = await ensureConfigDirectory();
    logInfo("Config directory ready:", configDir);
    return { success: true, path: configDir };
  } catch (error) {
    logError("Failed to get config directory", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});
electron.ipcMain.handle("write-config-file", async (event, fileName, content) => {
  logInfo("write-config-file requested", { fileName, contentLength: content.length });
  try {
    const validation = validateFilename(fileName);
    if (!validation.isValid) {
      logError("Invalid filename provided", { fileName, error: validation.error });
      return { success: false, error: validation.error };
    }
    if (typeof content !== "string") {
      logError("Invalid content type", { contentType: typeof content });
      return { success: false, error: "Content must be a string" };
    }
    if (content.length > 10 * 1024 * 1024) {
      logError("Content too large", { contentLength: content.length });
      return { success: false, error: "Content is too large (maximum 10MB)" };
    }
    const configDir = await ensureConfigDirectory();
    const filePath = path.join(configDir, fileName);
    logDebug("Writing config file", { configDir, fileName, filePath });
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      logDebug("File already exists, checking write permissions");
      await fs.promises.access(filePath, fs.constants.W_OK);
    } catch (error) {
      logDebug("File does not exist, will create new file");
    }
    const tempFilePath = `${filePath}.tmp`;
    try {
      await fs.promises.writeFile(tempFilePath, content, "utf8");
      await fs.promises.rename(tempFilePath, filePath);
      logInfo("Config file written successfully", { filePath, size: content.length });
    } catch (writeError) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (cleanupError) {
        logDebug("No temp file to clean up");
      }
      throw writeError;
    }
    return { success: true, filePath };
  } catch (error) {
    logError("Failed to write config file", {
      fileName,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : void 0,
      code: error == null ? void 0 : error.code,
      errno: error == null ? void 0 : error.errno,
      syscall: error == null ? void 0 : error.syscall,
      path: error == null ? void 0 : error.path
    });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});
electron.ipcMain.handle("list-config-files", async () => {
  logInfo("list-config-files requested");
  try {
    const configDir = await ensureConfigDirectory();
    logDebug("Listing files in config directory:", configDir);
    const entries = await fs.promises.readdir(configDir);
    logDebug("Found entries:", entries);
    const fileInfos = [];
    for (const entry of entries) {
      const fullPath = path.join(configDir, entry);
      try {
        const stats = await fs.promises.stat(fullPath);
        if (stats.isFile() && !entry.endsWith(".tmp")) {
          if (entry.endsWith(".json")) {
            try {
              const content = await fs.promises.readFile(fullPath, "utf8");
              const parsedContent = JSON.parse(content);
              logDebug("Successfully read JSON file:", { fileName: entry, size: content.length });
              fileInfos.push({
                name: entry,
                path: fullPath,
                content: parsedContent
              });
            } catch (error) {
              logError("Failed to read or parse JSON file", { fileName: entry, error });
            }
          }
        }
      } catch (error) {
        logError("Failed to stat entry", { entry, error });
      }
    }
    logInfo("Successfully loaded config files", { count: fileInfos.length });
    return { success: true, files: fileInfos };
  } catch (error) {
    logError("Failed to list config files", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});
electron.ipcMain.handle("show-open-dialog", async (event, options) => {
  logInfo("show-open-dialog requested", options);
  try {
    const result = await electron.dialog.showOpenDialog(options);
    logDebug("Open dialog result:", result);
    return result;
  } catch (error) {
    logError("Failed to show open dialog", error);
    return { canceled: true, filePaths: [] };
  }
});
electron.ipcMain.handle("show-save-dialog", async (event, options) => {
  logInfo("show-save-dialog requested", options);
  try {
    const result = await electron.dialog.showSaveDialog(options);
    logDebug("Save dialog result:", result);
    return result;
  } catch (error) {
    logError("Failed to show save dialog", error);
    return { canceled: true, filePath: void 0 };
  }
});
electron.ipcMain.handle("delete-file", async (event, filePath) => {
  logInfo("delete-file requested", { filePath });
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    logDebug("File exists, attempting to delete:", filePath);
    await fs.promises.unlink(filePath);
    logInfo("File deleted successfully:", filePath);
    return { success: true };
  } catch (error) {
    logError("Failed to delete file", {
      filePath,
      error: error instanceof Error ? error.message : error,
      code: error == null ? void 0 : error.code,
      errno: error == null ? void 0 : error.errno
    });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});
electron.ipcMain.handle("rename-file", async (event, oldPath, newPath) => {
  logInfo("rename-file requested", { oldPath, newPath });
  try {
    if (!oldPath || !newPath) {
      return { success: false, error: "Both oldPath and newPath are required" };
    }
    if (oldPath === newPath) {
      logInfo("rename-file skipped: paths are identical");
      return { success: true, filePath: newPath };
    }
    const oldDir = path.dirname(oldPath);
    const newDir = path.dirname(newPath);
    if (oldDir !== newDir) {
      logError("rename-file denied: directory changed", { oldDir, newDir });
      return { success: false, error: "Renaming must stay within the original folder" };
    }
    try {
      await fs.promises.access(newPath, fs.constants.F_OK);
      logError("rename-file denied: target already exists", { newPath });
      return { success: false, error: "A file with the new name already exists" };
    } catch {
    }
    await fs.promises.rename(oldPath, newPath);
    logInfo("File renamed successfully", { from: oldPath, to: newPath });
    return { success: true, filePath: newPath };
  } catch (error) {
    logError("Failed to rename file", { oldPath, newPath, error });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});
electron.ipcMain.handle("copy-file", async (_event, filePath, newPath) => {
  console.log("IPC copy-file requested", { filePath, newPath });
  logInfo("copy-file requested", { filePath, newPath });
  try {
    if (!filePath || !newPath) {
      return { success: false, error: "Both filePath and newPath are required" };
    }
    try {
      await fs.promises.access(filePath, fs.constants.F_OK | fs.constants.R_OK);
    } catch {
      logError("copy-file denied: source file not accessible", { filePath });
      return { success: false, error: "Source file does not exist or is not readable" };
    }
    if (filePath === newPath) {
      logError("copy-file denied: paths are identical");
      return { success: false, error: "Cannot copy file to the same location" };
    }
    const sourceDir = path.dirname(filePath);
    const targetDir = path.dirname(newPath);
    if (sourceDir !== targetDir) {
      logError("copy-file denied: directory changed", { sourceDir, targetDir });
      return { success: false, error: "Copying must stay within the original folder" };
    }
    try {
      await fs.promises.access(newPath, fs.constants.F_OK);
      logError("copy-file denied: target already exists", { newPath });
      return { success: false, error: "A file with the target name already exists" };
    } catch {
    }
    const content = await fs.promises.readFile(filePath, "utf8");
    await fs.promises.writeFile(newPath, content, "utf8");
    logInfo("File copied successfully", { from: filePath, to: newPath });
    return { success: true, filePath: newPath };
  } catch (error) {
    logError("Failed to copy file", { filePath, newPath, error });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});
electron.ipcMain.handle("create-schema-json-directory", async (event, schemaName) => {
  logInfo("create-schema-json-directory requested", { schemaName });
  try {
    const configDir = await ensureConfigDirectory();
    const jsonDir = path.join(configDir, "json-files", schemaName.replace(/[^a-zA-Z0-9.-]/g, "_"));
    await fs.promises.mkdir(jsonDir, { recursive: true });
    logInfo("Schema JSON directory created/verified:", jsonDir);
    return { success: true, path: jsonDir };
  } catch (error) {
    logError("Failed to create schema JSON directory", { schemaName, error });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});
electron.ipcMain.handle("write-schema-json-file", async (event, schemaName, fileName, content) => {
  logInfo("write-schema-json-file requested", { schemaName, fileName, contentLength: content.length });
  try {
    const configDir = await ensureConfigDirectory();
    const schemaDir = path.join(configDir, "json-files", schemaName.replace(/[^a-zA-Z0-9.-]/g, "_"));
    await fs.promises.mkdir(schemaDir, { recursive: true });
    const safeFileName = fileName.endsWith(".json") ? fileName : `${fileName}.json`;
    const filePath = path.join(schemaDir, safeFileName);
    await fs.promises.writeFile(filePath, content, "utf8");
    logInfo("Schema JSON file written successfully:", filePath);
    return { success: true, filePath };
  } catch (error) {
    logError("Failed to write schema JSON file", { schemaName, fileName, error });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});
electron.ipcMain.handle("list-schema-json-files", async (event, schemaName) => {
  logInfo("list-schema-json-files requested", { schemaName });
  try {
    const configDir = await ensureConfigDirectory();
    const schemaDir = path.join(configDir, "json-files", schemaName.replace(/[^a-zA-Z0-9.-]/g, "_"));
    try {
      await fs.promises.access(schemaDir, fs.constants.F_OK);
    } catch (error) {
      logInfo("Schema directory does not exist, returning empty list:", schemaDir);
      return { success: true, files: [] };
    }
    const entries = await fs.promises.readdir(schemaDir);
    const fileInfos = [];
    for (const entry of entries) {
      const fullPath = path.join(schemaDir, entry);
      try {
        const stats = await fs.promises.stat(fullPath);
        if (stats.isFile() && entry.endsWith(".json")) {
          try {
            const content = await fs.promises.readFile(fullPath, "utf8");
            const parsedContent = JSON.parse(content);
            fileInfos.push({
              name: entry,
              path: fullPath,
              content: parsedContent
            });
          } catch (error) {
            logError("Failed to read schema JSON file", { fileName: entry, error });
          }
        }
      } catch (error) {
        logError("Failed to stat entry", { entry, error });
      }
    }
    logInfo("Successfully loaded schema JSON files", { schemaName, count: fileInfos.length });
    return { success: true, files: fileInfos };
  } catch (error) {
    logError("Failed to list schema JSON files", { schemaName, error });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});
electron.app.whenReady().then(() => {
  logInfo("App is ready, creating main window");
  createMainWindow();
  logInfo("System information", {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    electronVersion: process.versions.electron,
    userDataPath: electron.app.getPath("userData"),
    tempPath: electron.app.getPath("temp"),
    homePath: electron.app.getPath("home")
  });
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      logInfo("Reactivating app, creating new window");
      createMainWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  logInfo("All windows closed");
  if (process.platform !== "darwin") {
    logInfo("Quitting app");
    electron.app.quit();
  }
});
electron.app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event2, navigationUrl) => {
    event2.preventDefault();
    logError("Blocked new window creation", { url: navigationUrl });
  });
});
