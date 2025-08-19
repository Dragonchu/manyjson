import { useAppStore } from '@/stores/app'
import { useUIStore } from '@/stores/ui'
import { FileService } from '@/services/fileService'
import { ValidationService } from '@/services/validationService'

export function useSchemaManager() {
  const appStore = useAppStore()
  const ui = useUIStore()
  const fileService = new FileService()
  const validationService = new ValidationService()

  async function addSchema(name: string, content: any): Promise<boolean> {
    const finalName = name.endsWith('.json') ? name : `${name}.json`

    if (appStore.schemas.some(s => s.name === finalName)) {
      ui.showStatus('A schema with this name already exists', 'error')
      return false
    }

    const valid = validationService.validateSchema(content)
    if (!valid.isValid) {
      ui.showStatus(valid.errors[0]?.message || 'Invalid schema', 'error')
      return false
    }

    const write = await fileService.writeConfigFile(finalName, JSON.stringify(content, null, 2))
    if (!write.success || !write.filePath) {
      ui.showStatus(`Failed to save schema: ${write.error || 'Unknown error'}`, 'error')
      return false
    }

    appStore.addSchemaLocal({ name: finalName, path: write.filePath, content })
    ui.showStatus(`Schema "${finalName}" created successfully`, 'success')
    return true
  }

  return { addSchema, fileService, validationService, ui }
}

