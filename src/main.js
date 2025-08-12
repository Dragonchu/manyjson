/*
  应用主进程入口：负责创建应用窗口与生命周期管理
  - 优先支持 macOS 的行为（窗口全部关闭时不退出、Dock 点击重新激活）
  - 使用 preload.js 提供安全的渲染进程桥接
*/

const { app, BrowserWindow, nativeTheme } = require('electron');
const path = require('path');

/**
 * 创建主窗口
 */
function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    title: 'ManyJson',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#ffffff',
    webPreferences: {
      // 使用 preload 注入安全的 API，而非直接开启 nodeIntegration
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  // 加载本地 HTML
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 根据需要打开开发者工具（开发阶段可以手动切换）
  // mainWindow.webContents.openDevTools();

  return mainWindow;
}

// 应用准备就绪后创建窗口
app.whenReady().then(() => {
  createMainWindow();

  // macOS: Dock 图标被点击且没有打开的窗口时，重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// 除 macOS 外，当所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});