<template>
  <div class="right-panel">
    <div class="right-panel-header">
      <div class="right-panel-title">
        {{ appStore.currentJsonFile ? appStore.currentJsonFile.name : 'JSON Content Viewer' }}
      </div>
      <div class="right-panel-controls">
        <div class="validation-status" v-if="appStore.currentJsonFile">
          <div 
            class="status-icon" 
            :class="{ valid: appStore.currentJsonFile.isValid, invalid: !appStore.currentJsonFile.isValid }"
          ></div>
          <span :class="{ 'status-valid': appStore.currentJsonFile.isValid, 'status-invalid': !appStore.currentJsonFile.isValid }">
            {{ appStore.currentJsonFile.isValid ? 'Valid JSON' : `${appStore.currentJsonFile.errors.length} validation errors` }}
          </span>
        </div>
        <div class="panel-actions" v-if="appStore.currentJsonFile">
          <button class="action-btn" @click="copyToClipboard" title="Copy JSON">
            <CopyIcon />
          </button>
          <button class="action-btn" @click="toggleEditMode" title="Edit JSON" v-if="!appStore.isEditMode">
            <EditIcon />
          </button>
          <button class="action-btn primary" @click="saveChanges" title="Save Changes" v-if="appStore.isEditMode">
            <SaveIcon />
          </button>
          <button class="action-btn" @click="cancelEdit" title="Cancel Edit" v-if="appStore.isEditMode">
            <CancelIcon />
          </button>
        </div>
      </div>
    </div>
    <div class="json-content">
      <!-- Validation Errors Display -->
      <div v-if="appStore.currentJsonFile && !appStore.currentJsonFile.isValid && !appStore.isEditMode" class="validation-errors">
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
      <div v-if="appStore.currentJsonFile && !appStore.isEditMode" class="json-viewer">
        <JsonHighlight :json="appStore.currentJsonFile.content" />
      </div>

      <!-- JSON Editor -->
      <textarea 
        v-if="appStore.currentJsonFile && appStore.isEditMode"
        v-model="editContent"
        class="json-editor"
        spellcheck="false"
        @input="validateEditContent"
      ></textarea>

      <!-- Empty State -->
      <div v-if="!appStore.currentJsonFile" class="json-viewer">
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">No JSON File Selected</div>
          <div class="empty-state-description">Select a JSON file from the middle panel to view its content and validation results</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import JsonHighlight from './JsonHighlight.vue'
import CopyIcon from './icons/CopyIcon.vue'
import EditIcon from './icons/EditIcon.vue'
import SaveIcon from './icons/SaveIcon.vue'
import CancelIcon from './icons/CancelIcon.vue'

const appStore = useAppStore()
const editContent = ref('')
const editErrors = ref<any[]>([])

// Watch for changes in current JSON file
watch(() => appStore.currentJsonFile, (newFile) => {
  if (newFile && appStore.isEditMode) {
    editContent.value = JSON.stringify(newFile.content, null, 2)
  }
}, { immediate: true })

function toggleEditMode() {
  if (appStore.currentJsonFile) {
    appStore.setEditMode(true)
    editContent.value = JSON.stringify(appStore.currentJsonFile.content, null, 2)
  }
}

function cancelEdit() {
  appStore.setEditMode(false)
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
      const validation = appStore.validateJsonWithSchema(parsedContent, appStore.currentSchema.content)
      if (!validation.isValid) {
        appStore.showStatus(`JSON is invalid: ${validation.errors.length} errors`, 'error')
        return
      }
    }

    // Save the file
    const success = await appStore.saveJsonFile(appStore.currentJsonFile.path, editContent.value)
    
    if (success) {
      // Update the current file content
      appStore.currentJsonFile.content = parsedContent
      appStore.currentJsonFile.isValid = true
      appStore.currentJsonFile.errors = []
      appStore.setEditMode(false)
    }
  } catch (error) {
    appStore.showStatus('Invalid JSON syntax', 'error')
  }
}

function validateEditContent() {
  try {
    const parsedContent = JSON.parse(editContent.value)
    
    if (appStore.currentSchema) {
      const validation = appStore.validateJsonWithSchema(parsedContent, appStore.currentSchema.content)
      editErrors.value = validation.errors
    } else {
      editErrors.value = []
    }
  } catch (error) {
    editErrors.value = [{ message: 'Invalid JSON syntax' }]
  }
}

async function copyToClipboard() {
  if (!appStore.currentJsonFile) return
  
  try {
    const content = JSON.stringify(appStore.currentJsonFile.content, null, 2)
    await navigator.clipboard.writeText(content)
    appStore.showStatus('JSON copied to clipboard', 'success')
  } catch (error) {
    appStore.showStatus('Failed to copy to clipboard', 'error')
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
</style>