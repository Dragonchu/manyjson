import type {
	PlatformApis,
	WriteResult,
	ListDirectoryEntry,
	PlatformCapabilities
} from './index'

const unsupported = (feature: string) => ({ success: false, error: `${feature} not available in web mode` })

// In-memory handle registry for File System Access API
const handleRegistry = new Map<string, FileSystemFileHandle>()

function randomId(): string {
	return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function toFsUri(id: string, name: string): string {
	return `fs://${id}/${name}`
}

function parseFsUri(uri: string): { id: string; name: string } | null {
	try {
		if (!uri.startsWith('fs://')) return null
		const withoutScheme = uri.slice('fs://'.length)
		const firstSlash = withoutScheme.indexOf('/')
		if (firstSlash === -1) return null
		const id = withoutScheme.slice(0, firstSlash)
		const name = withoutScheme.slice(firstSlash + 1)
		return { id, name }
	} catch {
		return null
	}
}

const webCapabilities: PlatformCapabilities = {
	fileSystem: typeof (window as any).showOpenFilePicker === 'function',
	configStorage: false,
	structuredStorage: false,
	openDialog: typeof (window as any).showOpenFilePicker === 'function',
	saveDialog: typeof (window as any).showSaveFilePicker === 'function',
	clipboard: true
}

async function readHandleText(handle: FileSystemFileHandle): Promise<string> {
	const file = await handle.getFile()
	return await file.text()
}

async function writeHandleText(handle: FileSystemFileHandle, content: string): Promise<void> {
	const writable = await handle.createWritable()
	await writable.write(content)
	await writable.close()
}

export const WebPlatformApis: PlatformApis = {
	async readFile<T = any>(filePath: string) {
		const parsed = parseFsUri(filePath)
		if (!parsed) return { success: false, error: 'Unsupported path in web mode' }
		const handle = handleRegistry.get(parsed.id)
		if (!handle) return { success: false, error: 'File handle not found (permission not granted or expired)' }
		try {
			const text = await readHandleText(handle)
			try {
				const data = JSON.parse(text) as T
				return { success: true, data }
			} catch {
				return { success: true, data: text as unknown as T }
			}
		} catch (e: any) {
			return { success: false, error: String(e) }
		}
	},

	async readTextFile(filePath: string) {
		const parsed = parseFsUri(filePath)
		if (!parsed) return { success: false, error: 'Unsupported path in web mode' }
		const handle = handleRegistry.get(parsed.id)
		if (!handle) return { success: false, error: 'File handle not found (permission not granted or expired)' }
		try {
			const content = await readHandleText(handle)
			return { success: true, content }
		} catch (e: any) {
			return { success: false, error: String(e) }
		}
	},

	async writeJsonFile(filePath: string, content: string): Promise<WriteResult> {
		// Try writing to existing handle if provided as fs:// URI
		const parsed = parseFsUri(filePath)
		if (parsed) {
			const existing = handleRegistry.get(parsed.id)
			if (existing) {
				try {
					await writeHandleText(existing, content)
					return { success: true, filePath }
				} catch (e: any) {
					return { success: false, error: String(e) }
				}
			}
		}

		// Otherwise prompt user to pick a save location
		if (typeof (window as any).showSaveFilePicker === 'function') {
			try {
				const suggestedName = (() => {
					try {
						const p = new URL(filePath)
						return p.pathname.split('/').pop() || 'schema.json'
					} catch {
						return filePath.split('/').pop() || 'schema.json'
					}
				})()
				// @ts-ignore - types available in supporting browsers
				const handle: FileSystemFileHandle = await (window as any).showSaveFilePicker({
					suggestedName,
					types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }]
				})
				await writeHandleText(handle, content)
				const id = randomId()
				handleRegistry.set(id, handle)
				const uri = toFsUri(id, suggestedName)
				return { success: true, filePath: uri }
			} catch (e: any) {
				return { success: false, error: String(e) }
			}
		}

		// Fallback: trigger download
		try {
			const blob = new Blob([content], { type: 'application/json' })
			const a = document.createElement('a')
			const url = URL.createObjectURL(blob)
			a.href = url
			a.download = filePath.split('/').pop() || 'schema.json'
			a.click()
			URL.revokeObjectURL(url)
			return { success: true, filePath }
		} catch (e: any) {
			return { success: false, error: String(e) }
		}
	},

	async deleteFile(): Promise<WriteResult> { return { success: true } },
	async renameFile(oldPath: string, newPath: string): Promise<WriteResult> {
		// Web mode cannot truly rename files on disk with a bare file handle.
		// Implement virtual rename for supported schemes.
		try {
			// Case 1: fs://<id>/<name> — must keep same id
			const oldFs = parseFsUri(oldPath)
			const newFs = parseFsUri(newPath)
			if (oldFs || newFs) {
				if (!oldFs || !newFs) return { success: false, error: 'Unsupported path in web mode' }
				if (oldFs.id !== newFs.id) return { success: false, error: 'Renaming must stay within the original folder' }
				if (!handleRegistry.has(oldFs.id)) return { success: false, error: 'File handle not found (permission not granted or expired)' }
				return { success: true, filePath: newPath }
			}

			// Case 2: structured://<schemaName>/<fileName>
			if (oldPath.startsWith('structured://') && newPath.startsWith('structured://')) {
				const getDir = (p: string) => p.slice(0, p.lastIndexOf('/'))
				if (getDir(oldPath) !== getDir(newPath)) {
					return { success: false, error: 'Renaming must stay within the original folder' }
				}
				return { success: true, filePath: newPath }
			}

			// Case 3: mock:// or other virtual schemes — allow rename within same directory part
			const schemeMatchOld = oldPath.match(/^([a-z]+):\/\//)
			const schemeMatchNew = newPath.match(/^([a-z]+):\/\//)
			if (schemeMatchOld && schemeMatchNew && schemeMatchOld[1] === schemeMatchNew[1]) {
				const getDir = (p: string) => p.slice(0, p.lastIndexOf('/'))
				if (getDir(oldPath) !== getDir(newPath)) {
					return { success: false, error: 'Renaming must stay within the original folder' }
				}
				return { success: true, filePath: newPath }
			}

			return { success: false, error: 'Unsupported path in web mode' }
		} catch (e: any) {
			return { success: false, error: String(e) }
		}
	},
	async copyFile(_src, _dst): Promise<WriteResult> { return { success: true } },
	async getFileStats() { return { success: false, error: 'getFileStats not available in web mode' } },
	async listDirectory(_dir): Promise<{ success: boolean; entries?: ListDirectoryEntry[]; error?: string }> { return { success: false, error: 'listDirectory not available in web mode' } },

	async getConfigDirectory() { return unsupported('getConfigDirectory') },
	async writeConfigFile(_n, _c) { return { success: true } },
	async listConfigFiles() { return { success: true, files: [] } },

	async writeSchemaJsonFile(_s, _f, _c) { return { success: true } },
	async listSchemaJsonFiles(_s) { return { success: true, files: [] } },

	async showOpenDialog(options) {
		if (typeof (window as any).showOpenFilePicker !== 'function') {
			return { canceled: true, filePaths: [] }
		}
		try {
			// Map filters to types
			const types = options?.filters?.length
				? options.filters.map(f => ({ description: f.name, accept: { 'application/json': f.extensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`) } }))
				: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }]
			// @ts-ignore
			const handles: FileSystemFileHandle[] = await (window as any).showOpenFilePicker({
				multiple: true,
				types
			})
			const filePaths: string[] = []
			for (const handle of handles) {
				const id = randomId()
				handleRegistry.set(id, handle)
				filePaths.push(toFsUri(id, (handle as any).name || 'untitled.json'))
			}
			return { canceled: false, filePaths }
		} catch (e: any) {
			return { canceled: true, filePaths: [] }
		}
	},

	async showSaveDialog() {
		// Saving is handled inside writeJsonFile for web mode
		return { canceled: true }
	},

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

