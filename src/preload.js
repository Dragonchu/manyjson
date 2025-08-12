/*
  Preload 脚本：在渲染进程加载前运行，用于暴露受控 API
  - 通过 contextBridge 安全地将只读能力暴露给渲染页面
  - 后续如需与主进程通信，可扩展 ipcRenderer 调用
*/

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('appInfo', {
  name: 'ManyJson',
  version: '0.1.0',
});

// 示例：如需与主进程通信，可在此处封装调用
// const { ipcRenderer } = require('electron');
// contextBridge.exposeInMainWorld('api', {
//   ping: () => ipcRenderer.invoke('ping'),
// });