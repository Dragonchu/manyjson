import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore, type SchemaInfo, type JsonFile } from '../../src/stores/app'

describe('App Store (Refactored)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const store = useAppStore()
      
      expect(store.currentSchema).toBeNull()
      expect(store.currentJsonFile).toBeNull()
      expect(store.schemas).toEqual([])
      expect(store.jsonFiles).toEqual([])
      expect(store.isEditMode).toBe(false)
      expect(store.isViewingSchema).toBe(false)
      expect(store.isEditingSchema).toBe(false)
      expect(store.statusMessage).toBe('')
      expect(store.statusType).toBe('info')
    })

    it('should have correct computed properties', () => {
      const store = useAppStore()
      
      expect(store.hasCurrentSchema).toBe(false)
      expect(store.hasCurrentJsonFile).toBe(false)
      expect(store.currentSchemaFiles).toEqual([])
    })
  })

  describe('Schema State Management', () => {
    it('should set current schema', () => {
      const store = useAppStore()
      const mockSchema: SchemaInfo = {
        name: 'test-schema.json',
        path: '/test/path',
        content: { type: 'object' },
        associatedFiles: []
      }

      store.setCurrentSchema(mockSchema)
      
      expect(store.currentSchema).toBe(mockSchema)
      expect(store.hasCurrentSchema).toBe(true)
      expect(store.currentJsonFile).toBeNull()
      expect(store.isEditMode).toBe(false)
      expect(store.isViewingSchema).toBe(false)
      expect(store.isEditingSchema).toBe(false)
    })

    it('should add schema to store', () => {
      const store = useAppStore()
      const mockSchema: SchemaInfo = {
        name: 'test-schema.json',
        path: '/test/path',
        content: { type: 'object' },
        associatedFiles: []
      }

      store.addSchemaToStore(mockSchema)
      
      expect(store.schemas).toContain(mockSchema)
      expect(store.schemas).toHaveLength(1)
    })

    it('should remove schema from store', () => {
      const store = useAppStore()
      const mockSchema: SchemaInfo = {
        name: 'test-schema.json',
        path: '/test/path',
        content: { type: 'object' },
        associatedFiles: []
      }

      store.addSchemaToStore(mockSchema)
      expect(store.schemas).toHaveLength(1)

      store.removeSchemaFromStore(mockSchema)
      expect(store.schemas).toHaveLength(0)
    })

    it('should update schema in store', () => {
      const store = useAppStore()
      const originalSchema: SchemaInfo = {
        name: 'test-schema.json',
        path: '/test/path',
        content: { type: 'object' },
        associatedFiles: []
      }

      store.addSchemaToStore(originalSchema)

      const updatedSchema: SchemaInfo = {
        ...originalSchema,
        content: { type: 'string' }
      }

      store.updateSchemaInStore(updatedSchema)
      
      expect(store.schemas[0].content).toEqual({ type: 'string' })
    })
  })

  describe('JSON File State Management', () => {
    it('should set current JSON file', () => {
      const store = useAppStore()
      const mockFile: JsonFile = {
        name: 'test.json',
        path: '/test/test.json',
        content: { test: true },
        isValid: true,
        errors: []
      }

      store.setCurrentJsonFile(mockFile)
      
      expect(store.currentJsonFile).toBe(mockFile)
      expect(store.hasCurrentJsonFile).toBe(true)
      expect(store.isEditMode).toBe(false)
    })

    it('should add JSON file to store', () => {
      const store = useAppStore()
      const mockFile: JsonFile = {
        name: 'test.json',
        path: '/test/test.json',
        content: { test: true },
        isValid: true,
        errors: []
      }

      store.addJsonFileToStore(mockFile)
      
      expect(store.jsonFiles).toContain(mockFile)
      expect(store.jsonFiles).toHaveLength(1)
    })

    it('should update existing JSON file in store', () => {
      const store = useAppStore()
      const originalFile: JsonFile = {
        name: 'test.json',
        path: '/test/test.json',
        content: { test: true },
        isValid: true,
        errors: []
      }

      store.addJsonFileToStore(originalFile)

      const updatedFile: JsonFile = {
        ...originalFile,
        content: { test: false }
      }

      store.addJsonFileToStore(updatedFile)
      
      expect(store.jsonFiles).toHaveLength(1)
      expect(store.jsonFiles[0].content).toEqual({ test: false })
    })

    it('should remove JSON file from store', () => {
      const store = useAppStore()
      const mockFile: JsonFile = {
        name: 'test.json',
        path: '/test/test.json',
        content: { test: true },
        isValid: true,
        errors: []
      }

      store.addJsonFileToStore(mockFile)
      expect(store.jsonFiles).toHaveLength(1)

      store.removeJsonFileFromStore(mockFile)
      expect(store.jsonFiles).toHaveLength(0)
    })
  })

  describe('UI Mode Management', () => {
    it('should set edit mode', () => {
      const store = useAppStore()
      const mockFile: JsonFile = {
        name: 'test.json',
        path: '/test/test.json',
        content: { test: true },
        isValid: true,
        errors: []
      }

      store.setCurrentJsonFile(mockFile)
      store.setEditMode(true)
      
      expect(store.isEditMode).toBe(true)
      expect(store.isViewingSchema).toBe(false)
      expect(store.isEditingSchema).toBe(false)
      expect(store.originalJsonContent).toBe('{\n  "test": true\n}')
    })

    it('should set schema view mode', () => {
      const store = useAppStore()
      const mockSchema: SchemaInfo = {
        name: 'test-schema.json',
        path: '/test/path',
        content: { type: 'object' },
        associatedFiles: []
      }

      store.setCurrentSchema(mockSchema)
      store.setSchemaViewMode(true)
      
      expect(store.isViewingSchema).toBe(true)
      expect(store.isEditMode).toBe(false)
      expect(store.isEditingSchema).toBe(false)
      expect(store.currentJsonFile).toBeNull()
    })

    it('should set schema edit mode', () => {
      const store = useAppStore()
      const mockSchema: SchemaInfo = {
        name: 'test-schema.json',
        path: '/test/path',
        content: { type: 'object' },
        associatedFiles: []
      }

      store.setCurrentSchema(mockSchema)
      store.setSchemaEditMode(true)
      
      expect(store.isEditingSchema).toBe(true)
      expect(store.isEditMode).toBe(false)
      expect(store.isViewingSchema).toBe(false)
      expect(store.currentJsonFile).toBeNull()
      expect(store.originalSchemaContent).toBe('{\n  "type": "object"\n}')
    })
  })

  describe('Schema-File Association Management', () => {
    it('should add file to schema', () => {
      const store = useAppStore()
      const mockSchema: SchemaInfo = {
        name: 'test-schema.json',
        path: '/test/path',
        content: { type: 'object' },
        associatedFiles: []
      }
      const mockFile: JsonFile = {
        name: 'test.json',
        path: '/test/test.json',
        content: { test: true },
        isValid: true,
        errors: []
      }

      store.addSchemaToStore(mockSchema)
      store.addFileToSchema(mockSchema, mockFile)
      
      expect(mockSchema.associatedFiles).toContain(mockFile)
      expect(mockSchema.associatedFiles).toHaveLength(1)
    })

    it('should remove file from schema', () => {
      const store = useAppStore()
      const mockFile: JsonFile = {
        name: 'test.json',
        path: '/test/test.json',
        content: { test: true },
        isValid: true,
        errors: []
      }
      const mockSchema: SchemaInfo = {
        name: 'test-schema.json',
        path: '/test/path',
        content: { type: 'object' },
        associatedFiles: [mockFile]
      }

      store.addSchemaToStore(mockSchema)
      store.removeFileFromSchema(mockSchema, mockFile)
      
      expect(mockSchema.associatedFiles).toHaveLength(0)
    })

    it('should set schema associated files', () => {
      const store = useAppStore()
      const mockFiles: JsonFile[] = [
        {
          name: 'test1.json',
          path: '/test/test1.json',
          content: { test: 1 },
          isValid: true,
          errors: []
        },
        {
          name: 'test2.json',
          path: '/test/test2.json',
          content: { test: 2 },
          isValid: true,
          errors: []
        }
      ]
      const mockSchema: SchemaInfo = {
        name: 'test-schema.json',
        path: '/test/path',
        content: { type: 'object' },
        associatedFiles: []
      }

      store.addSchemaToStore(mockSchema)
      store.setSchemaAssociatedFiles(mockSchema, mockFiles)
      
      expect(mockSchema.associatedFiles).toEqual(mockFiles)
      expect(mockSchema.associatedFiles).toHaveLength(2)
    })
  })

  describe('Status Management', () => {
    it('should show status message', () => {
      const store = useAppStore()
      
      store.showStatus('Test message', 'success')
      
      expect(store.statusMessage).toBe('Test message')
      expect(store.statusType).toBe('success')
    })

    it('should auto-clear status message', (done) => {
      const store = useAppStore()
      
      store.showStatus('Test message', 'error')
      expect(store.statusMessage).toBe('Test message')
      
      setTimeout(() => {
        expect(store.statusMessage).toBe('')
        done()
      }, 3100)
    })
  })
})