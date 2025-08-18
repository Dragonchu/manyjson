import { describe, it, expect, beforeEach } from 'vitest'
import { ValidationService } from '../../src/services/validationService'

describe('ValidationService', () => {
  let validationService: ValidationService

  beforeEach(() => {
    validationService = new ValidationService()
  })

  describe('validateJsonWithSchema', () => {
    it('should validate valid JSON against schema', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name']
      }
      const validJson = { name: 'John', age: 30 }

      const result = validationService.validateJsonWithSchema(validJson, schema)

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should detect invalid JSON against schema', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name']
      }
      const invalidJson = { age: 30 } // missing required 'name'

      const result = validationService.validateJsonWithSchema(invalidJson, schema)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain("must have required property 'name'")
    })

    it('should handle schema compilation errors', () => {
      const invalidSchema = {
        type: 'invalid-type'
      }
      const json = { test: true }

      const result = validationService.validateJsonWithSchema(json, invalidSchema)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('Schema compilation error')
    })
  })

  describe('validateSchema', () => {
    it('should validate valid schema', () => {
      const validSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      }

      const result = validationService.validateSchema(validSchema)

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
      expect(result.compilationError).toBeUndefined()
    })

    it('should detect invalid schema', () => {
      const invalidSchema = {
        type: 'invalid-type'
      }

      const result = validationService.validateSchema(invalidSchema)

      expect(result.isValid).toBe(false)
      expect(result.compilationError).toBeDefined()
    })
  })

  describe('validateJsonString', () => {
    it('should validate valid JSON string', () => {
      const validJsonString = '{"name": "John", "age": 30}'

      const result = validationService.validateJsonString(validJsonString)

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
      expect(result.parsed).toEqual({ name: 'John', age: 30 })
    })

    it('should detect invalid JSON string', () => {
      const invalidJsonString = '{"name": "John", "age": 30' // missing closing brace

      const result = validationService.validateJsonString(invalidJsonString)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('Invalid JSON format')
      expect(result.parsed).toBeUndefined()
    })

    it('should handle empty JSON string', () => {
      const emptyJsonString = ''

      const result = validationService.validateJsonString(emptyJsonString)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
    })
  })

  describe('validateFileName', () => {
    it('should validate valid file name', () => {
      const validFileName = 'test-file.json'

      const result = validationService.validateFileName(validFileName)

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
      expect(result.error).toBeUndefined()
    })

    it('should detect empty file name', () => {
      const emptyFileName = ''

      const result = validationService.validateFileName(emptyFileName)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('File name is required')
    })

    it('should detect file name with invalid characters', () => {
      const invalidFileName = 'test<file>.json'

      const result = validationService.validateFileName(invalidFileName)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('File name contains invalid characters')
    })

    it('should detect file name that is too long', () => {
      const longFileName = 'a'.repeat(201) + '.json'

      const result = validationService.validateFileName(longFileName)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('File name is too long (maximum 200 characters)')
    })

    it('should detect reserved file names', () => {
      const reservedFileName = 'CON.json'

      const result = validationService.validateFileName(reservedFileName)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('File name uses a reserved name')
    })

    it('should validate schema file names with different type', () => {
      const validSchemaName = 'test-schema'

      const result = validationService.validateFileName(validSchemaName, 'schema')

      expect(result.isValid).toBe(true)
    })

    it('should show correct error message for schema type', () => {
      const emptySchemaName = ''

      const result = validationService.validateFileName(emptySchemaName, 'schema')

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Schema name is required')
    })
  })

  describe('validateContentSize', () => {
    it('should validate content within size limit', () => {
      const smallContent = 'small content'

      const result = validationService.validateContentSize(smallContent)

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
      expect(result.error).toBeUndefined()
    })

    it('should detect content exceeding size limit', () => {
      const largeContent = 'a'.repeat(1024 * 1024 + 1) // 1MB + 1 byte

      const result = validationService.validateContentSize(largeContent)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Content is too large (maximum 1024KB)')
    })

    it('should use custom size limit', () => {
      const content = 'a'.repeat(101)
      const customLimit = 100

      const result = validationService.validateContentSize(content, customLimit)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Content is too large')
    })
  })
})