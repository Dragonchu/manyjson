import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SchemaService } from '../../src/services/schemaService'

// Mock the dependencies
vi.mock('../../src/services/fileService', () => ({
  fileService: {
    writeConfigFile: vi.fn(),
    listConfigFiles: vi.fn(),
    writeSchemaJsonFile: vi.fn(),
    listSchemaJsonFiles: vi.fn(),
    deleteFile: vi.fn(),
    readFile: vi.fn()
  }
}))

vi.mock('../../src/services/validationService', () => ({
  validationService: {
    validateFileName: vi.fn(),
    validateSchema: vi.fn(),
    validateContentSize: vi.fn(),
    validateJsonString: vi.fn(),
    validateJsonWithSchema: vi.fn()
  }
}))

vi.mock('../../src/services/logService', () => ({
  logService: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

import { fileService } from '../../src/services/fileService'
import { validationService } from '../../src/services/validationService'
import { logService } from '../../src/services/logService'

describe('SchemaService', () => {
  let schemaService: SchemaService

  beforeEach(() => {
    schemaService = new SchemaService()
    vi.clearAllMocks()
  })

  describe('createSchema', () => {
    it('should create schema successfully', async () => {
      const mockSchema = { type: 'object', properties: { name: { type: 'string' } } }
      
      // Mock validations to pass
      vi.mocked(validationService.validateFileName).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateSchema).mockReturnValue({ isValid: true, errors: [] })
      
      // Mock file service to succeed
      vi.mocked(fileService.writeConfigFile).mockResolvedValue({
        success: true,
        filePath: '/config/test-schema.json'
      })

      const result = await schemaService.createSchema('test-schema', mockSchema)

      expect(result.success).toBe(true)
      expect(result.schema).toBeDefined()
      expect(result.schema?.name).toBe('test-schema.json')
      expect(result.schema?.path).toBe('/config/test-schema.json')
      expect(result.schema?.content).toEqual(mockSchema)
      expect(result.schema?.associatedFiles).toEqual([])

      expect(validationService.validateFileName).toHaveBeenCalledWith('test-schema', 'schema')
      expect(validationService.validateSchema).toHaveBeenCalledWith(mockSchema)
      expect(fileService.writeConfigFile).toHaveBeenCalledWith('test-schema.json', JSON.stringify(mockSchema, null, 2))
    })

    it('should handle invalid schema name', async () => {
      vi.mocked(validationService.validateFileName).mockReturnValue({ 
        isValid: false, 
        errors: [], 
        error: 'Invalid name' 
      })

      const result = await schemaService.createSchema('', { type: 'object' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid name')
      expect(result.schema).toBeUndefined()
    })

    it('should handle invalid schema content', async () => {
      vi.mocked(validationService.validateFileName).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateSchema).mockReturnValue({ 
        isValid: false, 
        errors: [],
        compilationError: 'Invalid schema structure'
      })

      const result = await schemaService.createSchema('test', { type: 'invalid' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid schema structure')
    })

    it('should handle file write failure', async () => {
      vi.mocked(validationService.validateFileName).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateSchema).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(fileService.writeConfigFile).mockResolvedValue({
        success: false,
        error: 'Permission denied'
      })

      const result = await schemaService.createSchema('test', { type: 'object' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Permission denied')
    })
  })

  describe('loadSchemas', () => {
    it('should load schemas successfully', async () => {
      const mockFiles = [
        {
          name: 'schema1.json',
          path: '/config/schema1.json',
          content: { type: 'object' }
        },
        {
          name: 'schema2.json',
          path: '/config/schema2.json',
          content: { type: 'string' }
        },
        {
          name: 'schema-associations.json', // Should be ignored
          path: '/config/schema-associations.json',
          content: []
        }
      ]

      vi.mocked(fileService.listConfigFiles).mockResolvedValue({
        success: true,
        files: mockFiles
      })

      // Mock schema validation to pass for valid schemas
      vi.mocked(validationService.validateSchema).mockReturnValue({ isValid: true, errors: [] })

      const result = await schemaService.loadSchemas()

      expect(result).toHaveLength(2) // Should exclude schema-associations.json
      expect(result[0].name).toBe('schema1.json')
      expect(result[0].content).toEqual({ type: 'object' })
      expect(result[1].name).toBe('schema2.json')
      expect(result[1].content).toEqual({ type: 'string' })
    })

    it('should handle file service failure', async () => {
      vi.mocked(fileService.listConfigFiles).mockResolvedValue({
        success: false,
        error: 'Directory not found'
      })

      const result = await schemaService.loadSchemas()

      expect(result).toEqual([])
      expect(logService.error).toHaveBeenCalledWith('Failed to load schemas', 'Directory not found')
    })

    it('should skip invalid schema files', async () => {
      const mockFiles = [
        {
          name: 'valid-schema.json',
          path: '/config/valid-schema.json',
          content: { type: 'object' }
        },
        {
          name: 'invalid-schema.json',
          path: '/config/invalid-schema.json',
          content: { type: 'invalid' }
        }
      ]

      vi.mocked(fileService.listConfigFiles).mockResolvedValue({
        success: true,
        files: mockFiles
      })

      // Mock validation: first schema passes, second fails
      vi.mocked(validationService.validateSchema)
        .mockReturnValueOnce({ isValid: true, errors: [] })
        .mockReturnValueOnce({ isValid: false, errors: [], compilationError: 'Invalid type' })

      const result = await schemaService.loadSchemas()

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('valid-schema.json')
      expect(logService.warn).toHaveBeenCalledWith(
        'Invalid schema file skipped',
        { fileName: 'invalid-schema.json', error: 'Invalid type' }
      )
    })
  })

  describe('createSchemaJsonFile', () => {
    it('should create schema JSON file successfully', async () => {
      const content = '{"name": "John", "age": 30}'
      
      vi.mocked(validationService.validateFileName).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateContentSize).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateJsonString).mockReturnValue({ 
        isValid: true, 
        errors: [], 
        parsed: { name: 'John', age: 30 }
      })
      vi.mocked(fileService.writeSchemaJsonFile).mockResolvedValue({
        success: true,
        filePath: '/schema/test.json'
      })

      const result = await schemaService.createSchemaJsonFile('schema.json', 'test.json', content)

      expect(result.success).toBe(true)
      expect(result.filePath).toBe('/schema/test.json')
    })

    it('should handle invalid file name', async () => {
      vi.mocked(validationService.validateFileName).mockReturnValue({ 
        isValid: false, 
        errors: [], 
        error: 'Invalid name' 
      })

      const result = await schemaService.createSchemaJsonFile('schema.json', '', '{}')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid name')
    })

    it('should handle content too large', async () => {
      vi.mocked(validationService.validateFileName).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateContentSize).mockReturnValue({ 
        isValid: false, 
        errors: [], 
        error: 'Content too large' 
      })

      const result = await schemaService.createSchemaJsonFile('schema.json', 'test.json', 'large content')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Content too large')
    })

    it('should handle invalid JSON format', async () => {
      vi.mocked(validationService.validateFileName).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateContentSize).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateJsonString).mockReturnValue({ isValid: false, errors: [] })

      const result = await schemaService.createSchemaJsonFile('schema.json', 'test.json', 'invalid json')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid JSON format')
    })
  })

  describe('loadSchemaJsonFiles', () => {
    it('should load schema JSON files successfully', async () => {
      const mockSchema = {
        name: 'schema.json',
        path: '/config/schema.json',
        content: { type: 'object' },
        associatedFiles: []
      }

      const mockFiles = [
        { name: 'data1.json', path: '/schema/data1.json', content: { test: 1 } },
        { name: 'data2.json', path: '/schema/data2.json', content: { test: 2 } }
      ]

      vi.mocked(fileService.listSchemaJsonFiles).mockResolvedValue({
        success: true,
        files: mockFiles
      })

      vi.mocked(validationService.validateJsonWithSchema).mockReturnValue({
        isValid: true,
        errors: []
      })

      const result = await schemaService.loadSchemaJsonFiles('schema.json', mockSchema)

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('data1.json')
      expect(result[0].isValid).toBe(true)
      expect(result[1].name).toBe('data2.json')
      expect(result[1].isValid).toBe(true)
    })

    it('should handle file service failure', async () => {
      const mockSchema = {
        name: 'schema.json',
        path: '/config/schema.json',
        content: { type: 'object' },
        associatedFiles: []
      }

      vi.mocked(fileService.listSchemaJsonFiles).mockResolvedValue({
        success: false,
        error: 'Directory not found'
      })

      const result = await schemaService.loadSchemaJsonFiles('schema.json', mockSchema)

      expect(result).toEqual([])
    })
  })

  describe('deleteSchema', () => {
    it('should delete schema successfully', async () => {
      const mockSchema = {
        name: 'test-schema.json',
        path: '/config/test-schema.json',
        content: { type: 'object' },
        associatedFiles: []
      }

      vi.mocked(fileService.deleteFile).mockResolvedValue({
        success: true
      })

      const result = await schemaService.deleteSchema(mockSchema)

      expect(result.success).toBe(true)
      expect(fileService.deleteFile).toHaveBeenCalledWith('/config/test-schema.json')
    })

    it('should handle delete failure', async () => {
      const mockSchema = {
        name: 'test-schema.json',
        path: '/config/test-schema.json',
        content: { type: 'object' },
        associatedFiles: []
      }

      vi.mocked(fileService.deleteFile).mockResolvedValue({
        success: false,
        error: 'Permission denied'
      })

      const result = await schemaService.deleteSchema(mockSchema)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Permission denied')
    })
  })
})