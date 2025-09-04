<template>
  <div class="json-diff-viewer">
    <div class="diff-header">
      <div class="diff-title">JSON Diff Comparison</div>
      <div class="diff-controls">
        <button class="action-btn" @click="toggleViewMode" :title="viewMode === 'side-by-side' ? 'Switch to unified view' : 'Switch to side-by-side view'">
          {{ viewMode === 'side-by-side' ? '📄' : '📖' }}
        </button>
      </div>
    </div>
    
    <div class="diff-content" :class="viewMode">
      <div v-if="viewMode === 'side-by-side'" class="side-by-side-view">
        <div class="diff-panel">
          <div class="panel-header">Original</div>
          <div class="diff-original" v-html="formattedOriginal"></div>
        </div>
        <div class="diff-panel">
          <div class="panel-header">Modified</div>
          <div class="diff-modified" v-html="formattedModified"></div>
        </div>
      </div>
      
      <div v-else class="unified-view">
        <div class="diff-unified" v-html="unifiedDiff"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import * as jsondiffpatch from 'jsondiffpatch'

interface Props {
  originalContent: any
  modifiedContent: any
}

const props = defineProps<Props>()

const viewMode = ref<'side-by-side' | 'unified'>('side-by-side')

// Create jsondiffpatch instance with custom formatting
const differ = jsondiffpatch.create({
  objectHash: function(obj: any, index: number) {
    // Use id or name field for object identification, fallback to index
    if (typeof obj === 'object' && obj !== null) {
      return obj.id || obj.name || obj.key || index
    }
    return index
  },
  arrays: {
    detectMove: true,
    includeValueOnMove: false
  },
  textDiff: {
    minLength: 60
  }
})

const diffResult = computed(() => {
  try {
    const originalJson = typeof props.originalContent === 'string' 
      ? JSON.parse(props.originalContent) 
      : props.originalContent
    const modifiedJson = typeof props.modifiedContent === 'string' 
      ? JSON.parse(props.modifiedContent) 
      : props.modifiedContent
    
    return differ.diff(originalJson, modifiedJson)
  } catch (error) {
    console.error('Error computing diff:', error)
    return null
  }
})

const formattedOriginal = computed(() => {
  try {
    const originalJson = typeof props.originalContent === 'string' 
      ? JSON.parse(props.originalContent) 
      : props.originalContent
    return formatJsonWithHighlighting(originalJson, 'original')
  } catch (error) {
    return '<pre class="error">Invalid JSON in original content</pre>'
  }
})

const formattedModified = computed(() => {
  try {
    const modifiedJson = typeof props.modifiedContent === 'string' 
      ? JSON.parse(props.modifiedContent) 
      : props.modifiedContent
    return formatJsonWithHighlighting(modifiedJson, 'modified')
  } catch (error) {
    return '<pre class="error">Invalid JSON in modified content</pre>'
  }
})

const unifiedDiff = computed(() => {
  if (!diffResult.value) {
    return '<div class="no-changes">No differences found</div>'
  }
  
  try {
    const originalJson = typeof props.originalContent === 'string' 
      ? JSON.parse(props.originalContent) 
      : props.originalContent
    const modifiedJson = typeof props.modifiedContent === 'string' 
      ? JSON.parse(props.modifiedContent) 
      : props.modifiedContent
    
    return generateUnifiedDiffView(originalJson, modifiedJson, diffResult.value)
  } catch (error) {
    return '<pre class="error">Error generating unified diff</pre>'
  }
})

function toggleViewMode() {
  viewMode.value = viewMode.value === 'side-by-side' ? 'unified' : 'side-by-side'
}

function formatJsonWithHighlighting(json: any, type: 'original' | 'modified'): string {
  const formatted = JSON.stringify(json, null, 2)
  const lines = formatted.split('\n')
  
  return `<pre class="json-content ${type}">${lines.map((line, index) => 
    `<span class="line-number">${(index + 1).toString().padStart(3, ' ')}</span><span class="line-content">${escapeHtml(line)}</span>`
  ).join('\n')}</pre>`
}

function generateUnifiedDiffView(original: any, modified: any, diff: any): string {
  if (!diff) {
    return '<div class="no-changes">No differences found</div>'
  }
  
  const originalLines = JSON.stringify(original, null, 2).split('\n')
  const modifiedLines = JSON.stringify(modified, null, 2).split('\n')
  
  let result = '<pre class="unified-diff">'
  
  // Simple unified diff implementation
  const maxLines = Math.max(originalLines.length, modifiedLines.length)
  
  for (let i = 0; i < maxLines; i++) {
    const originalLine = originalLines[i] || ''
    const modifiedLine = modifiedLines[i] || ''
    
    if (originalLine === modifiedLine) {
      result += `<span class="line-unchanged"><span class="line-number">${(i + 1).toString().padStart(3, ' ')}</span><span class="line-content">${escapeHtml(originalLine)}</span></span>\n`
    } else {
      if (originalLine && !modifiedLine) {
        result += `<span class="line-removed"><span class="line-number">-</span><span class="line-content">${escapeHtml(originalLine)}</span></span>\n`
      } else if (!originalLine && modifiedLine) {
        result += `<span class="line-added"><span class="line-number">+</span><span class="line-content">${escapeHtml(modifiedLine)}</span></span>\n`
      } else {
        result += `<span class="line-removed"><span class="line-number">-</span><span class="line-content">${escapeHtml(originalLine)}</span></span>\n`
        result += `<span class="line-added"><span class="line-number">+</span><span class="line-content">${escapeHtml(modifiedLine)}</span></span>\n`
      }
    }
  }
  
  result += '</pre>'
  return result
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
</script>

<style scoped>
.json-diff-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  color: #d4d4d4;
}

.diff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #333;
  background: #252526;
}

.diff-title {
  font-weight: 600;
  font-size: 14px;
  color: #cccccc;
}

.diff-controls {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #464647;
  background: #3c3c3c;
  color: #cccccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #464647;
  border-color: #6c6c6c;
}

.diff-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.side-by-side-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  height: 100%;
}

.diff-panel {
  display: flex;
  flex-direction: column;
  border: 1px solid #333;
  border-radius: 6px;
  overflow: hidden;
}

.panel-header {
  padding: 8px 12px;
  background: #2d2d30;
  border-bottom: 1px solid #333;
  font-weight: 500;
  font-size: 13px;
  color: #cccccc;
}

.diff-original,
.diff-modified,
.diff-unified {
  flex: 1;
  overflow: auto;
  background: #1e1e1e;
}

.unified-view {
  height: 100%;
}

:deep(.json-content) {
  margin: 0;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
  white-space: pre;
  overflow: auto;
}

:deep(.line-number) {
  color: #858585;
  margin-right: 16px;
  user-select: none;
}

:deep(.line-content) {
  color: #d4d4d4;
}

:deep(.line-unchanged) {
  display: block;
  color: #d4d4d4;
}

:deep(.line-added) {
  display: block;
  background: rgba(46, 160, 67, 0.2);
  color: #4ec9b0;
}

:deep(.line-removed) {
  display: block;
  background: rgba(248, 81, 73, 0.2);
  color: #f48771;
}

:deep(.unified-diff) {
  margin: 0;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
  white-space: pre;
  overflow: auto;
  background: #1e1e1e;
}

:deep(.no-changes) {
  padding: 40px;
  text-align: center;
  color: #858585;
  font-style: italic;
}

:deep(.error) {
  color: #f48771;
  background: rgba(248, 81, 73, 0.1);
  padding: 12px;
  border-radius: 4px;
  margin: 12px;
}
</style>