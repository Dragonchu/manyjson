<template>
  <div class="left-panel">
    <div class="left-panel-header">
      <div class="left-panel-title">JSON Schema Manager</div>
      <div class="header-controls">
        <ThemeToggle />
        <div class="schema-actions">
          <button class="apple-btn tinted small" @click="handleAddSchema">Add</button>
          <button class="apple-btn bordered small" @click="handleRefresh">Refresh</button>
        </div>
      </div>
    </div>
    <div class="apple-list schema-tree">
      <div
        v-for="schema in appStore.schemas"
        :key="schema.path"
        class="apple-list-item schema"
        :class="{ selected: appStore.currentSchema?.path === schema.path }"
        @click="selectSchema(schema)"
        @contextmenu.prevent="showContextMenu($event, schema)"
      >
        <div class="schema-content">
          <span class="schema-icon">📄</span>
          <span class="schema-name">{{ schema.name }}</span>
        </div>
        <div class="apple-disclosure-indicator"></div>
      </div>
      
      <div v-if="appStore.schemas.length === 0" class="empty-state">
        <div class="empty-state-icon">📁</div>
        <div class="empty-state-title">No Schemas</div>
        <div class="empty-state-description">Add JSON schemas to get started</div>
      </div>
    </div>
    
    <!-- Add Schema Dialog -->
    <AddSchemaDialog ref="addSchemaDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore, type SchemaInfo } from '@/stores/app'
import AddSchemaDialog from './AddSchemaDialog.vue'
import ThemeToggle from './ThemeToggle.vue'

const appStore = useAppStore()
const addSchemaDialog = ref<InstanceType<typeof AddSchemaDialog>>()

function selectSchema(schema: SchemaInfo) {
  appStore.setCurrentSchema(schema)
}

function handleAddSchema() {
  addSchemaDialog.value?.showDialog()
}

function handleRefresh() {
  appStore.loadSchemas()
}

function showContextMenu(event: MouseEvent, schema: SchemaInfo) {
  // Context menu functionality will be handled by ContextMenu component
  const contextMenuEvent = new CustomEvent('show-context-menu', {
    detail: { event, schema, type: 'schema' }
  })
  document.dispatchEvent(contextMenuEvent)
}
</script>

<style scoped>
.left-panel {
  width: 300px;
  min-width: 250px;
  max-width: 400px;
  background: var(--linear-bg-secondary);
  border-right: 1px solid var(--linear-border);
  display: flex;
  flex-direction: column;
  position: relative;
}

.left-panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--linear-border);
  background: var(--linear-surface);
}

.left-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--linear-text-primary);
  margin-bottom: 12px;
}

.header-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.schema-actions {
  display: flex;
  gap: 8px;
}

.schema-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  margin: 8px;
  border-radius: 12px;
}

.schema-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.schema-icon {
  font-size: 16px;
  opacity: 0.8;
}

.schema-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--apple-text-primary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--linear-text-secondary);
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--linear-text-primary);
}

.empty-state-description {
  font-size: 14px;
  opacity: 0.8;
}
</style>