<template>
  <div v-if="isVisible" class="dialog-overlay" @click.self="closeDialog">
    <div class="dialog-container">
      <div class="dialog-header">
        <h2>Add New JSON Schema</h2>
        <button class="close-btn" @click="closeDialog">×</button>
      </div>
      
      <div class="dialog-content">
        <div class="form-group">
          <label for="schemaName">Schema Name:</label>
          <input
            id="schemaName"
            v-model="schemaName"
            type="text"
            placeholder="e.g., user-schema"
            class="form-input"
            @keydown.enter="handleSubmit"
          />
          <div class="input-hint">Name will be saved as: {{ displayName }}</div>
        </div>
        
        <div class="form-group">
          <label for="schemaContent">Schema Content:</label>
          <textarea
            id="schemaContent"
            v-model="schemaContent"
            placeholder="Enter JSON Schema content..."
            class="form-textarea"
            rows="12"
          ></textarea>
          <div class="input-hint">Enter valid JSON Schema definition</div>
        </div>
        
        <div class="template-section">
          <label>Quick Templates:</label>
          <div class="template-buttons">
            <button @click="useBasicTemplate" class="template-btn">Basic Object</button>
            <button @click="useUserTemplate" class="template-btn">User Schema</button>
            <button @click="useProductTemplate" class="template-btn">Product Schema</button>
          </div>
        </div>
      </div>
      
      <div class="dialog-actions">
        <button @click="closeDialog" class="btn-secondary">Cancel</button>
        <button @click="handleSubmit" class="btn-primary" :disabled="!isValid">
          Create Schema
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const isVisible = ref(false)
const schemaName = ref('')
const schemaContent = ref('')

const displayName = computed(() => {
  const name = schemaName.value.trim()
  return name ? (name.endsWith('.json') ? name : `${name}.json`) : 'schema.json'
})

const isValid = computed(() => {
  return schemaName.value.trim().length > 0 && schemaContent.value.trim().length > 0
})

function showDialog() {
  isVisible.value = true
  schemaName.value = ''
  schemaContent.value = ''
  useBasicTemplate()
}

function closeDialog() {
  isVisible.value = false
  schemaName.value = ''
  schemaContent.value = ''
}

function useBasicTemplate() {
  schemaContent.value = JSON.stringify({
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "title": "Basic Schema",
    "description": "A basic JSON schema template",
    "properties": {
      "id": {
        "type": "string",
        "description": "Unique identifier"
      },
      "name": {
        "type": "string",
        "description": "Name field"
      }
    },
    "required": ["id", "name"]
  }, null, 2)
}

function useUserTemplate() {
  schemaContent.value = JSON.stringify({
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "title": "User Schema",
    "description": "Schema for user data",
    "properties": {
      "id": {
        "type": "number",
        "description": "User ID"
      },
      "name": {
        "type": "string",
        "minLength": 1,
        "description": "User's full name"
      },
      "email": {
        "type": "string",
        "format": "email",
        "description": "User's email address"
      },
      "age": {
        "type": "number",
        "minimum": 0,
        "description": "User's age"
      }
    },
    "required": ["id", "name", "email"]
  }, null, 2)
}

function useProductTemplate() {
  schemaContent.value = JSON.stringify({
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "title": "Product Schema",
    "description": "Schema for product data",
    "properties": {
      "id": {
        "type": "number",
        "description": "Product ID"
      },
      "title": {
        "type": "string",
        "minLength": 1,
        "description": "Product title"
      },
      "price": {
        "type": "number",
        "minimum": 0,
        "description": "Product price"
      },
      "category": {
        "type": "string",
        "description": "Product category"
      },
      "description": {
        "type": "string",
        "description": "Product description"
      }
    },
    "required": ["id", "title", "price"]
  }, null, 2)
}

async function handleSubmit() {
  if (!isValid.value) return
  
  const success = await appStore.addSchema(schemaName.value.trim(), schemaContent.value.trim())
  if (success) {
    closeDialog()
  }
}

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
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-container {
  background: var(--linear-bg-primary);
  border: 1px solid var(--linear-border);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--linear-border);
  background: var(--linear-bg-secondary);
}

.dialog-header h2 {
  margin: 0;
  color: var(--linear-text-primary);
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: var(--linear-text-secondary);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--linear-bg-hover);
  color: var(--linear-text-primary);
}

.dialog-content {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: var(--linear-text-primary);
  font-weight: 500;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--linear-border);
  border-radius: 8px;
  background: var(--linear-bg-secondary);
  color: var(--linear-text-primary);
  font-size: 14px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--linear-accent);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--linear-border);
  border-radius: 8px;
  background: var(--linear-bg-secondary);
  color: var(--linear-text-primary);
  font-size: 13px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.4;
  resize: vertical;
  min-height: 200px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--linear-accent);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.input-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--linear-text-secondary);
}

.template-section {
  margin-bottom: 20px;
}

.template-section label {
  display: block;
  margin-bottom: 8px;
  color: var(--linear-text-primary);
  font-weight: 500;
  font-size: 14px;
}

.template-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.template-btn {
  padding: 8px 12px;
  border: 1px solid var(--linear-border);
  border-radius: 6px;
  background: var(--linear-bg-secondary);
  color: var(--linear-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-btn:hover {
  background: var(--linear-bg-hover);
  color: var(--linear-text-primary);
  border-color: var(--linear-accent);
}

.dialog-actions {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--linear-border);
  background: var(--linear-bg-secondary);
  justify-content: flex-end;
}

.btn-secondary {
  padding: 10px 20px;
  border: 1px solid var(--linear-border);
  border-radius: 8px;
  background: transparent;
  color: var(--linear-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--linear-bg-hover);
  color: var(--linear-text-primary);
}

.btn-primary {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: var(--linear-accent);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background: var(--linear-accent-hover);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
</style>