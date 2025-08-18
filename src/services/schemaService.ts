/**
 * Schema Service - Handles schema-specific business logic
 * Separated from store to follow single responsibility principle
 */

import { fileService } from './fileService'
import { validationService } from './validationService'
import { logService } from './logService'

export interface SchemaInfo {
  name: string
  path: string
  content: any
  associatedFiles: JsonFile[]
}

export interface JsonFile {
  name: string
  path: string
  content: any
  isValid: boolean
  errors: any[]
}

export interface SchemaAssociation {
  schemaPath: string
  schemaName: string
  associatedFiles: {
    name: string
    path: string
    content: any
    isValid: boolean
    errors: any[]
  }[]
}

export class SchemaService {
  /**
   * Create a new schema
   */
  async createSchema(name: string, content: any): Promise<{ success: boolean; schema?: SchemaInfo; error?: string }> {
    logService.info('SchemaService.createSchema', { name, hasContent: !!content })

    // Validate schema name
    const nameValidation = validationService.validateFileName(name, 'schema')
    if (!nameValidation.isValid) {
      return { success: false, error: nameValidation.error }
    }

    // Ensure .json extension
    const schemaName = name.endsWith('.json') ? name : `${name}.json`

    // Validate schema content
    const schemaValidation = validationService.validateSchema(content)
    if (!schemaValidation.isValid) {
      return { 
        success: false, 
        error: schemaValidation.compilationError || 'Invalid schema content' 
      }
    }

    // Write schema file
    const fileResult = await fileService.writeConfigFile(schemaName, JSON.stringify(content, null, 2))
    if (!fileResult.success) {
      return { success: false, error: fileResult.error }
    }

    const newSchema: SchemaInfo = {
      name: schemaName,
      path: fileResult.filePath!,
      content,
      associatedFiles: []
    }

    logService.info('Schema created successfully', { schemaName, filePath: fileResult.filePath })
    return { success: true, schema: newSchema }
  }

  /**
   * Load all schemas from the file system
   */
  async loadSchemas(): Promise<SchemaInfo[]> {
    logService.info('SchemaService.loadSchemas')

    const fileResult = await fileService.listConfigFiles()
    if (!fileResult.success || !fileResult.files) {
      logService.error('Failed to load schemas', fileResult.error)
      return []
    }

    const schemas: SchemaInfo[] = []
    for (const file of fileResult.files) {
      if (file.name.endsWith('.json') && file.name !== 'schema-associations.json') {
        try {
          const content = typeof file.content === 'string' 
            ? JSON.parse(file.content) 
            : file.content

          // Validate that it's a valid schema
          const schemaValidation = validationService.validateSchema(content)
          if (schemaValidation.isValid) {
            schemas.push({
              name: file.name,
              path: file.path,
              content,
              associatedFiles: []
            })
          } else {
            logService.warn('Invalid schema file skipped', { fileName: file.name, error: schemaValidation.compilationError })
          }
        } catch (error) {
          logService.error('Failed to parse schema file', { fileName: file.name, error })
        }
      }
    }

    logService.info('Schemas loaded successfully', { count: schemas.length })
    return schemas
  }

  /**
   * Save schema associations to persistent storage
   */
  async saveSchemaAssociations(schemas: SchemaInfo[]): Promise<void> {
    logService.info('SchemaService.saveSchemaAssociations', { schemaCount: schemas.length })

    try {
      const associations: SchemaAssociation[] = schemas.map(schema => ({
        schemaPath: schema.path,
        schemaName: schema.name,
        associatedFiles: schema.associatedFiles.map(file => ({
          name: file.name,
          path: file.path,
          content: file.content,
          isValid: file.isValid,
          errors: file.errors
        }))
      }))

      const fileResult = await fileService.writeConfigFile(
        'schema-associations.json', 
        JSON.stringify(associations, null, 2)
      )

      if (!fileResult.success) {
        throw new Error(fileResult.error)
      }

      logService.info('Schema associations saved successfully')
    } catch (error) {
      logService.error('Failed to save schema associations', error)
      throw error
    }
  }

  /**
   * Load schema associations from persistent storage
   */
  async loadSchemaAssociations(schemas: SchemaInfo[]): Promise<void> {
    logService.info('SchemaService.loadSchemaAssociations')

    try {
      const fileResult = await fileService.listConfigFiles()
      if (!fileResult.success || !fileResult.files) {
        return
      }

      const associationsFile = fileResult.files.find(file => file.name === 'schema-associations.json')
      if (!associationsFile || !associationsFile.content) {
        logService.info('No schema associations file found')
        return
      }

      const associations: SchemaAssociation[] = Array.isArray(associationsFile.content) 
        ? associationsFile.content 
        : []

      // Apply associations to schemas
      for (const association of associations) {
        const schema = schemas.find(s => s.path === association.schemaPath || s.name === association.schemaName)
        if (schema) {
          // Load associated files
          for (const fileInfo of association.associatedFiles) {
            try {
              let jsonContent = null

              // Try to reload the actual file content
              const fileResult = await fileService.readFile(fileInfo.path)
              if (fileResult.success) {
                jsonContent = typeof fileResult.data === 'string' 
                  ? JSON.parse(fileResult.data) 
                  : fileResult.data
              } else {
                // Use cached content if file couldn't be reloaded
                jsonContent = fileInfo.content
              }

              if (jsonContent) {
                // Re-validate against current schema
                const validation = validationService.validateJsonWithSchema(jsonContent, schema.content)

                const jsonFile: JsonFile = {
                  name: fileInfo.name,
                  path: fileInfo.path,
                  content: jsonContent,
                  isValid: validation.isValid,
                  errors: validation.errors
                }

                schema.associatedFiles.push(jsonFile)
              }
            } catch (error) {
              logService.error(`Failed to load associated file ${fileInfo.name}`, error)
            }
          }

          logService.info(`Loaded ${schema.associatedFiles.length} associated files for schema ${schema.name}`)
        }
      }
    } catch (error) {
      logService.error('Failed to load schema associations', error)
    }
  }

  /**
   * Create and save a JSON file for a specific schema
   */
  async createSchemaJsonFile(
    schemaName: string, 
    fileName: string, 
    content: string
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    logService.info('SchemaService.createSchemaJsonFile', { schemaName, fileName })

    // Validate file name
    const nameValidation = validationService.validateFileName(fileName, 'json')
    if (!nameValidation.isValid) {
      return { success: false, error: nameValidation.error }
    }

    // Validate content size
    const sizeValidation = validationService.validateContentSize(content)
    if (!sizeValidation.isValid) {
      return { success: false, error: sizeValidation.error }
    }

    // Validate JSON format
    const jsonValidation = validationService.validateJsonString(content)
    if (!jsonValidation.isValid) {
      return { success: false, error: 'Invalid JSON format' }
    }

    // Write the file
    const fileResult = await fileService.writeSchemaJsonFile(schemaName, fileName, content)
    if (!fileResult.success) {
      return { success: false, error: fileResult.error }
    }

    logService.info('Schema JSON file created successfully', { schemaName, fileName, filePath: fileResult.filePath })
    return { success: true, filePath: fileResult.filePath }
  }

  /**
   * Load JSON files for a specific schema
   */
  async loadSchemaJsonFiles(schemaName: string, schema: SchemaInfo): Promise<JsonFile[]> {
    logService.info('SchemaService.loadSchemaJsonFiles', { schemaName })

    const fileResult = await fileService.listSchemaJsonFiles(schemaName)
    if (!fileResult.success || !fileResult.files) {
      return []
    }

    const jsonFiles: JsonFile[] = fileResult.files.map(file => {
      // Validate each file against the schema
      const validation = validationService.validateJsonWithSchema(file.content, schema.content)
      
      return {
        name: file.name,
        path: file.path,
        content: file.content,
        isValid: validation.isValid,
        errors: validation.errors
      }
    })

    logService.info('Schema JSON files loaded successfully', { schemaName, count: jsonFiles.length })
    return jsonFiles
  }

  /**
   * Delete a schema
   */
  async deleteSchema(schema: SchemaInfo): Promise<{ success: boolean; error?: string }> {
    logService.info('SchemaService.deleteSchema', { schemaName: schema.name, schemaPath: schema.path })

    const fileResult = await fileService.deleteFile(schema.path)
    if (!fileResult.success) {
      return { success: false, error: fileResult.error }
    }

    logService.info('Schema deleted successfully', { schemaName: schema.name })
    return { success: true }
  }
}

// Export singleton instance
export const schemaService = new SchemaService()