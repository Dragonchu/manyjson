/**
 * File Service - Handles all file operations
 * Separated from store to follow single responsibility principle
 */

export interface FileResult {
  success: boolean
  data?: any
  filePath?: string
  error?: string
}

export interface FileInfo {
  name: string
  path: string
  content: any
}

export class FileService {
  /**
   * Write a configuration file (schema)
   */
  async writeConfigFile(fileName: string, content: string): Promise<FileResult> {
    try {
      if (window.electronAPI && typeof window.electronAPI.writeConfigFile === 'function') {
        const result = await window.electronAPI.writeConfigFile(fileName, content)
        return {
          success: result.success,
          filePath: result.filePath,
          error: result.error
        }
      } else {
        // Fallback for web mode
        return {
          success: true,
          filePath: `mock://config/${fileName}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to write config file: ${error}`
      }
    }
  }

  /**
   * Write a JSON file
   */
  async writeJsonFile(filePath: string, content: string): Promise<FileResult> {
    try {
      if (window.electronAPI && typeof window.electronAPI.writeJsonFile === 'function') {
        const result = await window.electronAPI.writeJsonFile(filePath, content)
        return {
          success: result.success,
          error: result.error
        }
      } else {
        // Fallback for web mode
        return {
          success: true,
          filePath: `mock://${filePath}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to write JSON file: ${error}`
      }
    }
  }

  /**
   * Write a schema-specific JSON file
   */
  async writeSchemaJsonFile(schemaName: string, fileName: string, content: string): Promise<FileResult> {
    try {
      if (window.electronAPI && typeof window.electronAPI.writeSchemaJsonFile === 'function') {
        const result = await window.electronAPI.writeSchemaJsonFile(schemaName, fileName, content)
        return {
          success: result.success,
          filePath: result.filePath,
          error: result.error
        }
      } else {
        // Fallback for web mode
        return {
          success: true,
          filePath: `mock://${schemaName}/${fileName}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to write schema JSON file: ${error}`
      }
    }
  }

  /**
   * Read a file
   */
  async readFile(filePath: string): Promise<FileResult> {
    try {
      if (window.electronAPI && typeof window.electronAPI.readFile === 'function') {
        const result = await window.electronAPI.readFile(filePath)
        return {
          success: result.success,
          data: result.data,
          error: result.error
        }
      } else {
        // Fallback for web mode
        return {
          success: false,
          error: 'File reading not available in web mode'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to read file: ${error}`
      }
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath: string): Promise<FileResult> {
    try {
      if (window.electronAPI && typeof window.electronAPI.deleteFile === 'function') {
        const result = await window.electronAPI.deleteFile(filePath)
        return {
          success: result.success,
          error: result.error
        }
      } else {
        // Fallback for web mode
        return {
          success: true
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete file: ${error}`
      }
    }
  }

  /**
   * List configuration files
   */
  async listConfigFiles(): Promise<FileResult & { files?: FileInfo[] }> {
    try {
      if (window.electronAPI && typeof window.electronAPI.listConfigFiles === 'function') {
        const result = await window.electronAPI.listConfigFiles()
        return {
          success: result.success,
          files: result.files,
          error: result.error
        }
      } else {
        // Fallback for web mode
        return {
          success: true,
          files: []
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to list config files: ${error}`
      }
    }
  }

  /**
   * List schema-specific JSON files
   */
  async listSchemaJsonFiles(schemaName: string): Promise<FileResult & { files?: FileInfo[] }> {
    try {
      if (window.electronAPI && typeof window.electronAPI.listSchemaJsonFiles === 'function') {
        const result = await window.electronAPI.listSchemaJsonFiles(schemaName)
        return {
          success: result.success,
          files: result.files,
          error: result.error
        }
      } else {
        // Fallback for web mode
        return {
          success: true,
          files: []
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to list schema JSON files: ${error}`
      }
    }
  }

  /**
   * Create directory for schema JSON files
   */
  async createSchemaJsonDirectory(schemaName: string): Promise<FileResult> {
    try {
      if (window.electronAPI && typeof window.electronAPI.createSchemaJsonDirectory === 'function') {
        const result = await window.electronAPI.createSchemaJsonDirectory(schemaName)
        return {
          success: result.success,
          error: result.error
        }
      } else {
        // Fallback for web mode
        return {
          success: true
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to create schema directory: ${error}`
      }
    }
  }
}

// Export singleton instance
export const fileService = new FileService()