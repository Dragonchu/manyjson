import { ref, nextTick } from 'vue'
import { useAppStore } from '@/stores/app'
import { useUIStore } from '@/stores/ui'
import { FileService } from '@/services/fileService'
import type { JsonFile } from '@/stores/app'

export function useInlineRename() {
  const appStore = useAppStore()
  const ui = useUIStore()
  const fileService = new FileService()

  // State for inline rename
  const editingFile = ref<JsonFile | null>(null)
  const editingName = ref('')
  const originalName = ref('')
  const isValidName = ref(true)
  const validationError = ref('')

  // Start inline rename for a file
  async function startRename(file: JsonFile) {
    editingFile.value = file
    originalName.value = file.name
    editingName.value = file.name.replace(/\.json$/, '') // Remove .json extension for editing
    isValidName.value = true
    validationError.value = ''

    // Focus the input field after DOM update
    await nextTick()
    const input = document.querySelector(`[data-file-path="${file.path}"] input`) as HTMLInputElement
    if (input) {
      input.focus()
      input.select()
    }
  }

  // Validate the file name
  function validateName(name: string): boolean {
    // Reset validation state
    isValidName.value = true
    validationError.value = ''

    // Check if name is empty
    if (!name || name.trim() === '') {
      isValidName.value = false
      validationError.value = 'File name cannot be empty'
      return false
    }

    // Check for invalid characters (Windows and Unix)
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/
    if (invalidChars.test(name)) {
      isValidName.value = false
      validationError.value = 'File name contains invalid characters'
      return false
    }

    // Check for reserved names (Windows)
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 
                          'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 
                          'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
    const nameWithoutExt = name.toUpperCase()
    if (reservedNames.includes(nameWithoutExt)) {
      isValidName.value = false
      validationError.value = 'This is a reserved file name'
      return false
    }

    // Check if name ends with dot or space (Windows)
    if (name.endsWith('.') || name.endsWith(' ')) {
      isValidName.value = false
      validationError.value = 'File name cannot end with a dot or space'
      return false
    }

    // Check for duplicate names in the same schema
    const newNameWithExt = name.endsWith('.json') ? name : `${name}.json`
    const isDuplicate = appStore.currentSchemaFiles.some(f => 
      f.path !== editingFile.value?.path && f.name === newNameWithExt
    )
    if (isDuplicate) {
      isValidName.value = false
      validationError.value = 'A file with this name already exists'
      return false
    }

    return true
  }

  // Update the editing name and validate
  function updateEditingName(name: string) {
    editingName.value = name
    validateName(name)
  }

  // Confirm the rename operation
  async function confirmRename() {
    if (!editingFile.value || !validateName(editingName.value)) {
      return false
    }

    const file = editingFile.value
    const newName = editingName.value.endsWith('.json') ? editingName.value : `${editingName.value}.json`
    
    // If name hasn't changed, just cancel
    if (newName === originalName.value) {
      cancelRename()
      return true
    }

    try {
      // Calculate new path (keep the directory, change the filename)
      const oldPath = file.path
      const pathParts = oldPath.split('/')
      pathParts[pathParts.length - 1] = newName
      const newPath = pathParts.join('/')

      // Perform the rename operation
      const result = await fileService.renameFile(oldPath, newPath)
      
      if (!result.success || !result.filePath) {
        ui.showStatus(`Failed to rename file: ${result.error || 'Unknown error'}`, 'error')
        return false
      }

      // Update the store
      await appStore.renameJsonFile(file, result.filePath)
      ui.showStatus('File renamed successfully', 'success')
      
      // Clear editing state
      editingFile.value = null
      editingName.value = ''
      originalName.value = ''
      
      return true
    } catch (error: any) {
      ui.showStatus(`Failed to rename file: ${String(error)}`, 'error')
      return false
    }
  }

  // Cancel the rename operation
  function cancelRename() {
    editingFile.value = null
    editingName.value = ''
    originalName.value = ''
    isValidName.value = true
    validationError.value = ''
  }

  // Check if a specific file is being edited
  function isEditing(file: JsonFile): boolean {
    return editingFile.value?.path === file.path
  }

  return {
    editingFile,
    editingName,
    isValidName,
    validationError,
    startRename,
    updateEditingName,
    confirmRename,
    cancelRename,
    isEditing
  }
}