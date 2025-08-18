import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { FileService } from '../services/fileService'
import { ValidationService } from '../services/validationService'
import { useUIStore } from './ui'

export interface JsonFile {
  name: string
  path: string
  content: any
  isValid: boolean
  errors: any[]
}

export interface SchemaInfo {
  name: string
  path: string
  content: any
  associatedFiles: JsonFile[]
}

function logInfo(message: string, ...args: any[]) {
  console.log(`[RENDERER-INFO] ${new Date().toISOString()} - ${message}`, ...args)
}

function logError(message: string, error?: any) {
  console.error(`[RENDERER-ERROR] ${new Date().toISOString()} - ${message}`, error)
}

export const useAppStore = defineStore('app', () => {
  // State
  const currentSchema = ref<SchemaInfo | null>(null)
  const currentJsonFile = ref<JsonFile | null>(null)
  const schemas = ref<SchemaInfo[]>([])
  const jsonFiles = ref<JsonFile[]>([])

  // UI flags kept for backward compat in components. Prefer using useUIStore in new code.
  const isEditMode = ref(false)
  const isViewingSchema = ref(false)
  const isEditingSchema = ref(false)
  const originalJsonContent = ref<string | null>(null)
  const originalSchemaContent = ref<string | null>(null)

  // Services
  const fileService = new FileService()
  const validationService = new ValidationService()
  const ui = useUIStore()

  // Computed
  const hasCurrentSchema = computed(() => currentSchema.value !== null)
  const hasCurrentJsonFile = computed(() => currentJsonFile.value !== null)
  const currentSchemaFiles = computed(() => {
    if (!currentSchema.value) return []
    return currentSchema.value.associatedFiles
  })

  // UI helpers (temporarily mirrored; will migrate to ui store usage in components)
  function setCurrentSchema(schema: SchemaInfo | null) {
    currentSchema.value = schema
    currentJsonFile.value = null
    isEditMode.value = false
    isViewingSchema.value = false
    isEditingSchema.value = false
  }

  function setCurrentJsonFile(file: JsonFile | null) {
    currentJsonFile.value = file
    isEditMode.value = false
    isViewingSchema.value = false
    isEditingSchema.value = false
  }

  function setEditMode(enabled: boolean) {
    isEditMode.value = enabled
    isViewingSchema.value = false
    isEditingSchema.value = false
    if (enabled && currentJsonFile.value) {
      originalJsonContent.value = JSON.stringify(currentJsonFile.value.content, null, 2)
    }
    ui.setEditMode(enabled)
  }

  function setSchemaViewMode(enabled: boolean) {
    isViewingSchema.value = enabled
    if (enabled) {
      currentJsonFile.value = null
      isEditMode.value = false
      isEditingSchema.value = false
    }
    ui.setSchemaViewMode(enabled)
  }

  function setSchemaEditMode(enabled: boolean) {
    isEditingSchema.value = enabled
    if (enabled) {
      currentJsonFile.value = null
      isEditMode.value = false
      isViewingSchema.value = false
      if (currentSchema.value) {
        originalSchemaContent.value = JSON.stringify(currentSchema.value.content, null, 2)
      }
    }
    ui.setSchemaEditMode(enabled)
  }

  function showStatus(message: string, type: 'success' | 'error' | 'info' = 'info') {
    ui.showStatus(message, type)
    logInfo(`Status message: [${type.toUpperCase()}] ${message}`)
  }

  function validateJsonWithSchema(jsonData: any, schema: any): { isValid: boolean; errors: any[] } {
    const result = validationService.validateJson(jsonData, schema)
    return { isValid: result.isValid, errors: (result.errors as any[]) || [] }
  }

  async function addSchema(name: string, content: any): Promise<boolean> {
    try {
      if (!name.trim()) {
        showStatus('Schema name cannot be empty', 'error')
        return false
      }
      const schemaName = name.endsWith('.json') ? name : `${name}.json`
      if (schemas.value.some(s => s.name === schemaName)) {
        showStatus('A schema with this name already exists', 'error')
        return false
      }
      const schemaOk = validationService.validateSchema(content)
      if (!schemaOk.ok) {
        showStatus(`Invalid schema: ${schemaOk.error}`, 'error')
        return false
      }

      const writeResult = await fileService.writeConfigFile(schemaName, JSON.stringify(content, null, 2))
      if (writeResult.success) {
        const newSchema: SchemaInfo = {
          name: schemaName,
          path: writeResult.filePath || `mock:///${schemaName}`,
          content,
          associatedFiles: []
        }
        schemas.value.push(newSchema)
        showStatus(`Schema "${schemaName}" created successfully`, 'success')
        return true
      }
      showStatus(`Failed to write file: ${writeResult.error || 'Unknown error'}`, 'error')
      return false
    } catch (error) {
      showStatus(`Failed to add schema: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
      return false
    }
  }

  async function loadSchemas() {
    try {
      const result = await fileService.listConfigFiles<any>()
      if (result.success && result.files) {
        const loadedSchemas: SchemaInfo[] = []
        for (const file of result.files) {
          const schemaInfo: SchemaInfo = {
            name: file.name,
            path: file.path,
            content: file.content,
            associatedFiles: []
          }
          const associatedFiles = await loadSchemaJsonFiles(file.name)
          schemaInfo.associatedFiles = associatedFiles
          loadedSchemas.push(schemaInfo)
        }
        schemas.value = loadedSchemas
        await loadSchemaAssociations()
        showStatus(`Loaded ${loadedSchemas.length} schemas with associated JSON files`, 'success')
        return
      }

      // Fallback mock data (web mode)
      const mockSchemas: SchemaInfo[] = [
        {
          name: 'user-schema.json',
          path: '/workspace/user-schema.json',
          content: {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
              "id": { "type": "number" },
              "name": { "type": "string", "minLength": 1 },
              "email": { "type": "string", "format": "email" },
              "age": { "type": "number", "minimum": 0 }
            },
            "required": ["id", "name", "email"]
          },
          associatedFiles: []
        },
        {
          name: 'product-schema.json',
          path: '/workspace/product-schema.json',
          content: {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
              "id": { "type": "number" },
              "title": { "type": "string", "minLength": 1 },
              "price": { "type": "number", "minimum": 0 },
              "category": { "type": "string" }
            },
            "required": ["id", "title", "price"]
          },
          associatedFiles: []
        }
      ]
      schemas.value = mockSchemas
      await loadJsonFiles()
      await loadSchemaAssociations()
      showStatus('Schemas loaded successfully (mock data)', 'success')
    } catch (error) {
      showStatus('Failed to load schemas', 'error')
    }
  }

  async function loadJsonFiles() {
    // Only used for mock mode
    try {
      const mockJsonFiles = [
        {
          name: 'user-data-1.json',
          path: '/workspace/user-data-1.json',
          content: {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            age: 30
          },
          isValid: true,
          errors: [] as any[]
        }
      ]
      for (const file of mockJsonFiles) {
        const associatedSchema = schemas.value.find(schema => file.name.includes('user') ? schema.name.includes('user') : schema.name.includes('product'))
        if (associatedSchema) {
          const validation = validateJsonWithSchema(file.content, associatedSchema.content)
          file.isValid = validation.isValid
          file.errors = validation.errors
          associatedSchema.associatedFiles.push(file)
        }
      }
      jsonFiles.value = mockJsonFiles as any
      showStatus('JSON files loaded and validated', 'success')
    } catch (error) {
      showStatus('Failed to load JSON files', 'error')
    }
  }

  async function saveJsonFile(filePath: string, content: string): Promise<boolean> {
    const result = await fileService.writeJsonFile(filePath, content)
    if (result.success) {
      showStatus('File saved successfully', 'success')
      return true
    }
    showStatus(`Failed to save file: ${result.error}`, 'error')
    return false
  }

  async function saveSchemaJsonFile(schemaName: string, fileName: string, content: string): Promise<{ success: boolean; filePath?: string }> {
    const result = await fileService.writeSchemaJsonFile(schemaName, fileName, content)
    if (result.success) {
      showStatus('JSON file saved successfully', 'success')
      return { success: true, filePath: result.filePath }
    }
    showStatus(`Failed to save JSON file: ${result.error}`, 'error')
    return { success: false }
  }

  async function loadSchemaJsonFiles(schemaName: string): Promise<JsonFile[]> {
    const result = await fileService.listSchemaJsonFiles<any>(schemaName)
    if (result.success && result.files) {
      const currentSchemaObj = schemas.value.find(s => s.name === schemaName)
      const mapped: JsonFile[] = result.files.map(file => {
        let isValid = true
        let errors: any[] = []
        if (currentSchemaObj) {
          const validation = validateJsonWithSchema(file.content, currentSchemaObj.content)
          isValid = validation.isValid
          errors = validation.errors
        }
        return { name: file.name, path: file.path, content: file.content, isValid, errors }
      })
      return mapped
    }
    return []
  }

  async function saveSchema(schemaPath: string, content: string): Promise<boolean> {
    const result = await fileService.writeJsonFile(schemaPath, content)
    if (result.success) {
      showStatus('Schema saved successfully', 'success')
      return true
    }
    showStatus(`Failed to save schema: ${result.error}`, 'error')
    return false
  }

  async function deleteSchema(schema: SchemaInfo): Promise<boolean> {
    try {
      const result = await fileService.deleteFile(schema.path)
      if (result.success) {
        const schemaIndex = schemas.value.findIndex(s => s.path === schema.path)
        if (schemaIndex !== -1) schemas.value.splice(schemaIndex, 1)
        if (currentSchema.value && currentSchema.value.path === schema.path) {
          currentSchema.value = null
          currentJsonFile.value = null
        }
        showStatus(`Schema "${schema.name}" deleted successfully`, 'success')
        return true
      }
      showStatus(`Failed to delete schema: ${result.error}`, 'error')
      return false
    } catch (error) {
      showStatus('Failed to delete schema', 'error')
      return false
    }
  }

  async function deleteJsonFile(file: JsonFile): Promise<boolean> {
    try {
      const result = await fileService.deleteFile(file.path)
      if (result.success) {
        const fileIndex = jsonFiles.value.findIndex(f => f.path === file.path)
        if (fileIndex !== -1) jsonFiles.value.splice(fileIndex, 1)
        for (const schema of schemas.value) {
          const idx = schema.associatedFiles.findIndex(f => f.path === file.path)
          if (idx !== -1) {
            schema.associatedFiles.splice(idx, 1)
            break
          }
        }
        if (currentJsonFile.value && currentJsonFile.value.path === file.path) {
          currentJsonFile.value = null
        }
        showStatus(`File "${file.name}" deleted successfully`, 'success')
        return true
      }
      showStatus(`Failed to delete file: ${result.error}`, 'error')
      return false
    } catch (error) {
      showStatus('Failed to delete file', 'error')
      return false
    }
  }

  async function saveSchemaAssociations(): Promise<void> {
    try {
      const associations = schemas.value.map(schema => ({
        schemaPath: schema.path,
        schemaName: schema.name,
        associatedFiles: schema.associatedFiles.map(file => ({
          name: file.name,
          path: file.path,
          isValid: file.isValid,
          errors: file.errors
        }))
      }))
      const writeRes = await fileService.writeConfigFile('schema-associations.json', JSON.stringify(associations, null, 2))
      if (!writeRes.success) {
        localStorage.setItem('schema-associations', JSON.stringify(associations))
      }
    } catch (error) {
      // best effort
    }
  }

  async function loadSchemaAssociations(): Promise<void> {
    try {
      let associations: any[] = []
      try {
        const result = await fileService.listConfigFiles<any>()
        if (result.success && result.files) {
          const associationsFile = result.files.find(f => f.name === 'schema-associations.json')
          if (associationsFile && associationsFile.content) {
            associations = Array.isArray(associationsFile.content) ? associationsFile.content : []
          }
        }
      } catch {}
      if (associations.length === 0) {
        try {
          const data = localStorage.getItem('schema-associations')
          if (data) associations = JSON.parse(data)
        } catch {}
      }
      for (const association of associations) {
        const schema = schemas.value.find(s => s.path === association.schemaPath || s.name === association.schemaName)
        if (schema) {
          for (const fileInfo of association.associatedFiles) {
            try {
              let jsonContent: any = null
              if (!fileInfo.path?.startsWith('mock://')) {
                const readRes = await fileService.readFile(fileInfo.path)
                if (readRes.success) {
                  jsonContent = typeof readRes.data === 'string' ? JSON.parse(readRes.data) : readRes.data
                }
              }
              if (!jsonContent && (fileInfo as any).content) {
                jsonContent = (fileInfo as any).content
              }
              if (jsonContent) {
                const validation = validateJsonWithSchema(jsonContent, schema.content)
                const jsonFile: JsonFile = {
                  name: fileInfo.name,
                  path: fileInfo.path,
                  content: jsonContent,
                  isValid: validation.isValid,
                  errors: validation.errors
                }
                schema.associatedFiles.push(jsonFile)
                const existingFileIndex = jsonFiles.value.findIndex(f => f.path === fileInfo.path)
                if (existingFileIndex === -1) {
                  jsonFiles.value.push(jsonFile)
                } else {
                  jsonFiles.value[existingFileIndex] = jsonFile
                }
              }
            } catch (error) {
              logError(`Failed to load associated file ${fileInfo.name}`, error)
            }
          }
        }
      }
    } catch (error) {
      // best effort
    }
  }

  return {
    currentSchema,
    currentJsonFile,
    schemas,
    jsonFiles,
    isEditMode,
    isViewingSchema,
    isEditingSchema,
    originalJsonContent,
    originalSchemaContent,

    hasCurrentSchema,
    hasCurrentJsonFile,
    currentSchemaFiles,

    setCurrentSchema,
    setCurrentJsonFile,
    setEditMode,
    setSchemaViewMode,
    setSchemaEditMode,
    showStatus,
    validateJsonWithSchema,
    addSchema,
    loadSchemas,
    loadSchemaAssociations,
    loadJsonFiles,
    saveJsonFile,
    saveSchemaJsonFile,
    loadSchemaJsonFiles,
    saveSchema,
    deleteSchema,
    deleteJsonFile,
    saveSchemaAssociations
  }
})

