"use strict";
const electron = require("electron");
const electronAPI = {
  // 文件读取
  readFile: (filename) => electron.ipcRenderer.invoke("read-file-sync", filename),
  // 文件写入
  writeJsonFile: (filePath, content) => electron.ipcRenderer.invoke("write-json-file", filePath, content),
  // 删除文件
  deleteFile: (filePath) => electron.ipcRenderer.invoke("delete-file", filePath),
  // 获取配置目录
  getConfigDirectory: () => electron.ipcRenderer.invoke("get-config-directory"),
  // 写入配置文件
  writeConfigFile: (fileName, content) => electron.ipcRenderer.invoke("write-config-file", fileName, content),
  // 列出配置文件
  listConfigFiles: () => electron.ipcRenderer.invoke("list-config-files"),
  // 打开文件对话框
  showOpenDialog: (options) => electron.ipcRenderer.invoke("show-open-dialog", options),
  // 保存文件对话框
  showSaveDialog: (options) => electron.ipcRenderer.invoke("show-save-dialog", options)
};
electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
