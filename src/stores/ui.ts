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

  // Diff mode data
  const diffSourceFile = ref<any>(null)
  const diffComparisonFile = ref<any>(null)

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

  function setDiffMode(enabled: boolean, sourceFile?: any, comparisonFile?: any) {
    console.log('setDiffMode called:', { enabled, sourceFile: sourceFile?.name, comparisonFile: comparisonFile?.name })
    isDiffMode.value = enabled
    if (enabled) {
      isEditMode.value = false
      isViewingSchema.value = false
      isEditingSchema.value = false
      diffSourceFile.value = sourceFile
      diffComparisonFile.value = comparisonFile
      console.log('Diff mode enabled, state:', { isDiffMode: isDiffMode.value, sourceFile: diffSourceFile.value?.name, comparisonFile: diffComparisonFile.value?.name })
    } else {
      diffSourceFile.value = null
      diffComparisonFile.value = null
      console.log('Diff mode disabled')
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
    diffSourceFile,
    diffComparisonFile,
    setEditMode,
    setSchemaViewMode,
    setSchemaEditMode,
    setDiffMode,
    showStatus,
  }
})

