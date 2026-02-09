<template>
  <div v-if="error" class="error-boundary" role="alert">
    <div class="error-boundary-icon" aria-hidden="true">&#9888;</div>
    <div class="error-boundary-content">
      <div class="error-boundary-title">Something went wrong</div>
      <div class="error-boundary-message">{{ error.message }}</div>
      <button class="apple-btn tinted small" @click="reset">Try again</button>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const error = ref<Error | null>(null)

onErrorCaptured((err: Error) => {
  error.value = err
  console.error('[ErrorBoundary] Caught:', err)
  // Returning false prevents the error from propagating further
  return false
})

function reset() {
  error.value = null
}

defineExpose({ reset })
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-6);
  background: rgba(255, 59, 48, 0.06);
  border: 1px solid var(--accent-error);
  border-radius: var(--radius-lg);
  margin: var(--space-4);
}

.error-boundary-icon {
  font-size: var(--text-2xl);
  color: var(--accent-error);
  flex-shrink: 0;
}

.error-boundary-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.error-boundary-title {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--apple-text-primary);
}

.error-boundary-message {
  font-size: var(--text-sm);
  color: var(--apple-text-secondary);
  font-family: var(--apple-font-mono);
  word-break: break-word;
}
</style>
