export type PlatformName = 'web' | 'desktop'

export interface FileStats {
	isFile: boolean
	isDirectory: boolean
	size?: number
	modified?: Date
}

export interface FileDialogOptions {
	title?: string
	filters?: Array<{ name: string; extensions: string[] }>
	properties?: string[]
}

export interface SaveDialogOptions {
	title?: string
	defaultPath?: string
	filters?: Array<{ name: string; extensions: string[] }>
}

export interface WriteResult {
	success: boolean
	filePath?: string
	error?: string
}

export interface ListDirectoryEntry {
	name: string
	path: string
	isFile: boolean
	isDirectory: boolean
	size: number
	modified: Date
}

export interface PlatformApis {
	// Files
	readFile<T = any>(filePath: string): Promise<{ success: boolean; data?: T; error?: string }>
	readTextFile(filePath: string): Promise<{ success: boolean; content?: string; error?: string }>
	writeJsonFile(filePath: string, content: string): Promise<WriteResult>
	deleteFile(filePath: string): Promise<WriteResult>
	renameFile(oldPath: string, newPath: string): Promise<WriteResult>
	copyFile(filePath: string, newPath: string): Promise<WriteResult>
	getFileStats(filePath: string): Promise<{ success: boolean; error?: string } & Partial<FileStats>>
	listDirectory(dirPath: string): Promise<{ success: boolean; entries?: ListDirectoryEntry[]; error?: string }>

	// App config storage
	getConfigDirectory(): Promise<{ success: boolean; path?: string; error?: string }>
	writeConfigFile(fileName: string, content: string): Promise<WriteResult>
	listConfigFiles(): Promise<{ success: boolean; files?: Array<{ name: string; path: string; content: any }>; error?: string }>

	// Structured JSON storage
	writeSchemaJsonFile(schemaName: string, fileName: string, content: string): Promise<WriteResult>
	listSchemaJsonFiles(schemaName: string): Promise<{ success: boolean; files?: Array<{ name: string; path: string; content: any }>; error?: string }>

	// Dialogs
	showOpenDialog(options: FileDialogOptions): Promise<{ canceled: boolean; filePaths: string[] }>
	showSaveDialog(options: SaveDialogOptions): Promise<{ canceled: boolean; filePath?: string }>

	// Clipboard
	writeClipboardText(text: string): Promise<{ success: boolean; error?: string }>

	// Capabilities
	isCapabilityAvailable(cap: keyof PlatformCapabilities): boolean
}

export interface PlatformCapabilities {
	fileSystem: boolean
	configStorage: boolean
	structuredStorage: boolean
	openDialog: boolean
	saveDialog: boolean
	clipboard: boolean
}

export interface PlatformRuntime {
	name: PlatformName
	capabilities: PlatformCapabilities
	apis: PlatformApis
}

// Environment detection
export function detectPlatform(): PlatformName {
	// If preload exposed electronAPI, assume desktop
	if (typeof window !== 'undefined' && (window as any).electronAPI) return 'desktop'
	return 'web'
}

