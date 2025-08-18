/**
 * JSON Files Composable - Combines store and service functionality for JSON file operations
 * This layer orchestrates between the UI state (store) and business logic (services)
 */

import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { schemaService, fileService, validationService, type JsonFile } from '@/services'

export function useJsonFiles() {
  const appStore = useAppStore()

  // Computed properties
  const jsonFiles = computed(() => appStore.jsonFiles)
  const currentJsonFile = computed(() => appStore.currentJsonFile)
  const hasCurrentJsonFile = computed(() => appStore.hasCurrentJsonFile)

  /**
   * Create a JSON file for a specific schema
   */
  const createSchemaJsonFile = async (schemaName: string, fileName: string, content: string) => {
    // Validate against schema if current schema is available
    if (appStore.currentSchema) {
      const jsonValidation = validationService.validateJsonString(content)
      if (!jsonValidation.isValid) {
        appStore.showStatus('Invalid JSON format', 'error')
        return { success: false }
      }

      const schemaValidation = validationService.validateJsonWithSchema(
        jsonValidation.parsed,
        appStore.currentSchema.content
      )
      
      if (!schemaValidation.isValid) {
        appStore.showStatus(`JSON validation failed: ${schemaValidation.errors.length} errors`, 'error')
        return { success: false }
      }
    }

    const result = await schemaService.createSchemaJsonFile(schemaName, fileName, content)
    
    if (result.success && result.filePath) {
      // Create JsonFile object
      const jsonValidation = validationService.validateJsonString(content)
      const jsonFile: JsonFile = {
        name: fileName,
        path: result.filePath,
        content: jsonValidation.parsed,
        isValid: true,
        errors: []
      }

      // Update store state
      appStore.addJsonFileToStore(jsonFile)
      
      // Associate with current schema if available
      if (appStore.currentSchema) {
        appStore.addFileToSchema(appStore.currentSchema, jsonFile)
      }

      appStore.showStatus('JSON file created successfully', 'success')
      return { success: true, filePath: result.filePath }
    } else {
      appStore.showStatus(result.error || 'Failed to create JSON file', 'error')
      return { success: false }
    }
  }

  /**
   * Save a JSON file
   */
  const saveJsonFile = async (filePath: string, content: string) => {
    // Validate JSON format
    const jsonValidation = validationService.validateJsonString(content)
    if (!jsonValidation.isValid) {
      appStore.showStatus('Invalid JSON format', 'error')
      return false
    }

    // Validate against schema if current schema is available
    if (appStore.currentSchema) {
      const schemaValidation = validationService.validateJsonWithSchema(
        jsonValidation.parsed,
        appStore.currentSchema.content
      )
      
      if (!schemaValidation.isValid) {
        appStore.showStatus(`JSON validation failed: ${schemaValidation.errors.length} errors`, 'error')
        return false
      }
    }

    const result = await fileService.writeJsonFile(filePath, content)
    
    if (result.success) {
      // Update current file if it's the one being saved
      if (currentJsonFile.value && currentJsonFile.value.path === filePath) {
        appStore.updateCurrentJsonFile({
          ...currentJsonFile.value,
          content: jsonValidation.parsed,
          isValid: true,
          errors: []
        })
      }

      appStore.showStatus('File saved successfully', 'success')
      return true
    } else {
      appStore.showStatus(result.error || 'Failed to save file', 'error')
      return false
    }
  }

  /**
   * Load JSON files for a schema
   */
  const loadSchemaJsonFiles = async (schemaName: string) => {
    if (!appStore.currentSchema) {
      return []
    }

    const jsonFiles = await schemaService.loadSchemaJsonFiles(schemaName, appStore.currentSchema)
    
    // Update store state
    appStore.setSchemaAssociatedFiles(appStore.currentSchema, jsonFiles)
    
    return jsonFiles
  }

  /**
   * Delete a JSON file
   */
  const deleteJsonFile = async (file: JsonFile) => {
    const result = await fileService.deleteFile(file.path)
    
    if (result.success) {
      // Update store state
      appStore.removeJsonFileFromStore(file)
      
      // Remove from current schema if associated
      if (appStore.currentSchema) {
        appStore.removeFileFromSchema(appStore.currentSchema, file)
      }
      
      // Clear current selection if the deleted file was selected
      if (currentJsonFile.value && currentJsonFile.value.path === file.path) {
        appStore.setCurrentJsonFile(null)
      }
      
      appStore.showStatus(`File "${file.name}" deleted successfully`, 'success')
      return true
    } else {
      appStore.showStatus(result.error || 'Failed to delete file', 'error')
      return false
    }
  }

  /**
   * Select a JSON file
   */
  const selectJsonFile = (file: JsonFile | null) => {
    appStore.setCurrentJsonFile(file)
  }

  /**
   * Validate a JSON file against current schema
   */
  const validateJsonFile = (file: JsonFile) => {
    if (!appStore.currentSchema) {
      return { isValid: true, errors: [] }
    }

    return validationService.validateJsonWithSchema(file.content, appStore.currentSchema.content)
  }

  return {
    // State
    jsonFiles,
    currentJsonFile,
    hasCurrentJsonFile,
    
    // Actions
    createSchemaJsonFile,
    saveJsonFile,
    loadSchemaJsonFiles,
    deleteJsonFile,
    selectJsonFile,
    validateJsonFile
  }
}