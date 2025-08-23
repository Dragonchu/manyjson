<template>
  <div class="advanced-json-editor">
    <div ref="editorRef" class="editor-container"></div>
  </div>
</template>

<script setup lang="ts">
import CodeMirror from 'codemirror'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

// Import CodeMirror modes and addons
import 'codemirror/addon/dialog/dialog'
import 'codemirror/addon/edit/closebrackets'
import 'codemirror/addon/edit/matchbrackets'
import 'codemirror/addon/fold/brace-fold'
import 'codemirror/addon/fold/foldcode'
import 'codemirror/addon/fold/foldgutter'
import 'codemirror/addon/lint/json-lint'
import 'codemirror/addon/lint/lint'
import 'codemirror/addon/search/search'
import 'codemirror/addon/search/searchcursor'
import 'codemirror/mode/javascript/javascript'

// Import CSS
import 'codemirror/addon/dialog/dialog.css'
import 'codemirror/addon/fold/foldgutter.css'
import 'codemirror/addon/lint/lint.css'
import 'codemirror/lib/codemirror.css'

interface Props {
  modelValue: string
  readonly?: boolean
  placeholder?: string
  schema?: any
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'validation-change', errors: any[]): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  placeholder: 'Enter JSON content...'
})

const emit = defineEmits<Emits>()

const editorRef = ref<HTMLElement>()
let editor: CodeMirror.Editor | null = null

// Custom JSON lint function
const jsonLint = (text: string) => {
  const found: any[] = []
  if (!text) return found
  
  try {
    JSON.parse(text)
  } catch (error: any) {
    const match = error.message.match(/at position (\d+)/)
    const pos = match ? parseInt(match[1]) : 0
    const lines = text.substring(0, pos).split('\n')
    const line = lines.length - 1
    const ch = lines[lines.length - 1].length
    
    found.push({
      from: CodeMirror.Pos(line, ch),
      to: CodeMirror.Pos(line, ch),
      message: error.message,
      severity: 'error'
    })
  }
  
  // Emit validation errors
  emit('validation-change', found)
  
  return found
}

// Initialize the editor
const initEditor = async () => {
  if (!editorRef.value) return
  
  editor = CodeMirror(editorRef.value, {
    value: props.modelValue,
    mode: { name: 'javascript', json: true },
    theme: 'default',
    lineNumbers: true,
    lineWrapping: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    foldGutter: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers'],
    lint: {
      getAnnotations: jsonLint,
      async: false
    },
    readOnly: props.readonly,
    indentUnit: 2,
    tabSize: 2,
    indentWithTabs: false,
    extraKeys: {
      'Ctrl-F': 'findPersistent',
      'Cmd-F': 'findPersistent',
      'Tab': (cm: CodeMirror.Editor) => {
        if (cm.somethingSelected()) {
          cm.indentSelection('add')
        } else {
          cm.replaceSelection('  ')
        }
      }
    }
  })
  
  // Listen for changes
  editor.on('change', (cm: CodeMirror.Editor) => {
    if (!props.readonly) {
      const newValue = cm.getValue()
      emit('update:modelValue', newValue)
    }
  })
  
  // Handle placeholder
  if (props.placeholder && !props.modelValue) {
    editor.setValue(props.placeholder)
    editor.getWrapperElement().classList.add('placeholder-active')
  }
  
  // Apply custom styling
  // applyCustomTheme()
}

// Apply custom theme to match the original design
const applyCustomTheme = () => {
  if (!editor) return
  
  const wrapper = editor.getWrapperElement()
  wrapper.style.height = '100%'
  wrapper.style.fontSize = '13px'
  wrapper.style.fontFamily = 'var(--linear-font-mono, "Monaco", "Menlo", "Ubuntu Mono", monospace)'
  wrapper.style.border = '1px solid var(--linear-border)'
  wrapper.style.borderRadius = '8px'
  wrapper.style.backgroundColor = 'var(--linear-bg-primary)'
  
  // Add focus styles
  editor.on('focus', () => {
    if (editor && editor.getValue() === props.placeholder) {
      editor.setValue('')
      wrapper.classList.remove('placeholder-active')
    }
    wrapper.style.borderColor = 'var(--linear-accent)'
    wrapper.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.1)'
  })
  
  editor.on('blur', () => {
    if (editor && !editor.getValue() && props.placeholder) {
      editor.setValue(props.placeholder)
      wrapper.classList.add('placeholder-active')
    }
    wrapper.style.borderColor = 'var(--linear-border)'
    wrapper.style.boxShadow = 'none'
  })
}

// Update editor content when modelValue changes
watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== editor.getValue()) {
    const cursor = editor.getCursor()
    editor.setValue(newValue)
    editor.setCursor(cursor)
  }
})

// Update readonly state
watch(() => props.readonly, (readonly) => {
  if (editor) {
    editor.setOption('readOnly', readonly)
  }
})

// Expose methods for parent components
const focus = () => {
  editor?.focus()
}

const getSelection = () => {
  return editor?.getSelection() || ''
}

const insertText = (text: string) => {
  if (!editor || props.readonly) return
  editor.replaceSelection(text)
}

const formatJson = () => {
  if (!editor || props.readonly) return
  try {
    const content = editor.getValue()
    const parsed = JSON.parse(content)
    const formatted = JSON.stringify(parsed, null, 2)
    const cursor = editor.getCursor()
    editor.setValue(formatted)
    editor.setCursor(cursor)
  } catch (error) {
    // Invalid JSON, don't format
  }
}

defineExpose({
  focus,
  getSelection,
  insertText,
  formatJson
})

onMounted(() => {
  nextTick(() => {
    initEditor()
  })
})

onUnmounted(() => {
  if (editor) {
    editor = null
  }
})
</script>

<style scoped>
.advanced-json-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-container {
  flex: 1;
  min-height: 0;
}

/* Custom CodeMirror 5 styling */
:deep(.CodeMirror) {
  height: 100%;
  color: var(--linear-text-primary);
  background-color: var(--linear-bg-primary);
}

/* CodeMirror JSON syntax highlighting to match JsonHighlight.vue */
:deep(.cm-property) {
  color: #8b5cf6; /* JSON key color - matches JsonHighlight.vue */
}

:deep(.cm-string) {
  color: #10b981; /* JSON string color - matches JsonHighlight.vue */
}

:deep(.cm-number) {
  color: #f59e0b; /* JSON number color - matches JsonHighlight.vue */
}

:deep(.cm-atom) {
  color: #ef4444; /* JSON boolean color - matches JsonHighlight.vue */
}

:deep(.cm-keyword) {
  color: #6b7280; /* JSON null color - matches JsonHighlight.vue */
}

:deep(.CodeMirror-scroll) {
  padding: 16px;
}

:deep(.CodeMirror-gutters) {
  background-color: var(--linear-surface);
  border-right: 1px solid var(--linear-border);
  color: var(--linear-text-secondary);
}

:deep(.CodeMirror-linenumber) {
  padding: 0 8px;
  font-size: 12px;
  color: var(--linear-text-secondary);
}

:deep(.CodeMirror-lint-marker-error) {
  background: #ef4444;
  border-radius: 2px;
}

:deep(.CodeMirror-lint-tooltip) {
  background-color: var(--linear-surface);
  border: 1px solid var(--linear-border);
  border-radius: 6px;
  color: var(--linear-text-primary);
}

:deep(.cm-error) {
  border-bottom: 2px wavy #ef4444;
}

:deep(.CodeMirror-placeholder) {
  color: var(--linear-text-tertiary);
}

:deep(.CodeMirror-dialog) {
  background-color: var(--linear-surface);
  border: 1px solid var(--linear-border);
  border-radius: 6px;
  color: var(--linear-text-primary);
}

:deep(.CodeMirror-dialog input) {
  background-color: var(--linear-bg-primary);
  border: 1px solid var(--linear-border);
  border-radius: 4px;
  color: var(--linear-text-primary);
  padding: 4px 8px;
}

:deep(.placeholder-active .CodeMirror) {
  color: var(--linear-text-tertiary);
}
</style>