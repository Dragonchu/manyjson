import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

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

export const useAppStore = defineStore('app', () => {
  // State
  const currentSchema = ref<SchemaInfo | null>(null)
  const currentJsonFile = ref<JsonFile | null>(null)
  const schemas = ref<SchemaInfo[]>([])
  const jsonFiles = ref<JsonFile[]>([])
  const isEditMode = ref(false)
  const originalJsonContent = ref<string | null>(null)
  const statusMessage = ref('')
  const statusType = ref<'success' | 'error' | 'info'>('info')

  // JSON Schema validator
  const ajv = new Ajv({ allErrors: true })
  addFormats(ajv)

  // Computed
  const hasCurrentSchema = computed(() => currentSchema.value !== null)
  const hasCurrentJsonFile = computed(() => currentJsonFile.value !== null)
  const currentSchemaFiles = computed(() => {
    if (!currentSchema.value) return []
    return currentSchema.value.associatedFiles
  })

  // Actions
  function setCurrentSchema(schema: SchemaInfo | null) {
    currentSchema.value = schema
    currentJsonFile.value = null
    isEditMode.value = false
  }

  function setCurrentJsonFile(file: JsonFile | null) {
    currentJsonFile.value = file
    isEditMode.value = false
  }

  function setEditMode(enabled: boolean) {
    isEditMode.value = enabled
    if (enabled && currentJsonFile.value) {
      originalJsonContent.value = JSON.stringify(currentJsonFile.value.content, null, 2)
    }
  }

  function showStatus(message: string, type: 'success' | 'error' | 'info' = 'info') {
    statusMessage.value = message
    statusType.value = type
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusMessage.value = ''
    }, 3000)
  }

  function validateJsonWithSchema(jsonData: any, schema: any): { isValid: boolean; errors: any[] } {
    try {
      const validate = ajv.compile(schema)
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

  async function addSchema(name: string, content: any): Promise<boolean> {
    try {
      // Validate schema name
      if (!name.trim()) {
        showStatus('Schema name cannot be empty', 'error')
        return false
      }

      // Ensure .json extension
      const schemaName = name.endsWith('.json') ? name : `${name}.json`
      
      // Check for duplicate names
      if (schemas.value.some(schema => schema.name === schemaName)) {
        showStatus('A schema with this name already exists', 'error')
        return false
      }

      // Validate schema content
      try {
        ajv.compile(content)
      } catch (error) {
        showStatus(`Invalid schema: ${error}`, 'error')
        return false
      }

      if (window.electronAPI) {
        // Use Electron config directory
        const result = await window.electronAPI.writeConfigFile(schemaName, JSON.stringify(content, null, 2))
        if (result.success && result.filePath) {
          const newSchema: SchemaInfo = {
            name: schemaName,
            path: result.filePath,
            content,
            associatedFiles: []
          }
          
          schemas.value.push(newSchema)
          showStatus(`Schema "${schemaName}" created successfully`, 'success')
          return true
        } else {
          showStatus(`Failed to write file: ${result.error}`, 'error')
          return false
        }
      } else {
        // Fallback for web mode - add to memory only
        const newSchema: SchemaInfo = {
          name: schemaName,
          path: `mock:///${schemaName}`,
          content,
          associatedFiles: []
        }
        
        schemas.value.push(newSchema)
        showStatus(`Schema "${schemaName}" created (mock mode)`, 'success')
        return true
      }
    } catch (error) {
      console.error('Failed to add schema:', error)
      showStatus('Failed to add schema', 'error')
      return false
    }
  }

  async function loadSchemas() {
    try {
      if (window.electronAPI) {
        // Load schemas from config directory
        const result = await window.electronAPI.listConfigFiles()
        if (result.success && result.files) {
          const loadedSchemas: SchemaInfo[] = result.files.map(file => ({
            name: file.name,
            path: file.path,
            content: file.content,
            associatedFiles: []
          }))
          
          schemas.value = loadedSchemas
          await loadJsonFiles()
          showStatus(`Loaded ${loadedSchemas.length} schemas from config directory`, 'success')
          return
        } else {
          console.warn('Failed to load from config directory:', result.error)
        }
      }
      
      // Fallback: Mock data for development/web mode
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
      showStatus('Schemas loaded successfully (mock data)', 'success')
    } catch (error) {
      console.error('Failed to load schemas:', error)
      showStatus('Failed to load schemas', 'error')
    }
  }

  async function loadJsonFiles() {
    try {
      // Mock JSON files - in real app, this would scan the file system
      const mockJsonFiles = [
        {
          name: 'user-data-1.json',
          path: '/workspace/user-data-1.json',
          content: {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "age": 30
          },
          isValid: true,
          errors: []
        },
        {
          name: 'user-data-invalid.json',
          path: '/workspace/user-data-invalid.json',
          content: {
            "id": "invalid",
            "name": "",
            "email": "invalid-email"
          },
          isValid: false,
          errors: []
        },
        {
          name: 'product-data-1.json',
          path: '/workspace/product-data-1.json',
          content: {
            "id": 1,
            "title": "Sample Product",
            "price": 29.99,
            "category": "Electronics"
          },
          isValid: true,
          errors: []
        }
      ]

      // Associate files with schemas and validate
      for (const file of mockJsonFiles) {
        const associatedSchema = schemas.value.find(schema => {
          return file.name.includes('user') ? schema.name.includes('user') : schema.name.includes('product')
        })
        
        if (associatedSchema) {
          const validation = validateJsonWithSchema(file.content, associatedSchema.content)
          file.isValid = validation.isValid
          file.errors = validation.errors
          associatedSchema.associatedFiles.push(file)
        }
      }

      jsonFiles.value = mockJsonFiles
      showStatus('JSON files loaded and validated', 'success')
    } catch (error) {
      console.error('Failed to load JSON files:', error)
      showStatus('Failed to load JSON files', 'error')
    }
  }

  async function saveJsonFile(filePath: string, content: string): Promise<boolean> {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.writeJsonFile(filePath, content)
        if (result.success) {
          showStatus('File saved successfully', 'success')
          return true
        } else {
          showStatus(`Failed to save file: ${result.error}`, 'error')
          return false
        }
      } else {
        // Fallback for web mode
        console.log('Saving file:', filePath, content)
        showStatus('File saved (mock)', 'success')
        return true
      }
    } catch (error) {
      console.error('Failed to save file:', error)
      showStatus('Failed to save file', 'error')
      return false
    }
  }

  async function deleteSchema(schema: SchemaInfo): Promise<boolean> {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.deleteFile(schema.path)
        if (result.success) {
          // Remove the schema from the store
          const schemaIndex = schemas.value.findIndex(s => s.path === schema.path)
          if (schemaIndex !== -1) {
            schemas.value.splice(schemaIndex, 1)
          }
          
          // Clear current selection if the deleted schema was selected
          if (currentSchema.value && currentSchema.value.path === schema.path) {
            currentSchema.value = null
            currentJsonFile.value = null
          }
          
          showStatus(`Schema "${schema.name}" deleted successfully`, 'success')
          return true
        } else {
          showStatus(`Failed to delete schema: ${result.error}`, 'error')
          return false
        }
      } else {
        // Fallback for web mode - just remove from store
        const schemaIndex = schemas.value.findIndex(s => s.path === schema.path)
        if (schemaIndex !== -1) {
          schemas.value.splice(schemaIndex, 1)
        }
        
        // Clear current selection if the deleted schema was selected
        if (currentSchema.value && currentSchema.value.path === schema.path) {
          currentSchema.value = null
          currentJsonFile.value = null
        }
        
        showStatus(`Schema "${schema.name}" deleted (mock)`, 'success')
        return true
      }
    } catch (error) {
      console.error('Failed to delete schema:', error)
      showStatus('Failed to delete schema', 'error')
      return false
    }
  }

  async function deleteJsonFile(file: JsonFile): Promise<boolean> {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.deleteFile(file.path)
        if (result.success) {
          // Remove the file from the store
          const fileIndex = jsonFiles.value.findIndex(f => f.path === file.path)
          if (fileIndex !== -1) {
            jsonFiles.value.splice(fileIndex, 1)
          }
          
          // Remove from associated schema
          for (const schema of schemas.value) {
            const associatedFileIndex = schema.associatedFiles.findIndex(f => f.path === file.path)
            if (associatedFileIndex !== -1) {
              schema.associatedFiles.splice(associatedFileIndex, 1)
              break
            }
          }
          
          // Clear current selection if the deleted file was selected
          if (currentJsonFile.value && currentJsonFile.value.path === file.path) {
            currentJsonFile.value = null
          }
          
          showStatus(`File "${file.name}" deleted successfully`, 'success')
          return true
        } else {
          showStatus(`Failed to delete file: ${result.error}`, 'error')
          return false
        }
      } else {
        // Fallback for web mode - just remove from store
        const fileIndex = jsonFiles.value.findIndex(f => f.path === file.path)
        if (fileIndex !== -1) {
          jsonFiles.value.splice(fileIndex, 1)
        }
        
        // Remove from associated schema
        for (const schema of schemas.value) {
          const associatedFileIndex = schema.associatedFiles.findIndex(f => f.path === file.path)
          if (associatedFileIndex !== -1) {
            schema.associatedFiles.splice(associatedFileIndex, 1)
            break
          }
        }
        
        // Clear current selection if the deleted file was selected
        if (currentJsonFile.value && currentJsonFile.value.path === file.path) {
          currentJsonFile.value = null
        }
        
        showStatus(`File "${file.name}" deleted (mock)`, 'success')
        return true
      }
    } catch (error) {
      console.error('Failed to delete file:', error)
      showStatus('Failed to delete file', 'error')
      return false
    }
  }

  return {
    // State
    currentSchema,
    currentJsonFile,
    schemas,
    jsonFiles,
    isEditMode,
    originalJsonContent,
    statusMessage,
    statusType,
    
    // Computed
    hasCurrentSchema,
    hasCurrentJsonFile,
    currentSchemaFiles,
    
    // Actions
    setCurrentSchema,
    setCurrentJsonFile,
    setEditMode,
    showStatus,
    validateJsonWithSchema,
    addSchema,
    loadSchemas,
    loadJsonFiles,
    saveJsonFile,
    deleteSchema,
    deleteJsonFile
  }
})