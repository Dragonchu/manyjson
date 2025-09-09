<template>
  <div class="app-container" v-if="!ui.isMobile">
    <!-- Left Panel - Schema Management -->
    <AppSidebar />
    
    <!-- Resize Handle -->
    <div 
      v-if="!ui.isMobile" 
      class="resize-handle" 
      id="leftResize" 
      @mousedown="startLeftResize" 
      @dblclick="toggleLeftCollapse"
    ></div>
    
    <!-- Middle Panel - JSON Files List -->
    <MiddlePanel />
    
    <!-- Resize Handle -->
    <div v-if="!ui.isMobile" class="resize-handle" id="middleResize"></div>
    
    <!-- Right Panel - JSON Content View -->
    <RightPanel />
    
    <!-- Context Menu (disabled on mobile view-only) -->
    <ContextMenu v-if="!ui.isMobile" />
    
    <!-- Add File Popup (disabled on mobile view-only) -->
    <AddFilePopup v-if="!ui.isMobile" />
    
    <!-- File Selector Popup for Diff (disabled on mobile view-only) -->
    <FileSelectorPopup v-if="!ui.isMobile" />
  </div>
  <div v-else class="app-container">
    <MobileFriendly />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import MiddlePanel from '@/components/MiddlePanel.vue'
import RightPanel from '@/components/RightPanel.vue'
import ContextMenu from '@/components/ContextMenu.vue'
import AddFilePopup from '@/components/AddFilePopup.vue'
import FileSelectorPopup from '@/components/FileSelectorPopup.vue'
import { useAppStore } from '@/stores/app'
import { useUIStore } from '@/stores/ui'
import MobileFriendly from '@/components/MobileFriendly.vue'

const appStore = useAppStore()
const ui = useUIStore()
const route = useRoute()
const router = useRouter()

let isResizingLeft = false
let startX = 0
let startWidth = 0

function startLeftResize(event: MouseEvent) {
  isResizingLeft = true
  startX = event.clientX
  startWidth = ui.leftSidebarWidth
  document.addEventListener('mousemove', handleLeftResize)
  document.addEventListener('mouseup', stopLeftResize)
}

function handleLeftResize(event: MouseEvent) {
  if (!isResizingLeft) return
  const delta = event.clientX - startX
  if (ui.leftSidebarCollapsed) {
    ui.setLeftSidebarCollapsed(false)
  }
  ui.setLeftSidebarWidth(startWidth + delta)
}

function stopLeftResize() {
  if (!isResizingLeft) return
  isResizingLeft = false
  document.removeEventListener('mousemove', handleLeftResize)
  document.removeEventListener('mouseup', stopLeftResize)
}

function toggleLeftCollapse() {
  ui.setLeftSidebarCollapsed(!ui.leftSidebarCollapsed)
}

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
  
  // Sync initial state from route
  syncFromRoute()
  
  // Add event listener for diff functionality
  document.addEventListener('start-diff-view', handleStartDiff as EventListener)
})

onUnmounted(() => {
  document.removeEventListener('start-diff-view', handleStartDiff as EventListener)
})

// Keep store selection in sync with the route
watch(() => route.fullPath, () => {
  syncFromRoute()
})

function syncFromRoute() {
  const schemaName = route.params.schemaName as string | undefined
  const fileName = route.params.fileName as string | undefined

  if (!schemaName) {
    // Clear selection when on root
    appStore.setCurrentSchema(null)
    return
  }

  const schema = appStore.schemas.find(s => s.name === schemaName)
  if (schema) {
    if (appStore.currentSchema?.name !== schema.name) {
      appStore.setCurrentSchema(schema)
    }

    if (fileName) {
      const file = schema.associatedFiles.find(f => f.name === fileName)
      if (file) {
        appStore.setCurrentJsonFile(file)
      } else {
        appStore.setCurrentJsonFile(null)
      }
    } else {
      appStore.setCurrentJsonFile(null)
    }
  } else {
    // If schema not found but schemas are loaded, navigate back to root
    if (appStore.schemas.length > 0 && route.name !== 'Home') {
      router.replace({ name: 'Home' })
    }
  }
}
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: var(--apple-bg-primary);
  font-family: var(--apple-font-primary);
  gap: 0; /* No gap, panels handle their own borders */
}

/* Resize Handles - Apple HIG compliant */
.resize-handle {
  width: var(--spacing-xs); /* 4px - follows 8pt grid */
  background: transparent;
  cursor: col-resize;
  position: relative;
  transition: var(--apple-transition-fast);
  z-index: 10;
}

.resize-handle:hover {
  background: var(--linear-accent);
  opacity: 0.8;
}

.resize-handle:active {
  background: var(--linear-accent);
  opacity: 1;
}

/* Expand hover area for easier interaction */
.resize-handle::after {
  content: '';
  position: absolute;
  top: 0;
  left: calc(-1 * var(--spacing-xs)); /* -4px */
  right: calc(-1 * var(--spacing-xs)); /* -4px */
  bottom: 0;
}

/* Enhanced visual feedback for resize handles */
.resize-handle::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: var(--spacing-6); /* 24px */
  background: var(--apple-border);
  border-radius: 1px;
  opacity: 0;
  transition: var(--apple-transition-fast);
}

.resize-handle:hover::before {
  opacity: 0.6;
}

/* Ensure panels maintain proper content hierarchy */
.app-container > * {
  border-radius: 0; /* Panels should not have rounded corners at container level */
}
</style>