"use strict";
const electron = require("electron");
const electronAPI = {
  // 文件写入
  writeJsonFile: (filePath, content) => electron.ipcRenderer.invoke("write-json-file", filePath, content),
  // 打开文件对话框
  showOpenDialog: (options) => electron.ipcRenderer.invoke("show-open-dialog", options),
  // 保存文件对话框
  showSaveDialog: (options) => electron.ipcRenderer.invoke("show-save-dialog", options),
  // 删除文件
  deleteFile: (filePath) => electron.ipcRenderer.invoke("delete-file", filePath)
};
electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
