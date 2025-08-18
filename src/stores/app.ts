/**
 * Application Store - Pure State Management
 * Refactored to only handle state, UI modes, and simple state operations
 * Business logic moved to services, orchestration moved to composables
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Re-export types for backward compatibility
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
  // === PURE STATE ===
  
  // Data state
  const currentSchema = ref<SchemaInfo | null>(null)
  const currentJsonFile = ref<JsonFile | null>(null)
  const schemas = ref<SchemaInfo[]>([])
  const jsonFiles = ref<JsonFile[]>([])
  
  // UI state
  const isEditMode = ref(false)
  const isViewingSchema = ref(false)
  const isEditingSchema = ref(false)
  const originalJsonContent = ref<string | null>(null)
  const originalSchemaContent = ref<string | null>(null)
  
  // Status state
  const statusMessage = ref('')
  const statusType = ref<'success' | 'error' | 'info'>('info')

  // === COMPUTED PROPERTIES ===
  
  const hasCurrentSchema = computed(() => currentSchema.value !== null)
  const hasCurrentJsonFile = computed(() => currentJsonFile.value !== null)
  const currentSchemaFiles = computed(() => {
    if (!currentSchema.value) return []
    return currentSchema.value.associatedFiles
  })

  // === SIMPLE STATE MUTATIONS ===
  
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
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusMessage.value = ''
    }, 3000)
  }

  // === DATA MANAGEMENT (Simple CRUD operations) ===
  
  function setSchemas(newSchemas: SchemaInfo[]) {
    schemas.value = newSchemas
  }

  function addSchemaToStore(schema: SchemaInfo) {
    schemas.value.push(schema)
  }

  function removeSchemaFromStore(schema: SchemaInfo) {
    const index = schemas.value.findIndex(s => s.path === schema.path)
    if (index !== -1) {
      schemas.value.splice(index, 1)
    }
  }

  function updateSchemaInStore(updatedSchema: SchemaInfo) {
    const index = schemas.value.findIndex(s => s.path === updatedSchema.path)
    if (index !== -1) {
      schemas.value[index] = updatedSchema
    }
  }

  function addJsonFileToStore(jsonFile: JsonFile) {
    const existingIndex = jsonFiles.value.findIndex(f => f.path === jsonFile.path)
    if (existingIndex === -1) {
      jsonFiles.value.push(jsonFile)
    } else {
      jsonFiles.value[existingIndex] = jsonFile
    }
  }

  function removeJsonFileFromStore(jsonFile: JsonFile) {
    const index = jsonFiles.value.findIndex(f => f.path === jsonFile.path)
    if (index !== -1) {
      jsonFiles.value.splice(index, 1)
    }
  }

  function updateCurrentJsonFile(updatedFile: JsonFile) {
    currentJsonFile.value = updatedFile
    
    // Also update in the global jsonFiles array
    const index = jsonFiles.value.findIndex(f => f.path === updatedFile.path)
    if (index !== -1) {
      jsonFiles.value[index] = updatedFile
    }
  }

  // === SCHEMA-FILE ASSOCIATION MANAGEMENT ===
  
  function addFileToSchema(schema: SchemaInfo, file: JsonFile) {
    const existingIndex = schema.associatedFiles.findIndex(f => f.path === file.path)
    if (existingIndex === -1) {
      schema.associatedFiles.push(file)
    } else {
      schema.associatedFiles[existingIndex] = file
    }
  }

  function removeFileFromSchema(schema: SchemaInfo, file: JsonFile) {
    const index = schema.associatedFiles.findIndex(f => f.path === file.path)
    if (index !== -1) {
      schema.associatedFiles.splice(index, 1)
    }
  }

  function setSchemaAssociatedFiles(schema: SchemaInfo, files: JsonFile[]) {
    schema.associatedFiles = files
  }

  return {
    // === STATE ===
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
    
    // === COMPUTED ===
    hasCurrentSchema,
    hasCurrentJsonFile,
    currentSchemaFiles,
    
    // === UI STATE ACTIONS ===
    setCurrentSchema,
    setCurrentJsonFile,
    setEditMode,
    setSchemaViewMode,
    setSchemaEditMode,
    showStatus,
    
    // === DATA MANAGEMENT ACTIONS ===
    setSchemas,
    addSchemaToStore,
    removeSchemaFromStore,
    updateSchemaInStore,
    addJsonFileToStore,
    removeJsonFileFromStore,
    updateCurrentJsonFile,
    
    // === ASSOCIATION MANAGEMENT ===
    addFileToSchema,
    removeFileFromSchema,
    setSchemaAssociatedFiles
  }
})