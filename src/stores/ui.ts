import { defineStore } from 'pinia'
import { ref } from 'vue'

export type StatusType = 'success' | 'error' | 'info'

export const useUIStore = defineStore('ui', () => {
  // UI flags
  const isEditMode = ref(false)
  const isViewingSchema = ref(false)
  const isEditingSchema = ref(false)
  const isDiffMode = ref(false)

  // Status messaging
  const statusMessage = ref('')
  const statusType = ref<StatusType>('info')

  function setEditMode(enabled: boolean) {
    isEditMode.value = enabled
    if (enabled) {
      isViewingSchema.value = false
      isEditingSchema.value = false
      isDiffMode.value = false
    }
  }

  function setSchemaViewMode(enabled: boolean) {
    isViewingSchema.value = enabled
    if (enabled) {
      isEditMode.value = false
      isEditingSchema.value = false
      isDiffMode.value = false
    }
  }

  function setSchemaEditMode(enabled: boolean) {
    isEditingSchema.value = enabled
    if (enabled) {
      isEditMode.value = false
      isViewingSchema.value = false
      isDiffMode.value = false
    }
  }

  function setDiffMode(enabled: boolean) {
    isDiffMode.value = enabled
    if (enabled) {
      isEditMode.value = false
      isViewingSchema.value = false
      isEditingSchema.value = false
    }
  }

  function showStatus(message: string, type: StatusType = 'info') {
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
    isDiffMode,
    statusMessage,
    statusType,
    setEditMode,
    setSchemaViewMode,
    setSchemaEditMode,
    setDiffMode,
    showStatus,
  }
})

