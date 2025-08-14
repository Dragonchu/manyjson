<template>
  <div class="app-container">
    <!-- Show loading spinner while initializing -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <div class="loading-text">Initializing ManyJson...</div>
      </div>
    </div>
    
    <!-- Main application content -->
    <template v-else>
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import LeftPanel from '@/components/LeftPanel.vue'
import MiddlePanel from '@/components/MiddlePanel.vue'
import RightPanel from '@/components/RightPanel.vue'
import ContextMenu from '@/components/ContextMenu.vue'
import AddFilePopup from '@/components/AddFilePopup.vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const isLoading = ref(true)

onMounted(async () => {
  try {
    // Initialize the application
    await appStore.loadSchemas()
  } catch (error) {
    console.error('Failed to initialize app:', error)
  } finally {
    isLoading.value = false
  }
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

/* Loading overlay styles */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--linear-bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  text-align: center;
  color: var(--linear-text-primary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(99, 102, 241, 0.3);
  border-top: 4px solid var(--linear-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.loading-text {
  font-size: 16px;
  color: var(--linear-text-secondary);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>