import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FileService } from '../../src/services/fileService'

// Mock window.electronAPI
const mockElectronAPI = {
  writeConfigFile: vi.fn(),
  writeJsonFile: vi.fn(),
  writeSchemaJsonFile: vi.fn(),
  readFile: vi.fn(),
  deleteFile: vi.fn(),
  listConfigFiles: vi.fn(),
  listSchemaJsonFiles: vi.fn(),
  createSchemaJsonDirectory: vi.fn(),
}

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
  configurable: true,
})

describe('FileService', () => {
  let fileService: FileService

  beforeEach(() => {
    fileService = new FileService()
    vi.clearAllMocks()
    
    // Reset window.electronAPI mock
    Object.defineProperty(window, 'electronAPI', {
      value: mockElectronAPI,
      writable: true,
      configurable: true,
    })
  })

  describe('writeConfigFile', () => {
    it('should write config file successfully', async () => {
      mockElectronAPI.writeConfigFile.mockResolvedValue({
        success: true,
        filePath: '/config/test.json'
      })

      const result = await fileService.writeConfigFile('test.json', '{"test": true}')

      expect(result.success).toBe(true)
      expect(result.filePath).toBe('/config/test.json')
      expect(mockElectronAPI.writeConfigFile).toHaveBeenCalledWith('test.json', '{"test": true}')
    })

    it('should handle write config file error', async () => {
      mockElectronAPI.writeConfigFile.mockResolvedValue({
        success: false,
        error: 'Permission denied'
      })

      const result = await fileService.writeConfigFile('test.json', '{"test": true}')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Permission denied')
    })

    it('should fallback to mock mode when electronAPI not available', async () => {
      // Temporarily remove electronAPI
      const originalElectronAPI = window.electronAPI
      // @ts-ignore
      delete window.electronAPI

      const result = await fileService.writeConfigFile('test.json', '{"test": true}')

      expect(result.success).toBe(true)
      expect(result.filePath).toBe('mock://config/test.json')
      
      // Restore electronAPI
      Object.defineProperty(window, 'electronAPI', {
        value: originalElectronAPI,
        writable: true,
        configurable: true,
      })
    })
  })

  describe('writeJsonFile', () => {
    it('should write JSON file successfully', async () => {
      mockElectronAPI.writeJsonFile.mockResolvedValue({
        success: true
      })

      const result = await fileService.writeJsonFile('/path/test.json', '{"test": true}')

      expect(result.success).toBe(true)
      expect(mockElectronAPI.writeJsonFile).toHaveBeenCalledWith('/path/test.json', '{"test": true}')
    })

    it('should handle write JSON file error', async () => {
      mockElectronAPI.writeJsonFile.mockResolvedValue({
        success: false,
        error: 'File not found'
      })

      const result = await fileService.writeJsonFile('/path/test.json', '{"test": true}')

      expect(result.success).toBe(false)
      expect(result.error).toBe('File not found')
    })
  })

  describe('writeSchemaJsonFile', () => {
    it('should write schema JSON file successfully', async () => {
      mockElectronAPI.writeSchemaJsonFile.mockResolvedValue({
        success: true,
        filePath: '/schema/test.json'
      })

      const result = await fileService.writeSchemaJsonFile('schema.json', 'test.json', '{"test": true}')

      expect(result.success).toBe(true)
      expect(result.filePath).toBe('/schema/test.json')
      expect(mockElectronAPI.writeSchemaJsonFile).toHaveBeenCalledWith('schema.json', 'test.json', '{"test": true}')
    })
  })

  describe('readFile', () => {
    it('should read file successfully', async () => {
      mockElectronAPI.readFile.mockResolvedValue({
        success: true,
        data: '{"test": true}'
      })

      const result = await fileService.readFile('/path/test.json')

      expect(result.success).toBe(true)
      expect(result.data).toBe('{"test": true}')
      expect(mockElectronAPI.readFile).toHaveBeenCalledWith('/path/test.json')
    })

    it('should handle read file error', async () => {
      mockElectronAPI.readFile.mockResolvedValue({
        success: false,
        error: 'File not found'
      })

      const result = await fileService.readFile('/path/test.json')

      expect(result.success).toBe(false)
      expect(result.error).toBe('File not found')
    })
  })

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      mockElectronAPI.deleteFile.mockResolvedValue({
        success: true
      })

      const result = await fileService.deleteFile('/path/test.json')

      expect(result.success).toBe(true)
      expect(mockElectronAPI.deleteFile).toHaveBeenCalledWith('/path/test.json')
    })

    it('should handle delete file error', async () => {
      mockElectronAPI.deleteFile.mockResolvedValue({
        success: false,
        error: 'Permission denied'
      })

      const result = await fileService.deleteFile('/path/test.json')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Permission denied')
    })
  })

  describe('listConfigFiles', () => {
    it('should list config files successfully', async () => {
      const mockFiles = [
        { name: 'schema1.json', path: '/config/schema1.json', content: { type: 'object' } },
        { name: 'schema2.json', path: '/config/schema2.json', content: { type: 'string' } }
      ]

      mockElectronAPI.listConfigFiles.mockResolvedValue({
        success: true,
        files: mockFiles
      })

      const result = await fileService.listConfigFiles()

      expect(result.success).toBe(true)
      expect(result.files).toEqual(mockFiles)
      expect(mockElectronAPI.listConfigFiles).toHaveBeenCalled()
    })

    it('should handle list config files error', async () => {
      mockElectronAPI.listConfigFiles.mockResolvedValue({
        success: false,
        error: 'Directory not found'
      })

      const result = await fileService.listConfigFiles()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Directory not found')
    })
  })

  describe('listSchemaJsonFiles', () => {
    it('should list schema JSON files successfully', async () => {
      const mockFiles = [
        { name: 'data1.json', path: '/schema/data1.json', content: { test: 1 } },
        { name: 'data2.json', path: '/schema/data2.json', content: { test: 2 } }
      ]

      mockElectronAPI.listSchemaJsonFiles.mockResolvedValue({
        success: true,
        files: mockFiles
      })

      const result = await fileService.listSchemaJsonFiles('schema.json')

      expect(result.success).toBe(true)
      expect(result.files).toEqual(mockFiles)
      expect(mockElectronAPI.listSchemaJsonFiles).toHaveBeenCalledWith('schema.json')
    })
  })

  describe('createSchemaJsonDirectory', () => {
    it('should create schema JSON directory successfully', async () => {
      mockElectronAPI.createSchemaJsonDirectory.mockResolvedValue({
        success: true
      })

      const result = await fileService.createSchemaJsonDirectory('schema.json')

      expect(result.success).toBe(true)
      expect(mockElectronAPI.createSchemaJsonDirectory).toHaveBeenCalledWith('schema.json')
    })

    it('should handle create directory error', async () => {
      mockElectronAPI.createSchemaJsonDirectory.mockResolvedValue({
        success: false,
        error: 'Permission denied'
      })

      const result = await fileService.createSchemaJsonDirectory('schema.json')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Permission denied')
    })
  })

  describe('Exception handling', () => {
    it('should handle exceptions in writeConfigFile', async () => {
      mockElectronAPI.writeConfigFile.mockRejectedValue(new Error('Network error'))

      const result = await fileService.writeConfigFile('test.json', '{"test": true}')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to write config file')
    })

    it('should handle exceptions in readFile', async () => {
      mockElectronAPI.readFile.mockRejectedValue(new Error('Network error'))

      const result = await fileService.readFile('/path/test.json')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to read file')
    })
  })
})