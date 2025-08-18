import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSchemas } from '../../src/composables/useSchemas'

// Mock the services
const mockSchemaService = {
  createSchema: vi.fn(),
  loadSchemas: vi.fn(),
  deleteSchema: vi.fn(),
  loadSchemaAssociations: vi.fn(),
  saveSchemaAssociations: vi.fn()
}

vi.mock('../../src/services', () => ({
  schemaService: mockSchemaService
}))

describe('useSchemas', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('createSchema', () => {
    it('should create schema successfully', async () => {
      const mockSchema = {
        name: 'test-schema.json',
        path: '/config/test-schema.json',
        content: { type: 'object' },
        associatedFiles: []
      }

      mockSchemaService.createSchema.mockResolvedValue({
        success: true,
        schema: mockSchema
      })

      const { createSchema, schemas } = useSchemas()
      const result = await createSchema('test-schema', { type: 'object' })

      expect(result).toBe(true)
      expect(schemas.value).toContain(mockSchema)
      expect(mockSchemaService.createSchema).toHaveBeenCalledWith('test-schema', { type: 'object' })
    })

    it('should handle schema creation failure', async () => {
      mockSchemaService.createSchema.mockResolvedValue({
        success: false,
        error: 'Invalid schema'
      })

      const { createSchema, schemas } = useSchemas()
      const result = await createSchema('test-schema', { type: 'invalid' })

      expect(result).toBe(false)
      expect(schemas.value).toHaveLength(0)
    })
  })

  describe('loadSchemas', () => {
    it('should load schemas successfully', async () => {
      const mockSchemas = [
        {
          name: 'schema1.json',
          path: '/config/schema1.json',
          content: { type: 'object' },
          associatedFiles: []
        },
        {
          name: 'schema2.json',
          path: '/config/schema2.json',
          content: { type: 'string' },
          associatedFiles: []
        }
      ]

      mockSchemaService.loadSchemas.mockResolvedValue(mockSchemas)
      mockSchemaService.loadSchemaAssociations.mockResolvedValue(undefined)

      const { loadSchemas, schemas } = useSchemas()
      await loadSchemas()

      expect(schemas.value).toEqual(mockSchemas)
      expect(mockSchemaService.loadSchemas).toHaveBeenCalled()
      expect(mockSchemaService.loadSchemaAssociations).toHaveBeenCalledWith(mockSchemas)
    })

    it('should handle load schemas failure', async () => {
      mockSchemaService.loadSchemas.mockRejectedValue(new Error('Load failed'))

      const { loadSchemas, schemas } = useSchemas()
      await loadSchemas()

      expect(schemas.value).toEqual([])
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

      mockSchemaService.deleteSchema.mockResolvedValue({
        success: true
      })

      const { deleteSchema, selectSchema, schemas, currentSchema } = useSchemas()
      
      // Add schema to store first
      schemas.value.push(mockSchema)
      selectSchema(mockSchema)
      
      const result = await deleteSchema(mockSchema)

      expect(result).toBe(true)
      expect(schemas.value).not.toContain(mockSchema)
      expect(currentSchema.value).toBeNull()
      expect(mockSchemaService.deleteSchema).toHaveBeenCalledWith(mockSchema)
    })

    it('should handle delete schema failure', async () => {
      const mockSchema = {
        name: 'test-schema.json',
        path: '/config/test-schema.json',
        content: { type: 'object' },
        associatedFiles: []
      }

      mockSchemaService.deleteSchema.mockResolvedValue({
        success: false,
        error: 'Permission denied'
      })

      const { deleteSchema, schemas } = useSchemas()
      schemas.value.push(mockSchema)

      const result = await deleteSchema(mockSchema)

      expect(result).toBe(false)
      expect(schemas.value).toContain(mockSchema) // Should still be there
    })
  })

  describe('selectSchema', () => {
    it('should select schema', () => {
      const mockSchema = {
        name: 'test-schema.json',
        path: '/config/test-schema.json',
        content: { type: 'object' },
        associatedFiles: []
      }

      const { selectSchema, currentSchema } = useSchemas()
      selectSchema(mockSchema)

      expect(currentSchema.value).toBe(mockSchema)
    })

    it('should clear selection', () => {
      const { selectSchema, currentSchema } = useSchemas()
      selectSchema(null)

      expect(currentSchema.value).toBeNull()
    })
  })

  describe('saveSchemaAssociations', () => {
    it('should save schema associations successfully', async () => {
      mockSchemaService.saveSchemaAssociations.mockResolvedValue(undefined)

      const { saveSchemaAssociations } = useSchemas()
      await saveSchemaAssociations()

      expect(mockSchemaService.saveSchemaAssociations).toHaveBeenCalled()
    })

    it('should handle save associations failure', async () => {
      mockSchemaService.saveSchemaAssociations.mockRejectedValue(new Error('Save failed'))

      const { saveSchemaAssociations } = useSchemas()
      await saveSchemaAssociations()

      // Should not throw, but show error status
    })
  })

  describe('computed properties', () => {
    it('should provide correct computed values', () => {
      const { hasCurrentSchema, currentSchemaFiles, schemas, currentSchema } = useSchemas()

      expect(hasCurrentSchema.value).toBe(false)
      expect(currentSchemaFiles.value).toEqual([])

      const mockSchema = {
        name: 'test-schema.json',
        path: '/config/test-schema.json',
        content: { type: 'object' },
        associatedFiles: [
          {
            name: 'test.json',
            path: '/test.json',
            content: { test: true },
            isValid: true,
            errors: []
          }
        ]
      }

      schemas.value.push(mockSchema)
      currentSchema.value = mockSchema

      expect(hasCurrentSchema.value).toBe(true)
      expect(currentSchemaFiles.value).toEqual(mockSchema.associatedFiles)
    })
  })
})