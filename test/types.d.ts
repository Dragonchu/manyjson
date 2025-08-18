/**
 * Test type declarations
 */

declare global {
  interface Window {
    electronAPI?: {
      writeConfigFile: (fileName: string, content: string) => Promise<any>
      listConfigFiles: () => Promise<any>
      writeJsonFile: (filePath: string, content: string) => Promise<any>
      writeSchemaJsonFile: (schemaName: string, fileName: string, content: string) => Promise<any>
      readFile: (filePath: string) => Promise<any>
      deleteFile: (filePath: string) => Promise<any>
      listSchemaJsonFiles: (schemaName: string) => Promise<any>
      createSchemaJsonDirectory: (schemaName: string) => Promise<any>
      getConfigDirectory: () => Promise<any>
      showOpenDialog: () => Promise<any>
      showSaveDialog: () => Promise<any>
    }
  }

  var mockElectronAPI: any
}

export {}