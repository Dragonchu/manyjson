<template>
  <div class="left-panel" :style="leftPanelStyle" :class="{ collapsed: ui.leftSidebarCollapsed }">
    <div class="left-panel-header">
      <div class="left-panel-title">JSON Schema Manager</div>
      <div class="header-controls">
        <div class="collapse-row">
          <button class="apple-btn plain small" @click="toggleCollapsed" :title="ui.leftSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'">
            <span v-if="ui.leftSidebarCollapsed">⟩</span>
            <span v-else>⟨</span>
          </button>
        </div>
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
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore, type SchemaInfo } from '@/stores/app'
import { useUIStore } from '@/stores/ui'
import AddSchemaDialog from './AddSchemaDialog.vue'
import ThemeToggle from './ThemeToggle.vue'

const appStore = useAppStore()
const ui = useUIStore()
const addSchemaDialog = ref<InstanceType<typeof AddSchemaDialog>>()
const router = useRouter()

const leftPanelStyle = computed(() => {
  if (ui.leftSidebarCollapsed) {
    return { width: '48px', minWidth: '48px' }
  }
  return { width: `${ui.leftSidebarWidth}px`, minWidth: '250px', maxWidth: '400px' }
})

function selectSchema(schema: SchemaInfo) {
  // Navigate to schema route to keep URL and state in sync
  router.push({ name: 'Schema', params: { schemaName: schema.name } })
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

function toggleCollapsed() {
  ui.setLeftSidebarCollapsed(!ui.leftSidebarCollapsed)
}
</script>

<style scoped>
.left-panel {
  width: var(--panel-width-md); /* 300px */
  min-width: var(--panel-width-sm); /* 250px */
  max-width: var(--panel-width-xl); /* 400px */
  background: var(--linear-bg-secondary);
  border-right: 1px solid var(--linear-border);
  display: flex;
  flex-direction: column;
  position: relative;
}

.left-panel-header {
  padding: var(--spacing-lg); /* 20px - Apple standard medium */
  border-bottom: 1px solid var(--linear-border);
  background: var(--linear-surface);
}

.left-panel-title {
  font-size: var(--text-base); /* 14px */
  font-weight: var(--font-semibold); /* 600 */
  color: var(--linear-text-primary);
  margin-bottom: var(--spacing-md); /* 16px */
  line-height: var(--leading-normal);
}

.header-controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md); /* 16px */
}

.collapse-row {
  display: flex;
  justify-content: flex-end;
}

/* Collapsed state styling */
.left-panel.collapsed .left-panel-title,
.left-panel.collapsed .schema-actions,
.left-panel.collapsed .schema-tree,
.left-panel.collapsed :deep(.theme-toggle) {
  display: none;
}

.left-panel.collapsed .left-panel-header {
  padding: var(--spacing-md);
}

.left-panel.collapsed .collapse-row {
  justify-content: center;
}

.schema-actions {
  display: flex;
  gap: var(--spacing-sm); /* 8px */
}

.schema-tree {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm); /* 8px */
  margin: var(--spacing-sm); /* 8px */
  border-radius: var(--radius-lg); /* 12px */
}

.schema-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm); /* 8px */
}

.schema-icon {
  font-size: var(--text-md); /* 16px */
  opacity: 0.8;
}

.schema-name {
  font-size: var(--text-base); /* 14px */
  font-weight: var(--font-medium); /* 500 */
  color: var(--apple-text-primary);
  line-height: var(--leading-normal);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl) var(--spacing-lg); /* 48px 20px */
  text-align: center;
  color: var(--linear-text-secondary);
}

.empty-state-icon {
  font-size: var(--text-3xl); /* 28px */
  margin-bottom: var(--spacing-lg); /* 20px */
  opacity: 0.5;
}

.empty-state-title {
  font-size: var(--text-md); /* 16px */
  font-weight: var(--font-semibold); /* 600 */
  margin-bottom: var(--spacing-sm); /* 8px */
  color: var(--linear-text-primary);
  line-height: var(--leading-normal);
}

.empty-state-description {
  font-size: var(--text-base); /* 14px */
  opacity: 0.8;
  line-height: var(--leading-relaxed);
}
</style>