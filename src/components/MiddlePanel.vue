<template>
  <div class="middle-panel">
    <div class="middle-panel-header">
      <div class="header-top">
        <div class="middle-panel-title">Associated JSON Files</div>
        <button 
          v-if="appStore.currentSchema && !ui.isMobile" 
          class="apple-btn tinted small"
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
        @contextmenu.prevent="ui.isMobile ? undefined : showContextMenu($event, file)"
        @dblclick="ui.isMobile ? undefined : startInlineRename(file)"
      >
        <!-- Normal display mode -->
        <div v-if="!inlineRename.isEditing(file)" class="json-file-name" :title="`${file.name}\n\nDouble-click or press F2 to rename`">
          {{ file.name }}
        </div>
        
        <!-- Inline edit mode -->
        <div v-else class="json-file-name-edit">
          <input
            type="text"
            class="apple-input inline-rename-input"
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
import { useRouter } from 'vue-router'
import { useAppStore, type JsonFile } from '@/stores/app'
import { useUIStore } from '@/stores/ui'
import { useInlineRename } from '@/composables/useInlineRename'

const appStore = useAppStore()
const ui = useUIStore()
const inlineRename = useInlineRename()
const router = useRouter()

// Track if we're confirming via Enter key
let isConfirming = false

function selectFile(file: JsonFile) {
  // Don't select if we're editing this file
  if (inlineRename.isEditing(file)) {
    return
  }
  if (appStore.currentSchema) {
    router.push({ name: 'SchemaFile', params: { schemaName: appStore.currentSchema.name, fileName: file.name } })
  } else {
    appStore.setCurrentJsonFile(file)
  }
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
  if (ui.isMobile) {
    return
  }
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
  width: var(--panel-width-lg); /* 350px */
  min-width: var(--panel-width-md); /* 300px */
  max-width: var(--panel-width-xl); /* 400px */
  background: var(--linear-bg-tertiary);
  border-right: 1px solid var(--linear-border);
  display: flex;
  flex-direction: column;
}

.middle-panel-header {
  padding: var(--spacing-lg); /* 20px - Apple standard medium */
  border-bottom: 1px solid var(--linear-border);
  background: var(--linear-surface);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm); /* 8px */
}

.middle-panel-title {
  font-size: var(--text-base); /* 14px */
  font-weight: var(--font-semibold); /* 600 */
  color: var(--linear-text-primary);
  line-height: var(--leading-normal);
}

/* Button styles moved to apple-btn system in main CSS */

.schema-info {
  font-size: var(--text-sm); /* 12px */
  color: var(--linear-text-tertiary);
  line-height: var(--leading-normal);
}

.json-files-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm); /* 8px */
}

.json-file-card {
  background: var(--apple-bg-primary);
  border: 1px solid var(--apple-border);
  border-radius: var(--radius-lg); /* 12px */
  padding: var(--spacing-lg); /* 20px */
  margin-bottom: var(--spacing-sm); /* 8px */
  cursor: pointer;
  transition: var(--apple-transition-fast);
  min-height: var(--touch-target-md); /* 44px */
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: var(--apple-shadow-sm);
}

.json-file-card:hover {
  background: var(--apple-surface-hover);
  border-color: var(--apple-border-hover);
  box-shadow: var(--apple-shadow-md);
  transform: translateY(-1px);
}

.json-file-card.selected {
  border-color: var(--accent-primary);
  background: rgba(var(--linear-accent-rgb), 0.1);
  box-shadow: var(--apple-shadow-md);
}

.json-file-card.invalid {
  border-color: var(--accent-error);
  background: rgba(255, 59, 48, 0.05);
}

.json-file-name {
  font-size: var(--text-base); /* 14px */
  font-weight: var(--font-medium); /* 500 */
  color: var(--apple-text-primary);
  margin-bottom: var(--spacing-xs); /* 4px */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: var(--leading-normal);
}

.json-file-status {
  font-size: var(--text-xs); /* 11px */
  display: flex;
  align-items: center;
  gap: var(--spacing-xs); /* 4px */
  line-height: var(--leading-normal);
}

/* Inline rename styles */
.json-file-card.editing {
  background: var(--linear-surface-active);
  border-color: var(--linear-accent);
  box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.1);
}

.json-file-name-edit {
  margin-bottom: var(--spacing-xs); /* 4px */
  position: relative;
}

.inline-rename-input {
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-sm); /* 4px 8px */
  font-size: var(--text-sm); /* 12px */
  font-weight: var(--font-medium); /* 500 */
  color: var(--linear-text-primary);
  background: var(--linear-bg-primary);
  border: 2px solid var(--linear-accent);
  border-radius: var(--radius-sm); /* 4px */
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s var(--apple-ease);
}

/* Inline input inherits apple-input styling with overrides */
.inline-rename-input {
  min-height: var(--touch-target-sm); /* 32px - smaller for inline editing */
  padding: var(--spacing-sm) var(--spacing-md); /* 8px 16px */
  font-size: var(--text-base); /* 14px */
  font-weight: var(--font-medium); /* 500 */
}

.inline-rename-input.invalid-input {
  border-color: var(--accent-error);
  background: rgba(255, 59, 48, 0.05);
}

.inline-rename-input.invalid-input:focus {
  box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.2);
}

.validation-error {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: var(--spacing-sm); /* 8px */
  padding: var(--spacing-sm) var(--spacing-md); /* 8px 16px */
  background: var(--accent-error);
  color: white;
  font-size: var(--text-sm); /* 12px */
  border-radius: var(--radius-md); /* 8px */
  z-index: 10;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: var(--apple-shadow-md);
  font-weight: var(--font-medium); /* 500 */
}

/* Ensure the card has enough space for validation error */
.json-file-card.editing {
  margin-bottom: var(--spacing-2xl); /* 32px */
}
</style>