import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useValidation } from '../../src/composables/useValidation'

// Mock the validation service
vi.mock('../../src/services', () => ({
  validationService: {
    validateJsonWithSchema: vi.fn(),
    validateSchema: vi.fn(),
    validateJsonString: vi.fn(),
    validateFileName: vi.fn(),
    validateContentSize: vi.fn()
  }
}))

import { validationService } from '../../src/services'

describe('useValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateJsonWithSchema', () => {
    it('should validate JSON with schema', () => {
      const mockResult = { isValid: true, errors: [] }
      vi.mocked(validationService.validateJsonWithSchema).mockReturnValue(mockResult)

      const { validateJsonWithSchema } = useValidation()
      const result = validateJsonWithSchema({ test: true }, { type: 'object' })

      expect(result).toBe(mockResult)
      expect(validationService.validateJsonWithSchema).toHaveBeenCalledWith({ test: true }, { type: 'object' })
    })
  })

  describe('validateSchema', () => {
    it('should validate schema', () => {
      const mockResult = { isValid: true, errors: [] }
      vi.mocked(validationService.validateSchema).mockReturnValue(mockResult)

      const { validateSchema } = useValidation()
      const result = validateSchema({ type: 'object' })

      expect(result).toBe(mockResult)
      expect(validationService.validateSchema).toHaveBeenCalledWith({ type: 'object' })
    })
  })

  describe('validateJsonString', () => {
    it('should validate JSON string', () => {
      const mockResult = { isValid: true, errors: [], parsed: { test: true } }
      vi.mocked(validationService.validateJsonString).mockReturnValue(mockResult)

      const { validateJsonString } = useValidation()
      const result = validateJsonString('{"test": true}')

      expect(result).toBe(mockResult)
      expect(validationService.validateJsonString).toHaveBeenCalledWith('{"test": true}')
    })
  })

  describe('validateFileName', () => {
    it('should validate file name with default type', () => {
      const mockResult = { isValid: true, errors: [] }
      vi.mocked(validationService.validateFileName).mockReturnValue(mockResult)

      const { validateFileName } = useValidation()
      const result = validateFileName('test.json')

      expect(result).toBe(mockResult)
      expect(validationService.validateFileName).toHaveBeenCalledWith('test.json', 'json')
    })

    it('should validate file name with schema type', () => {
      const mockResult = { isValid: true, errors: [] }
      vi.mocked(validationService.validateFileName).mockReturnValue(mockResult)

      const { validateFileName } = useValidation()
      const result = validateFileName('test-schema.json', 'schema')

      expect(result).toBe(mockResult)
      expect(validationService.validateFileName).toHaveBeenCalledWith('test-schema.json', 'schema')
    })
  })

  describe('validateContentSize', () => {
    it('should validate content size with default limit', () => {
      const mockResult = { isValid: true, errors: [] }
      vi.mocked(validationService.validateContentSize).mockReturnValue(mockResult)

      const { validateContentSize } = useValidation()
      const result = validateContentSize('small content')

      expect(result).toBe(mockResult)
      expect(validationService.validateContentSize).toHaveBeenCalledWith('small content', undefined)
    })

    it('should validate content size with custom limit', () => {
      const mockResult = { isValid: false, errors: [], error: 'Too large' }
      vi.mocked(validationService.validateContentSize).mockReturnValue(mockResult)

      const { validateContentSize } = useValidation()
      const result = validateContentSize('large content', 100)

      expect(result).toBe(mockResult)
      expect(validationService.validateContentSize).toHaveBeenCalledWith('large content', 100)
    })
  })

  describe('validateSchemaForm', () => {
    it('should validate complete schema form successfully', () => {
      // Mock all validations to pass
      vi.mocked(validationService.validateFileName).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateContentSize).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateJsonString).mockReturnValue({ 
        isValid: true, 
        errors: [], 
        parsed: { type: 'object' }
      })
      vi.mocked(validationService.validateSchema).mockReturnValue({ isValid: true, errors: [] })

      const { validateSchemaForm } = useValidation()
      const result = validateSchemaForm('test-schema', '{"type": "object"}', [])

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should detect invalid schema name', () => {
      vi.mocked(validationService.validateFileName).mockReturnValue({ 
        isValid: false, 
        errors: [], 
        error: 'Invalid name' 
      })

      const { validateSchemaForm } = useValidation()
      const result = validateSchemaForm('', '{"type": "object"}', [])

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid name')
    })

    it('should detect duplicate schema name', () => {
      vi.mocked(validationService.validateFileName).mockReturnValue({ isValid: true, errors: [] })

      const { validateSchemaForm } = useValidation()
      const result = validateSchemaForm('existing-schema', '{"type": "object"}', ['existing-schema.json'])

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('A schema with this name already exists')
    })

    it('should detect empty content', () => {
      vi.mocked(validationService.validateFileName).mockReturnValue({ isValid: true, errors: [] })

      const { validateSchemaForm } = useValidation()
      const result = validateSchemaForm('test-schema', '', [])

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Schema content is required')
    })

    it('should detect content too large', () => {
      vi.mocked(validationService.validateFileName).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateContentSize).mockReturnValue({ 
        isValid: false, 
        errors: [], 
        error: 'Content too large' 
      })

      const { validateSchemaForm } = useValidation()
      const result = validateSchemaForm('test-schema', 'large content', [])

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Content too large')
    })

    it('should detect invalid JSON format', () => {
      vi.mocked(validationService.validateFileName).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateContentSize).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateJsonString).mockReturnValue({ isValid: false, errors: [] })

      const { validateSchemaForm } = useValidation()
      const result = validateSchemaForm('test-schema', 'invalid json', [])

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid JSON format')
    })

    it('should detect invalid schema structure', () => {
      vi.mocked(validationService.validateFileName).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateContentSize).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateJsonString).mockReturnValue({ 
        isValid: true, 
        errors: [], 
        parsed: { type: 'invalid' }
      })
      vi.mocked(validationService.validateSchema).mockReturnValue({ 
        isValid: false, 
        errors: [],
        compilationError: 'Invalid schema structure'
      })

      const { validateSchemaForm } = useValidation()
      const result = validateSchemaForm('test-schema', '{"type": "invalid"}', [])

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid schema structure')
    })
  })

  describe('validateJsonFileForm', () => {
    it('should validate complete JSON file form successfully', () => {
      vi.mocked(validationService.validateFileName).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateContentSize).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateJsonString).mockReturnValue({ 
        isValid: true, 
        errors: [], 
        parsed: { name: 'John' }
      })
      vi.mocked(validationService.validateJsonWithSchema).mockReturnValue({ isValid: true, errors: [] })

      const { validateJsonFileForm } = useValidation()
      const result = validateJsonFileForm('test.json', '{"name": "John"}', { type: 'object' })

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should validate without schema', () => {
      vi.mocked(validationService.validateFileName).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateContentSize).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateJsonString).mockReturnValue({ 
        isValid: true, 
        errors: [], 
        parsed: { name: 'John' }
      })

      const { validateJsonFileForm } = useValidation()
      const result = validateJsonFileForm('test.json', '{"name": "John"}')

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
      expect(validationService.validateJsonWithSchema).not.toHaveBeenCalled()
    })

    it('should detect schema validation failure', () => {
      vi.mocked(validationService.validateFileName).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateContentSize).mockReturnValue({ isValid: true, errors: [] })
      vi.mocked(validationService.validateJsonString).mockReturnValue({ 
        isValid: true, 
        errors: [], 
        parsed: { name: 'John' }
      })
      vi.mocked(validationService.validateJsonWithSchema).mockReturnValue({ 
        isValid: false, 
        errors: [{}, {}] // 2 errors
      })

      const { validateJsonFileForm } = useValidation()
      const result = validateJsonFileForm('test.json', '{"name": "John"}', { type: 'object' })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('JSON validation failed: 2 errors')
    })
  })
})