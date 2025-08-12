/*
  Preload 脚本：在渲染进程中提供安全的 Node.js API 访问
  - 通过 contextBridge 暴露有限的 API 给渲染进程
  - 确保渲染进程无法直接访问 Node.js API，提升安全性
*/

import { contextBridge, ipcRenderer } from 'electron'

// 定义暴露给渲染进程的 API
const electronAPI = {
  // 文件写入
  writeJsonFile: (filePath: string, content: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('write-json-file', filePath, content),

  // 打开文件对话框
  showOpenDialog: (options: any): Promise<{ canceled: boolean; filePaths: string[] }> =>
    ipcRenderer.invoke('show-open-dialog', options),

  // 保存文件对话框
  showSaveDialog: (options: any): Promise<{ canceled: boolean; filePath?: string }> =>
    ipcRenderer.invoke('show-save-dialog', options),
}

// 通过 contextBridge 安全地暴露 API
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// 类型声明（确保 TypeScript 识别）
export type ElectronAPI = typeof electronAPI