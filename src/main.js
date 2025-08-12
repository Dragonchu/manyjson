/*
  应用主进程入口：负责创建应用窗口与生命周期管理
  - 优先支持 macOS 的行为（窗口全部关闭时不退出、Dock 点击重新激活）
  - 使用 preload.js 提供安全的渲染进程桥接
*/

const { app, BrowserWindow, nativeTheme, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

/**
 * 创建主窗口
 */
function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    title: 'ManyJson - JSON Schema Manager',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0a0a0a' : '#ffffff',
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

// IPC 处理程序
ipcMain.handle('write-json-file', async (event, data) => {
  try {
    const { filePath, jsonData } = data;
    
    if (!filePath) {
      // 如果没有提供文件路径，打开保存对话框
      const result = await dialog.showSaveDialog({
        title: '保存 JSON 文件',
        defaultPath: 'data.json',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (result.canceled) {
        return { success: false, error: '用户取消了保存操作' };
      }
      
      const selectedPath = result.filePath;
      await fs.writeFile(selectedPath, JSON.stringify(jsonData, null, 2), 'utf8');
      return { success: true, filePath: selectedPath };
    } else {
      // 使用提供的文件路径
      await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
      return { success: true, filePath };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-json-file', async (event, filePath) => {
  try {
    if (!filePath) {
      // 如果没有提供文件路径，打开文件选择对话框
      const result = await dialog.showOpenDialog({
        title: '选择 JSON 文件',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });
      
      if (result.canceled) {
        return { success: false, error: '用户取消了文件选择' };
      }
      
      filePath = result.filePaths[0];
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(content);
    return { success: true, data: jsonData, filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Simple file reader for schema manager
ipcMain.handle('read-file-sync', async (event, filename) => {
  try {
    // Read from the root directory where the JSON files are located
    const filePath = path.join(process.cwd(), filename);
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to read ${filename}:`, error);
    return null;
  }
});

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