/**
 * Validation Composable - Provides validation functionality to components
 * This layer provides easy access to validation services from components
 */

import { validationService, type ValidationResult, type SchemaValidationResult } from '@/services'

export function useValidation() {
  /**
   * Validate JSON data against a schema
   */
  const validateJsonWithSchema = (jsonData: any, schema: any): ValidationResult => {
    return validationService.validateJsonWithSchema(jsonData, schema)
  }

  /**
   * Validate schema content
   */
  const validateSchema = (schema: any): SchemaValidationResult => {
    return validationService.validateSchema(schema)
  }

  /**
   * Validate JSON string format
   */
  const validateJsonString = (jsonString: string): ValidationResult & { parsed?: any } => {
    return validationService.validateJsonString(jsonString)
  }

  /**
   * Validate file name
   */
  const validateFileName = (fileName: string, type: 'schema' | 'json' = 'json'): ValidationResult & { error?: string } => {
    return validationService.validateFileName(fileName, type)
  }

  /**
   * Validate content size
   */
  const validateContentSize = (content: string, maxSize?: number): ValidationResult & { error?: string } => {
    return validationService.validateContentSize(content, maxSize)
  }

  /**
   * Comprehensive form validation for schema creation
   */
  const validateSchemaForm = (name: string, content: string, existingNames: string[] = []) => {
    const errors: string[] = []

    // Validate name
    const nameValidation = validateFileName(name, 'schema')
    if (!nameValidation.isValid) {
      errors.push(nameValidation.error!)
    }

    // Check for duplicate names
    const finalSchemaName = name.endsWith('.json') ? name : `${name}.json`
    if (existingNames.includes(finalSchemaName)) {
      errors.push('A schema with this name already exists')
    }

    // Validate content
    if (!content.trim()) {
      errors.push('Schema content is required')
    } else {
      // Validate content size
      const sizeValidation = validateContentSize(content)
      if (!sizeValidation.isValid) {
        errors.push(sizeValidation.error!)
      }

      // Validate JSON format
      const jsonValidation = validateJsonString(content)
      if (!jsonValidation.isValid) {
        errors.push('Invalid JSON format')
      } else {
        // Validate schema structure
        const schemaValidation = validateSchema(jsonValidation.parsed)
        if (!schemaValidation.isValid) {
          errors.push(schemaValidation.compilationError || 'Invalid schema structure')
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Comprehensive form validation for JSON file creation
   */
  const validateJsonFileForm = (fileName: string, content: string, schema?: any) => {
    const errors: string[] = []

    // Validate file name
    const nameValidation = validateFileName(fileName, 'json')
    if (!nameValidation.isValid) {
      errors.push(nameValidation.error!)
    }

    // Validate content
    if (!content.trim()) {
      errors.push('JSON content is required')
    } else {
      // Validate content size
      const sizeValidation = validateContentSize(content)
      if (!sizeValidation.isValid) {
        errors.push(sizeValidation.error!)
      }

      // Validate JSON format
      const jsonValidation = validateJsonString(content)
      if (!jsonValidation.isValid) {
        errors.push('Invalid JSON format')
      } else if (schema) {
        // Validate against schema
        const schemaValidation = validateJsonWithSchema(jsonValidation.parsed, schema)
        if (!schemaValidation.isValid) {
          errors.push(`JSON validation failed: ${schemaValidation.errors.length} errors`)
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  return {
    validateJsonWithSchema,
    validateSchema,
    validateJsonString,
    validateFileName,
    validateContentSize,
    validateSchemaForm,
    validateJsonFileForm
  }
}