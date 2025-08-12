/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  electronAPI: {
    writeJsonFile: (filePath: string, content: string) => Promise<void>
    showOpenDialog: (options: any) => Promise<any>
    showSaveDialog: (options: any) => Promise<any>
  }
}