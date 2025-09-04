<template>
  <div class="theme-toggle">
    <div class="theme-status">{{ getThemeStatus() }}</div>
    <div class="theme-buttons">
      <button 
      class="theme-btn"
      :class="{ active: uiStore.theme === 'light' }"
      @click="setTheme('light')"
      title="Light theme"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2"/>
        <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2"/>
        <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2"/>
      </svg>
    </button>
    
    <button 
      class="theme-btn"
      :class="{ active: uiStore.theme === 'dark' }"
      @click="setTheme('dark')"
      title="Dark theme"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" fill="currentColor"/>
      </svg>
    </button>
    
    <button 
      class="theme-btn"
      :class="{ active: uiStore.theme === 'auto' }"
      @click="setTheme('auto')"
      title="Auto theme (system preference)"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
        <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" stroke-width="2"/>
      </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUIStore, type ThemeType } from '@/stores/ui'

const uiStore = useUIStore()

function setTheme(theme: ThemeType) {
  uiStore.setTheme(theme)
}

function getThemeStatus() {
  if (uiStore.theme === 'auto') {
    return `Auto (${uiStore.currentTheme})`
  }
  return uiStore.theme.charAt(0).toUpperCase() + uiStore.theme.slice(1)
}
</script>

<style scoped>
.theme-toggle {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-status {
  font-size: 12px;
  color: var(--apple-text-secondary);
  text-align: center;
  font-weight: 500;
}

.theme-buttons {
  display: flex;
  background: var(--apple-surface);
  border: 1px solid var(--apple-border);
  border-radius: 8px;
  overflow: hidden;
}

.theme-btn {
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: var(--apple-text-secondary);
  cursor: pointer;
  transition: var(--apple-transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.theme-btn:hover {
  background: var(--apple-surface-hover);
  color: var(--apple-text-primary);
}

.theme-btn.active {
  background: var(--accent-primary);
  color: white;
}

.theme-btn.active:hover {
  background: var(--accent-primary-hover);
}

.theme-btn:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 20%;
  bottom: 20%;
  width: 1px;
  background: var(--apple-border);
}

.theme-btn.active:not(:last-child)::after {
  display: none;
}
</style>