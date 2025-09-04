<template>
  <div class="middle-panel">
    <div class="middle-panel-header">
      <div class="header-top">
        <div class="middle-panel-title">Associated JSON Files</div>
        <button 
          v-if="appStore.currentSchema" 
          class="btn-add"
          @click="openAddFilePopup"
          title="Add JSON file"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add
        </button>
      </div>
      <div class="schema-info">
        {{ appStore.currentSchema ? `Schema: ${appStore.currentSchema.name}` : 'Select a schema to view associated files' }}
      </div>
    </div>
    <div class="json-files-list">
      <div
        v-for="file in appStore.currentSchemaFiles"
        :key="file.path"
        class="json-file-card"
        :class="{ 
          selected: appStore.currentJsonFile?.path === file.path,
          invalid: !file.isValid,
          editing: inlineRename.isEditing(file)
        }"
        :data-file-path="file.path"
        @click="selectFile(file)"
        @contextmenu.prevent="showContextMenu($event, file)"
        @dblclick="startInlineRename(file)"
      >
        <!-- Normal display mode -->
        <div v-if="!inlineRename.isEditing(file)" class="json-file-name" :title="`${file.name}\n\nDouble-click or press F2 to rename`">
          {{ file.name }}
        </div>
        
        <!-- Inline edit mode -->
        <div v-else class="json-file-name-edit">
          <input
            type="text"
            class="inline-rename-input"
            :class="{ 'invalid-input': !inlineRename.isValidName.value }"
            :value="inlineRename.editingName.value"
            @input="inlineRename.updateEditingName(($event.target as HTMLInputElement).value)"
            @keydown.enter="handleRenameConfirm"
            @keydown.escape="inlineRename.cancelRename()"
            @blur="handleRenameBlur"
            @click.stop
          />
          <div v-if="!inlineRename.isValidName.value" class="validation-error">
            {{ inlineRename.validationError.value }}
          </div>
        </div>
        
        <div class="json-file-status">
          <div 
            class="status-icon" 
            :class="{ valid: file.isValid, invalid: !file.isValid }"
          ></div>
          <span :class="{ 'status-valid': file.isValid, 'status-invalid': !file.isValid }">
            {{ file.isValid ? 'Valid' : `Invalid (${file.errors.length} errors)` }}
          </span>
        </div>
      </div>
      
      <div v-if="!appStore.currentSchema" class="empty-state">
        <div class="empty-state-icon">📄</div>
        <div class="empty-state-title">No Schema Selected</div>
        <div class="empty-state-description">Select a JSON Schema from the left panel to view associated JSON files</div>
      </div>
      
      <div v-else-if="appStore.currentSchemaFiles.length === 0" class="empty-state">
        <div class="empty-state-icon">📄</div>
        <div class="empty-state-title">No JSON Files</div>
        <div class="empty-state-description">No JSON files are associated with this schema</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAppStore, type JsonFile } from '@/stores/app'
import { useUIStore } from '@/stores/ui'
import { useInlineRename } from '@/composables/useInlineRename'

const appStore = useAppStore()
const ui = useUIStore()
const inlineRename = useInlineRename()

// Track if we're confirming via Enter key
let isConfirming = false

function selectFile(file: JsonFile) {
  // Don't select if we're editing this file
  if (inlineRename.isEditing(file)) {
    return
  }
  appStore.setCurrentJsonFile(file)
}

function showContextMenu(event: MouseEvent, file: JsonFile) {
  // Don't show context menu if we're editing
  if (inlineRename.isEditing(file)) {
    return
  }
  
  // Context menu functionality will be handled by ContextMenu component
  const contextMenuEvent = new CustomEvent('show-context-menu', {
    detail: { event, file, type: 'file' }
  })
  document.dispatchEvent(contextMenuEvent)
}

function openAddFilePopup() {
  if (!appStore.currentSchema) {
    ui.showStatus('Please select a schema first', 'error')
    return
  }

  // Emit event to show the add file popup
  const event = new CustomEvent('show-add-file-popup', {
    detail: { schema: appStore.currentSchema }
  })
  document.dispatchEvent(event)
}

function startInlineRename(file: JsonFile) {
  // Don't start rename if already editing
  if (inlineRename.editingFile.value) {
    return
  }
  inlineRename.startRename(file)
}

async function handleRenameConfirm() {
  isConfirming = true
  await inlineRename.confirmRename()
  isConfirming = false
}

function handleRenameBlur() {
  // Don't cancel if we're confirming via Enter key
  if (isConfirming) {
    return
  }
  
  // Small delay to allow click events on other elements to fire first
  setTimeout(() => {
    if (inlineRename.editingFile.value) {
      inlineRename.confirmRename()
    }
  }, 200)
}

// Handle global rename trigger event
function handleRenameEvent(event: CustomEvent) {
  const { file } = event.detail
  if (file) {
    startInlineRename(file)
  }
}

// Handle F2 key for rename
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'F2' && appStore.currentJsonFile && !inlineRename.editingFile.value) {
    event.preventDefault()
    startInlineRename(appStore.currentJsonFile)
  }
}

onMounted(() => {
  document.addEventListener('trigger-inline-rename', handleRenameEvent as EventListener)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('trigger-inline-rename', handleRenameEvent as EventListener)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.middle-panel {
  width: 350px;
  min-width: 300px;
  max-width: 500px;
  background: var(--linear-bg-tertiary);
  border-right: 1px solid var(--linear-border);
  display: flex;
  flex-direction: column;
}

.middle-panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--linear-border);
  background: var(--linear-surface);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.middle-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--linear-text-primary);
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--linear-accent);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--linear-transition-fast);
}

.btn-add:hover {
  background: var(--accent-primary-hover);
  transform: translateY(-1px);
}

.btn-add svg {
  width: 14px;
  height: 14px;
}

.schema-info {
  font-size: 12px;
  color: var(--linear-text-tertiary);
}

.json-files-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.json-file-card {
  background: var(--linear-surface);
  border: 1px solid var(--linear-border);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: var(--linear-transition-fast);
}

.json-file-card:hover {
  background: var(--linear-surface-hover);
  border-color: var(--linear-border-hover);
}

.json-file-card.selected {
  border-color: var(--linear-accent);
  background: var(--linear-surface-active);
}

.json-file-card.invalid {
  border-color: var(--linear-error);
  background: rgba(239, 68, 68, 0.05);
}

.json-file-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--linear-text-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.json-file-status {
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Inline rename styles */
.json-file-card.editing {
  background: var(--linear-surface-active);
  border-color: var(--linear-accent);
  box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.1);
}

.json-file-name-edit {
  margin-bottom: 4px;
  position: relative;
}

.inline-rename-input {
  width: 100%;
  padding: 4px 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--linear-text-primary);
  background: var(--linear-bg-primary);
  border: 2px solid var(--linear-accent);
  border-radius: 4px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s ease;
}

.inline-rename-input:focus {
  border-color: var(--linear-accent);
  box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.15);
}

.inline-rename-input.invalid-input {
  border-color: var(--linear-error);
  background: rgba(239, 68, 68, 0.05);
}

.inline-rename-input.invalid-input:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.validation-error {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  padding: 4px 8px;
  background: var(--linear-error);
  color: white;
  font-size: 11px;
  border-radius: 4px;
  z-index: 10;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Ensure the card has enough space for validation error */
.json-file-card.editing {
  margin-bottom: 32px;
}
</style>