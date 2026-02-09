<template>
  <div
    class="context-menu"
    ref="contextMenuRef"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    v-show="isVisible"
    role="menu"
    :aria-label="contextType === 'schema' ? 'Schema actions' : 'File actions'"
    @keydown="handleMenuKeydown"
  >
    <!-- Schema context menu items -->
    <template v-if="contextType === 'schema'">
      <div class="context-menu-item" role="menuitem" tabindex="-1" @click="handleViewSchema">View Schema</div>
      <div class="context-menu-item" role="menuitem" tabindex="-1" @click="handleEditSchema">Edit Schema</div>
      <div class="context-menu-item" role="menuitem" tabindex="-1" @click="handleShareSchema">Share...</div>
      <div class="context-menu-separator" role="separator"></div>
      <div class="context-menu-item" role="menuitem" tabindex="-1" @click="handleDeleteSchema">Delete Schema</div>
    </template>

    <!-- File context menu items -->
    <template v-if="contextType === 'file'">
      <div class="context-menu-item" role="menuitem" tabindex="-1" @click="handleCopyFile">Copy File</div>
      <div class="context-menu-separator" role="separator"></div>
      <div class="context-menu-item" role="menuitem" tabindex="-1" @click="handleViewFile">View File</div>
      <div class="context-menu-item" role="menuitem" tabindex="-1" @click="handleEditFile">Edit File</div>
      <div class="context-menu-separator" role="separator"></div>
      <div class="context-menu-item" role="menuitem" tabindex="-1" @click="handleDiffWith">Diff with...</div>
      <div class="context-menu-separator" role="separator"></div>
      <div class="context-menu-item" role="menuitem" tabindex="-1" @click="handleRenameFile">Rename File</div>
      <div class="context-menu-separator" role="separator"></div>
      <div class="context-menu-item" role="menuitem" tabindex="-1" @click="handleDeleteFile">Delete File</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
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
  console.log('showContextMenu called with:', event.detail)
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

  // Auto-focus first menu item for keyboard navigation
  nextTick(() => {
    const firstItem = contextMenuRef.value?.querySelector('[role="menuitem"]') as HTMLElement | null
    firstItem?.focus()
  })
}

function hideContextMenu() {
  isVisible.value = false
  currentSchema.value = null
  currentFile.value = null
}

function handleViewSchema() {
  if (currentSchema.value) {
    appStore.setCurrentSchema(currentSchema.value)
    ui.setSchemaViewMode(true)
    ui.showStatus(`Viewing schema: ${currentSchema.value.name}`, 'info')
  }
  hideContextMenu()
}
function handleShareSchema() {
  if (currentSchema.value) {
    const evt = new CustomEvent('show-share-schema-popup', {
      detail: { schema: currentSchema.value }
    })
    document.dispatchEvent(evt)
  }
  hideContextMenu()
}

function handleEditSchema() {
  if (currentSchema.value) {
    appStore.setCurrentSchema(currentSchema.value)
    ui.setSchemaEditMode(true)
    ui.showStatus(`Editing schema: ${currentSchema.value.name}`, 'info')
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
    ui.showStatus(`Viewing file: ${currentFile.value.name}`, 'info')
  }
  hideContextMenu()
}

function handleEditFile() {
  if (currentFile.value) {
    appStore.setCurrentJsonFile(currentFile.value)
    ui.setEditMode(true)
    ui.showStatus(`Editing file: ${currentFile.value.name}`, 'info')
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

async function handleCopyFile() {
  console.log('handleCopyFile called', { currentFile: currentFile.value })
  if (currentFile.value) {
    console.log('Attempting to copy file:', currentFile.value.name)
    try {
      const success = await appStore.copyJsonFile(currentFile.value)
      console.log('Copy result:', success)
      if (success) {
        ui.showStatus(`File copied: ${currentFile.value.name}`, 'success')
      } else {
        ui.showStatus(`Failed to copy file: ${currentFile.value.name}`, 'error')
      }
    } catch (error) {
      console.error('Error during copy:', error)
      ui.showStatus(`Error copying file: ${error}`, 'error')
    }
  } else {
    console.log('No current file selected')
  }
  hideContextMenu()
}

function handleDiffWith() {
  console.log('handleDiffWith called with currentFile:', currentFile.value?.name)
  if (currentFile.value) {
    // Show file selector popup for diff comparison
    const diffEvent = new CustomEvent('show-file-selector', {
      detail: { sourceFile: currentFile.value }
    })
    console.log('Dispatching show-file-selector event')
    document.dispatchEvent(diffEvent)
  }
  hideContextMenu()
}

function handleRenameFile() {
  if (!currentFile.value) {
    hideContextMenu()
    return
  }

  // Trigger inline rename in the MiddlePanel component
  const renameEvent = new CustomEvent('trigger-inline-rename', {
    detail: { file: currentFile.value }
  })
  document.dispatchEvent(renameEvent)
  
  hideContextMenu()
}

/** Keyboard navigation within context menu (arrows, Escape) */
function handleMenuKeydown(event: KeyboardEvent) {
  const items = contextMenuRef.value?.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLElement> | undefined
  if (!items || items.length === 0) return

  const focused = document.activeElement as HTMLElement
  const currentIndex = Array.from(items).indexOf(focused)

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0
    items[next].focus()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1
    items[prev].focus()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    hideContextMenu()
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    if (focused && focused.classList.contains('context-menu-item')) {
      focused.click()
    }
  }
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
  background: var(--apple-bg-primary);
  border: 1px solid var(--apple-border);
  border-radius: var(--radius-lg); /* 12px */
  box-shadow: var(--apple-shadow-lg);
  padding: var(--spacing-sm) 0; /* 8px 0 */
  min-width: 180px;
  z-index: var(--z-dropdown);
  backdrop-filter: blur(20px); /* Apple-style backdrop blur */
}

.context-menu-item {
  padding: var(--spacing-md) var(--spacing-lg); /* 16px 20px */
  font-size: var(--text-base); /* 14px */
  cursor: pointer;
  transition: var(--apple-transition-fast);
  color: var(--apple-text-primary);
  min-height: var(--touch-target-md); /* 44px */
  display: flex;
  align-items: center;
  font-weight: var(--font-normal); /* 400 */
  line-height: var(--leading-normal);
}

.context-menu-item:hover {
  background: var(--apple-surface-hover);
  border-radius: var(--spacing-sm); /* 8px */
  margin: 0 var(--spacing-sm); /* 0 8px */
}

.context-menu-item:active {
  background: var(--apple-surface-active);
}

.context-menu-separator {
  height: 1px;
  background: var(--apple-border);
  margin: var(--spacing-sm) var(--spacing-md); /* 8px 16px */
}
</style>