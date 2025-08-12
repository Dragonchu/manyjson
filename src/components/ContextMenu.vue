<template>
  <div 
    class="context-menu" 
    ref="contextMenuRef"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    v-show="isVisible"
  >
    <div class="context-menu-item" @click="handleViewSchema">View Schema</div>
    <div class="context-menu-item" @click="handleEditSchema">Edit Schema</div>
    <div class="context-menu-separator"></div>
    <div class="context-menu-item" @click="handleDeleteSchema">Delete Schema</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAppStore, type SchemaInfo } from '@/stores/app'

const appStore = useAppStore()
const contextMenuRef = ref<HTMLElement>()
const isVisible = ref(false)
const position = ref({ x: 0, y: 0 })
const currentSchema = ref<SchemaInfo | null>(null)

function showContextMenu(event: CustomEvent) {
  const { event: mouseEvent, schema } = event.detail
  currentSchema.value = schema
  position.value = { x: mouseEvent.clientX, y: mouseEvent.clientY }
  isVisible.value = true
}

function hideContextMenu() {
  isVisible.value = false
  currentSchema.value = null
}

function handleViewSchema() {
  if (currentSchema.value) {
    appStore.showStatus(`Viewing schema: ${currentSchema.value.name}`, 'info')
    // TODO: Implement schema viewing
  }
  hideContextMenu()
}

function handleEditSchema() {
  if (currentSchema.value) {
    appStore.showStatus(`Edit schema functionality coming soon`, 'info')
    // TODO: Implement schema editing
  }
  hideContextMenu()
}

function handleDeleteSchema() {
  if (currentSchema.value) {
    appStore.showStatus(`Delete schema functionality coming soon`, 'info')
    // TODO: Implement schema deletion
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