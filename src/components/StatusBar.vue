<template>
  <div class="status-bar-container">
    <!-- Current toast notification -->
    <div
      class="status-bar"
      :class="{
        show: uiStore.statusMessage,
        success: uiStore.statusType === 'success',
        error: uiStore.statusType === 'error'
      }"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span class="status-bar-icon" aria-hidden="true" v-if="uiStore.statusType === 'success'">&#10003;</span>
      <span class="status-bar-icon" aria-hidden="true" v-else-if="uiStore.statusType === 'error'">&#10007;</span>
      <span class="status-bar-icon" aria-hidden="true" v-else>&#8505;</span>
      <span class="status-bar-text">{{ uiStore.statusMessage }}</span>
    </div>

    <!-- Error history toggle (only shown when there's history with errors) -->
    <button
      v-if="errorCount > 0"
      class="status-history-toggle"
      :class="{ active: showHistory }"
      @click="showHistory = !showHistory"
      :aria-label="`${errorCount} recent errors. ${showHistory ? 'Hide' : 'Show'} error history.`"
      :aria-expanded="showHistory"
    >
      <span class="error-badge">{{ errorCount }}</span>
    </button>

    <!-- Error history panel -->
    <div
      v-if="showHistory"
      class="status-history-panel"
      role="log"
      aria-label="Status history"
    >
      <div class="status-history-header">
        <span>Status History</span>
        <button class="apple-btn plain small" @click="handleClearHistory" aria-label="Clear history">Clear</button>
      </div>
      <div class="status-history-list">
        <div
          v-for="entry in reversedHistory"
          :key="entry.id"
          class="status-history-entry"
          :class="entry.type"
        >
          <span class="entry-type-icon" aria-hidden="true">
            <template v-if="entry.type === 'success'">&#10003;</template>
            <template v-else-if="entry.type === 'error'">&#10007;</template>
            <template v-else>&#8505;</template>
          </span>
          <span class="entry-message">{{ entry.message }}</span>
          <span class="entry-time">{{ formatTime(entry.timestamp) }}</span>
        </div>
        <div v-if="uiStore.statusHistory.length === 0" class="status-history-empty">
          No messages yet
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
const showHistory = ref(false)

const errorCount = computed(() =>
  uiStore.statusHistory.filter(e => e.type === 'error').length
)

const reversedHistory = computed(() =>
  [...uiStore.statusHistory].reverse()
)

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function handleClearHistory() {
  uiStore.clearStatusHistory()
  showHistory.value = false
}
</script>

<style scoped>
.status-bar-container {
  position: fixed;
  bottom: var(--space-5);
  right: var(--space-5);
  z-index: var(--z-toast, 1000);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
}

.status-bar {
  background: var(--apple-bg-primary);
  border: 1px solid var(--apple-border);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  color: var(--apple-text-primary);
  opacity: 0;
  transform: translateY(10px);
  transition: var(--apple-transition);
  max-width: 360px;
  min-height: var(--touch-target-md);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  backdrop-filter: blur(20px);
  box-shadow: var(--apple-shadow-md);
  pointer-events: none;
}

.status-bar.show {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.status-bar.success {
  border-color: var(--accent-success);
  color: var(--accent-success);
}

.status-bar.error {
  border-color: var(--accent-error);
  color: var(--accent-error);
}

.status-bar-icon {
  flex-shrink: 0;
  font-size: var(--text-md);
}

.status-bar-text {
  flex: 1;
  line-height: var(--leading-normal);
}

/* Error history toggle button */
.status-history-toggle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent-error);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  box-shadow: var(--apple-shadow-md);
  transition: var(--apple-transition-fast);
}

.status-history-toggle:hover {
  transform: scale(1.1);
}

.status-history-toggle.active {
  background: var(--apple-red-hover);
}

.error-badge {
  line-height: 1;
}

/* History panel */
.status-history-panel {
  background: var(--apple-bg-primary);
  border: 1px solid var(--apple-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--apple-shadow-lg);
  backdrop-filter: blur(20px);
  width: 340px;
  max-height: 300px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.status-history-header {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--apple-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--apple-text-primary);
}

.status-history-list {
  overflow-y: auto;
  flex: 1;
}

.status-history-entry {
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--apple-border);
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
}

.status-history-entry:last-child {
  border-bottom: none;
}

.status-history-entry.error {
  color: var(--accent-error);
}

.status-history-entry.success {
  color: var(--accent-success);
}

.status-history-entry.info {
  color: var(--apple-text-secondary);
}

.entry-type-icon {
  flex-shrink: 0;
  width: 16px;
  text-align: center;
}

.entry-message {
  flex: 1;
  word-break: break-word;
}

.entry-time {
  flex-shrink: 0;
  font-size: var(--text-xs);
  color: var(--apple-text-tertiary);
  margin-left: auto;
}

.status-history-empty {
  padding: var(--space-6);
  text-align: center;
  color: var(--apple-text-tertiary);
  font-size: var(--text-sm);
}
</style>