/*
  Preload 脚本：在渲染进程加载前运行，用于暴露受控 API
  - 通过 contextBridge 安全地将只读能力暴露给渲染页面
  - 后续如需与主进程通信，可扩展 ipcRenderer 调用
*/

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('appInfo', {
  name: 'ManyJson',
  version: '0.1.0',
});

// 暴露 JSON 文件操作 API
contextBridge.exposeInMainWorld('jsonAPI', {
  writeFile: (data) => ipcRenderer.invoke('write-json-file', data),
  readFile: (filePath) => ipcRenderer.invoke('read-json-file', filePath),
});

// 暴露文件系统 API for schema manager
contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filename) => ipcRenderer.invoke('read-file-sync', filename),
});