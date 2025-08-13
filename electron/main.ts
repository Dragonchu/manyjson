/*
  应用主进程入口：负责创建应用窗口与生命周期管理
  - 优先支持 macOS 的行为（窗口全部关闭时不退出、Dock 点击重新激活）
  - 使用 preload.js 提供安全的渲染进程桥接
*/

import { app, BrowserWindow, nativeTheme, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'

const isDev = process.env.NODE_ENV === 'development'

/**
 * 创建主窗口
 */
function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    title: 'ManyJson - JSON Schema Manager',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0a0a0a' : '#ffffff',
    webPreferences: {
      // 使用 preload 注入安全的 API，而非直接开启 nodeIntegration
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  })

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    // 开发模式下打开开发者工具
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  return mainWindow
}

// 获取应用配置目录
function getConfigDirectory(): string {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, 'schemas')
}

// 确保配置目录存在
async function ensureConfigDirectory(): Promise<string> {
  const configDir = getConfigDirectory()
  try {
    await fs.mkdir(configDir, { recursive: true })
    return configDir
  } catch (error) {
    console.error('Failed to create config directory:', error)
    throw error
  }
}

// IPC 处理程序
ipcMain.handle('write-json-file', async (event, filePath: string, content: string) => {
  try {
    await fs.writeFile(filePath, content, 'utf8')
    return { success: true }
  } catch (error) {
    console.error('Failed to write file:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

// 获取配置目录路径
ipcMain.handle('get-config-directory', async () => {
  try {
    const configDir = await ensureConfigDirectory()
    return { success: true, path: configDir }
  } catch (error) {
    console.error('Failed to get config directory:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

// 写入配置文件（使用配置目录）
ipcMain.handle('write-config-file', async (event, fileName: string, content: string) => {
  try {
    const configDir = await ensureConfigDirectory()
    const filePath = join(configDir, fileName)
    await fs.writeFile(filePath, content, 'utf8')
    return { success: true, filePath }
  } catch (error) {
    console.error('Failed to write config file:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

// 读取配置目录中的所有文件
ipcMain.handle('list-config-files', async () => {
  try {
    const configDir = await ensureConfigDirectory()
    const files = await fs.readdir(configDir)
    const jsonFiles = files.filter(file => file.endsWith('.json'))
    
    const fileInfos = await Promise.all(
      jsonFiles.map(async (fileName) => {
        const filePath = join(configDir, fileName)
        const content = await fs.readFile(filePath, 'utf8')
        return {
          name: fileName,
          path: filePath,
          content: JSON.parse(content)
        }
      })
    )
    
    return { success: true, files: fileInfos }
  } catch (error) {
    console.error('Failed to list config files:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('show-open-dialog', async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(options)
    return result
  } catch (error) {
    console.error('Failed to show open dialog:', error)
    return { canceled: true, filePaths: [] }
  }
})

ipcMain.handle('show-save-dialog', async (event, options) => {
  try {
    const result = await dialog.showSaveDialog(options)
    return result
  } catch (error) {
    console.error('Failed to show save dialog:', error)
    return { canceled: true, filePath: undefined }
  }
})

ipcMain.handle('delete-file', async (event, filePath: string) => {
  try {
    await fs.unlink(filePath)
    return { success: true }
  } catch (error) {
    console.error('Failed to delete file:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

// 应用生命周期管理
app.whenReady().then(() => {
  createMainWindow()

  // macOS 特有行为：Dock 点击时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

// 所有窗口关闭时的行为
app.on('window-all-closed', () => {
  // macOS 上除非用户明确退出（Cmd + Q），否则保持应用运行
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 安全性：阻止新窗口创建
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    // 阻止新窗口创建，确保应用安全
    event.preventDefault()
    console.warn('Blocked new window creation:', navigationUrl)
  })
})