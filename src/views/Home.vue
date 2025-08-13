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
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import LeftPanel from '@/components/LeftPanel.vue'
import MiddlePanel from '@/components/MiddlePanel.vue'
import RightPanel from '@/components/RightPanel.vue'
import ContextMenu from '@/components/ContextMenu.vue'
import AddFilePopup from '@/components/AddFilePopup.vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

onMounted(async () => {
  // Initialize the application
  await appStore.loadSchemas()
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