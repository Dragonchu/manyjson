import type {
	PlatformApis,
	WriteResult,
	ListDirectoryEntry,
	PlatformCapabilities
} from './index'

const electronAPI = (typeof window !== 'undefined' ? (window as any).electronAPI : undefined)

const desktopCapabilities: PlatformCapabilities = {
	fileSystem: true,
	configStorage: true,
	structuredStorage: true,
	openDialog: true,
	saveDialog: true,
	clipboard: true
}

export const DesktopPlatformApis: PlatformApis = {
	async readFile(filePath) { return electronAPI.readFile(filePath) },
	async readTextFile(filePath) { return electronAPI.readTextFile(filePath) },
	async writeJsonFile(filePath, content): Promise<WriteResult> { return electronAPI.writeJsonFile(filePath, content) },
	async deleteFile(filePath): Promise<WriteResult> { return electronAPI.deleteFile(filePath) },
	async renameFile(oldPath, newPath): Promise<WriteResult> { return electronAPI.renameFile?.(oldPath, newPath) ?? { success: false, error: 'renameFile not implemented in preload' } },
	async copyFile(filePath, newPath): Promise<WriteResult> { return electronAPI.copyFile?.(filePath, newPath) ?? { success: false, error: 'copyFile not implemented in preload' } },
	async getFileStats(filePath) { return electronAPI.getFileStats(filePath) },
	async listDirectory(dirPath): Promise<{ success: boolean; entries?: ListDirectoryEntry[]; error?: string }> { return electronAPI.listDirectory(dirPath) },

	async getConfigDirectory() { return electronAPI.getConfigDirectory() },
	async writeConfigFile(fileName, content) { return electronAPI.writeConfigFile(fileName, content) },
	async listConfigFiles() { return electronAPI.listConfigFiles() },

	async writeSchemaJsonFile(schemaName, fileName, content) { return electronAPI.writeSchemaJsonFile?.(schemaName, fileName, content) ?? { success: false, error: 'writeSchemaJsonFile not implemented' } },
	async listSchemaJsonFiles(schemaName) { return electronAPI.listSchemaJsonFiles?.(schemaName) ?? { success: true, files: [] } },

	async showOpenDialog(options) { return electronAPI.showOpenDialog(options) },
	async showSaveDialog(options) { return electronAPI.showSaveDialog(options) },

	async writeClipboardText(text: string) {
		try {
			await navigator.clipboard.writeText(text)
			return { success: true }
		} catch (e: any) {
			return { success: false, error: String(e) }
		}
	},

	isCapabilityAvailable(cap: keyof typeof desktopCapabilities) {
		return desktopCapabilities[cap]
	}
}

export { desktopCapabilities }

