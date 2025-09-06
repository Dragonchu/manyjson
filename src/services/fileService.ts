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

import { getPlatformRuntime } from '@/platform/runtime'

export class FileService {
  private apis = getPlatformRuntime().apis

  async writeJsonFile(filePath: string, content: string): Promise<WriteResult> {
    try {
      return await this.apis.writeJsonFile(filePath, content)
    } catch (error: any) {
      return { success: false, error: String(error) }
    }
  }

  async deleteFile(filePath: string): Promise<WriteResult> {
    try {
      return await this.apis.deleteFile(filePath)
    } catch (error: any) {
      return { success: false, error: String(error) }
    }
  }

  async writeConfigFile(fileName: string, content: string): Promise<WriteResult> {
    try {
      return await this.apis.writeConfigFile(fileName, content)
    } catch (error: any) {
      return { success: false, error: String(error) }
    }
  }

  async listConfigFiles(): Promise<{ success: boolean; files?: FileInfo[]; error?: string }> {
    try {
      return await this.apis.listConfigFiles()
    } catch (error: any) {
      return { success: false, error: String(error) }
    }
  }

  async readFile<T = any>(filePath: string): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      return await this.apis.readFile<T>(filePath)
    } catch (error: any) {
      return { success: false, error: String(error) }
    }
  }

  async writeSchemaJsonFile(schemaName: string, fileName: string, content: string): Promise<WriteResult> {
    try {
      return await this.apis.writeSchemaJsonFile(schemaName, fileName, content)
    } catch (error: any) {
      return { success: false, error: String(error) }
    }
  }

  async listSchemaJsonFiles(schemaName: string): Promise<{ success: boolean; files?: FileInfo[]; error?: string }> {
    try {
      return await this.apis.listSchemaJsonFiles(schemaName) as any
    } catch (error: any) {
      return { success: false, error: String(error) }
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<WriteResult> {
    try {
      return await this.apis.renameFile(oldPath, newPath)
    } catch (error: any) {
      return { success: false, error: String(error) }
    }
  }

  async copyFile(filePath: string, newPath: string): Promise<WriteResult> {
    try {
      return await this.apis.copyFile(filePath, newPath)
    } catch (error: any) {
      return { success: false, error: String(error) }
    }
  }
}

