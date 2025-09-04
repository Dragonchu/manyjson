<template>
  <div class="right-panel">
    <div class="right-panel-header">
      <div class="right-panel-title">
        {{ 
          ui.isDiffMode
            ? 'JSON File Comparison'
            : ui.isEditingSchema && appStore.currentSchema 
              ? `Editing Schema: ${appStore.currentSchema.name}` 
              : ui.isViewingSchema && appStore.currentSchema 
                ? `Schema: ${appStore.currentSchema.name}` 
                : appStore.currentJsonFile 
                  ? appStore.currentJsonFile.name 
                  : 'JSON Content Viewer' 
        }}
      </div>
      <div class="right-panel-controls">
        <div class="validation-status" v-if="ui.isDiffMode">
          <div class="status-icon diff"></div>
          <span class="status-diff">Diff Mode</span>
        </div>
        <div class="validation-status" v-else-if="ui.isEditingSchema && appStore.currentSchema">
          <div class="status-icon editing"></div>
          <span class="status-editing">Editing Schema</span>
        </div>
        <div class="validation-status" v-else-if="ui.isViewingSchema && appStore.currentSchema">
          <div class="status-icon schema"></div>
          <span class="status-schema">Schema Definition</span>
        </div>
        <div class="validation-status" v-else-if="appStore.currentJsonFile">
          <div 
            class="status-icon" 
            :class="{ valid: appStore.currentJsonFile.isValid, invalid: !appStore.currentJsonFile.isValid }"
          ></div>
          <span :class="{ 'status-valid': appStore.currentJsonFile.isValid, 'status-invalid': !appStore.currentJsonFile.isValid }">
            {{ appStore.currentJsonFile.isValid ? 'Valid JSON' : `${appStore.currentJsonFile.errors.length} validation errors` }}
          </span>
        </div>
        <div class="panel-actions" v-if="ui.isEditingSchema && appStore.currentSchema">
          <button class="action-btn primary" @click="saveSchemaChanges" title="Save Schema">
            <SaveIcon />
          </button>
          <button class="action-btn" @click="cancelSchemaEdit" title="Cancel Edit">
            <CancelIcon />
          </button>
        </div>
        <div class="panel-actions" v-else-if="ui.isViewingSchema && appStore.currentSchema">
          <button class="action-btn" @click="copySchemaToClipboard" title="Copy Schema">
            <CopyIcon />
          </button>
        </div>
        <div class="panel-actions" v-else-if="appStore.currentJsonFile">
          <button class="action-btn" @click="copyToClipboard" title="Copy JSON">
            <CopyIcon />
          </button>
          <button class="action-btn" @click="toggleEditMode" title="Edit JSON" v-if="!ui.isEditMode">
            <EditIcon />
          </button>
          <button class="action-btn primary" @click="saveChanges" title="Save Changes" v-if="ui.isEditMode">
            <SaveIcon />
          </button>
          <button class="action-btn" @click="cancelEdit" title="Cancel Edit" v-if="ui.isEditMode">
            <CancelIcon />
          </button>
        </div>
      </div>
    </div>
    <div class="json-content">
      <!-- Diff Viewer -->
      <JsonDiffViewer v-if="ui.isDiffMode" />

      <!-- Schema Editor -->
      <AdvancedJsonEditor
        v-else-if="ui.isEditingSchema && appStore.currentSchema"
        v-model="editSchemaContent"
        placeholder="Enter schema JSON..."
        @validation-change="handleSchemaValidationChange"
      />

      <!-- Schema Viewer -->
      <div v-else-if="ui.isViewingSchema && appStore.currentSchema" class="json-viewer">
        <div class="schema-info-banner">
          <strong>Viewing Schema: {{ appStore.currentSchema.name }}</strong>
        </div>
        <JsonHighlight :json="appStore.currentSchema.content" />
      </div>

      <!-- Validation Errors Display -->
      <div v-else-if="appStore.currentJsonFile && !appStore.currentJsonFile.isValid && !ui.isEditMode" class="validation-errors">
        <div class="validation-errors-header">
          <div class="validation-errors-header-left">
            <span>⚠️</span>
            <span>Validation Errors</span>
          </div>
          <span class="error-count">{{ appStore.currentJsonFile.errors.length }}</span>
        </div>
        <div class="validation-errors-content">
          <div v-for="(error, index) in appStore.currentJsonFile.errors" :key="index" class="error-item">
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

      <!-- JSON Viewer -->
      <div v-else-if="appStore.currentJsonFile && !ui.isEditMode" class="json-viewer">
        <JsonHighlight :json="appStore.currentJsonFile.content" />
      </div>

      <!-- JSON Editor -->
      <AdvancedJsonEditor
        v-else-if="appStore.currentJsonFile && ui.isEditMode"
        v-model="editContent"
        :schema="appStore.currentSchema?.content"
        placeholder="Enter JSON content..."
        @validation-change="handleValidationChange"
      />

      <!-- Empty State -->
      <div v-else class="json-viewer">
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">No Content Selected</div>
          <div class="empty-state-description">Select a JSON file from the middle panel to view its content, or right-click a schema to view its definition</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useUIStore } from '@/stores/ui'
import { ValidationService } from '@/services/validationService'
import { FileService } from '@/services/fileService'
import JsonHighlight from './JsonHighlight.vue'
import AdvancedJsonEditor from './AdvancedJsonEditor.vue'
import JsonDiffViewer from './JsonDiffViewer.vue'
import CopyIcon from './icons/CopyIcon.vue'
import EditIcon from './icons/EditIcon.vue'
import SaveIcon from './icons/SaveIcon.vue'
import CancelIcon from './icons/CancelIcon.vue'

const appStore = useAppStore()
const ui = useUIStore()
const validationService = new ValidationService()
const fileService = new FileService()
const editContent = ref('')
const editErrors = ref<any[]>([])
const editSchemaContent = ref('')
const editSchemaErrors = ref<any[]>([])

// Watch for changes in current JSON file
watch(() => appStore.currentJsonFile, (newFile) => {
  if (newFile && ui.isEditMode) {
    editContent.value = JSON.stringify(newFile.content, null, 2)
  }
}, { immediate: true })

// Watch for changes in current schema when entering edit mode
watch(() => appStore.currentSchema, (newSchema) => {
  if (newSchema && ui.isEditingSchema) {
    editSchemaContent.value = JSON.stringify(newSchema.content, null, 2)
  }
}, { immediate: true })

// Watch for schema edit mode changes
watch(() => ui.isEditingSchema, (isEditing) => {
  if (isEditing && appStore.currentSchema) {
    editSchemaContent.value = JSON.stringify(appStore.currentSchema.content, null, 2)
  }
})

function toggleEditMode() {
  if (appStore.currentJsonFile) {
    ui.setEditMode(true)
    editContent.value = JSON.stringify(appStore.currentJsonFile.content, null, 2)
  }
}

function cancelEdit() {
  ui.setEditMode(false)
  editContent.value = ''
  editErrors.value = []
}

async function saveChanges() {
  if (!appStore.currentJsonFile) return

  try {
    // Parse and validate JSON
    const parsedContent = JSON.parse(editContent.value)
    
    // Validate against schema if available
    if (appStore.currentSchema) {
      const validation = validationService.validateJson(parsedContent, appStore.currentSchema.content)
      if (!validation.isValid) {
        ui.showStatus(`JSON is invalid: ${validation.errors.length} errors`, 'error')
        return
      }
    }

    // Save the file
    const result = await fileService.writeJsonFile(appStore.currentJsonFile.path, editContent.value)
    const success = result.success
    
    if (success) {
      // Update the current file content
      appStore.currentJsonFile.content = parsedContent
      appStore.currentJsonFile.isValid = true
      appStore.currentJsonFile.errors = []
      ui.setEditMode(false)
    } else {
      ui.showStatus(`Failed to save file: ${result.error || 'Unknown error'}`, 'error')
    }
  } catch (error) {
    ui.showStatus('Invalid JSON syntax', 'error')
  }
}

function validateEditContent() {
  try {
    const parsedContent = JSON.parse(editContent.value)
    
    if (appStore.currentSchema) {
      const validation = validationService.validateJson(parsedContent, appStore.currentSchema.content)
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

function handleSchemaValidationChange(errors: any[]) {
  editSchemaErrors.value = errors
}

function cancelSchemaEdit() {
  ui.setSchemaEditMode(false)
  editSchemaContent.value = ''
  editSchemaErrors.value = []
}

async function saveSchemaChanges() {
  if (!appStore.currentSchema) return

  try {
    // Parse and validate JSON syntax
    const parsedContent = JSON.parse(editSchemaContent.value)
    
    // Save the schema
    const result = await fileService.writeJsonFile(appStore.currentSchema.path, editSchemaContent.value)
    if (result.success) {
      // Update the current schema content
      appStore.currentSchema.content = parsedContent
      ui.setSchemaEditMode(false)
      
      // Reload schemas to refresh the UI
      await appStore.loadSchemas()
    } else {
      ui.showStatus(`Failed to save schema: ${result.error || 'Unknown error'}`, 'error')
    }
  } catch (error) {
    ui.showStatus('Invalid JSON syntax', 'error')
  }
}

async function copyToClipboard() {
  if (!appStore.currentJsonFile) return
  
  try {
    const content = JSON.stringify(appStore.currentJsonFile.content, null, 2)
    await navigator.clipboard.writeText(content)
    ui.showStatus('JSON copied to clipboard', 'success')
  } catch (error) {
    ui.showStatus('Failed to copy to clipboard', 'error')
  }
}

async function copySchemaToClipboard() {
  if (!appStore.currentSchema) return
  
  try {
    const content = JSON.stringify(appStore.currentSchema.content, null, 2)
    await navigator.clipboard.writeText(content)
    ui.showStatus('Schema copied to clipboard', 'success')
  } catch (error) {
    ui.showStatus('Failed to copy schema to clipboard', 'error')
  }
}
</script>

<style scoped>
.right-panel {
  flex: 1;
  background: var(--linear-bg-primary);
  display: flex;
  flex-direction: column;
}

.right-panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--linear-border);
  background: var(--linear-surface);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.right-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--linear-text-primary);
}

.right-panel-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.validation-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.json-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
  font-family: var(--linear-font-mono);
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.json-viewer {
  background: var(--linear-surface);
  border: 1px solid var(--linear-border);
  border-radius: 8px;
  padding: 16px;
  height: 100%;
  overflow: auto;
}

.json-editor {
  width: 100%;
  height: 100%;
  background: var(--linear-surface);
  border: 1px solid var(--linear-border);
  border-radius: 8px;
  padding: 16px;
  font-family: var(--linear-font-mono);
  font-size: 13px;
  line-height: 1.5;
  color: var(--linear-text-primary);
  resize: none;
  outline: none;
  tab-size: 2;
}

.json-editor:focus {
  border-color: var(--linear-accent);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

/* Validation Error Display */
.validation-errors {
  background: var(--linear-surface);
  border: 1px solid var(--linear-border);
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.validation-errors-header {
  background: rgba(239, 68, 68, 0.1);
  border-bottom: 1px solid var(--linear-border);
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--linear-error);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.validation-errors-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.validation-errors-content {
  max-height: 350px;
  overflow-y: auto;
}

.error-item {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  font-size: 12px;
  line-height: 1.3;
}

.error-item:last-child {
  border-bottom: none;
}

.error-item-header {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 4px;
}

.error-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.error-icon.critical {
  color: var(--linear-error);
}

.error-message {
  flex: 1;
  line-height: 1.4;
}

.error-message-text {
  font-weight: 500;
  color: var(--linear-text-primary);
  margin-bottom: 2px;
}

.error-path {
  font-family: var(--linear-font-mono);
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  color: var(--linear-text-secondary);
  margin-top: 3px;
  display: inline-block;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.error-count {
  background: var(--linear-surface);
  border: 1px solid var(--linear-border);
  border-radius: 10px;
  padding: 1px 6px;
  font-size: 9px;
  font-weight: 600;
}

/* Schema viewing styles */
.status-icon.schema {
  width: 12px;
  height: 12px;
  background: var(--linear-accent);
  border-radius: 50%;
}

.status-schema {
  color: var(--linear-accent);
  font-weight: 500;
}

/* Schema editing styles */
.status-icon.editing {
  width: 12px;
  height: 12px;
  background: var(--linear-warning);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-editing {
  color: var(--linear-warning);
  font-weight: 500;
}

/* Diff mode styles */
.status-icon.diff {
  width: 12px;
  height: 12px;
  background: var(--linear-info);
  border-radius: 50%;
}

.status-diff {
  color: var(--linear-info);
  font-weight: 500;
}

.schema-editor {
  border: 2px solid var(--linear-warning);
  background: rgba(255, 193, 7, 0.05);
}

.schema-editor:focus {
  border-color: var(--linear-warning);
  box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.1);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.schema-info-banner {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid var(--linear-accent);
  border-radius: 6px;
  color: var(--linear-accent);
}
</style>