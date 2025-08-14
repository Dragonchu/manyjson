import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '../src/stores/app'

// Mock window.electronAPI
const mockElectronAPI = {
  writeConfigFile: vi.fn(),
  listConfigFiles: vi.fn(),
  writeJsonFile: vi.fn(),
  deleteFile: vi.fn(),
  getConfigDirectory: vi.fn(),
  showOpenDialog: vi.fn(),
  showSaveDialog: vi.fn(),
}

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
  configurable: true,
})

describe('App Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const store = useAppStore()
    
    expect(store.currentSchema).toBeNull()
    expect(store.currentJsonFile).toBeNull()
    expect(store.schemas).toEqual([])
    expect(store.jsonFiles).toEqual([])
    expect(store.isEditMode).toBe(false)
    expect(store.isViewingSchema).toBe(false)
    expect(store.statusMessage).toBe('')
  })

  it('should set current schema', () => {
    const store = useAppStore()
    const mockSchema = {
      name: 'test-schema.json',
      path: '/test/path',
      content: { type: 'object' },
      associatedFiles: []
    }

    store.setCurrentSchema(mockSchema)
    
    expect(store.currentSchema).toEqual(mockSchema)
    expect(store.currentJsonFile).toBeNull()
    expect(store.isEditMode).toBe(false)
    expect(store.isViewingSchema).toBe(false)
  })

  it('should set schema view mode', () => {
    const store = useAppStore()
    const mockJsonFile = {
      name: 'test.json',
      path: '/test/path.json',
      content: { name: 'test' },
      isValid: true,
      errors: []
    }

    // Set up some initial state
    store.setCurrentJsonFile(mockJsonFile)
    store.setEditMode(true)

    // Enable schema view mode
    store.setSchemaViewMode(true)
    
    expect(store.isViewingSchema).toBe(true)
    expect(store.currentJsonFile).toBeNull()
    expect(store.isEditMode).toBe(false)

    // Disable schema view mode
    store.setSchemaViewMode(false)
    
    expect(store.isViewingSchema).toBe(false)
  })

  it('should manage schema edit mode state', () => {
    const store = useAppStore()
    
    const mockJsonFile = {
      name: 'test.json',
      path: '/test.json',
      content: { name: 'test' },
      isValid: true,
      errors: []
    }

    const mockSchema = {
      name: 'test-schema',
      path: '/test-schema.json',
      content: { type: 'object' },
      associatedFiles: []
    }

    // Set up some initial state
    store.setCurrentJsonFile(mockJsonFile)
    store.setEditMode(true)
    store.setCurrentSchema(mockSchema)

    // Enable schema edit mode
    store.setSchemaEditMode(true)
    
    expect(store.isEditingSchema).toBe(true)
    expect(store.currentJsonFile).toBeNull()
    expect(store.isEditMode).toBe(false)
    expect(store.isViewingSchema).toBe(false)
    expect(store.originalSchemaContent).toBe(JSON.stringify(mockSchema.content, null, 2))

    // Disable schema edit mode
    store.setSchemaEditMode(false)
    
    expect(store.isEditingSchema).toBe(false)
  })

  it('should clear schema edit mode when setting other modes', () => {
    const store = useAppStore()
    
    const mockSchema = {
      name: 'test-schema',
      path: '/test-schema.json',
      content: { type: 'object' },
      associatedFiles: []
    }

    // Enable schema edit mode first
    store.setCurrentSchema(mockSchema)
    store.setSchemaEditMode(true)
    expect(store.isEditingSchema).toBe(true)

    // Setting current schema should clear edit mode
    store.setCurrentSchema(mockSchema)
    expect(store.isEditingSchema).toBe(false)

    // Enable schema edit mode again
    store.setSchemaEditMode(true)
    expect(store.isEditingSchema).toBe(true)

    // Setting JSON edit mode should clear schema edit mode
    const mockJsonFile = {
      name: 'test.json',
      path: '/test.json',
      content: { name: 'test' },
      isValid: true,
      errors: []
    }
    store.setCurrentJsonFile(mockJsonFile)
    store.setEditMode(true)
    expect(store.isEditingSchema).toBe(false)

    // Enable schema edit mode again
    store.setSchemaEditMode(true)
    expect(store.isEditingSchema).toBe(true)

    // Setting schema view mode should clear edit mode
    store.setSchemaViewMode(true)
    expect(store.isEditingSchema).toBe(false)
  })

  it('should validate JSON with schema', () => {
    const store = useAppStore()
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      },
      required: ['name']
    }

    const validJson = { name: 'John', age: 30 }
    const invalidJson = { age: 'thirty' }

    const validResult = store.validateJsonWithSchema(validJson, schema)
    const invalidResult = store.validateJsonWithSchema(invalidJson, schema)

    expect(validResult.isValid).toBe(true)
    expect(validResult.errors).toHaveLength(0)

    expect(invalidResult.isValid).toBe(false)
    expect(invalidResult.errors.length).toBeGreaterThan(0)
  })

  it('should show status message', () => {
    const store = useAppStore()
    
    store.showStatus('Test message', 'success')
    
    expect(store.statusMessage).toBe('Test message')
    expect(store.statusType).toBe('success')
  })

  describe('addSchema', () => {
    it('should successfully add a new schema with Electron API', async () => {
      const store = useAppStore()
      const schemaContent = {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' }
        },
        required: ['id', 'name']
      }

      mockElectronAPI.writeConfigFile.mockResolvedValue({
        success: true,
        filePath: '/config/test-schema.json'
      })

      const result = await store.addSchema('test-schema', schemaContent)

      expect(result).toBe(true)
      expect(mockElectronAPI.writeConfigFile).toHaveBeenCalledWith(
        'test-schema.json',
        JSON.stringify(schemaContent, null, 2)
      )
      expect(store.schemas).toHaveLength(1)
      expect(store.schemas[0]).toEqual({
        name: 'test-schema.json',
        path: '/config/test-schema.json',
        content: schemaContent,
        associatedFiles: []
      })
    })

    it('should add .json extension if not provided', async () => {
      const store = useAppStore()
      const schemaContent = { type: 'object' }

      mockElectronAPI.writeConfigFile.mockResolvedValue({
        success: true,
        filePath: '/config/test.json'
      })

      await store.addSchema('test', schemaContent)

      expect(mockElectronAPI.writeConfigFile).toHaveBeenCalledWith(
        'test.json',
        expect.any(String)
      )
    })

    it('should reject empty schema name', async () => {
      const store = useAppStore()
      
      const result = await store.addSchema('', { type: 'object' })
      
      expect(result).toBe(false)
      expect(store.statusMessage).toBe('Schema name cannot be empty')
      expect(store.statusType).toBe('error')
    })

    it('should reject duplicate schema names', async () => {
      const store = useAppStore()
      store.schemas.push({
        name: 'existing-schema.json',
        path: '/test/path',
        content: { type: 'object' },
        associatedFiles: []
      })

      const result = await store.addSchema('existing-schema', { type: 'object' })

      expect(result).toBe(false)
      expect(store.statusMessage).toBe('A schema with this name already exists')
      expect(store.statusType).toBe('error')
    })

    it('should reject invalid schema content', async () => {
      const store = useAppStore()
      const invalidSchema = {
        type: 'invalid-type'  // This will cause AJV compilation to fail
      }

      const result = await store.addSchema('test-schema', invalidSchema)

      expect(result).toBe(false)
      expect(store.statusMessage).toContain('Invalid schema')
      expect(store.statusType).toBe('error')
    })

    it('should handle Electron API errors', async () => {
      const store = useAppStore()
      const schemaContent = { type: 'object' }

      mockElectronAPI.writeConfigFile.mockResolvedValue({
        success: false,
        error: 'Permission denied'
      })

      const result = await store.addSchema('test-schema', schemaContent)

      expect(result).toBe(false)
      expect(store.statusMessage).toBe('Failed to write file: Permission denied')
      expect(store.statusType).toBe('error')
    })

    it('should work in fallback mode without Electron API', async () => {
      // Temporarily remove electronAPI
      const originalElectronAPI = window.electronAPI
      Object.defineProperty(window, 'electronAPI', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const store = useAppStore()
      const schemaContent = { type: 'object' }

      const result = await store.addSchema('test-schema', schemaContent)

      expect(result).toBe(true)
      expect(store.schemas).toHaveLength(1)
      expect(store.schemas[0].path).toBe('mock:///test-schema.json')

      // Restore electronAPI
      Object.defineProperty(window, 'electronAPI', {
        value: originalElectronAPI,
        writable: true,
        configurable: true,
      })
    })
  })

  describe('saveSchema', () => {
    it('should save schema successfully with Electron API', async () => {
      const store = useAppStore()
      const schemaPath = '/test/schema.json'
      const schemaContent = JSON.stringify({ type: 'object' }, null, 2)

      mockElectronAPI.writeJsonFile.mockResolvedValue({
        success: true
      })

      const result = await store.saveSchema(schemaPath, schemaContent)

      expect(result).toBe(true)
      expect(mockElectronAPI.writeJsonFile).toHaveBeenCalledWith(schemaPath, schemaContent)
      expect(store.statusMessage).toBe('Schema saved successfully')
      expect(store.statusType).toBe('success')
    })

    it('should handle Electron API save errors', async () => {
      const store = useAppStore()
      const schemaPath = '/test/schema.json'
      const schemaContent = JSON.stringify({ type: 'object' }, null, 2)

      mockElectronAPI.writeJsonFile.mockResolvedValue({
        success: false,
        error: 'Permission denied'
      })

      const result = await store.saveSchema(schemaPath, schemaContent)

      expect(result).toBe(false)
      expect(store.statusMessage).toBe('Failed to save schema: Permission denied')
      expect(store.statusType).toBe('error')
    })

    it('should work in fallback mode without Electron API', async () => {
      // Temporarily remove electronAPI
      const originalElectronAPI = window.electronAPI
      Object.defineProperty(window, 'electronAPI', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const store = useAppStore()
      const result = await store.saveSchema('/test/schema.json', '{"type": "object"}')

      expect(result).toBe(true)
      expect(store.statusMessage).toBe('Schema saved (mock)')
      expect(store.statusType).toBe('success')

      // Restore electronAPI
      Object.defineProperty(window, 'electronAPI', {
        value: originalElectronAPI,
        writable: true,
        configurable: true,
      })
    })
  })

  describe('loadSchemas', () => {
    it('should load schemas from config directory with Electron API', async () => {
      const store = useAppStore()
      const mockFiles = [
        {
          name: 'user-schema.json',
          path: '/config/user-schema.json',
          content: { type: 'object', properties: { name: { type: 'string' } } }
        },
        {
          name: 'product-schema.json',
          path: '/config/product-schema.json',
          content: { type: 'object', properties: { title: { type: 'string' } } }
        }
      ]

      mockElectronAPI.listConfigFiles.mockResolvedValue({
        success: true,
        files: mockFiles
      })

      await store.loadSchemas()

      expect(store.schemas).toHaveLength(2)
      expect(store.schemas[0].name).toBe('user-schema.json')
      expect(store.schemas[0].path).toBe('/config/user-schema.json')
      expect(store.schemas[0].content).toEqual(mockFiles[0].content)
      expect(store.statusMessage).toContain('Loaded 2 schemas with associated JSON files')
    })

    it('should fallback to mock data when Electron API fails', async () => {
      const store = useAppStore()

      mockElectronAPI.listConfigFiles.mockResolvedValue({
        success: false,
        error: 'Config directory not found'
      })

      await store.loadSchemas()

      expect(store.schemas.length).toBeGreaterThan(0)
      expect(store.statusMessage).toBe('Schemas loaded successfully (mock data)')
    })
  })
})