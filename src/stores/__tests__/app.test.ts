import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '../app'

describe('App Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with default state', () => {
    const store = useAppStore()
    
    expect(store.currentSchema).toBeNull()
    expect(store.currentJsonFile).toBeNull()
    expect(store.schemas).toEqual([])
    expect(store.jsonFiles).toEqual([])
    expect(store.isEditMode).toBe(false)
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

  it('should add a new schema successfully', async () => {
    const store = useAppStore()
    
    const schemaName = 'test-schema'
    const schemaContent = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' }
      },
      required: ['id', 'name']
    }

    const result = await store.addSchema(schemaName, schemaContent)
    
    expect(result).toBe(true)
    expect(store.schemas).toHaveLength(1)
    expect(store.schemas[0].name).toBe('test-schema.json')
    expect(store.schemas[0].path).toBe('/workspace/test-schema.json')
    expect(store.schemas[0].content).toEqual({
      ...schemaContent,
      $schema: 'http://json-schema.org/draft-07/schema#'
    })
    expect(store.currentSchema).toEqual(store.schemas[0])
  })

  it('should handle adding schema with string content', async () => {
    const store = useAppStore()
    
    const schemaName = 'string-schema'
    const schemaContent = JSON.stringify({
      type: 'object',
      properties: {
        test: { type: 'string' }
      }
    })

    const result = await store.addSchema(schemaName, schemaContent)
    
    expect(result).toBe(true)
    expect(store.schemas).toHaveLength(1)
    expect(store.schemas[0].content.type).toBe('object')
    expect(store.schemas[0].content.$schema).toBe('http://json-schema.org/draft-07/schema#')
  })

  it('should prevent adding duplicate schema names', async () => {
    const store = useAppStore()
    
    const schemaName = 'duplicate-schema'
    const schemaContent = { type: 'object' }

    // Add first schema
    await store.addSchema(schemaName, schemaContent)
    expect(store.schemas).toHaveLength(1)

    // Try to add duplicate
    const result = await store.addSchema(schemaName, schemaContent)
    
    expect(result).toBe(false)
    expect(store.schemas).toHaveLength(1) // Should still be 1
  })

  it('should handle invalid schema content', async () => {
    const store = useAppStore()
    
    const schemaName = 'invalid-schema'
    const invalidContent = 'invalid json content'

    const result = await store.addSchema(schemaName, invalidContent)
    
    expect(result).toBe(false)
    expect(store.schemas).toHaveLength(0)
  })
})