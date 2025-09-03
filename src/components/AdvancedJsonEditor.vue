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
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

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

// Initialize AJV instance
const ajv = new Ajv({ 
  allErrors: true, 
  verbose: true,
  strict: false 
})
addFormats(ajv)

// Cache compiled validator for performance
let compiledValidator: any = null

// Watch schema changes to recompile validator
watch(() => props.schema, (newSchema) => {
  if (newSchema) {
    try {
      compiledValidator = ajv.compile(newSchema)
    } catch (error) {
      console.warn('Failed to compile schema:', error)
      compiledValidator = null
    }
  } else {
    compiledValidator = null
  }
}, { immediate: true })

// Helper function to find line and column from character position
const getLineColumnFromPos = (doc: string, pos: number) => {
  const lines = doc.substring(0, pos).split('\n')
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  }
}

// Helper function to find character position from JSON path
const findPositionFromPath = (doc: string, instancePath: string, propertyName?: string): { from: number; to: number } => {
  try {
    // For missing properties, try to find the parent object
    if (propertyName && instancePath !== undefined) {
      const pathSegments = instancePath.split('/').filter(segment => segment !== '')
      
      if (pathSegments.length === 0) {
        // Root level missing property - find the end of the root object to suggest insertion point
        const openBrace = doc.indexOf('{')
        const closeBrace = doc.lastIndexOf('}')
        if (openBrace !== -1 && closeBrace !== -1) {
          // Find a good insertion point (before the closing brace)
          let insertPos = closeBrace
          // Look for the last property to position after it
          const lastComma = doc.lastIndexOf(',', closeBrace)
          if (lastComma !== -1) {
            insertPos = lastComma + 1
          }
          return { from: insertPos, to: insertPos }
        }
      } else {
        // Navigate to parent object and find insertion point
        let searchPattern = ''
        for (let i = 0; i < pathSegments.length; i++) {
          const segment = pathSegments[i]
          if (i === 0) {
            searchPattern = `"${segment}"`
          } else {
            searchPattern += `[\\s\\S]*?"${segment}"`
          }
        }
        
        const regex = new RegExp(searchPattern)
        const match = regex.exec(doc)
        if (match) {
          const startPos = match.index + match[0].length
          // Find the object containing this path
          let braceCount = 0
          let pos = startPos
          while (pos < doc.length) {
            if (doc[pos] === '{') {
              braceCount++
              if (braceCount === 1) {
                // Found opening brace, look for insertion point
                const closingBrace = doc.indexOf('}', pos)
                if (closingBrace !== -1) {
                  return { from: closingBrace, to: closingBrace }
                }
              }
            } else if (doc[pos] === '}') {
              braceCount--
            }
            pos++
          }
        }
      }
    }
    
    // For other errors, try to find the exact property or value
    if (instancePath) {
      const pathSegments = instancePath.split('/').filter(segment => segment !== '')
      let searchPattern = ''
      
      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i]
        if (isNaN(parseInt(segment))) {
          // Property name
          if (i === 0) {
            searchPattern = `"${segment}"`
          } else {
            searchPattern += `[\\s\\S]*?"${segment}"`
          }
        } else {
          // Array index - this is more complex, skip for now
          searchPattern += `[\\s\\S]*?\\[\\s*${segment}\\s*\\]`
        }
      }
      
      if (searchPattern) {
        const regex = new RegExp(searchPattern)
        const match = regex.exec(doc)
        if (match) {
          const startPos = match.index
          const endPos = startPos + match[0].length
          return { from: startPos, to: endPos }
        }
      }
      
      // Fallback: search for individual path segments
      for (const segment of pathSegments) {
        if (!isNaN(parseInt(segment))) continue // Skip array indices
        
        const quotedSegment = `"${segment}"`
        const index = doc.indexOf(quotedSegment)
        if (index !== -1) {
          return { from: index, to: index + quotedSegment.length }
        }
      }
    }
    
    // Ultimate fallback
    return { from: 0, to: 1 }
  } catch {
    return { from: 0, to: 1 }
  }
}

// Custom JSON linter that includes schema validation
const createJsonLinter = () => {
  return linter((view) => {
    const doc = view.state.doc.toString()
    const diagnostics: any[] = []
    
    // First, check JSON syntax
    let parsedJson: any = null
    try {
      parsedJson = JSON.parse(doc)
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

    // If JSON is valid and we have a compiled validator, validate against it
    if (parsedJson && compiledValidator) {
      try {
        const isValid = compiledValidator(parsedJson)
        
        if (!isValid && compiledValidator.errors) {
          for (const error of compiledValidator.errors) {
            const instancePath = error.instancePath || ''
            const propertyName = error.params?.missingProperty || 
                               (error.keyword === 'additionalProperties' ? error.params?.additionalProperty : undefined)
            
            // Find the position in the document
            const errorPosition = findPositionFromPath(doc, instancePath, propertyName)
            
            // Create a more user-friendly error message
            let message = ''
            switch (error.keyword) {
              case 'required':
                message = `Missing required property: ${error.params?.missingProperty}`
                break
              case 'type':
                message = `Expected ${error.params?.type}, got ${typeof error.data}`
                break
              case 'additionalProperties':
                message = `Additional property not allowed: ${error.params?.additionalProperty}`
                break
              case 'enum':
                message = `Value must be one of: ${error.params?.allowedValues?.join(', ')}`
                break
              case 'format':
                message = `Invalid ${error.params?.format} format`
                break
              case 'minimum':
                message = `Value must be >= ${error.params?.limit}`
                break
              case 'maximum':
                message = `Value must be <= ${error.params?.limit}`
                break
              case 'minLength':
                message = `String must be at least ${error.params?.limit} characters`
                break
              case 'maxLength':
                message = `String must be at most ${error.params?.limit} characters`
                break
              case 'pattern':
                message = `String does not match required pattern`
                break
              case 'minItems':
                message = `Array must have at least ${error.params?.limit} items`
                break
              case 'maxItems':
                message = `Array must have at most ${error.params?.limit} items`
                break
              case 'uniqueItems':
                message = `Array items must be unique`
                break
              default:
                message = error.message || 'Schema validation error'
            }
            
            // Add path context if available
            if (instancePath) {
              message = `At ${instancePath}: ${message}`
            }
            
            diagnostics.push({
              from: errorPosition.from,
              to: errorPosition.to,
              severity: 'error',
              message,
              source: 'schema-validation'
            })
          }
        }
      } catch (schemaError: any) {
        // If schema compilation fails, show a warning
        diagnostics.push({
          from: 0,
          to: 1,
          severity: 'warning',
          message: `Schema validation error: ${schemaError.message}`
        })
      }
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