<template>
  <div v-if="isVisible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog" @click.stop>
      <div class="dialog-header">
        <h3>Add New Schema</h3>
        <button class="apple-btn plain small icon-only" @click="closeDialog">×</button>
      </div>
      
      <div class="dialog-content">
        <div class="form-group">
          <label for="schemaName">Schema Name</label>
          <input
            id="schemaName"
            v-model="schemaName"
            type="text"
            placeholder="Enter schema name (e.g., user-schema)"
            class="apple-input"
            :class="{ error: nameError }"
            :disabled="isSubmitting"
          />
          <div v-if="nameError" class="error-message">{{ nameError }}</div>
        </div>
        
        <div class="form-group">
          <label for="schemaContent">Schema Content</label>
          <div class="template-buttons">
            <button 
              v-for="template in templates" 
              :key="template.name"
              class="apple-btn bordered small"
              :disabled="isSubmitting"
              @click="useTemplate(template)"
            >
              {{ template.name }}
            </button>
          </div>
          <textarea
            id="schemaContent"
            v-model="schemaContentText"
            placeholder="Enter JSON Schema content..."
            class="apple-textarea"
            :class="{ error: contentError }"
            :disabled="isSubmitting"
            rows="15"
          ></textarea>
          <div v-if="contentError" class="error-message">{{ contentError }}</div>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button class="apple-btn bordered" @click="closeDialog" :disabled="isSubmitting">Cancel</button>
        <button class="apple-btn filled" @click="handleSubmit" :disabled="isSubmitting || !canSubmit">
          <div v-if="isSubmitting" class="apple-activity-indicator"></div>
          <span>{{ isSubmitting ? 'Creating...' : 'Create Schema' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useUIStore } from '@/stores/ui'
import { useSchemaManager } from '@/composables/useSchemaManager'
import { useCapability } from '@/composables/useCapability'

const appStore = useAppStore()
const ui = useUIStore()
const manager = useSchemaManager()
const { runtime } = useCapability()

const isVisible = ref(false)
const schemaName = ref('')
const schemaContentText = ref('')
const isSubmitting = ref(false)
const nameError = ref('')
const contentError = ref('')
const lastSubmitTime = ref(0)

// Logging utility for component
function logInfo(message: string, ...args: any[]) {
  console.log(`[DIALOG-INFO] ${new Date().toISOString()} - ${message}`, ...args)
}

function logError(message: string, error?: any) {
  console.error(`[DIALOG-ERROR] ${new Date().toISOString()} - ${message}`, error)
}

// Enhanced filename validation
function validateSchemaName(name: string): { isValid: boolean; error?: string } {
  const trimmedName = name.trim()
  
  if (!trimmedName) {
    return { isValid: false, error: 'Schema name is required' }
  }

  // Check for invalid characters
  const invalidChars = /[<>:"|?*\x00-\x1f/\\]/
  if (invalidChars.test(trimmedName)) {
    return { isValid: false, error: 'Schema name contains invalid characters' }
  }

  // Check length
  if (trimmedName.length > 200) {
    return { isValid: false, error: 'Schema name is too long (maximum 200 characters)' }
  }

  // Check for reserved names
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i
  if (reservedNames.test(trimmedName)) {
    return { isValid: false, error: 'Schema name uses a reserved name' }
  }

  return { isValid: true }
}

// Schema templates
const templates = [
  {
    name: 'Basic Object',
    content: {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "id": { "type": "number" },
        "name": { "type": "string", "minLength": 1 }
      },
      "required": ["id", "name"]
    }
  },
  {
    name: 'User Schema',
    content: {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "id": { "type": "number" },
        "name": { "type": "string", "minLength": 1 },
        "email": { "type": "string", "format": "email" },
        "age": { "type": "number", "minimum": 0 },
        "isActive": { "type": "boolean" }
      },
      "required": ["id", "name", "email"]
    }
  },
  {
    name: 'Product Schema',
    content: {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "id": { "type": "number" },
        "title": { "type": "string", "minLength": 1 },
        "description": { "type": "string" },
        "price": { "type": "number", "minimum": 0 },
        "category": { "type": "string" },
        "inStock": { "type": "boolean" }
      },
      "required": ["id", "title", "price"]
    }
  }
]

const parsedContent = computed(() => {
  try {
    return JSON.parse(schemaContentText.value)
  } catch {
    return null
  }
})

const canSubmit = computed(() => {
  return !isSubmitting.value && 
         schemaName.value.trim().length > 0 && 
         schemaContentText.value.trim().length > 0 && 
         parsedContent.value !== null
})

function showDialog() {
  logInfo('AddSchemaDialog opened')
  isVisible.value = true
  resetForm()
}

function closeDialog() {
  logInfo('AddSchemaDialog closed')
  isVisible.value = false
  resetForm()
}

function resetForm() {
  schemaName.value = ''
  schemaContentText.value = ''
  nameError.value = ''
  contentError.value = ''
  isSubmitting.value = false
  lastSubmitTime.value = 0
  logInfo('Form reset')
}

function handleOverlayClick(event: MouseEvent) {
  if (event.target === event.currentTarget && !isSubmitting.value) {
    logInfo('Dialog closed by overlay click')
    closeDialog()
  }
}

function useTemplate(template: any) {
  if (isSubmitting.value) return
  
  logInfo('Template selected', { templateName: template.name })
  schemaContentText.value = JSON.stringify(template.content, null, 2)
}

function validateForm(): boolean {
  logInfo('Validating form', { 
    hasName: !!schemaName.value.trim(), 
    hasContent: !!schemaContentText.value.trim(),
    existingSchemas: appStore.schemas.length
  })
  
  nameError.value = ''
  contentError.value = ''
  
  // Validate name with enhanced validation
  const nameValidation = validateSchemaName(schemaName.value)
  if (!nameValidation.isValid) {
    nameError.value = nameValidation.error!
    logError('Validation failed: invalid schema name', nameValidation.error)
    return false
  }
  
  const finalSchemaName = schemaName.value.endsWith('.json') ? schemaName.value : `${schemaName.value}.json`
  if (appStore.schemas.some(schema => schema.name === finalSchemaName)) {
    nameError.value = 'A schema with this name already exists'
    logError('Validation failed: duplicate schema name', { schemaName: finalSchemaName })
    return false
  }
  
  // Validate content
  if (!schemaContentText.value.trim()) {
    contentError.value = 'Schema content is required'
    logError('Validation failed: empty schema content')
    return false
  }

  // Check content size
  if (schemaContentText.value.length > 1024 * 1024) { // 1MB limit
    contentError.value = 'Schema content is too large (maximum 1MB)'
    logError('Validation failed: content too large', { size: schemaContentText.value.length })
    return false
  }
  
  if (!parsedContent.value) {
    contentError.value = 'Invalid JSON format'
    logError('Validation failed: invalid JSON format', { content: schemaContentText.value.substring(0, 100) + '...' })
    return false
  }
  
  logInfo('Form validation passed')
  return true
}

async function handleSubmit() {
  const now = Date.now()
  
  // Prevent rapid submissions (debounce)
  if (now - lastSubmitTime.value < 1000) {
    logInfo('Submission ignored due to debouncing')
    return
  }
  
  lastSubmitTime.value = now
  
  logInfo('Form submission started', {
    schemaName: schemaName.value,
    contentLength: schemaContentText.value.length,
    hasValidContent: !!parsedContent.value,
    platform: runtime.name
  })
  
  if (!validateForm()) {
    logError('Form submission aborted due to validation errors')
    return
  }
  
  isSubmitting.value = true
  
  try {
    logInfo('Calling appStore.addSchema')
    
    if (runtime.name === 'web') {
      ui.showStatus('Web 模式：数据仅临时保存。桌面版支持持久化。', 'info')
    }

    const success = await manager.addSchema(schemaName.value, parsedContent.value)
    logInfo('manager.addSchema completed', { success })
    
    if (success) {
      logInfo('Schema creation successful, closing dialog')
      closeDialog()
    } else {
      logError('Schema creation failed - check app store logs for details')
      // The error message is already shown by the store
    }
  } catch (error) {
    logError('Exception during schema creation', error)
    
    // Show more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorDetails = error instanceof Error ? error.stack : 'No stack trace available'
    
    logError('Detailed error info', {
      message: errorMessage,
      stack: errorDetails,
      platform: runtime.name,
      schemaName: schemaName.value,
      contentLength: schemaContentText.value.length
    })
    
    ui.showStatus(`Failed to create schema: ${errorMessage}`, 'error')
  } finally {
    isSubmitting.value = false
    logInfo('Form submission completed')
  }
}

// Watch for validation errors
watch([schemaName, schemaContentText], () => {
  if (nameError.value) nameError.value = ''
  if (contentError.value) contentError.value = ''
})

defineExpose({
  showDialog
})
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--apple-bg-secondary);
  border: 1px solid var(--linear-border, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1);
  /* Ensure dialog is always visible */
  opacity: 1;
  transform: none;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--linear-border);
}

.dialog-header h3 {
  margin: 0;
  color: var(--linear-text-primary);
  font-size: 18px;
  font-weight: 600;
}

/* Close button now uses apple-btn system */

.dialog-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--apple-text-primary);
  font-size: 14px;
}

/* Form controls now use apple-input and apple-textarea classes from main CSS */

.template-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

/* Template buttons now use apple-btn bordered small classes */

.error-message {
  color: var(--linear-error);
  font-size: 12px;
  margin-top: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--linear-border);
  background: var(--linear-bg-tertiary);
  backdrop-filter: blur(10px);
}

/* Legacy button styles replaced with apple-btn system */
</style>