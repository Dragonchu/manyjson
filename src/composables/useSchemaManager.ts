import { useAppStore, type SchemaInfo } from '@/stores/app'
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

    if (appStore.schemas.some((s: SchemaInfo) => s.name === finalName)) {
      ui.showStatus('A schema with this name already exists', 'error')
      return false
    }

    const valid = validationService.validateSchema(content)
    if (!valid.isValid) {
      ui.showStatus(valid.errors[0]?.message || 'Invalid schema', 'error')
      return false
    }

    // Delegate to store, which handles both Electron (persist) and Web (in-memory) modes
    const created = await appStore.addSchema(finalName, content)
    if (!created) {
      ui.showStatus('Failed to create schema', 'error')
      return false
    }

    ui.showStatus(`Schema "${finalName}" created successfully`, 'success')
    return true
  }

  return { addSchema, fileService, validationService, ui }
}

