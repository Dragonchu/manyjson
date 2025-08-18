import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const isEditMode = ref(false)
  const isViewingSchema = ref(false)
  const isEditingSchema = ref(false)
  const statusMessage = ref('')
  const statusType = ref<'success' | 'error' | 'info'>('info')

  function setEditMode(enabled: boolean) {
    isEditMode.value = enabled
    if (enabled) {
      isViewingSchema.value = false
      isEditingSchema.value = false
    }
  }

  function setSchemaViewMode(enabled: boolean) {
    isViewingSchema.value = enabled
    if (enabled) {
      isEditMode.value = false
      isEditingSchema.value = false
    }
  }

  function setSchemaEditMode(enabled: boolean) {
    isEditingSchema.value = enabled
    if (enabled) {
      isEditMode.value = false
      isViewingSchema.value = false
    }
  }

  function showStatus(message: string, type: 'success' | 'error' | 'info' = 'info') {
    statusMessage.value = message
    statusType.value = type
    setTimeout(() => {
      statusMessage.value = ''
    }, 3000)
  }

  return {
    isEditMode,
    isViewingSchema,
    isEditingSchema,
    statusMessage,
    statusType,
    setEditMode,
    setSchemaViewMode,
    setSchemaEditMode,
    showStatus
  }
})

