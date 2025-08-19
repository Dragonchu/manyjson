import Ajv from 'ajv'
import addFormats from 'ajv-formats'

export interface ValidationResult {
  isValid: boolean
  errors: any[]
}

export class ValidationService {
  private ajv: Ajv

  constructor() {
    this.ajv = new Ajv({ allErrors: true })
    addFormats(this.ajv)
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

