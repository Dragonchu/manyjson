import type {
	PlatformApis,
	WriteResult,
	ListDirectoryEntry,
	PlatformCapabilities
} from './index'

const unsupported = (feature: string) => ({ success: false, error: `${feature} not available in web mode` })

const webCapabilities: PlatformCapabilities = {
	fileSystem: false,
	configStorage: false,
	structuredStorage: false,
	openDialog: false,
	saveDialog: false,
	clipboard: true
}

export const WebPlatformApis: PlatformApis = {
	async readFile() { return { success: false, error: 'readFile not available in web mode' } },
	async readTextFile() { return { success: false, error: 'readTextFile not available in web mode' } },
	async writeJsonFile(filePath: string, _content: string): Promise<WriteResult> { return { success: true, filePath } },
	async deleteFile(): Promise<WriteResult> { return { success: true } },
	async renameFile(_old, _new): Promise<WriteResult> { return { success: true } },
	async copyFile(_src, _dst): Promise<WriteResult> { return { success: true } },
	async getFileStats() { return { success: false, error: 'getFileStats not available in web mode' } },
	async listDirectory(_dir): Promise<{ success: boolean; entries?: ListDirectoryEntry[]; error?: string }> { return { success: false, error: 'listDirectory not available in web mode' } },

	async getConfigDirectory() { return unsupported('getConfigDirectory') },
	async writeConfigFile(_n, _c) { return { success: true } },
	async listConfigFiles() { return { success: true, files: [] } },

	async writeSchemaJsonFile(_s, _f, _c) { return { success: true } },
	async listSchemaJsonFiles(_s) { return { success: true, files: [] } },

	async showOpenDialog() { return { canceled: true, filePaths: [] } },
	async showSaveDialog() { return { canceled: true } },

	async writeClipboardText(text: string) {
		try {
			await navigator.clipboard.writeText(text)
			return { success: true }
		} catch (e: any) {
			return { success: false, error: String(e) }
		}
	},

	isCapabilityAvailable(cap: keyof typeof webCapabilities) {
		return webCapabilities[cap]
	}
}

export { webCapabilities }

