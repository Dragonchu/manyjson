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
})