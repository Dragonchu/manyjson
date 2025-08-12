<template>
  <div class="middle-panel">
    <div class="middle-panel-header">
      <div class="middle-panel-title">Associated JSON Files</div>
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
          invalid: !file.isValid 
        }"
        @click="selectFile(file)"
        @contextmenu.prevent="showContextMenu($event, file)"
      >
        <div class="json-file-name">{{ file.name }}</div>
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
import { useAppStore, type JsonFile } from '@/stores/app'

const appStore = useAppStore()

function selectFile(file: JsonFile) {
  appStore.setCurrentJsonFile(file)
}

function showContextMenu(event: MouseEvent, file: JsonFile) {
  // Context menu functionality will be handled by ContextMenu component
  const contextMenuEvent = new CustomEvent('show-context-menu', {
    detail: { event, file, type: 'file' }
  })
  document.dispatchEvent(contextMenuEvent)
}
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

.middle-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--linear-text-primary);
  margin-bottom: 8px;
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
}

.json-file-status {
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>