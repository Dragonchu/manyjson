/**
 * Validation Service - Handles all validation logic
 * Separated from store to follow single responsibility principle
 */

import Ajv from 'ajv'
import addFormats from 'ajv-formats'

export interface ValidationResult {
  isValid: boolean
  errors: any[]
}

export interface SchemaValidationResult extends ValidationResult {
  compilationError?: string
}

export class ValidationService {
  private ajv: Ajv

  constructor() {
    this.ajv = new Ajv({ allErrors: true })
    addFormats(this.ajv)
  }

  /**
   * Validate JSON data against a schema
   */
  validateJsonWithSchema(jsonData: any, schema: any): ValidationResult {
    try {
      const validate = this.ajv.compile(schema)
      const isValid = validate(jsonData)
      return {
        isValid,
        errors: validate.errors || []
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [{ message: `Schema compilation error: ${error}` }]
      }
    }
  }

  /**
   * Validate schema content itself
   */
  validateSchema(schema: any): SchemaValidationResult {
    try {
      this.ajv.compile(schema)
      return {
        isValid: true,
        errors: []
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [],
        compilationError: String(error)
      }
    }
  }

  /**
   * Validate JSON string format
   */
  validateJsonString(jsonString: string): ValidationResult & { parsed?: any } {
    try {
      const parsed = JSON.parse(jsonString)
      return {
        isValid: true,
        errors: [],
        parsed
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [{ message: `Invalid JSON format: ${error}` }]
      }
    }
  }

  /**
   * Validate file name for schema or JSON files
   */
  validateFileName(fileName: string, type: 'schema' | 'json' = 'json'): ValidationResult & { error?: string } {
    const trimmedName = fileName.trim()
    
    if (!trimmedName) {
      return { 
        isValid: false, 
        errors: [], 
        error: `${type === 'schema' ? 'Schema' : 'File'} name is required` 
      }
    }

    // Check for invalid characters
    const invalidChars = /[<>:"|?*\x00-\x1f/\\]/
    if (invalidChars.test(trimmedName)) {
      return { 
        isValid: false, 
        errors: [], 
        error: `${type === 'schema' ? 'Schema' : 'File'} name contains invalid characters` 
      }
    }

    // Check length
    if (trimmedName.length > 200) {
      return { 
        isValid: false, 
        errors: [], 
        error: `${type === 'schema' ? 'Schema' : 'File'} name is too long (maximum 200 characters)` 
      }
    }

    // Check for reserved names
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i
    if (reservedNames.test(trimmedName)) {
      return { 
        isValid: false, 
        errors: [], 
        error: `${type === 'schema' ? 'Schema' : 'File'} name uses a reserved name` 
      }
    }

    return { isValid: true, errors: [] }
  }

  /**
   * Validate content size
   */
  validateContentSize(content: string, maxSize: number = 1024 * 1024): ValidationResult & { error?: string } {
    if (content.length > maxSize) {
      return {
        isValid: false,
        errors: [],
        error: `Content is too large (maximum ${Math.round(maxSize / 1024)}KB)`
      }
    }

    return { isValid: true, errors: [] }
  }
}

// Export singleton instance
export const validationService = new ValidationService()