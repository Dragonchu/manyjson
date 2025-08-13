<template>
  <div v-if="isVisible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog" @click.stop>
      <div class="dialog-header">
        <h3>Add New Schema</h3>
        <button class="close-btn" @click="closeDialog">×</button>
      </div>
      
      <div class="dialog-content">
        <div class="form-group">
          <label for="schemaName">Schema Name</label>
          <input
            id="schemaName"
            v-model="schemaName"
            type="text"
            placeholder="Enter schema name (e.g., user-schema)"
            class="form-input"
            :class="{ error: nameError }"
          />
          <div v-if="nameError" class="error-message">{{ nameError }}</div>
        </div>
        
        <div class="form-group">
          <label for="schemaContent">Schema Content</label>
          <div class="template-buttons">
            <button 
              v-for="template in templates" 
              :key="template.name"
              class="template-btn"
              @click="useTemplate(template)"
            >
              {{ template.name }}
            </button>
          </div>
          <textarea
            id="schemaContent"
            v-model="schemaContentText"
            placeholder="Enter JSON Schema content..."
            class="form-textarea"
            :class="{ error: contentError }"
            rows="15"
          ></textarea>
          <div v-if="contentError" class="error-message">{{ contentError }}</div>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="closeDialog">Cancel</button>
        <button class="btn btn-primary" @click="handleSubmit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Creating...' : 'Create Schema' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const isVisible = ref(false)
const schemaName = ref('')
const schemaContentText = ref('')
const isSubmitting = ref(false)
const nameError = ref('')
const contentError = ref('')

// Schema templates
const templates = [
  {
    name: 'Basic Object',
    content: {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "id": { "type": "number" },
        "name": { "type": "string", "minLength": 1 }
      },
      "required": ["id", "name"]
    }
  },
  {
    name: 'User Schema',
    content: {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "id": { "type": "number" },
        "name": { "type": "string", "minLength": 1 },
        "email": { "type": "string", "format": "email" },
        "age": { "type": "number", "minimum": 0 },
        "isActive": { "type": "boolean" }
      },
      "required": ["id", "name", "email"]
    }
  },
  {
    name: 'Product Schema',
    content: {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "id": { "type": "number" },
        "title": { "type": "string", "minLength": 1 },
        "description": { "type": "string" },
        "price": { "type": "number", "minimum": 0 },
        "category": { "type": "string" },
        "inStock": { "type": "boolean" }
      },
      "required": ["id", "title", "price"]
    }
  }
]

const parsedContent = computed(() => {
  try {
    return JSON.parse(schemaContentText.value)
  } catch {
    return null
  }
})

function showDialog() {
  isVisible.value = true
  resetForm()
}

function closeDialog() {
  isVisible.value = false
  resetForm()
}

function resetForm() {
  schemaName.value = ''
  schemaContentText.value = ''
  nameError.value = ''
  contentError.value = ''
  isSubmitting.value = false
}

function handleOverlayClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    closeDialog()
  }
}

function useTemplate(template: any) {
  schemaContentText.value = JSON.stringify(template.content, null, 2)
}

function validateForm(): boolean {
  nameError.value = ''
  contentError.value = ''
  
  // Validate name
  if (!schemaName.value.trim()) {
    nameError.value = 'Schema name is required'
    return false
  }
  
  if (appStore.schemas.some(schema => schema.name === (schemaName.value.endsWith('.json') ? schemaName.value : `${schemaName.value}.json`))) {
    nameError.value = 'A schema with this name already exists'
    return false
  }
  
  // Validate content
  if (!schemaContentText.value.trim()) {
    contentError.value = 'Schema content is required'
    return false
  }
  
  if (!parsedContent.value) {
    contentError.value = 'Invalid JSON format'
    return false
  }
  
  return true
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }
  
  isSubmitting.value = true
  
  try {
    const success = await appStore.addSchema(schemaName.value, parsedContent.value)
    if (success) {
      closeDialog()
    }
  } catch (error) {
    console.error('Failed to create schema:', error)
    appStore.showStatus('Failed to create schema', 'error')
  } finally {
    isSubmitting.value = false
  }
}

// Watch for validation errors
watch([schemaName, schemaContentText], () => {
  if (nameError.value) nameError.value = ''
  if (contentError.value) contentError.value = ''
})

defineExpose({
  showDialog
})
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--linear-surface);
  border-radius: 8px;
  width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--linear-border);
}

.dialog-header h3 {
  margin: 0;
  color: var(--linear-text-primary);
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--linear-text-secondary);
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: var(--linear-transition-fast);
}

.close-btn:hover {
  background: var(--linear-surface-hover);
  color: var(--linear-text-primary);
}

.dialog-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--linear-text-primary);
  font-size: 14px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--linear-border);
  border-radius: 6px;
  background: var(--linear-bg-primary);
  color: var(--linear-text-primary);
  font-size: 14px;
  font-family: inherit;
  transition: var(--linear-transition-fast);
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--linear-accent);
  box-shadow: 0 0 0 2px rgba(var(--linear-accent-rgb), 0.2);
}

.form-input.error,
.form-textarea.error {
  border-color: var(--linear-error);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.template-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.template-btn {
  padding: 6px 12px;
  border: 1px solid var(--linear-border);
  border-radius: 4px;
  background: var(--linear-bg-secondary);
  color: var(--linear-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: var(--linear-transition-fast);
}

.template-btn:hover {
  background: var(--linear-surface-hover);
  color: var(--linear-text-primary);
  border-color: var(--linear-accent);
}

.error-message {
  color: var(--linear-error);
  font-size: 12px;
  margin-top: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--linear-border);
  background: var(--linear-bg-secondary);
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--linear-transition-fast);
  border: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--linear-surface);
  color: var(--linear-text-secondary);
  border: 1px solid var(--linear-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--linear-surface-hover);
  color: var(--linear-text-primary);
}

.btn-primary {
  background: var(--linear-accent);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--linear-accent-hover);
}
</style>