<template>
  <div 
    class="context-menu" 
    ref="contextMenuRef"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    v-show="isVisible"
  >
    <!-- Schema context menu items -->
    <template v-if="contextType === 'schema'">
      <div class="context-menu-item" @click="handleViewSchema">View Schema</div>
      <div class="context-menu-item" @click="handleEditSchema">Edit Schema</div>
      <div class="context-menu-separator"></div>
      <div class="context-menu-item" @click="handleDeleteSchema">Delete Schema</div>
    </template>
    
    <!-- File context menu items -->
    <template v-if="contextType === 'file'">
      <div class="context-menu-item" @click="handleViewFile">View File</div>
      <div class="context-menu-item" @click="handleEditFile">Edit File</div>
      <div class="context-menu-separator"></div>
      <div class="context-menu-item" @click="handleDeleteFile">Delete File</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAppStore, type SchemaInfo, type JsonFile } from '@/stores/app'
import { useUIStore } from '@/stores/ui'

const appStore = useAppStore()
const ui = useUIStore()
const contextMenuRef = ref<HTMLElement>()
const isVisible = ref(false)
const position = ref({ x: 0, y: 0 })
const currentSchema = ref<SchemaInfo | null>(null)
const currentFile = ref<JsonFile | null>(null)
const contextType = ref<'schema' | 'file'>('schema')

function showContextMenu(event: CustomEvent) {
  const { event: mouseEvent, schema, file, type } = event.detail
  
  if (type === 'schema') {
    currentSchema.value = schema
    currentFile.value = null
    contextType.value = 'schema'
  } else if (type === 'file') {
    currentFile.value = file
    currentSchema.value = null
    contextType.value = 'file'
  }
  
  position.value = { x: mouseEvent.clientX, y: mouseEvent.clientY }
  isVisible.value = true
}

function hideContextMenu() {
  isVisible.value = false
  currentSchema.value = null
  currentFile.value = null
}

function handleViewSchema() {
  if (currentSchema.value) {
    appStore.setCurrentSchema(currentSchema.value)
    appStore.setSchemaViewMode(true)
    appStore.showStatus(`Viewing schema: ${currentSchema.value.name}`, 'info')
  }
  hideContextMenu()
}

function handleEditSchema() {
  if (currentSchema.value) {
    appStore.setCurrentSchema(currentSchema.value)
    appStore.setSchemaEditMode(true)
    appStore.showStatus(`Editing schema: ${currentSchema.value.name}`, 'info')
  }
  hideContextMenu()
}

async function handleDeleteSchema() {
  if (currentSchema.value) {
    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to delete the schema "${currentSchema.value.name}"? This action cannot be undone.`)
    
    if (confirmed) {
      await appStore.deleteSchema(currentSchema.value)
    }
  }
  hideContextMenu()
}

function handleViewFile() {
  if (currentFile.value) {
    appStore.setCurrentJsonFile(currentFile.value)
    appStore.showStatus(`Viewing file: ${currentFile.value.name}`, 'info')
  }
  hideContextMenu()
}

function handleEditFile() {
  if (currentFile.value) {
    appStore.setCurrentJsonFile(currentFile.value)
    ui.setEditMode(true)
    appStore.showStatus(`Editing file: ${currentFile.value.name}`, 'info')
  }
  hideContextMenu()
}

async function handleDeleteFile() {
  if (currentFile.value) {
    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to delete the file "${currentFile.value.name}"? This action cannot be undone.`)
    
    if (confirmed) {
      await appStore.deleteJsonFile(currentFile.value)
    }
  }
  hideContextMenu()
}

function handleClickOutside(event: MouseEvent) {
  if (contextMenuRef.value && !contextMenuRef.value.contains(event.target as Node)) {
    hideContextMenu()
  }
}

onMounted(() => {
  document.addEventListener('show-context-menu', showContextMenu as EventListener)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('show-context-menu', showContextMenu as EventListener)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: var(--linear-bg-secondary);
  border: 1px solid var(--linear-border);
  border-radius: 8px;
  box-shadow: var(--linear-shadow-lg);
  padding: 4px 0;
  min-width: 150px;
  z-index: 1000;
}

.context-menu-item {
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: var(--linear-transition-fast);
  color: var(--linear-text-primary);
}

.context-menu-item:hover {
  background: var(--linear-surface-hover);
}

.context-menu-separator {
  height: 1px;
  background: var(--linear-border);
  margin: 4px 0;
}
</style>