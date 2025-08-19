/*
  应用主进程入口：负责创建应用窗口与生命周期管理
  - 优先支持 macOS 的行为（窗口全部关闭时不退出、Dock 点击重新激活）
  - 使用 preload.js 提供安全的渲染进程桥接
*/

import { app, BrowserWindow, nativeTheme, ipcMain, dialog } from 'electron'
import { join, dirname } from 'path'
import { promises as fs } from 'fs'
import { constants } from 'fs'

const isDev = process.env.NODE_ENV === 'development'

// Logging utility
function logInfo(message: string, ...args: any[]) {
  console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args)
}

function logError(message: string, error?: any) {
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error)
}

function logDebug(message: string, ...args: any[]) {
  if (isDev) {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args)
  }
}

// Filename validation utility
function validateFilename(filename: string): { isValid: boolean; error?: string } {
  if (!filename || typeof filename !== 'string') {
    return { isValid: false, error: 'Filename is required and must be a string' }
  }

  const trimmedFilename = filename.trim()
  if (!trimmedFilename) {
    return { isValid: false, error: 'Filename cannot be empty' }
  }

  // Check for path traversal attempts
  if (trimmedFilename.includes('..') || trimmedFilename.includes('/') || trimmedFilename.includes('\\')) {
    return { isValid: false, error: 'Filename cannot contain path separators or relative path references' }
  }

  // Check for invalid characters (Windows + some additional unsafe characters)
  const invalidChars = /[<>:"|?*\x00-\x1f]/
  if (invalidChars.test(trimmedFilename)) {
    return { isValid: false, error: 'Filename contains invalid characters' }
  }

  // Check length (most filesystems have a 255 byte limit)
  if (Buffer.byteLength(trimmedFilename, 'utf8') > 255) {
    return { isValid: false, error: 'Filename is too long' }
  }

  // Check for reserved names (Windows)
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i
  if (reservedNames.test(trimmedFilename)) {
    return { isValid: false, error: 'Filename uses a reserved name' }
  }

  return { isValid: true }
}

// Directory creation with proper error handling and retries
async function ensureConfigDirectoryWithRetry(maxRetries = 3): Promise<string> {
  const configDir = getConfigDirectory()
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logDebug(`Ensuring config directory exists (attempt ${attempt}/${maxRetries}):`, configDir)
      
      // Check if directory exists and is accessible
      try {
        await fs.access(configDir, constants.F_OK)
        logDebug('Config directory already exists')
      } catch (error) {
        logInfo('Creating config directory:', configDir)
        await fs.mkdir(configDir, { recursive: true })
        logInfo('Config directory created successfully')
      }

      // Verify write permissions
      try {
        await fs.access(configDir, constants.W_OK)
        logDebug('Config directory is writable')
        return configDir
      } catch (error) {
        logError('Config directory is not writable', error)
        throw new Error(`Config directory is not writable: ${configDir}`)
      }
    } catch (error) {
      logError(`Failed to create or access config directory (attempt ${attempt}/${maxRetries})`, error)
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 100 * attempt))
    }
  }
  
  throw new Error('Failed to ensure config directory after all retries')
}

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
    // 在打包后的应用中，文件结构是: app.asar/dist/index.html
    // __dirname 指向 app.asar/dist-electron，所以需要 ../dist/index.html
    const htmlPath = join(__dirname, '../dist/index.html')
    logInfo('Loading HTML file from:', htmlPath)
    mainWindow.loadFile(htmlPath).catch((error) => {
      logError('Failed to load HTML file', { htmlPath, error })
      // 尝试开发者工具以便调试
      mainWindow.webContents.openDevTools()
    })
  }

  return mainWindow
}

// 获取应用配置目录
function getConfigDirectory(): string {
  const userDataPath = app.getPath('userData')
  const configDir = join(userDataPath, 'schemas')
  logDebug('Config directory path:', configDir)
  return configDir
}

// 确保配置目录存在
async function ensureConfigDirectory(): Promise<string> {
  return ensureConfigDirectoryWithRetry()
}

// IPC 处理器：文件操作
ipcMain.handle('read-file-sync', async (event, filename: string) => {
  logInfo('IPC: read-file-sync called', { filename })
  
  try {
    const content = await fs.readFile(filename, 'utf-8')
    const parsedContent = JSON.parse(content)
    logInfo('File read successfully', { filename, contentLength: content.length })
    return parsedContent
  } catch (error) {
    logError('Failed to read file', { filename, error })
    throw error
  }
})

ipcMain.handle('write-json-file', async (event, filePath: string, content: string) => {
  logInfo('write-json-file requested', { filePath, contentLength: content.length })
  
  try {
    // Verify the directory exists and is writable
    const directory = join(filePath, '..')
    try {
      await fs.access(directory, constants.W_OK)
      logDebug('Target directory is writable:', directory)
    } catch (error) {
      logError('Target directory is not writable', { directory, error })
      throw new Error(`Directory is not writable: ${directory}`)
    }

    await fs.writeFile(filePath, content, 'utf8')
    logInfo('File written successfully:', filePath)
    return { success: true }
  } catch (error) {
    logError('Failed to write file', { filePath, error: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : undefined })
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

// 获取配置目录路径
ipcMain.handle('get-config-directory', async () => {
  logInfo('get-config-directory requested')
  
  try {
    const configDir = await ensureConfigDirectory()
    logInfo('Config directory ready:', configDir)
    return { success: true, path: configDir }
  } catch (error) {
    logError('Failed to get config directory', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

// 写入配置文件（使用配置目录）
ipcMain.handle('write-config-file', async (event, fileName: string, content: string) => {
  logInfo('write-config-file requested', { fileName, contentLength: content.length })
  
  try {
    // Validate filename first
    const validation = validateFilename(fileName)
    if (!validation.isValid) {
      logError('Invalid filename provided', { fileName, error: validation.error })
      return { success: false, error: validation.error }
    }

    // Validate content
    if (typeof content !== 'string') {
      logError('Invalid content type', { contentType: typeof content })
      return { success: false, error: 'Content must be a string' }
    }

    if (content.length > 10 * 1024 * 1024) { // 10MB limit
      logError('Content too large', { contentLength: content.length })
      return { success: false, error: 'Content is too large (maximum 10MB)' }
    }

    const configDir = await ensureConfigDirectory()
    const filePath = join(configDir, fileName)
    
    logDebug('Writing config file', { configDir, fileName, filePath })

    // Check if we can write to the specific file location
    try {
      // Try to access the file if it exists
      await fs.access(filePath, constants.F_OK)
      logDebug('File already exists, checking write permissions')
      await fs.access(filePath, constants.W_OK)
    } catch (error) {
      // File doesn't exist, which is fine for new files
      logDebug('File does not exist, will create new file')
    }

    // Atomic write operation using temporary file
    const tempFilePath = `${filePath}.tmp`
    try {
      await fs.writeFile(tempFilePath, content, 'utf8')
      await fs.rename(tempFilePath, filePath)
      logInfo('Config file written successfully', { filePath, size: content.length })
    } catch (writeError) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempFilePath)
      } catch (cleanupError) {
        logDebug('No temp file to clean up')
      }
      throw writeError
    }
    
    return { success: true, filePath }
  } catch (error) {
    logError('Failed to write config file', { 
      fileName, 
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      errno: (error as any)?.errno,
      syscall: (error as any)?.syscall,
      path: (error as any)?.path
    })
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

// 读取配置目录中的所有文件
ipcMain.handle('list-config-files', async () => {
  logInfo('list-config-files requested')
  
  try {
    const configDir = await ensureConfigDirectory()
    logDebug('Listing files in config directory:', configDir)
    
    const files = await fs.readdir(configDir)
    logDebug('Found files:', files)
    
    const jsonFiles = files.filter(file => file.endsWith('.json') && !file.endsWith('.tmp'))
    logInfo('Found JSON files:', jsonFiles)
    
    const fileInfos = await Promise.all(
      jsonFiles.map(async (fileName) => {
        const filePath = join(configDir, fileName)
        try {
          const content = await fs.readFile(filePath, 'utf8')
          const parsedContent = JSON.parse(content)
          logDebug('Successfully read file:', { fileName, size: content.length })
          return {
            name: fileName,
            path: filePath,
            content: parsedContent
          }
        } catch (error) {
          logError('Failed to read or parse file', { fileName, error })
          throw error
        }
      })
    )
    
    logInfo('Successfully loaded config files', { count: fileInfos.length })
    return { success: true, files: fileInfos }
  } catch (error) {
    logError('Failed to list config files', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('show-open-dialog', async (event, options) => {
  logInfo('show-open-dialog requested', options)
  
  try {
    const result = await dialog.showOpenDialog(options)
    logDebug('Open dialog result:', result)
    return result
  } catch (error) {
    logError('Failed to show open dialog', error)
    return { canceled: true, filePaths: [] }
  }
})

ipcMain.handle('show-save-dialog', async (event, options) => {
  logInfo('show-save-dialog requested', options)
  
  try {
    const result = await dialog.showSaveDialog(options)
    logDebug('Save dialog result:', result)
    return result
  } catch (error) {
    logError('Failed to show save dialog', error)
    return { canceled: true, filePath: undefined }
  }
})

ipcMain.handle('delete-file', async (event, filePath: string) => {
  logInfo('delete-file requested', { filePath })
  
  try {
    // Check if file exists and is accessible
    await fs.access(filePath, constants.F_OK)
    logDebug('File exists, attempting to delete:', filePath)
    
    await fs.unlink(filePath)
    logInfo('File deleted successfully:', filePath)
    return { success: true }
  } catch (error) {
    logError('Failed to delete file', { 
      filePath,
      error: error instanceof Error ? error.message : error,
      code: (error as any)?.code,
      errno: (error as any)?.errno
    })
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

// Rename a file within the same directory
ipcMain.handle('rename-file', async (event, filePath: string, newFileName: string) => {
  logInfo('rename-file requested', { filePath, newFileName })

  try {
    // Validate new filename
    const validation = validateFilename(newFileName)
    if (!validation.isValid) {
      logError('Invalid new filename provided for rename', { newFileName, error: validation.error })
      return { success: false, error: validation.error }
    }

    // Ensure .json extension is preserved/added
    const safeFileName = newFileName.endsWith('.json') ? newFileName : `${newFileName}.json`

    // Source must exist
    await fs.access(filePath, constants.F_OK)

    // Determine target path (same directory)
    const directory = dirname(filePath)
    const targetPath = join(directory, safeFileName)

    // If target already exists, abort
    try {
      await fs.access(targetPath, constants.F_OK)
      logError('Target file already exists for rename', { targetPath })
      return { success: false, error: 'A file with the target name already exists' }
    } catch {
      // OK: target does not exist
    }

    // Perform atomic rename
    await fs.rename(filePath, targetPath)
    logInfo('File renamed successfully', { from: filePath, to: targetPath })
    return { success: true, newPath: targetPath, newName: safeFileName }
  } catch (error) {
    logError('Failed to rename file', { filePath, newFileName, error })
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

// Create JSON file directory for a schema
ipcMain.handle('create-schema-json-directory', async (event, schemaName: string) => {
  logInfo('create-schema-json-directory requested', { schemaName })
  
  try {
    const configDir = await ensureConfigDirectory()
    const jsonDir = join(configDir, 'json-files', schemaName.replace(/[^a-zA-Z0-9.-]/g, '_'))
    
    // Create directory if it doesn't exist
    await fs.mkdir(jsonDir, { recursive: true })
    logInfo('Schema JSON directory created/verified:', jsonDir)
    
    return { success: true, path: jsonDir }
  } catch (error) {
    logError('Failed to create schema JSON directory', { schemaName, error })
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

// Write JSON file to schema-specific directory
ipcMain.handle('write-schema-json-file', async (event, schemaName: string, fileName: string, content: string) => {
  logInfo('write-schema-json-file requested', { schemaName, fileName, contentLength: content.length })
  
  try {
    // Ensure the schema directory exists
    const configDir = await ensureConfigDirectory()
    const schemaDir = join(configDir, 'json-files', schemaName.replace(/[^a-zA-Z0-9.-]/g, '_'))
    await fs.mkdir(schemaDir, { recursive: true })
    
    // Ensure filename has .json extension
    const safeFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`
    const filePath = join(schemaDir, safeFileName)
    
    // Write the file
    await fs.writeFile(filePath, content, 'utf8')
    logInfo('Schema JSON file written successfully:', filePath)
    
    return { success: true, filePath }
  } catch (error) {
    logError('Failed to write schema JSON file', { schemaName, fileName, error })
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

// List all JSON files for a specific schema
ipcMain.handle('list-schema-json-files', async (event, schemaName: string) => {
  logInfo('list-schema-json-files requested', { schemaName })
  
  try {
    const configDir = await ensureConfigDirectory()
    const schemaDir = join(configDir, 'json-files', schemaName.replace(/[^a-zA-Z0-9.-]/g, '_'))
    
    // Check if schema directory exists
    try {
      await fs.access(schemaDir, constants.F_OK)
    } catch (error) {
      // Directory doesn't exist, return empty list
      logInfo('Schema directory does not exist, returning empty list:', schemaDir)
      return { success: true, files: [] }
    }
    
    const files = await fs.readdir(schemaDir)
    const jsonFiles = files.filter(file => file.endsWith('.json'))
    
    const fileInfos = await Promise.all(
      jsonFiles.map(async (fileName) => {
        const filePath = join(schemaDir, fileName)
        try {
          const content = await fs.readFile(filePath, 'utf8')
          const parsedContent = JSON.parse(content)
          return {
            name: fileName,
            path: filePath,
            content: parsedContent
          }
        } catch (error) {
          logError('Failed to read schema JSON file', { fileName, error })
          throw error
        }
      })
    )
    
    logInfo('Successfully loaded schema JSON files', { schemaName, count: fileInfos.length })
    return { success: true, files: fileInfos }
  } catch (error) {
    logError('Failed to list schema JSON files', { schemaName, error })
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

// 应用生命周期管理
app.whenReady().then(() => {
  logInfo('App is ready, creating main window')
  createMainWindow()

  // Log system information
  logInfo('System information', {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    electronVersion: process.versions.electron,
    userDataPath: app.getPath('userData'),
    tempPath: app.getPath('temp'),
    homePath: app.getPath('home')
  })

  // macOS 特有行为：Dock 点击时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      logInfo('Reactivating app, creating new window')
      createMainWindow()
    }
  })
})

// 所有窗口关闭时的行为
app.on('window-all-closed', () => {
  logInfo('All windows closed')
  // macOS 上除非用户明确退出（Cmd + Q），否则保持应用运行
  if (process.platform !== 'darwin') {
    logInfo('Quitting app')
    app.quit()
  }
})

// 安全性：阻止新窗口创建
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    // 阻止新窗口创建，确保应用安全
    event.preventDefault()
    logError('Blocked new window creation', { url: navigationUrl })
  })
})