import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
  const originalJsonContent = ref<string | null>(null)
  const originalSchemaContent = ref<string | null>(null)

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
  }

  function setCurrentJsonFile(file: JsonFile | null) {
    currentJsonFile.value = file
  }

  // Lightweight local state mutation for composables/services
  function addSchemaLocal(input: { name: string; path: string; content: any }) {
    const newSchema: SchemaInfo = {
      name: input.name,
      path: input.path,
      content: input.content,
      associatedFiles: []
    }
    schemas.value.push(newSchema)
  }

  async function addSchema(name: string, content: any): Promise<boolean> {
    logInfo('addSchema called', { 
      name, 
      hasContent: !!content, 
      hasElectronAPI: !!window.electronAPI,
    })
    try {
      if (!name.trim()) {
        logError('Empty schema name provided')
        return false
      }
      const schemaName = name.endsWith('.json') ? name : `${name}.json`
      if (schemas.value.some(schema => schema.name === schemaName)) {
        logError('Duplicate schema name', { schemaName })
        return false
      }

      // Persist via Electron if available
      if (window.electronAPI && typeof window.electronAPI.writeConfigFile === 'function') {
        try {
          const result = await window.electronAPI.writeConfigFile(schemaName, JSON.stringify(content, null, 2))
          if (result.success && result.filePath) {
            addSchemaLocal({ name: schemaName, path: result.filePath, content })
            return true
          } else {
            logError('Electron API returned failure', { result })
            return false
          }
        } catch (electronError) {
          logError('Exception during Electron API call', electronError)
          return false
        }
      } else {
        // Fallback for web mode - add to memory only
        addSchemaLocal({ name: schemaName, path: `mock:///${schemaName}`, content })
        return true
      }
    } catch (error) {
      logError('Unexpected error in addSchema', error)
      return false
    }
  }

  async function loadSchemas() {
    logInfo('loadSchemas called')
    try {
      if (window.electronAPI?.listConfigFiles) {
        try {
          const result = await window.electronAPI.listConfigFiles()
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
            return
          }
        } catch (electronError) {
          logError('Exception during Electron API listConfigFiles call', electronError)
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
      await loadSchemaAssociations()
    } catch (error) {
      logError('Unexpected error in loadSchemas', error)
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

      // Associate files with schemas (validation handled elsewhere in UI for now)
      for (const file of mockJsonFiles) {
        const associatedSchema = schemas.value.find(schema => {
          return file.name.includes('user') ? schema.name.includes('user') : schema.name.includes('product')
        })
        if (associatedSchema) {
          associatedSchema.associatedFiles.push(file)
        }
      }

      jsonFiles.value = mockJsonFiles
      logInfo('JSON files loaded', { count: mockJsonFiles.length })
    } catch (error) {
      logError('Unexpected error in loadJsonFiles', error)
    }
  }

  async function saveJsonFile(filePath: string, content: string): Promise<boolean> {
    logInfo('saveJsonFile called', { filePath, contentLength: content.length })
    try {
      if (window.electronAPI?.writeJsonFile) {
        try {
          const result = await window.electronAPI.writeJsonFile(filePath, content)
          return !!result.success
        } catch (electronError) {
          logError('Exception during Electron API writeJsonFile call', electronError)
          return false
        }
      } else {
        // Fallback for web mode
        return true
      }
    } catch (error) {
      logError('Unexpected error in saveJsonFile', error)
      return false
    }
  }

  async function saveSchemaJsonFile(schemaName: string, fileName: string, content: string): Promise<{ success: boolean; filePath?: string }> {
    logInfo('saveSchemaJsonFile called', { schemaName, fileName, contentLength: content.length })
    try {
      if (window.electronAPI?.writeSchemaJsonFile) {
        try {
          const result = await window.electronAPI.writeSchemaJsonFile(schemaName, fileName, content)
          if (result.success) {
            return { success: true, filePath: result.filePath }
          } else {
            return { success: false }
          }
        } catch (electronError) {
          logError('Exception during Electron API writeSchemaJsonFile call', electronError)
          return { success: false }
        }
      } else {
        // Fallback for web mode
        return { success: true, filePath: `mock://${schemaName}/${fileName}` }
      }
    } catch (error) {
      logError('Unexpected error in saveSchemaJsonFile', error)
      return { success: false }
    }
  }

  async function loadSchemaJsonFiles(schemaName: string): Promise<JsonFile[]> {
    logInfo('loadSchemaJsonFiles called', { schemaName })
    try {
      if (window.electronAPI?.listSchemaJsonFiles) {
        try {
          const result = await window.electronAPI.listSchemaJsonFiles(schemaName)
          if (result.success && result.files) {
            const jsonFiles: JsonFile[] = result.files.map(file => ({
              name: file.name,
              path: file.path,
              content: file.content,
              isValid: true,
              errors: []
            }))
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
      if (window.electronAPI?.writeJsonFile) {
        try {
          const result = await window.electronAPI.writeJsonFile(schemaPath, content)
          return !!result.success
        } catch (electronError) {
          logError('Exception during Electron API writeJsonFile call for schema', electronError)
          return false
        }
      } else {
        // Fallback for web mode
        return true
      }
    } catch (error) {
      logError('Unexpected error in saveSchema', error)
      return false
    }
  }

  async function deleteSchema(schema: SchemaInfo): Promise<boolean> {
    logInfo('deleteSchema called', { schemaName: schema.name, schemaPath: schema.path })
    try {
      if (window.electronAPI?.deleteFile) {
        const result = await window.electronAPI.deleteFile(schema.path)
        if (result.success) {
          const schemaIndex = schemas.value.findIndex(s => s.path === schema.path)
          if (schemaIndex !== -1) {
            schemas.value.splice(schemaIndex, 1)
          }
          if (currentSchema.value && currentSchema.value.path === schema.path) {
            currentSchema.value = null
            currentJsonFile.value = null
          }
          return true
        } else {
          return false
        }
      } else {
        const schemaIndex = schemas.value.findIndex(s => s.path === schema.path)
        if (schemaIndex !== -1) {
          schemas.value.splice(schemaIndex, 1)
        }
        if (currentSchema.value && currentSchema.value.path === schema.path) {
          currentSchema.value = null
          currentJsonFile.value = null
        }
        return true
      }
    } catch (error) {
      logError('Unexpected error in deleteSchema', error)
      return false
    }
  }

  async function deleteJsonFile(file: JsonFile): Promise<boolean> {
    logInfo('deleteJsonFile called', { fileName: file.name, filePath: file.path })
    try {
      if (window.electronAPI?.deleteFile) {
        const result = await window.electronAPI.deleteFile(file.path)
        if (result.success) {
          const fileIndex = jsonFiles.value.findIndex(f => f.path === file.path)
          if (fileIndex !== -1) {
            jsonFiles.value.splice(fileIndex, 1)
          }
          for (const schema of schemas.value) {
            const associatedFileIndex = schema.associatedFiles.findIndex(f => f.path === file.path)
            if (associatedFileIndex !== -1) {
              schema.associatedFiles.splice(associatedFileIndex, 1)
              break
            }
          }
          if (currentJsonFile.value && currentJsonFile.value.path === file.path) {
            currentJsonFile.value = null
          }
          return true
        } else {
          return false
        }
      } else {
        const fileIndex = jsonFiles.value.findIndex(f => f.path === file.path)
        if (fileIndex !== -1) {
          jsonFiles.value.splice(fileIndex, 1)
        }
        for (const schema of schemas.value) {
          const associatedFileIndex = schema.associatedFiles.findIndex(f => f.path === file.path)
          if (associatedFileIndex !== -1) {
            schema.associatedFiles.splice(associatedFileIndex, 1)
            break
          }
        }
        if (currentJsonFile.value && currentJsonFile.value.path === file.path) {
          currentJsonFile.value = null
        }
        return true
      }
    } catch (error) {
      logError('Unexpected error in deleteJsonFile', error)
      return false
    }
  }

  async function renameJsonFile(file: JsonFile, newPath: string): Promise<boolean> {
    logInfo('renameJsonFile called', { oldName: file.name, oldPath: file.path, newPath })
    try {
      // Derive new name from path
      const newName = newPath.split('/').pop() || newPath

      // Update global list
      const fileIndex = jsonFiles.value.findIndex(f => f.path === file.path)
      if (fileIndex !== -1) {
        jsonFiles.value[fileIndex] = { ...jsonFiles.value[fileIndex], name: newName, path: newPath }
      }

      // Update schema association
      for (const schema of schemas.value) {
        const associatedFileIndex = schema.associatedFiles.findIndex(f => f.path === file.path)
        if (associatedFileIndex !== -1) {
          schema.associatedFiles[associatedFileIndex] = { ...schema.associatedFiles[associatedFileIndex], name: newName, path: newPath }
          break
        }
      }

      // Update current selection if needed
      if (currentJsonFile.value && currentJsonFile.value.path === file.path) {
        currentJsonFile.value = { ...currentJsonFile.value, name: newName, path: newPath }
      }

      // Persist associations change
      await saveSchemaAssociations()
      return true
    } catch (error) {
      logError('Unexpected error in renameJsonFile', error)
      return false
    }
  }

  async function saveSchemaAssociations(): Promise<void> {
    try {
      if (window.electronAPI && typeof window.electronAPI.writeConfigFile === 'function') {
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

      for (const association of associations) {
        const schema = schemas.value.find(s => s.path === association.schemaPath || s.name === association.schemaName)
        if (schema) {
          for (const fileInfo of association.associatedFiles) {
            try {
              let jsonContent = null
              if (window.electronAPI && typeof window.electronAPI.readFile === 'function' && !fileInfo.path.startsWith('mock://')) {
                const fileResult = await window.electronAPI.readFile(fileInfo.path)
                if (fileResult.success) {
                  jsonContent = typeof fileResult.data === 'string' 
                    ? JSON.parse(fileResult.data) 
                    : fileResult.data
                } else {
                  logInfo(`File ${fileInfo.path} could not be loaded, using cached data if available`)
                }
              }
              if (!jsonContent && fileInfo.content) {
                jsonContent = fileInfo.content
              }
              if (jsonContent) {
                const jsonFile: JsonFile = {
                  name: fileInfo.name,
                  path: fileInfo.path,
                  content: jsonContent,
                  isValid: fileInfo.isValid,
                  errors: fileInfo.errors
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
    originalJsonContent,
    originalSchemaContent,
    
    // Computed
    hasCurrentSchema,
    hasCurrentJsonFile,
    currentSchemaFiles,
    
    // Actions
    setCurrentSchema,
    setCurrentJsonFile,
    addSchemaLocal,
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
    renameJsonFile,
    saveSchemaAssociations
  }
})