/*
  Preload 脚本：在渲染进程中提供安全的 Node.js API 访问
  - 通过 contextBridge 暴露有限的 API 给渲染进程
  - 确保渲染进程无法直接访问 Node.js API，提升安全性
*/

import { contextBridge, ipcRenderer } from 'electron'

// 定义暴露给渲染进程的 API
const electronAPI = {
  // 文件读取
  readFile: (filename: string): Promise<any> =>
    ipcRenderer.invoke('read-file-sync', filename),

  // 文件写入
  writeJsonFile: (filePath: string, content: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('write-json-file', filePath, content),

  // 删除文件
  deleteFile: (filePath: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('delete-file', filePath),

  // 获取配置目录
  getConfigDirectory: (): Promise<{ success: boolean; path?: string; error?: string }> =>
    ipcRenderer.invoke('get-config-directory'),

  // 写入配置文件
  writeConfigFile: (fileName: string, content: string): Promise<{ success: boolean; filePath?: string; error?: string }> =>
    ipcRenderer.invoke('write-config-file', fileName, content),

  // 列出配置文件
  listConfigFiles: (): Promise<{ success: boolean; files?: Array<{ name: string; path: string; content: any }>; error?: string }> =>
    ipcRenderer.invoke('list-config-files'),

  // 打开文件对话框
  showOpenDialog: (options: any): Promise<{ canceled: boolean; filePaths: string[] }> =>
    ipcRenderer.invoke('show-open-dialog', options),

  // 保存文件对话框
  showSaveDialog: (options: any): Promise<{ canceled: boolean; filePath?: string }> =>
    ipcRenderer.invoke('show-save-dialog', options),

  // 重命名文件
  renameFile: (oldPath: string, newPath: string): Promise<{ success: boolean; filePath?: string; error?: string }> =>
    ipcRenderer.invoke('rename-file', oldPath, newPath),

  // 复制文件
  copyFile: (filePath: string, newPath: string): Promise<{ success: boolean; filePath?: string; error?: string }> =>
    ipcRenderer.invoke('copy-file', filePath, newPath),

  // Schema JSON file operations
  createSchemaJsonDirectory: (schemaName: string): Promise<{ success: boolean; path?: string; error?: string }> =>
    ipcRenderer.invoke('create-schema-json-directory', schemaName),

  writeSchemaJsonFile: (schemaName: string, fileName: string, content: string): Promise<{ success: boolean; filePath?: string; error?: string }> =>
    ipcRenderer.invoke('write-schema-json-file', schemaName, fileName, content),

  listSchemaJsonFiles: (schemaName: string): Promise<{ success: boolean; files?: Array<{ name: string; path: string; content: any }>; error?: string }> =>
    ipcRenderer.invoke('list-schema-json-files', schemaName),
}

// 通过 contextBridge 安全地暴露 API
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// 类型声明（确保 TypeScript 识别）
export type ElectronAPI = typeof electronAPI