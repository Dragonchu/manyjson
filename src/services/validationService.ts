import Ajv, { ErrorObject } from 'ajv'
import addFormats from 'ajv-formats'

export interface ValidationResult {
  isValid: boolean
  errors: ErrorObject[] | null | undefined
}

export class ValidationService {
  private ajv: Ajv

  constructor() {
    this.ajv = new Ajv({ allErrors: true })
    addFormats(this.ajv)
  }

  validateJson(data: any, schema: any): ValidationResult {
    try {
      const validate = this.ajv.compile(schema)
      const isValid = validate(data)
      return {
        isValid: Boolean(isValid),
        errors: validate.errors
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [{ message: `Schema compilation error: ${String(error)}` } as any]
      }
    }
  }

  validateSchema(schema: any): { ok: boolean; error?: string } {
    try {
      this.ajv.compile(schema)
      return { ok: true }
    } catch (error: any) {
      return { ok: false, error: String(error) }
    }
  }
}

