<template>
  <div 
    class="status-bar" 
    :class="{ 
      show: appStore.statusMessage, 
      success: appStore.statusType === 'success',
      error: appStore.statusType === 'error'
    }"
  >
    {{ appStore.statusMessage }}
  </div>
</template>

<script setup lang="ts">
import { useUIStore } from '@/stores/ui'

const appStore = useUIStore()
</script>

<style scoped>
.status-bar {
  position: fixed;
  bottom: 16px;
  right: 16px;
  background: var(--linear-bg-secondary);
  border: 1px solid var(--linear-border);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--linear-text-secondary);
  opacity: 0;
  transform: translateY(10px);
  transition: var(--linear-transition);
  z-index: 1000;
  max-width: 300px;
}

.status-bar.show {
  opacity: 1;
  transform: translateY(0);
}

.status-bar.success {
  border-color: var(--linear-success);
  color: var(--linear-success);
}

.status-bar.error {
  border-color: var(--linear-error);
  color: var(--linear-error);
}
</style>