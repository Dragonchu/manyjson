<template>
  <div class="json-highlight" v-html="highlightedJson"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  json: any
}

const props = defineProps<Props>()

const highlightedJson = computed(() => {
  if (!props.json) return ''
  
  const jsonString = JSON.stringify(props.json, null, 2)
  return highlightJsonSyntax(jsonString)
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
</style>