/**
 * Schema Composable - Combines store and service functionality for schema operations
 * This layer orchestrates between the UI state (store) and business logic (services)
 */

import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { schemaService, type SchemaInfo } from '@/services'

export function useSchemas() {
  const appStore = useAppStore()

  // Computed properties
  const schemas = computed(() => appStore.schemas)
  const currentSchema = computed(() => appStore.currentSchema)
  const hasCurrentSchema = computed(() => appStore.hasCurrentSchema)
  const currentSchemaFiles = computed(() => appStore.currentSchemaFiles)

  /**
   * Create a new schema
   */
  const createSchema = async (name: string, content: any) => {
    const result = await schemaService.createSchema(name, content)
    
    if (result.success && result.schema) {
      // Update store state
      appStore.addSchemaToStore(result.schema)
      appStore.showStatus(`Schema "${result.schema.name}" created successfully`, 'success')
      return true
    } else {
      appStore.showStatus(result.error || 'Failed to create schema', 'error')
      return false
    }
  }

  /**
   * Load all schemas
   */
  const loadSchemas = async () => {
    try {
      const loadedSchemas = await schemaService.loadSchemas()
      
      // Update store state
      appStore.setSchemas(loadedSchemas)
      
      // Load associations
      await schemaService.loadSchemaAssociations(loadedSchemas)
      
      appStore.showStatus(`Loaded ${loadedSchemas.length} schemas`, 'success')
    } catch (error) {
      appStore.showStatus('Failed to load schemas', 'error')
    }
  }

  /**
   * Delete a schema
   */
  const deleteSchema = async (schema: SchemaInfo) => {
    const result = await schemaService.deleteSchema(schema)
    
    if (result.success) {
      // Update store state
      appStore.removeSchemaFromStore(schema)
      
      // Clear current selection if the deleted schema was selected
      if (currentSchema.value && currentSchema.value.path === schema.path) {
        appStore.setCurrentSchema(null)
        appStore.setCurrentJsonFile(null)
      }
      
      appStore.showStatus(`Schema "${schema.name}" deleted successfully`, 'success')
      return true
    } else {
      appStore.showStatus(result.error || 'Failed to delete schema', 'error')
      return false
    }
  }

  /**
   * Select a schema
   */
  const selectSchema = (schema: SchemaInfo | null) => {
    appStore.setCurrentSchema(schema)
  }

  /**
   * Save schema associations
   */
  const saveSchemaAssociations = async () => {
    try {
      await schemaService.saveSchemaAssociations(schemas.value)
    } catch (error) {
      appStore.showStatus('Failed to save schema associations', 'error')
    }
  }

  return {
    // State
    schemas,
    currentSchema,
    hasCurrentSchema,
    currentSchemaFiles,
    
    // Actions
    createSchema,
    loadSchemas,
    deleteSchema,
    selectSchema,
    saveSchemaAssociations
  }
}