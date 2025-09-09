/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  electronAPI?: {
    readFile: (filename: string) => Promise<any>
    readTextFile: (filename: string) => Promise<{ success: boolean; content?: string; error?: string }>
    getFileStats: (filePath: string) => Promise<{ success: boolean; isFile?: boolean; isDirectory?: boolean; size?: number; modified?: Date; error?: string }>
    listDirectory: (dirPath: string) => Promise<{ success: boolean; entries?: Array<{ name: string; path: string; isFile: boolean; isDirectory: boolean; size: number; modified: Date }>; error?: string }>
    writeJsonFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
    deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>
    getConfigDirectory: () => Promise<{ success: boolean; path?: string; error?: string }>
    writeConfigFile: (fileName: string, content: string) => Promise<{ success: boolean; filePath?: string; error?: string }>
    listConfigFiles: () => Promise<{ success: boolean; files?: Array<{ name: string; path: string; content: any }>; error?: string }>
    showOpenDialog: (options: any) => Promise<{ canceled: boolean; filePaths: string[] }>
    showSaveDialog: (options: any) => Promise<{ canceled: boolean; filePath?: string }>
    renameFile?: (oldPath: string, newPath: string) => Promise<{ success: boolean; filePath?: string; error?: string }>
    copyFile?: (filePath: string, newPath: string) => Promise<{ success: boolean; filePath?: string; error?: string }>
    // Structured JSON file storage APIs
    writeSchemaJsonFile?: (schemaName: string, fileName: string, content: string) => Promise<{ success: boolean; filePath?: string; error?: string }>
    listSchemaJsonFiles?: (schemaName: string) => Promise<{ success: boolean; files?: Array<{ name: string; path: string; content: any }>; error?: string }>
  }
}

// Fallback type declarations for lz-string to satisfy TS in bundler mode
declare module 'lz-string' {
  export function compressToEncodedURIComponent(input: string): string
  export function decompressFromEncodedURIComponent(input: string): string | null
  const _default: {
    compressToEncodedURIComponent(input: string): string
    decompressFromEncodedURIComponent(input: string): string | null
  }
  export default _default
}