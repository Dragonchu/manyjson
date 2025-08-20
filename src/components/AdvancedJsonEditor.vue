<template>
  <div class="advanced-json-editor">
    <div ref="editorRef" class="editor-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { basicSetup } from 'codemirror'
import { EditorView, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { json } from '@codemirror/lang-json'
import { linter, lintGutter } from '@codemirror/lint'
import { searchKeymap } from '@codemirror/search'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'

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
let editorView: EditorView | null = null

// Custom JSON linter that includes schema validation
const createJsonLinter = () => {
  return linter((view) => {
    const doc = view.state.doc.toString()
    const diagnostics: any[] = []
    
    // First, check JSON syntax
    try {
      const parsed = JSON.parse(doc)
      
      // If we have a schema, validate against it
      if (props.schema) {
        // Basic schema validation would go here
        // For now, we'll just validate JSON syntax
      }
    } catch (error: any) {
      // Parse the error to get position information
      const match = error.message.match(/position (\d+)/)
      const pos = match ? parseInt(match[1]) : 0
      
      diagnostics.push({
        from: Math.max(0, pos - 1),
        to: Math.min(doc.length, pos + 1),
        severity: 'error',
        message: error.message
      })
    }
    
    // Emit validation errors
    emit('validation-change', diagnostics)
    
    return diagnostics
  })
}

// Create the editor theme
const createTheme = () => {
  return EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '13px',
      fontFamily: 'var(--linear-font-mono, "Monaco", "Menlo", "Ubuntu Mono", monospace)'
    },
    '.cm-content': {
      padding: '16px',
      minHeight: '100%',
      color: 'var(--linear-text-primary)',
      backgroundColor: 'var(--linear-bg-primary)'
    },
    '.cm-focused': {
      outline: 'none'
    },
    '.cm-editor': {
      backgroundColor: 'var(--linear-bg-primary)',
      border: '1px solid var(--linear-border)',
      borderRadius: '8px'
    },
    '.cm-editor.cm-focused': {
      borderColor: 'var(--linear-accent)',
      boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.1)'
    },
    '.cm-scroller': {
      fontFamily: 'var(--linear-font-mono, "Monaco", "Menlo", "Ubuntu Mono", monospace)'
    },
    '.cm-gutters': {
      backgroundColor: 'var(--linear-surface)',
      borderRight: '1px solid var(--linear-border)',
      color: 'var(--linear-text-secondary)'
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 8px',
      fontSize: '12px'
    },
    '.cm-diagnostic-error': {
      borderBottom: '2px wavy #ef4444'
    },
    '.cm-tooltip': {
      backgroundColor: 'var(--linear-surface)',
      border: '1px solid var(--linear-border)',
      borderRadius: '6px',
      color: 'var(--linear-text-primary)'
    },
    '.cm-placeholder': {
      color: 'var(--linear-text-tertiary)'
    }
  })
}

// Initialize the editor
const initEditor = async () => {
  if (!editorRef.value) return
  
  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      basicSetup,
      json(),
      createJsonLinter(),
      lintGutter(),
      createTheme(),
      keymap.of([
        ...defaultKeymap,
        ...searchKeymap,
        indentWithTab
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !props.readonly) {
          const newValue = update.state.doc.toString()
          emit('update:modelValue', newValue)
        }
      }),
      EditorState.readOnly.of(props.readonly),
      EditorView.placeholder(props.placeholder)
    ]
  })
  
  editorView = new EditorView({
    state,
    parent: editorRef.value
  })
}

// Update editor content when modelValue changes
watch(() => props.modelValue, (newValue) => {
  if (editorView && newValue !== editorView.state.doc.toString()) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: newValue
      }
    })
  }
})

// Update readonly state
watch(() => props.readonly, (readonly) => {
  if (editorView) {
    editorView.dispatch({
      effects: EditorState.reconfigure.of([
        basicSetup,
        json(),
        createJsonLinter(),
        lintGutter(),
        createTheme(),
        keymap.of([
          ...defaultKeymap,
          ...searchKeymap,
          indentWithTab
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !readonly) {
            const newValue = update.state.doc.toString()
            emit('update:modelValue', newValue)
          }
        }),
        EditorState.readOnly.of(readonly),
        EditorView.placeholder(props.placeholder)
      ])
    })
  }
})

// Expose methods for parent components
const focus = () => {
  editorView?.focus()
}

const getSelection = () => {
  if (!editorView) return ''
  const { from, to } = editorView.state.selection.main
  return editorView.state.doc.sliceString(from, to)
}

const insertText = (text: string) => {
  if (!editorView || props.readonly) return
  const { from, to } = editorView.state.selection.main
  editorView.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length }
  })
}

const formatJson = () => {
  if (!editorView || props.readonly) return
  try {
    const content = editorView.state.doc.toString()
    const parsed = JSON.parse(content)
    const formatted = JSON.stringify(parsed, null, 2)
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: formatted
      }
    })
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
  if (editorView) {
    editorView.destroy()
    editorView = null
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

:deep(.cm-editor) {
  height: 100%;
}

:deep(.cm-scroller) {
  height: 100%;
}
</style>