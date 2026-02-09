import Ajv from 'ajv'
import addFormats from 'ajv-formats'

export interface ValidationResult {
  isValid: boolean
  errors: any[]
}

/**
 * Shared AJV singleton instance.
 *
 * Re-use this across the entire application to avoid redundant schema
 * compilation and memory overhead from multiple AJV instances.
 */
let _sharedAjv: Ajv | null = null

export function getSharedAjv(): Ajv {
  if (!_sharedAjv) {
    _sharedAjv = new Ajv({ allErrors: true, verbose: true, strict: false })
    addFormats(_sharedAjv)
  }
  return _sharedAjv
}

export class ValidationService {
  private ajv: Ajv

  constructor() {
    this.ajv = getSharedAjv()
  }

  validateSchema(schema: any): ValidationResult {
    try {
      this.ajv.compile(schema)
      return { isValid: true, errors: [] }
    } catch (error) {
      return { isValid: false, errors: [{ message: `Invalid schema: ${String(error)}` }] }
    }
  }

  validateJson(data: any, schema: any): ValidationResult {
    try {
      const validate = this.ajv.compile(schema)
      const isValid = validate(data)
      return {
        isValid,
        errors: validate.errors || []
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [{ message: `Schema compilation error: ${String(error)}` }]
      }
    }
  }
}

