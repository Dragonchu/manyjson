<template>
  <div class="app-container">
    <!-- Left Panel - Schema Management -->
    <LeftPanel />
    
    <!-- Resize Handle -->
    <div class="resize-handle" id="leftResize"></div>
    
    <!-- Middle Panel - JSON Files List -->
    <MiddlePanel />
    
    <!-- Resize Handle -->
    <div class="resize-handle" id="middleResize"></div>
    
    <!-- Right Panel - JSON Content View -->
    <RightPanel />
    
    <!-- Context Menu -->
    <ContextMenu />
    
    <!-- Add File Popup -->
    <AddFilePopup />
    
    <!-- File Selector Popup for Diff -->
    <FileSelectorPopup />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import LeftPanel from '@/components/LeftPanel.vue'
import MiddlePanel from '@/components/MiddlePanel.vue'
import RightPanel from '@/components/RightPanel.vue'
import ContextMenu from '@/components/ContextMenu.vue'
import AddFilePopup from '@/components/AddFilePopup.vue'
import FileSelectorPopup from '@/components/FileSelectorPopup.vue'
import { useAppStore } from '@/stores/app'
import { useUIStore } from '@/stores/ui'

const appStore = useAppStore()
const ui = useUIStore()

// Handle diff view start event
const handleStartDiff = (event: CustomEvent) => {
  console.log('handleStartDiff called in Home.vue', event.detail)
  const { sourceFile, comparisonFile } = event.detail
  console.log('Setting diff mode with files:', { sourceFile: sourceFile.name, comparisonFile: comparisonFile.name })
  ui.setDiffMode(true, sourceFile, comparisonFile)
  ui.showStatus(`Comparing ${sourceFile.name} with ${comparisonFile.name}`, 'info')
  console.log('Diff mode set, isDiffMode:', ui.isDiffMode)
}

onMounted(async () => {
  // Initialize the application
  await appStore.loadSchemas()
  
  // Add event listener for diff functionality
  document.addEventListener('start-diff-view', handleStartDiff as EventListener)
})

onUnmounted(() => {
  document.removeEventListener('start-diff-view', handleStartDiff as EventListener)
})
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
}

/* Resize Handles */
.resize-handle {
  width: 4px;
  background: transparent;
  cursor: col-resize;
  position: relative;
}

.resize-handle:hover {
  background: var(--linear-accent);
}

.resize-handle::after {
  content: '';
  position: absolute;
  top: 0;
  left: -2px;
  right: -2px;
  bottom: 0;
}
</style>