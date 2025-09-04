<template>
  <Teleport to="body">
    <div 
      v-if="isVisible" 
      class="popup-overlay"
      @click="closePopup"
      :class="{ 'fade-in': isVisible }"
    >
      <div 
        class="popup-window"
        @click.stop
        :class="{ 'slide-in': isVisible }"
      >
        <!-- Header -->
        <div class="popup-header">
          <div class="popup-header-left">
            <div class="popup-title">Add JSON File</div>
            <div class="popup-subtitle" v-if="schema">
              For schema: {{ schema.name }}
            </div>
          </div>
          <div class="popup-header-right">
            <div class="validation-status" v-if="editErrors.length > 0">
              <span class="error-count">{{ editErrors.length }} error{{ editErrors.length === 1 ? '' : 's' }}</span>
            </div>
            <div class="popup-actions">
              <button 
                class="apple-btn filled small icon-only" 
                @click="saveJsonFile"
                :disabled="false"
                :title="getButtonTooltip()"
              >
                <SaveIcon />
              </button>
              <button 
                class="apple-btn plain small icon-only" 
                @click="closePopup"
                title="Cancel"
              >
                <CancelIcon />
              </button>
            </div>
          </div>
        </div>

        <!-- File Name Input -->
        <div class="file-name-section">
          <label for="fileName">File Name:</label>
                      <input 
            id="fileName"
            v-model="fileName"
            type="text"
            placeholder="Enter file name (e.g., data.json)"
            class="apple-input"
            @keyup.enter="saveJsonFile"
          />
        </div>

        <!-- JSON Editor -->
        <div class="json-content">
          <AdvancedJsonEditor
            v-model="editContent"
            :schema="schema?.content"
            placeholder="Enter JSON content..."
            @validation-change="handleValidationChange"
          />
          
          <!-- Validation Errors Display -->
          <div v-if="editErrors.length > 0" class="validation-errors">
            <div class="validation-errors-header">
              <div class="validation-errors-header-left">
                <span>⚠️</span>
                <span>Validation Errors</span>
              </div>
              <span class="error-count">{{ editErrors.length }}</span>
            </div>
            <div class="validation-errors-content">
              <div v-for="(error, index) in editErrors" :key="index" class="error-item">
                <div class="error-item-header">
                  <div class="error-icon critical">❌</div>
                  <div class="error-message">
                    <div class="error-message-text">{{ error.message }}</div>
                    <div v-if="error.instancePath" class="error-path">{{ error.instancePath }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useAppStore, type SchemaInfo } from '@/stores/app'
import { useUIStore } from '@/stores/ui'
import { ValidationService } from '@/services/validationService'
import { FileService } from '@/services/fileService'
import AdvancedJsonEditor from './AdvancedJsonEditor.vue'
import SaveIcon from './icons/SaveIcon.vue'
import CancelIcon from './icons/CancelIcon.vue'

const appStore = useAppStore()
const ui = useUIStore()
const validationService = new ValidationService()
const fileName = ref('')
const isVisible = ref(false)
const schema = ref<SchemaInfo | null>(null)
const editContent = ref('{}')
const editErrors = ref<any[]>([])
const fileService = new FileService()

function getButtonTooltip() {
  if (!fileName.value?.trim()) {
    return 'Please enter a file name'
  }
  return 'Save JSON file'
}

function showPopup(schemaInfo: SchemaInfo) {
  schema.value = schemaInfo
  isVisible.value = true
  fileName.value = ''
  editContent.value = '{}'
  editErrors.value = []
  
  // Trigger validation after setting up the popup
  setTimeout(() => {
    validateEditContent()
  }, 100)
  
  // Focus the file name input after animation
  setTimeout(() => {
    const input = document.getElementById('fileName') as HTMLInputElement
    if (input) input.focus()
  }, 300)
}

function closePopup() {
  isVisible.value = false
  setTimeout(() => {
    schema.value = null
    fileName.value = ''
    editContent.value = '{}'
    editErrors.value = []
  }, 300)
}

async function saveJsonFile() {
  if (!schema.value || !fileName.value?.trim()) {
    ui.showStatus('Please enter a file name', 'error')
    return
  }

  try {
    // Parse JSON to validate
    const parsedContent = JSON.parse(editContent.value)
    
    // Ensure .json extension
    const fullFileName = fileName.value.endsWith('.json') ? fileName.value : `${fileName.value}.json`
    
    // Check if file name already exists in this schema
    if (schema.value.associatedFiles.some(f => f.name === fullFileName)) {
      ui.showStatus('A file with this name already exists', 'error')
      return
    }
    
    // Validate against schema
    const validation = validationService.validateJson(parsedContent, schema.value.content)
    
    // Save the JSON file to schema-specific directory
    let actualFilePath: string
    try {
      // Use the new structured file saving system
      const saveResult = await fileService.writeSchemaJsonFile(schema.value.name, fullFileName, editContent.value)
      
      if (!saveResult.success) {
        ui.showStatus(`Failed to save JSON file: ${saveResult.error || 'Unknown error'}`, 'error')
        return
      }
      
      actualFilePath = saveResult.filePath || `structured://${schema.value.name}/${fullFileName}`
      ui.showStatus(`JSON file saved to structured location`, 'success')
    } catch (error) {
      ui.showStatus(`Failed to save JSON file: ${error}`, 'error')
      return
    }
    
    // Create new JsonFile object with actual file path
    const newJsonFile = {
      name: fullFileName,
      path: actualFilePath,
      content: parsedContent,
      isValid: validation.isValid,
      errors: validation.errors
    }
    
    // Add to schema's associated files
    schema.value.associatedFiles.push(newJsonFile)
    
    // Add to global jsonFiles array
    const existingFileIndex = appStore.jsonFiles.findIndex(f => f.path === actualFilePath)
    if (existingFileIndex === -1) {
      appStore.jsonFiles.push(newJsonFile)
    } else {
      appStore.jsonFiles[existingFileIndex] = newJsonFile
    }
    
    // Save the updated schema associations to persistence
    await appStore.saveSchemaAssociations()
    
    ui.showStatus(`File "${fullFileName}" created successfully${validation.isValid ? '' : ' (with validation errors)'}`, 'success')
    
    closePopup()
  } catch (error) {
    ui.showStatus('Invalid JSON syntax', 'error')
  }
}

function validateEditContent() {
  try {
    const parsedContent = JSON.parse(editContent.value)
    
    if (schema.value) {
      const validation = validationService.validateJson(parsedContent, schema.value.content)
      editErrors.value = validation.errors
    } else {
      editErrors.value = []
    }
  } catch (error) {
    editErrors.value = [{ message: 'Invalid JSON syntax' }]
  }
}

// Handle validation changes from the advanced editor
function handleValidationChange(errors: any[]) {
  editErrors.value = errors
}

function handleGlobalEvent(event: CustomEvent) {
  if (event.type === 'show-add-file-popup') {
    showPopup(event.detail.schema)
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isVisible.value) {
    closePopup()
  }
}

onMounted(() => {
  document.addEventListener('show-add-file-popup', handleGlobalEvent as EventListener)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('show-add-file-popup', handleGlobalEvent as EventListener)
  document.removeEventListener('keydown', handleKeyDown)
})

// Watch for content changes to validate
watch(editContent, validateEditContent)
</script>

<style scoped>
.popup-overlay {
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
  opacity: 0;
  transition: opacity 0.3s ease;
}

.popup-overlay.fade-in {
  opacity: 1;
}

.popup-window {
  background: var(--linear-bg-primary);
  border: 1px solid var(--linear-border);
  border-radius: 12px;
  width: 90vw;
  max-width: 800px;
  height: 80vh;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transform: translateY(20px) scale(0.95);
  transition: transform 0.3s ease;
}

.popup-window.slide-in {
  transform: translateY(0) scale(1);
}

.popup-header {
  padding: 20px;
  border-bottom: 1px solid var(--linear-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--linear-surface);
  border-radius: 12px 12px 0 0;
}

.popup-header-left {
  display: flex;
  flex-direction: column;
}

.popup-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--linear-text-primary);
  margin-bottom: 4px;
}

.popup-subtitle {
  font-size: 14px;
  color: var(--linear-text-secondary);
}

.popup-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.validation-status {
  font-size: 12px;
}

.error-count {
  color: var(--linear-error);
  font-weight: 500;
}

.popup-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--linear-border);
  border-radius: 6px;
  background: var(--linear-surface);
  color: var(--linear-text-secondary);
  cursor: pointer;
  transition: var(--linear-transition-fast);
}

.action-btn:hover {
  background: var(--linear-surface-hover);
  border-color: var(--linear-border-hover);
}

.action-btn.primary {
  background: var(--linear-accent);
  color: white;
  border-color: var(--linear-accent);
}

.action-btn.primary:hover {
  background: var(--accent-primary-hover);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn:disabled:hover {
  background: var(--linear-surface);
  border-color: var(--linear-border);
}

.file-name-section {
  padding: 16px 20px;
  border-bottom: 1px solid var(--linear-border);
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--linear-surface);
}

.file-name-section label {
  font-size: 14px;
  font-weight: 500;
  color: var(--linear-text-primary);
  white-space: nowrap;
}

.file-name-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--linear-border);
  border-radius: 6px;
  background: var(--linear-bg-primary);
  color: var(--linear-text-primary);
  font-size: 14px;
  transition: var(--linear-transition-fast);
}

.file-name-input:focus {
  outline: none;
  border-color: var(--linear-accent);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.json-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.json-editor {
  flex: 1;
  padding: 20px;
  border: none;
  background: var(--linear-bg-primary);
  color: var(--linear-text-primary);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
  outline: none;
  overflow-y: auto;
}

.validation-errors {
  border-top: 1px solid var(--linear-border);
  background: var(--linear-surface);
  max-height: 200px;
  overflow-y: auto;
}

.validation-errors-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(239, 68, 68, 0.1);
  border-bottom: 1px solid var(--linear-border);
}

.validation-errors-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--linear-error);
}

.validation-errors-content {
  padding: 0;
}

.error-item {
  padding: 8px 16px;
  border-bottom: 1px solid var(--linear-border);
}

.error-item:last-child {
  border-bottom: none;
}

.error-item-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.error-icon.critical {
  font-size: 12px;
  margin-top: 2px;
}

.error-message {
  flex: 1;
}

.error-message-text {
  font-size: 13px;
  color: var(--linear-text-primary);
  font-weight: 500;
  margin-bottom: 2px;
}

.error-path {
  font-size: 11px;
  color: var(--linear-text-tertiary);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}
</style>