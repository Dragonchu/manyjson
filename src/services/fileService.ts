export interface WriteResult {
  success: boolean
  filePath?: string
  error?: string
}

export interface FileInfo<T = any> {
  name: string
  path: string
  content: T
}

export class FileService {
  async writeJsonFile(filePath: string, content: string): Promise<WriteResult> {
    if (window.electronAPI?.writeJsonFile) {
      try {
        const result = await window.electronAPI.writeJsonFile(filePath, content)
        return result
      } catch (error: any) {
        return { success: false, error: String(error) }
      }
    }
    return { success: true, filePath }
  }

  async deleteFile(filePath: string): Promise<WriteResult> {
    if (window.electronAPI?.deleteFile) {
      try {
        const result = await window.electronAPI.deleteFile(filePath)
        return result
      } catch (error: any) {
        return { success: false, error: String(error) }
      }
    }
    return { success: true }
  }

  async writeConfigFile(fileName: string, content: string): Promise<WriteResult> {
    if (window.electronAPI?.writeConfigFile) {
      try {
        const result = await window.electronAPI.writeConfigFile(fileName, content)
        return result
      } catch (error: any) {
        return { success: false, error: String(error) }
      }
    }
    return { success: true, filePath: `mock:///${fileName}` }
  }

  async listConfigFiles(): Promise<{ success: boolean; files?: FileInfo[]; error?: string }> {
    if (window.electronAPI?.listConfigFiles) {
      try {
        const result = await window.electronAPI.listConfigFiles()
        return result
      } catch (error: any) {
        return { success: false, error: String(error) }
      }
    }
    return { success: true, files: [] }
  }

  async readFile<T = any>(filePath: string): Promise<{ success: boolean; data?: T; error?: string }> {
    if (window.electronAPI?.readFile) {
      try {
        const result = await window.electronAPI.readFile(filePath)
        return result
      } catch (error: any) {
        return { success: false, error: String(error) }
      }
    }
    return { success: false, error: 'readFile not available in web mode' }
  }

  async writeSchemaJsonFile(schemaName: string, fileName: string, content: string): Promise<WriteResult> {
    if (window.electronAPI?.writeSchemaJsonFile) {
      try {
        const result = await window.electronAPI.writeSchemaJsonFile(schemaName, fileName, content)
        return result
      } catch (error: any) {
        return { success: false, error: String(error) }
      }
    }
    return { success: true, filePath: `mock://${schemaName}/${fileName}` }
  }

  async listSchemaJsonFiles(schemaName: string): Promise<{ success: boolean; files?: FileInfo[]; error?: string }> {
    if (window.electronAPI?.listSchemaJsonFiles) {
      try {
        const result = await window.electronAPI.listSchemaJsonFiles(schemaName)
        return result
      } catch (error: any) {
        return { success: false, error: String(error) }
      }
    }
    return { success: true, files: [] }
  }

  async renameFile(oldPath: string, newPath: string): Promise<WriteResult> {
    if (window.electronAPI?.renameFile) {
      try {
        const result = await window.electronAPI.renameFile(oldPath, newPath)
        return result
      } catch (error: any) {
        return { success: false, error: String(error) }
      }
    }
    // Web mode fallback: pretend success
    return { success: true, filePath: newPath }
  }

  async copyFile(filePath: string, newPath: string): Promise<WriteResult> {
    if (window.electronAPI?.copyFile) {
      try {
        const result = await window.electronAPI.copyFile(filePath, newPath)
        return result
      } catch (error: any) {
        return { success: false, error: String(error) }
      }
    }
    // Web mode fallback: pretend success
    return { success: true, filePath: newPath }
  }
}

