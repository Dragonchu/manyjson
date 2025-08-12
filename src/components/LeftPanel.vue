<template>
  <div class="left-panel">
    <div class="left-panel-header">
      <div class="left-panel-title">JSON Schema Manager</div>
      <div class="schema-actions">
        <button class="btn-small" @click="handleAddSchema">Add</button>
        <button class="btn-small" @click="handleRefresh">Refresh</button>
      </div>
    </div>
    <div class="schema-tree">
      <div
        v-for="schema in appStore.schemas"
        :key="schema.path"
        class="tree-item schema"
        :class="{ selected: appStore.currentSchema?.path === schema.path }"
        @click="selectSchema(schema)"
        @contextmenu.prevent="showContextMenu($event, schema)"
      >
        {{ schema.name }}
      </div>
      
      <div v-if="appStore.schemas.length === 0" class="empty-state">
        <div class="empty-state-icon">📁</div>
        <div class="empty-state-title">No Schemas</div>
        <div class="empty-state-description">Add JSON schemas to get started</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore, type SchemaInfo } from '@/stores/app'

const appStore = useAppStore()

function selectSchema(schema: SchemaInfo) {
  appStore.setCurrentSchema(schema)
}

function handleAddSchema() {
  appStore.showStatus('Add schema functionality coming soon', 'info')
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
  margin-bottom: 8px;
}

.schema-actions {
  display: flex;
  gap: 8px;
}

.schema-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.tree-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin: 2px 0;
  cursor: pointer;
  border-radius: 6px;
  transition: var(--linear-transition-fast);
  font-size: 13px;
  user-select: none;
}

.tree-item:hover {
  background: var(--linear-surface-hover);
}

.tree-item.selected {
  background: var(--linear-accent);
  color: white;
}

.tree-item.schema {
  color: var(--linear-text-secondary);
  padding-left: 24px;
}

.tree-item.schema::before {
  content: "📄";
  margin-right: 8px;
}
</style>