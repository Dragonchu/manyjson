export interface WriteResult {
  success: boolean
  filePath?: string
  error?: string
}

export interface ListFileItem<T = any> {
  name: string
  path: string
  content: T
}

export interface ListResult<T = any> {
  success: boolean
  files?: Array<ListFileItem<T>>
  error?: string
}

export class FileService {
  // Save any JSON to a path
  async writeJsonFile(filePath: string, content: string): Promise<WriteResult> {
    if ((window as any).electronAPI) {
      try {
        const result = await (window as any).electronAPI.writeJsonFile(filePath, content)
        return result
      } catch (error: any) {
        return { success: false, error: String(error) }
      }
    }
    // Fallback for web
    return { success: true }
  }

  // Save schema via config writer (by name)
  async writeConfigFile(fileName: string, content: string): Promise<WriteResult> {
    if ((window as any).electronAPI?.writeConfigFile) {
      try {
        const result = await (window as any).electronAPI.writeConfigFile(fileName, content)
        return result
      } catch (error: any) {
        return { success: false, error: String(error) }
      }
    }
    return { success: true, filePath: `mock:///${fileName}` }
  }

  async listConfigFiles<T = any>(): Promise<ListResult<T>> {
    if ((window as any).electronAPI?.listConfigFiles) {
      try {
        const result = await (window as any).electronAPI.listConfigFiles()
        return result
      } catch (error: any) {
        return { success: false, error: String(error) }
      }
    }
    return { success: true, files: [] }
  }

  async deleteFile(path: string): Promise<{ success: boolean; error?: string }> {
    if ((window as any).electronAPI?.deleteFile) {
      try {
        const result = await (window as any).electronAPI.deleteFile(path)
        return result
      } catch (error: any) {
        return { success: false, error: String(error) }
      }
    }
    return { success: true }
  }

  async readFile(path: string): Promise<{ success: boolean; data?: string | any; error?: string }> {
    if ((window as any).electronAPI?.readFile) {
      try {
        const result = await (window as any).electronAPI.readFile(path)
        return result
      } catch (error: any) {
        return { success: false, error: String(error) }
      }
    }
    return { success: false, error: 'Not supported in web mode' }
  }

  // Structured JSON file writing for schema
  async writeSchemaJsonFile(schemaName: string, fileName: string, content: string): Promise<WriteResult> {
    if ((window as any).electronAPI?.writeSchemaJsonFile) {
      try {
        const result = await (window as any).electronAPI.writeSchemaJsonFile(schemaName, fileName, content)
        return result
      } catch (error: any) {
        return { success: false, error: String(error) }
      }
    }
    return { success: true, filePath: `mock://${schemaName}/${fileName}` }
  }

  async listSchemaJsonFiles<T = any>(schemaName: string): Promise<ListResult<T>> {
    if ((window as any).electronAPI?.listSchemaJsonFiles) {
      try {
        const result = await (window as any).electronAPI.listSchemaJsonFiles(schemaName)
        return result
      } catch (error: any) {
        return { success: false, error: String(error) }
      }
    }
    return { success: true, files: [] }
  }
}

