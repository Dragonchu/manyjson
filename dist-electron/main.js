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
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
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
    const files = await fs.promises.readdir(configDir);
    logDebug("Found files:", files);
    const jsonFiles = files.filter((file) => file.endsWith(".json") && !file.endsWith(".tmp"));
    logInfo("Found JSON files:", jsonFiles);
    const fileInfos = await Promise.all(
      jsonFiles.map(async (fileName) => {
        const filePath = path.join(configDir, fileName);
        try {
          const content = await fs.promises.readFile(filePath, "utf8");
          const parsedContent = JSON.parse(content);
          logDebug("Successfully read file:", { fileName, size: content.length });
          return {
            name: fileName,
            path: filePath,
            content: parsedContent
          };
        } catch (error) {
          logError("Failed to read or parse file", { fileName, error });
          throw error;
        }
      })
    );
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
