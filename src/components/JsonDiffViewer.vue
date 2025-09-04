<template>
  <div class="json-diff-viewer">
    <div class="diff-header">
      <div class="diff-file-info">
        <div class="file-info-item">
          <span class="file-label">Source:</span>
          <span class="file-name">{{ sourceFile.name }}</span>
          <span class="file-status" :class="{ valid: sourceFile.isValid, invalid: !sourceFile.isValid }">
            {{ sourceFile.isValid ? '✓ Valid' : '⚠️ Invalid' }}
          </span>
        </div>
        <div class="file-info-item">
          <span class="file-label">Comparing with:</span>
          <span class="file-name">{{ comparisonFile.name }}</span>
          <span class="file-status" :class="{ valid: comparisonFile.isValid, invalid: !comparisonFile.isValid }">
            {{ comparisonFile.isValid ? '✓ Valid' : '⚠️ Invalid' }}
          </span>
        </div>
      </div>
      <button class="apple-btn plain small icon-only" @click="closeDiff" title="Close Diff View">
        ✕
      </button>
    </div>
    
    <div class="diff-content">
      <div class="diff-column">
        <div class="column-header">
          <h4>{{ sourceFile.name }}</h4>
        </div>
        <div class="json-content">
          <JsonHighlight :json="sourceFile.content" :highlightDiffs="true" :diffData="leftDiffData" />
        </div>
      </div>
      
      <div class="diff-separator"></div>
      
      <div class="diff-column">
        <div class="column-header">
          <h4>{{ comparisonFile.name }}</h4>
        </div>
        <div class="json-content">
          <JsonHighlight :json="comparisonFile.content" :highlightDiffs="true" :diffData="rightDiffData" />
        </div>
      </div>
    </div>
    
    <div class="diff-stats" v-if="diffStats">
      <div class="stat-item added">
        <span class="stat-icon">+</span>
        <span class="stat-count">{{ diffStats.added }}</span>
        <span class="stat-label">Added</span>
      </div>
      <div class="stat-item removed">
        <span class="stat-icon">-</span>
        <span class="stat-count">{{ diffStats.removed }}</span>
        <span class="stat-label">Removed</span>
      </div>
      <div class="stat-item modified">
        <span class="stat-icon">~</span>
        <span class="stat-count">{{ diffStats.modified }}</span>
        <span class="stat-label">Modified</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import JsonHighlight from './JsonHighlight.vue'

const ui = useUIStore()

const sourceFile = computed(() => ui.diffSourceFile)
const comparisonFile = computed(() => ui.diffComparisonFile)

const diffStats = computed(() => {
  if (!sourceFile.value || !comparisonFile.value) return null
  
  const diff = calculateJsonDiff(sourceFile.value.content, comparisonFile.value.content)
  return {
    added: diff.added.length,
    removed: diff.removed.length,
    modified: diff.modified.length
  }
})

const leftDiffData = computed(() => {
  if (!sourceFile.value || !comparisonFile.value) return null
  return calculateJsonDiff(sourceFile.value.content, comparisonFile.value.content)
})

const rightDiffData = computed(() => {
  if (!sourceFile.value || !comparisonFile.value) return null
  return calculateJsonDiff(comparisonFile.value.content, sourceFile.value.content)
})

function calculateJsonDiff(source: any, target: any) {
  const added: string[] = []
  const removed: string[] = []
  const modified: string[] = []
  
  // Handle plain text comparison
  if (typeof source === 'string' || typeof target === 'string') {
    return calculateTextDiff(
      typeof source === 'string' ? source : JSON.stringify(source, null, 2),
      typeof target === 'string' ? target : JSON.stringify(target, null, 2)
    )
  }
  
  // JSON object comparison
  const sourceKeys = new Set(Object.keys(flattenObject(source)))
  const targetKeys = new Set(Object.keys(flattenObject(target)))
  const sourceFlat = flattenObject(source)
  const targetFlat = flattenObject(target)
  
  // Find added keys
  for (const key of targetKeys) {
    if (!sourceKeys.has(key)) {
      added.push(key)
    }
  }
  
  // Find removed keys
  for (const key of sourceKeys) {
    if (!targetKeys.has(key)) {
      removed.push(key)
    }
  }
  
  // Find modified keys
  for (const key of sourceKeys) {
    if (targetKeys.has(key) && JSON.stringify(sourceFlat[key]) !== JSON.stringify(targetFlat[key])) {
      modified.push(key)
    }
  }
  
  return { added, removed, modified }
}

function calculateTextDiff(sourceText: string, targetText: string) {
  const added: string[] = []
  const removed: string[] = []
  const modified: string[] = []
  
  const sourceLines = sourceText.split('\n')
  const targetLines = targetText.split('\n')
  
  // Simple line-by-line comparison
  const maxLines = Math.max(sourceLines.length, targetLines.length)
  
  for (let i = 0; i < maxLines; i++) {
    const sourceLine = sourceLines[i]
    const targetLine = targetLines[i]
    
    if (sourceLine === undefined) {
      added.push(`line-${i + 1}`)
    } else if (targetLine === undefined) {
      removed.push(`line-${i + 1}`)
    } else if (sourceLine !== targetLine) {
      modified.push(`line-${i + 1}`)
    }
  }
  
  return { added, removed, modified }
}

function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const flattened: Record<string, any> = {}
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], newKey))
      } else {
        flattened[newKey] = obj[key]
      }
    }
  }
  
  return flattened
}

function closeDiff() {
  ui.setDiffMode(false)
}

// This component just displays the diff, event handling is done in Home.vue
</script>

<style scoped>
.json-diff-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--linear-surface);
  border: 1px solid var(--linear-border);
  border-radius: 8px;
  overflow: hidden;
}

.diff-header {
  padding: 16px;
  border-bottom: 1px solid var(--linear-border);
  background: var(--linear-bg-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.diff-file-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.file-label {
  font-weight: 600;
  color: var(--linear-text-secondary);
  min-width: 100px;
}

.file-name {
  font-weight: 500;
  color: var(--linear-text-primary);
}

.file-status {
  font-size: 12px;
  font-weight: 500;
}

.file-status.valid {
  color: var(--linear-success);
}

.file-status.invalid {
  color: var(--linear-error);
}

.close-diff-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--linear-text-secondary);
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-diff-btn:hover {
  background: var(--linear-border);
  color: var(--linear-text-primary);
}

.diff-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.diff-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.column-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--linear-border);
  background: var(--linear-bg-secondary);
}

.column-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--linear-text-primary);
}

.json-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
  font-family: var(--linear-font-mono);
  font-size: 13px;
  line-height: 1.5;
}

.diff-separator {
  width: 1px;
  background: var(--linear-border);
  flex-shrink: 0;
}

.diff-stats {
  padding: 12px 16px;
  border-top: 1px solid var(--linear-border);
  background: var(--linear-bg-primary);
  display: flex;
  gap: 24px;
  justify-content: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
}

.stat-icon {
  font-weight: 600;
  font-size: 14px;
}

.stat-item.added {
  color: var(--linear-success);
}

.stat-item.removed {
  color: var(--linear-error);
}

.stat-item.modified {
  color: var(--linear-warning);
}

.stat-count {
  font-weight: 600;
}

.stat-label {
  color: var(--linear-text-secondary);
}
</style>