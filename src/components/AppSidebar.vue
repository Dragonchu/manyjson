<template>
  <nav class="left-panel" :style="leftPanelStyle" :class="{ collapsed: ui.leftSidebarCollapsed }" aria-label="Schema navigation">
    <div class="left-panel-header">
      <div class="left-panel-title" id="schema-list-label">JSON Schema Manager</div>
      <div class="header-controls">
        <div class="collapse-row">
          <button
            class="apple-btn plain small"
            @click="toggleCollapsed"
            :aria-label="ui.leftSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
            :aria-expanded="!ui.leftSidebarCollapsed"
          >
            <span v-if="ui.leftSidebarCollapsed" aria-hidden="true">⟩</span>
            <span v-else aria-hidden="true">⟨</span>
          </button>
        </div>
        <ThemeToggle />
        <div class="schema-actions" role="toolbar" aria-label="Schema actions">
          <button class="apple-btn tinted small" @click="handleAddSchema" v-if="!ui.isMobile" aria-label="Add new schema">Add</button>
          <button class="apple-btn bordered small" @click="handleImportSchema" v-if="!ui.isMobile" aria-label="Import schema from file">Import</button>
          <button class="apple-btn bordered small" @click="handleRefresh" aria-label="Refresh schema list">Refresh</button>
        </div>
      </div>
    </div>
    <div
      class="apple-list schema-tree"
      role="listbox"
      aria-labelledby="schema-list-label"
      @keydown="handleSchemaListKeydown"
    >
      <div
        v-for="(schema, index) in appStore.schemas"
        :key="schema.path"
        class="apple-list-item schema"
        :class="{ selected: appStore.currentSchema?.path === schema.path }"
        role="option"
        :aria-selected="appStore.currentSchema?.path === schema.path"
        :tabindex="appStore.currentSchema?.path === schema.path ? 0 : -1"
        @click="selectSchema(schema)"
        @keydown.enter="selectSchema(schema)"
        @contextmenu.prevent="ui.isMobile ? undefined : showContextMenu($event, schema)"
      >
        <div class="schema-content">
          <span class="schema-icon" aria-hidden="true">📄</span>
          <span class="schema-name">{{ schema.name }}</span>
        </div>
        <div class="apple-disclosure-indicator" aria-hidden="true"></div>
      </div>

      <div v-if="appStore.schemas.length === 0" class="empty-state" role="status">
        <div class="empty-state-icon" aria-hidden="true">📁</div>
        <div class="empty-state-title">No Schemas</div>
        <div class="empty-state-description">Add JSON schemas to get started</div>
      </div>
    </div>

    <!-- Add Schema Dialog -->
    <AddSchemaDialog ref="addSchemaDialog" />
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore, type SchemaInfo } from '@/stores/app'
import { useUIStore } from '@/stores/ui'
import AddSchemaDialog from './AddSchemaDialog.vue'
import ThemeToggle from './ThemeToggle.vue'
import { getPlatformRuntime } from '@/platform/runtime'

const appStore = useAppStore()
const ui = useUIStore()
const addSchemaDialog = ref<InstanceType<typeof AddSchemaDialog>>()
const router = useRouter()
const runtime = getPlatformRuntime()

// Listen for global Cmd/Ctrl+N shortcut
const onTriggerAddSchema = () => { handleAddSchema() }
onMounted(() => { document.addEventListener('trigger-add-schema', onTriggerAddSchema) })
onUnmounted(() => { document.removeEventListener('trigger-add-schema', onTriggerAddSchema) })

const leftPanelStyle = computed(() => {
  if (ui.isMobile) {
    return { width: '100%', minWidth: 'unset', maxWidth: 'unset' }
  }
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

async function handleImportSchema() {
  try {
    if (runtime.name === 'web') {
      // Use File System Access API if available via platform wrapper
      const result = await runtime.apis.showOpenDialog({
        title: 'Import schema JSON',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: []
      })
      if (result.canceled || result.filePaths.length === 0) return
      // Read first selection
      const filePath = result.filePaths[0]
      const read = await runtime.apis.readTextFile(filePath)
      if (!read.success || !read.content) {
        ui.showStatus('Failed to read selected file', 'error')
        return
      }
      // Parse and add schema
      let json: any
      try {
        json = JSON.parse(read.content)
      } catch (e) {
        ui.showStatus('Selected file is not valid JSON', 'error')
        return
      }
      const name = (filePath.split('/').pop() || 'schema.json')
      const ok = await appStore.addSchema(name, json, { path: filePath })
      if (ok) {
        ui.showStatus(`Imported schema: ${name}`, 'success')
      } else {
        ui.showStatus('Failed to import schema', 'error')
      }
    } else {
      // Desktop: use native open dialog exposed already via electronAPI
      const result = await runtime.apis.showOpenDialog({
        title: 'Import schema JSON',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
      })
      if (result.canceled || result.filePaths.length === 0) return
      const filePath = result.filePaths[0]
      const read = await runtime.apis.readTextFile(filePath)
      if (!read.success || !read.content) {
        ui.showStatus('Failed to read selected file', 'error')
        return
      }
      let json: any
      try { json = JSON.parse(read.content) } catch {
        ui.showStatus('Selected file is not valid JSON', 'error')
        return
      }
      const name = (filePath.split('/').pop() || 'schema.json')
      const ok = await appStore.addSchema(name, json, { path: filePath })
      if (ok) ui.showStatus(`Imported schema: ${name}`, 'success')
      else ui.showStatus('Failed to import schema', 'error')
    }
  } catch (e) {
    ui.showStatus('Import canceled or failed', 'error')
  }
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

/** Arrow-key navigation within the schema list */
function handleSchemaListKeydown(event: KeyboardEvent) {
  const schemas = appStore.schemas
  if (schemas.length === 0) return

  const currentIndex = schemas.findIndex(s => s.path === appStore.currentSchema?.path)

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    const next = currentIndex < schemas.length - 1 ? currentIndex + 1 : 0
    selectSchema(schemas[next])
    focusSchemaItem(next)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    const prev = currentIndex > 0 ? currentIndex - 1 : schemas.length - 1
    selectSchema(schemas[prev])
    focusSchemaItem(prev)
  }
}

function focusSchemaItem(index: number) {
  const list = document.querySelector('.schema-tree')
  if (!list) return
  const items = list.querySelectorAll('[role="option"]')
  if (items[index]) (items[index] as HTMLElement).focus()
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