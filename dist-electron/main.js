"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const isDev = process.env.NODE_ENV === "development";
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
electron.ipcMain.handle("write-json-file", async (event, filePath, content) => {
  try {
    await fs.promises.writeFile(filePath, content, "utf8");
    return { success: true };
  } catch (error) {
    console.error("Failed to write file:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});
electron.ipcMain.handle("show-open-dialog", async (event, options) => {
  try {
    const result = await electron.dialog.showOpenDialog(options);
    return result;
  } catch (error) {
    console.error("Failed to show open dialog:", error);
    return { canceled: true, filePaths: [] };
  }
});
electron.ipcMain.handle("show-save-dialog", async (event, options) => {
  try {
    const result = await electron.dialog.showSaveDialog(options);
    return result;
  } catch (error) {
    console.error("Failed to show save dialog:", error);
    return { canceled: true, filePath: void 0 };
  }
});
electron.app.whenReady().then(() => {
  createMainWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event2, navigationUrl) => {
    event2.preventDefault();
    console.warn("Blocked new window creation:", navigationUrl);
  });
});
