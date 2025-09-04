<template>
  <div class="json-highlight" v-html="highlightedJson"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  json: any
  highlightDiffs?: boolean
  diffData?: {
    added: string[]
    removed: string[]
    modified: string[]
  } | null
}

const props = defineProps<Props>()

const highlightedJson = computed(() => {
  if (!props.json) return ''
  
  let content = ''
  let isJsonContent = false
  
  // Check if content is already a string (plain text) or needs JSON stringification
  if (typeof props.json === 'string') {
    content = props.json
    // Try to detect if it's JSON content
    try {
      JSON.parse(content)
      isJsonContent = true
    } catch {
      isJsonContent = false
    }
  } else {
    content = JSON.stringify(props.json, null, 2)
    isJsonContent = true
  }
  
  let highlighted = isJsonContent ? highlightJsonSyntax(content) : highlightPlainText(content)
  
  // Apply diff highlighting if enabled
  if (props.highlightDiffs && props.diffData) {
    highlighted = applyDiffHighlighting(highlighted, props.diffData)
  }
  
  return highlighted
})

function highlightJsonSyntax(json: string): string {
  // Escape HTML
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  
  // Highlight different JSON elements
  return json
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'json-number'
      
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key'
        } else {
          cls = 'json-string'
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean'
      } else if (/null/.test(match)) {
        cls = 'json-null'
      }
      
      return '<span class="' + cls + '">' + match + '</span>'
    })
}

function highlightPlainText(text: string): string {
  // Escape HTML and preserve whitespace for plain text
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function applyDiffHighlighting(html: string, diffData: { added: string[], removed: string[], modified: string[] }): string {
  let result = html
  
  const lines = result.split('\n')
  const highlightedLines = lines.map((line, index) => {
    let hasChange = false
    let changeType = ''
    
    // Check for line-based changes (for text files)
    const lineKey = `line-${index + 1}`
    if (diffData.added.includes(lineKey)) {
      hasChange = true
      changeType = 'added'
    } else if (diffData.removed.includes(lineKey)) {
      hasChange = true
      changeType = 'removed'
    } else if (diffData.modified.includes(lineKey)) {
      hasChange = true
      changeType = 'modified'
    } else {
      // Check for JSON key-based changes
      for (const key of diffData.added) {
        if (!key.startsWith('line-') && line.includes(`"${key.split('.').pop()}"`)) {
          hasChange = true
          changeType = 'added'
          break
        }
      }
      
      if (!hasChange) {
        for (const key of diffData.removed) {
          if (!key.startsWith('line-') && line.includes(`"${key.split('.').pop()}"`)) {
            hasChange = true
            changeType = 'removed'
            break
          }
        }
      }
      
      if (!hasChange) {
        for (const key of diffData.modified) {
          if (!key.startsWith('line-') && line.includes(`"${key.split('.').pop()}"`)) {
            hasChange = true
            changeType = 'modified'
            break
          }
        }
      }
    }
    
    if (hasChange) {
      return `<div class="diff-line diff-${changeType}">${line}</div>`
    }
    
    return line
  })
  
  return highlightedLines.join('\n')
}
</script>

<style scoped>
.json-highlight {
  font-family: var(--linear-font-mono);
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  color: var(--linear-text-primary);
}

:deep(.json-key) {
  color: #8b5cf6;
}

:deep(.json-string) {
  color: #10b981;
}

:deep(.json-number) {
  color: #f59e0b;
}

:deep(.json-boolean) {
  color: #ef4444;
}

:deep(.json-null) {
  color: #6b7280;
}

/* Diff highlighting styles */
:deep(.diff-line) {
  display: block;
  margin: 0 -4px;
  padding: 0 4px;
  border-radius: 3px;
}

:deep(.diff-line.diff-added) {
  background-color: rgba(16, 185, 129, 0.1);
  border-left: 3px solid var(--linear-success);
}

:deep(.diff-line.diff-removed) {
  background-color: rgba(239, 68, 68, 0.1);
  border-left: 3px solid var(--linear-error);
}

:deep(.diff-line.diff-modified) {
  background-color: rgba(245, 158, 11, 0.1);
  border-left: 3px solid var(--linear-warning);
}
</style>