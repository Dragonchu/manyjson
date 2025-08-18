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

// Logging utility for renderer process
function logInfo(message: string, ...args: any[]) {
  console.log(`[RENDERER-INFO] ${new Date().toISOString()} - ${message}`, ...args)
}

function logError(message: string, error?: any) {
  console.error(`[RENDERER-ERROR] ${new Date().toISOString()} - ${message}`, error)
}

function logDebug(message: string, ...args: any[]) {
  console.log(`[RENDERER-DEBUG] ${new Date().toISOString()} - ${message}`, ...args)
}

export const useAppStore = defineStore('app', () => {
  // State
  const currentSchema = ref<SchemaInfo | null>(null)
  const currentJsonFile = ref<JsonFile | null>(null)
  const schemas = ref<SchemaInfo[]>([])
  const jsonFiles = ref<JsonFile[]>([])
  const isEditMode = ref(false)
  const isViewingSchema = ref(false)
  const isEditingSchema = ref(false)
  const originalJsonContent = ref<string | null>(null)
  const originalSchemaContent = ref<string | null>(null)
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
  }

  function setSchemaViewMode(enabled: boolean) {
    isViewingSchema.value = enabled
    if (enabled) {
      currentJsonFile.value = null
      isEditMode.value = false
      isEditingSchema.value = false
    }
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
  }

  function showStatus(message: string, type: 'success' | 'error' | 'info' = 'info') {
    statusMessage.value = message
    statusType.value = type
    
    logInfo(`Status message: [${type.toUpperCase()}] ${message}`)
    
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
      logError('Schema validation compilation error', error)
      return {
        isValid: false,
        errors: [{ message: `Schema compilation error: ${error}` }]
      }
    }
  }

  async function addSchema(name: string, content: any): Promise<boolean> {
    logInfo('addSchema called', { 
      name, 
      hasContent: !!content, 
      hasElectronAPI: !!window.electronAPI,
      electronAPIType: typeof window.electronAPI,
      hasWriteConfigFile: !!(window.electronAPI?.writeConfigFile),
      writeConfigFileType: typeof window.electronAPI?.writeConfigFile,
      isElectronContext: typeof window !== 'undefined' && window.electronAPI !== undefined
    })
    
    try {
      // Validate schema name
      if (!name.trim()) {
        logError('Empty schema name provided')
        showStatus('Schema name cannot be empty', 'error')
        return false
      }

      // Ensure .json extension
      const schemaName = name.endsWith('.json') ? name : `${name}.json`
      logDebug('Schema name after extension check', { originalName: name, schemaName })
      
      // Check for duplicate names
      if (schemas.value.some(schema => schema.name === schemaName)) {
        logError('Duplicate schema name', { schemaName, existingSchemas: schemas.value.map(s => s.name) })
        showStatus('A schema with this name already exists', 'error')
        return false
      }

      // Validate schema content
      try {
        ajv.compile(content)
        logDebug('Schema content validation passed')
      } catch (error) {
        logError('Invalid schema content', { error, content })
        showStatus(`Invalid schema: ${error}`, 'error')
        return false
      }

      // Check if electronAPI is available and properly initialized
      if (window.electronAPI && typeof window.electronAPI.writeConfigFile === 'function') {
        logInfo('Using Electron API to write config file - attempting writeConfigFile call')
        
        try {
          const result = await window.electronAPI.writeConfigFile(schemaName, JSON.stringify(content, null, 2))
          logInfo('Electron API writeConfigFile result', result)
          
          if (result.success && result.filePath) {
            const newSchema: SchemaInfo = {
              name: schemaName,
              path: result.filePath,
              content,
              associatedFiles: []
            }
            
            schemas.value.push(newSchema)
            logInfo('Schema added successfully via Electron API', { schemaName, filePath: result.filePath })
            showStatus(`Schema "${schemaName}" created successfully at ${result.filePath}`, 'success')
            return true
          } else {
            logError('Electron API returned failure', { result })
            showStatus(`Failed to write file: ${result.error || 'Unknown error'}`, 'error')
            return false
          }
        } catch (electronError) {
          logError('Exception during Electron API call', electronError)
          showStatus(`Error communicating with file system: ${electronError}`, 'error')
          return false
        }
      } else {
        logInfo('Electron API not available or not properly initialized, using fallback mode', {
          hasElectronAPI: !!window.electronAPI,
          hasWriteConfigFile: !!(window.electronAPI?.writeConfigFile),
          writeConfigFileType: typeof window.electronAPI?.writeConfigFile
        })
        
        // Fallback for web mode - add to memory only
        const newSchema: SchemaInfo = {
          name: schemaName,
          path: `mock:///${schemaName}`,
          content,
          associatedFiles: []
        }
        
        schemas.value.push(newSchema)
        logInfo('Schema added in fallback mode', { schemaName })
        showStatus(`Schema "${schemaName}" created (web mode - not saved to disk)`, 'success')
        return true
      }
    } catch (error) {
      logError('Unexpected error in addSchema', error)
      showStatus(`Failed to add schema: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
      return false
    }
  }

  async function loadSchemas() {
    logInfo('loadSchemas called')
    
    try {
      if (window.electronAPI) {
        logInfo('Using Electron API to load schemas from config directory')
        
        try {
          const result = await window.electronAPI.listConfigFiles()
          logInfo('Electron API listConfigFiles result', { success: result.success, fileCount: result.files?.length })
          
          if (result.success && result.files) {
            const loadedSchemas: SchemaInfo[] = []
            
            // Load each schema and its associated JSON files
            for (const file of result.files) {
              const schemaInfo: SchemaInfo = {
                name: file.name,
                path: file.path,
                content: file.content,
                associatedFiles: []
              }
              
              // Load associated JSON files for this schema
              const associatedFiles = await loadSchemaJsonFiles(file.name)
              schemaInfo.associatedFiles = associatedFiles
              
              loadedSchemas.push(schemaInfo)
            }
            
            schemas.value = loadedSchemas
            
            // Also load any additional associations from the old system
            await loadSchemaAssociations()
            
            logInfo('Schemas and associated files loaded from config directory', { 
              schemaCount: loadedSchemas.length,
              totalJsonFiles: loadedSchemas.reduce((sum, s) => sum + s.associatedFiles.length, 0)
            })
            showStatus(`Loaded ${loadedSchemas.length} schemas with associated JSON files`, 'success')
            return
          } else {
            logError('Failed to load from config directory', { error: result.error })
          }
        } catch (electronError) {
          logError('Exception during Electron API listConfigFiles call', electronError)
        }
      } else {
        logInfo('Electron API not available')
      }
      
      // Fallback: Mock data for development/web mode
      logInfo('Using fallback mock data')
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
      logInfo('Mock schemas loaded', { count: mockSchemas.length })
      showStatus('Schemas loaded successfully (mock data)', 'success')
    } catch (error) {
      logError('Unexpected error in loadSchemas', error)
      showStatus('Failed to load schemas', 'error')
    }
  }

  async function loadJsonFiles() {
    logInfo('loadJsonFiles called')
    
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
          errors: [] as any[]
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
          errors: [] as any[]
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
          errors: [] as any[]
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
      logInfo('JSON files loaded and validated', { count: mockJsonFiles.length })
      showStatus('JSON files loaded and validated', 'success')
    } catch (error) {
      logError('Unexpected error in loadJsonFiles', error)
      showStatus('Failed to load JSON files', 'error')
    }
  }

  async function saveJsonFile(filePath: string, content: string): Promise<boolean> {
    logInfo('saveJsonFile called', { filePath, contentLength: content.length })
    
    try {
      if (window.electronAPI) {
        logInfo('Using Electron API to save JSON file')
        
        try {
          const result = await window.electronAPI.writeJsonFile(filePath, content)
          logInfo('Electron API writeJsonFile result', result)
          
          if (result.success) {
            logInfo('File saved successfully via Electron API')
            showStatus('File saved successfully', 'success')
            return true
          } else {
            logError('Electron API returned failure for saveJsonFile', { error: result.error })
            showStatus(`Failed to save file: ${result.error}`, 'error')
            return false
          }
        } catch (electronError) {
          logError('Exception during Electron API writeJsonFile call', electronError)
          showStatus(`Error saving file: ${electronError}`, 'error')
          return false
        }
      } else {
        // Fallback for web mode
        logInfo('Electron API not available, using fallback for saveJsonFile')
        showStatus('File saved (mock)', 'success')
        return true
      }
    } catch (error) {
      logError('Unexpected error in saveJsonFile', error)
      showStatus('Failed to save file', 'error')
      return false
    }
  }

  async function saveSchemaJsonFile(schemaName: string, fileName: string, content: string): Promise<{ success: boolean; filePath?: string }> {
    logInfo('saveSchemaJsonFile called', { schemaName, fileName, contentLength: content.length })
    
    try {
      if (window.electronAPI) {
        logInfo('Using Electron API to save schema JSON file')
        
        try {
          const result = await window.electronAPI.writeSchemaJsonFile(schemaName, fileName, content)
          logInfo('Electron API writeSchemaJsonFile result', result)
          
          if (result.success) {
            logInfo('Schema JSON file saved successfully via Electron API')
            showStatus('JSON file saved successfully', 'success')
            return { success: true, filePath: result.filePath }
          } else {
            logError('Electron API returned failure for saveSchemaJsonFile', { error: result.error })
            showStatus(`Failed to save JSON file: ${result.error}`, 'error')
            return { success: false }
          }
        } catch (electronError) {
          logError('Exception during Electron API writeSchemaJsonFile call', electronError)
          showStatus(`Error saving JSON file: ${electronError}`, 'error')
          return { success: false }
        }
      } else {
        // Fallback for web mode
        logInfo('Electron API not available, using fallback for saveSchemaJsonFile')
        showStatus('JSON file saved (mock)', 'success')
        return { success: true, filePath: `mock://${schemaName}/${fileName}` }
      }
    } catch (error) {
      logError('Unexpected error in saveSchemaJsonFile', error)
      showStatus('Failed to save JSON file', 'error')
      return { success: false }
    }
  }

  async function loadSchemaJsonFiles(schemaName: string): Promise<JsonFile[]> {
    logInfo('loadSchemaJsonFiles called', { schemaName })
    
    try {
      if (window.electronAPI) {
        logInfo('Using Electron API to load schema JSON files')
        
        try {
          const result = await window.electronAPI.listSchemaJsonFiles(schemaName)
          logInfo('Electron API listSchemaJsonFiles result', { success: result.success, fileCount: result.files?.length })
          
          if (result.success && result.files) {
            const jsonFiles: JsonFile[] = result.files.map(file => {
              // Validate each file against the current schema if available
              const currentSchemaObj = schemas.value.find(s => s.name === schemaName)
              let isValid = true
              let errors: any[] = []
              
              if (currentSchemaObj) {
                const validation = validateJsonWithSchema(file.content, currentSchemaObj.content)
                isValid = validation.isValid
                errors = validation.errors
              }
              
              return {
                name: file.name,
                path: file.path,
                content: file.content,
                isValid,
                errors
              }
            })
            
            logInfo('Schema JSON files loaded successfully', { schemaName, count: jsonFiles.length })
            return jsonFiles
          } else {
            logError('Failed to load schema JSON files', { schemaName, error: result.error })
            return []
          }
        } catch (electronError) {
          logError('Exception during Electron API listSchemaJsonFiles call', electronError)
          return []
        }
      } else {
        // Fallback for web mode
        logInfo('Electron API not available, using fallback for loadSchemaJsonFiles')
        return []
      }
    } catch (error) {
      logError('Unexpected error in loadSchemaJsonFiles', error)
      return []
    }
  }

  async function saveSchema(schemaPath: string, content: string): Promise<boolean> {
    logInfo('saveSchema called', { schemaPath, contentLength: content.length })
    
    try {
      if (window.electronAPI) {
        logInfo('Using Electron API to save schema file')
        
        try {
          const result = await window.electronAPI.writeJsonFile(schemaPath, content)
          logInfo('Electron API writeJsonFile result for schema', result)
          
          if (result.success) {
            logInfo('Schema saved successfully via Electron API')
            showStatus('Schema saved successfully', 'success')
            return true
          } else {
            logError('Electron API returned failure for saveSchema', { error: result.error })
            showStatus(`Failed to save schema: ${result.error}`, 'error')
            return false
          }
        } catch (electronError) {
          logError('Exception during Electron API writeJsonFile call for schema', electronError)
          showStatus(`Error saving schema: ${electronError}`, 'error')
          return false
        }
      } else {
        // Fallback for web mode
        logInfo('Electron API not available, using fallback for saveSchema')
        showStatus('Schema saved (mock)', 'success')
        return true
      }
    } catch (error) {
      logError('Unexpected error in saveSchema', error)
      showStatus('Failed to save schema', 'error')
      return false
    }
  }

  async function deleteSchema(schema: SchemaInfo): Promise<boolean> {
    logInfo('deleteSchema called', { schemaName: schema.name, schemaPath: schema.path })
    
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
          
          logInfo('Schema deleted successfully', { schemaName: schema.name })
          showStatus(`Schema "${schema.name}" deleted successfully`, 'success')
          return true
        } else {
          logError('Failed to delete schema via Electron API', { error: result.error })
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
        
        logInfo('Schema deleted in fallback mode', { schemaName: schema.name })
        showStatus(`Schema "${schema.name}" deleted (mock)`, 'success')
        return true
      }
    } catch (error) {
      logError('Unexpected error in deleteSchema', error)
      showStatus('Failed to delete schema', 'error')
      return false
    }
  }

  async function deleteJsonFile(file: JsonFile): Promise<boolean> {
    logInfo('deleteJsonFile called', { fileName: file.name, filePath: file.path })
    
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
          
          logInfo('JSON file deleted successfully', { fileName: file.name })
          showStatus(`File "${file.name}" deleted successfully`, 'success')
          return true
        } else {
          logError('Failed to delete JSON file via Electron API', { error: result.error })
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
        
        logInfo('JSON file deleted in fallback mode', { fileName: file.name })
        showStatus(`File "${file.name}" deleted (mock)`, 'success')
        return true
      }
    } catch (error) {
      logError('Unexpected error in deleteJsonFile', error)
      showStatus('Failed to delete file', 'error')
      return false
    }
  }



  async function saveSchemaAssociations(): Promise<void> {
    try {
      if (window.electronAPI && typeof window.electronAPI.writeConfigFile === 'function') {
        // Save schema associations to a config file
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
        
        await window.electronAPI.writeConfigFile('schema-associations.json', JSON.stringify(associations, null, 2))
        logInfo('Schema associations saved to config file')
      } else {
        // Fallback: save to localStorage
        const associations = schemas.value.map(schema => ({
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
        
        localStorage.setItem('schema-associations', JSON.stringify(associations))
        logInfo('Schema associations saved to localStorage')
      }
    } catch (error) {
      logError('Failed to save schema associations', error)
    }
  }

  async function loadSchemaAssociations(): Promise<void> {
    logInfo('loadSchemaAssociations called')
    
    try {
      let associations: any[] = []
      
      if (window.electronAPI && typeof window.electronAPI.listConfigFiles === 'function') {
        // Try to load from config files
        try {
          const result = await window.electronAPI.listConfigFiles()
          if (result.success && result.files) {
            const associationsFile = result.files.find(file => file.name === 'schema-associations.json')
            if (associationsFile && associationsFile.content) {
              associations = Array.isArray(associationsFile.content) ? associationsFile.content : []
              logInfo('Schema associations loaded from config file', { count: associations.length })
            }
          }
        } catch (error) {
          logInfo('No schema associations config file found or failed to load, continuing without associations')
        }
      } else {
        // Fallback: load from localStorage
        try {
          const data = localStorage.getItem('schema-associations')
          if (data) {
            associations = JSON.parse(data)
            logInfo('Schema associations loaded from localStorage', { count: associations.length })
          }
        } catch (error) {
          logInfo('No schema associations in localStorage, continuing without associations')
        }
      }
      
      // Apply associations to loaded schemas
      for (const association of associations) {
        const schema = schemas.value.find(s => s.path === association.schemaPath || s.name === association.schemaName)
        if (schema) {
          // Load associated files
          for (const fileInfo of association.associatedFiles) {
            try {
              let jsonContent = null
              
              if (window.electronAPI && typeof window.electronAPI.readFile === 'function' && !fileInfo.path.startsWith('mock://')) {
                // Try to reload the actual file content
                const fileResult = await window.electronAPI.readFile(fileInfo.path)
                if (fileResult.success) {
                  jsonContent = typeof fileResult.data === 'string' 
                    ? JSON.parse(fileResult.data) 
                    : fileResult.data
                } else {
                  logInfo(`File ${fileInfo.path} could not be loaded, using cached data if available`)
                }
              }
              
              // Use cached content if file couldn't be reloaded (for localStorage or failed file reads)
              if (!jsonContent && fileInfo.content) {
                jsonContent = fileInfo.content
              }
              
              if (jsonContent) {
                // Re-validate against current schema
                const validation = validateJsonWithSchema(jsonContent, schema.content)
                
                const jsonFile: JsonFile = {
                  name: fileInfo.name,
                  path: fileInfo.path,
                  content: jsonContent,
                  isValid: validation.isValid,
                  errors: validation.errors
                }
                
                schema.associatedFiles.push(jsonFile)
                
                // Add to global jsonFiles array if not already present
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
          
          logInfo(`Loaded ${schema.associatedFiles.length} associated files for schema ${schema.name}`)
        }
      }
      
      logInfo('Schema associations loading completed')
    } catch (error) {
      logError('Failed to load schema associations', error)
    }
  }

  return {
    // State
    currentSchema,
    currentJsonFile,
    schemas,
    jsonFiles,
    isEditMode,
    isViewingSchema,
    isEditingSchema,
    originalJsonContent,
    originalSchemaContent,
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