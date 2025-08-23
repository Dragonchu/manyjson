<template>
  <div class="advanced-json-editor">
    <div ref="editorRef" class="editor-container"></div>
  </div>
</template>

<script setup lang="ts">
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { json } from '@codemirror/lang-json'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { linter, lintGutter } from '@codemirror/lint'
import { searchKeymap } from '@codemirror/search'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, placeholder } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { basicSetup } from 'codemirror'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

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
      JSON.parse(doc)

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

// Create syntax highlighting style
const createSyntaxHighlighting = () => {
  try {
    return HighlightStyle.define([
      { tag: tags.string, color: '#10b981' },     // Green for strings
      { tag: tags.number, color: '#f59e0b' },     // Orange for numbers
      { tag: tags.bool, color: '#ef4444' },        // Red for booleans
      { tag: tags.null, color: '#6b7280' },        // Gray for null
      { tag: tags.propertyName, color: '#8b5cf6' }, // Purple for keys
      { tag: tags.punctuation, color: 'var(--linear-text-primary)' }, // White for punctuation
      { tag: tags.brace, color: 'var(--linear-text-primary)' },     // White for braces
      { tag: tags.bracket, color: 'var(--linear-text-primary)' },   // White for brackets
      { tag: tags.separator, color: 'var(--linear-text-primary)' }   // White for separators
    ])
  } catch (error) {
    console.warn('Failed to create syntax highlighting:', error)
    return HighlightStyle.define([]) // Return empty HighlightStyle as fallback
  }
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
      backgroundColor: 'var(--linear-bg-primary)',
    },
    '.cm-cursor': {
      borderLeft: '1px solid white'
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
      background: 'lightslategray',
      border: '1px solid var(--linear-border)',
      borderRadius: '6px',
      color: 'var(--linear-text-primary)'
    },
    '.cm-placeholder': {
      color: 'var(--linear-text-tertiary)'
    },
    '.cm-activeLineGutter': {
      background: 'transparent'
    }
  })
}

// Create editor extensions
const createEditorExtensions = (readonly: boolean) => {
  return [
    basicSetup,
    json(),
    createJsonLinter(),
    lintGutter(),
    createTheme(),
    syntaxHighlighting(createSyntaxHighlighting()),
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
    placeholder(props.placeholder)
  ]
}

// Initialize the editor
const initEditor = async () => {
  if (!editorRef.value) return

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: createEditorExtensions(props.readonly)
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
    const newState = EditorState.create({
      doc: editorView.state.doc,
      extensions: createEditorExtensions(readonly)
    })
    editorView.setState(newState)
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