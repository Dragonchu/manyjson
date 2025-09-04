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
  bottom: 20px;
  right: 20px;
  background: var(--apple-bg-primary);
  border: 1px solid var(--apple-border);
  border-radius: 12px; /* Apple HIG standard radius */
  padding: 12px 16px; /* Increased padding for better touch target */
  font-size: 14px; /* Improved readability */
  color: var(--apple-text-primary);
  opacity: 0;
  transform: translateY(10px);
  transition: var(--apple-transition);
  z-index: 1000;
  max-width: 320px;
  min-height: 44px; /* Apple HIG minimum touch target */
  display: flex;
  align-items: center;
  backdrop-filter: blur(20px); /* Apple-style backdrop blur */
  box-shadow: var(--apple-shadow-md);
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