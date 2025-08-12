/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  electronAPI: {
    writeJsonFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
    showOpenDialog: (options: any) => Promise<{ canceled: boolean; filePaths: string[] }>
    showSaveDialog: (options: any) => Promise<{ canceled: boolean; filePath?: string }>
    deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>
  }
}