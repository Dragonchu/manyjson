<template>
  <div class="popup-overlay" v-show="isVisible" @click.self="close">
    <div class="popup-container">
      <div class="popup-header">
        <h3>Select File to Compare With</h3>
        <button class="apple-btn plain small icon-only" @click="close">×</button>
      </div>
      
      <div class="popup-content">
        <div class="source-file-info">
          <strong>Comparing:</strong> {{ sourceFile?.name }}
        </div>
        
        <div class="apple-segmented-control file-selection-tabs">
          <button 
            class="apple-segment" 
            :class="{ selected: activeTab === 'project' }"
            @click="activeTab = 'project'"
          >
            Project Files
          </button>
          <button 
            class="apple-segment" 
            :class="{ selected: activeTab === 'external' }"
            @click="activeTab = 'external'"
          >
            Browse Files
          </button>
        </div>

        <!-- Project Files Tab -->
        <div v-if="activeTab === 'project'" class="project-files-section">
          <div class="schema-section" v-for="schema in appStore.schemas" :key="schema.path">
            <div class="schema-header">
              <span class="schema-name">{{ schema.name }}</span>
              <span class="file-count">({{ getSchemaFiles(schema).length }} files)</span>
            </div>
            <div class="apple-list file-list">
              <div 
                v-for="file in getSchemaFiles(schema)" 
                :key="file.path"
                class="apple-list-item file-item"
                :class="{ 
                  selected: selectedFile?.path === file.path,
                  disabled: file.path === sourceFile?.path 
                }"
                @click="selectFile(file)"
              >
                <span class="file-name">{{ file.name }}</span>
                <span class="file-status" :class="{ valid: file.isValid, invalid: !file.isValid }">
                  {{ file.isValid ? '✓' : '⚠️' }}
                </span>
              </div>
            </div>
          </div>
          
          <div v-if="allProjectFiles.length === 0" class="empty-state">
            <div class="empty-state-icon">📄</div>
            <div class="empty-state-text">No JSON files available in project</div>
          </div>
        </div>

        <!-- External Files Tab -->
        <div v-if="activeTab === 'external'" class="external-files-section">
          <div class="browse-section">
            <button class="apple-btn tinted" @click="browseForFile">
              📁 Browse for File
            </button>
            <div v-if="externalFile" class="selected-external-file">
              <div class="external-file-info">
                <span class="file-name">{{ externalFile.name }}</span>
                <span class="file-path">{{ externalFile.path }}</span>
              </div>
            </div>
            <!-- Test button for debugging -->
            <button class="apple-btn plain small" @click="testDiffWithSampleFile" style="margin-top: 10px;">
              🧪 Test Diff (Debug)
            </button>
          </div>
        </div>
      </div>
      
      <div class="popup-footer">
        <button class="apple-btn bordered" @click="close">Cancel</button>
        <button 
          class="apple-btn filled" 
          :disabled="!canCompare"
          @click="startComparison"
        >
          Compare Files
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAppStore, type JsonFile } from '@/stores/app'
import { useUIStore } from '@/stores/ui'
import { getPlatformRuntime } from '@/platform/runtime'

const appStore = useAppStore()
const ui = useUIStore()
const runtime = getPlatformRuntime()

const isVisible = ref(false)
const sourceFile = ref<JsonFile | null>(null)
const selectedFile = ref<JsonFile | null>(null)
const externalFile = ref<{ name: string; path: string; content: any } | null>(null)
const activeTab = ref<'project' | 'external'>('project')

// Debug watcher
watch(isVisible, (newValue) => {
  console.log('FileSelectorPopup isVisible changed to:', newValue)
})

const allProjectFiles = computed(() => {
  // Get all associated files from all schemas
  return appStore.schemas.flatMap(schema => schema.associatedFiles || [])
})

const canCompare = computed(() => {
  const result = activeTab.value === 'project' 
    ? (selectedFile.value && selectedFile.value.path !== sourceFile.value?.path)
    : (externalFile.value !== null)
  
  console.log('canCompare computed:', { 
    activeTab: activeTab.value, 
    selectedFile: selectedFile.value?.name, 
    externalFile: externalFile.value?.name,
    result 
  })
  
  return result
})

function getSchemaFiles(schema: any) {
  return schema.associatedFiles || []
}

function selectFile(file: JsonFile) {
  if (file.path === sourceFile.value?.path) return // Can't compare with itself
  selectedFile.value = file
  externalFile.value = null // Clear external selection
}

async function browseForFile() {
  console.log('browseForFile called')
  
  if (runtime.name === 'web') {
    ui.showStatus('Web 模式不支持本地文件浏览，请使用桌面版。', 'error')
    return
  }
  
  try {
    console.log('Showing open dialog...')
    const result = await runtime.apis.showOpenDialog({
      title: 'Select file to compare',
      filters: [
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    
    console.log('Open dialog result:', result)

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0]
      
      // First check if it's actually a file (not a directory)
      try {
        // Check if the new APIs are available
        if (!runtime.apis.getFileStats || !runtime.apis.readTextFile) {
          console.log('New APIs not available, falling back to basic file reading')
          // Fallback to basic file reading
          try {
            const content = await runtime.apis.readFile(filePath)
            const fileName = filePath.split(/[/\\]/).pop() || 'Unknown'
            
            externalFile.value = {
              name: fileName,
              path: filePath,
              content: content
            }
            selectedFile.value = null
            return
          } catch (error) {
            ui.showStatus('Failed to read selected file', 'error')
            return
          }
        }
        
        const stats = await runtime.apis.getFileStats(filePath)
        if (!stats.success) {
          ui.showStatus('Failed to get file information', 'error')
          return
        }
        
        if (!stats.isFile) {
          ui.showStatus('Selected item is not a file', 'error')
          return
        }
        
        // Read file content
        const textResult = await runtime.apis.readTextFile(filePath)
        if (!textResult.success) {
          ui.showStatus('Failed to read selected file', 'error')
          return
        }
        
        const fileName = filePath.split(/[/\\]/).pop() || 'Unknown'
        let content = textResult.content
        
        // Try to parse as JSON if possible, otherwise keep as plain text
        try {
          content = JSON.parse(textResult.content!)
        } catch {
          // Keep as string for text comparison - this is perfectly fine
          content = textResult.content
        }
        
        externalFile.value = {
          name: fileName,
          path: filePath,
          content: content
        }
        selectedFile.value = null // Clear project file selection
      } catch (error) {
        ui.showStatus('Failed to process selected file', 'error')
      }
    }
  } catch (error) {
    ui.showStatus('Failed to open file dialog', 'error')
  }
}

function startComparison() {
  console.log('startComparison called', { sourceFile: sourceFile.value, activeTab: activeTab.value, selectedFile: selectedFile.value, externalFile: externalFile.value })
  
  if (!sourceFile.value) {
    console.log('No source file available')
    return
  }
  
  let comparisonFile = null
  if (activeTab.value === 'project' && selectedFile.value) {
    comparisonFile = selectedFile.value
    console.log('Using project file for comparison:', comparisonFile.name)
  } else if (activeTab.value === 'external' && externalFile.value) {
    comparisonFile = {
      name: externalFile.value.name,
      path: externalFile.value.path,
      content: externalFile.value.content,
      isValid: true, // We assume external files are valid for comparison
      errors: []
    } as JsonFile
    console.log('Using external file for comparison:', comparisonFile.name)
  }
  
  if (comparisonFile) {
    console.log('Dispatching start-diff-view event')
    // Emit event to start diff view
    const diffEvent = new CustomEvent('start-diff-view', {
      detail: { 
        sourceFile: sourceFile.value, 
        comparisonFile: comparisonFile 
      }
    })
    document.dispatchEvent(diffEvent)
    close()
  } else {
    console.log('No comparison file selected')
  }
}

function showFileSelector(event: CustomEvent) {
  console.log('showFileSelector called with event:', event.detail)
  const { sourceFile: file } = event.detail
  sourceFile.value = file
  selectedFile.value = null
  externalFile.value = null
  activeTab.value = 'project'
  isVisible.value = true
  console.log('File selector popup should now be visible:', { isVisible: isVisible.value, sourceFile: sourceFile.value?.name })
}

function testDiffWithSampleFile() {
  console.log('testDiffWithSampleFile called')
  if (!sourceFile.value) {
    console.log('No source file for test')
    return
  }
  
  // Create a mock comparison file for testing
  const mockComparisonFile = {
    name: 'test-comparison.json',
    path: '/test/path',
    content: { test: 'data', modified: 'value' },
    isValid: true,
    errors: []
  } as JsonFile
  
  console.log('Dispatching test start-diff-view event')
  const diffEvent = new CustomEvent('start-diff-view', {
    detail: { 
      sourceFile: sourceFile.value, 
      comparisonFile: mockComparisonFile 
    }
  })
  document.dispatchEvent(diffEvent)
  close()
}

function close() {
  isVisible.value = false
  sourceFile.value = null
  selectedFile.value = null
  externalFile.value = null
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isVisible.value) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('show-file-selector', showFileSelector as EventListener)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('show-file-selector', showFileSelector as EventListener)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.popup-container {
  background: var(--linear-bg-primary);
  border: 1px solid var(--linear-border);
  border-radius: var(--radius-lg); /* 12px */
  width: 600px;
  max-height: 70vh;
  overflow: hidden;
  box-shadow: var(--apple-shadow-lg);
}

.popup-header {
  padding: var(--spacing-xl); /* 24px */
  border-bottom: 1px solid var(--linear-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--linear-bg-secondary);
}

.popup-header h3 {
  margin: 0;
  font-size: var(--text-md); /* 16px */
  font-weight: var(--font-semibold); /* 600 */
  color: var(--linear-text-primary);
  line-height: var(--leading-tight);
}

/* Close button now uses apple-btn system */

.popup-content {
  padding: var(--spacing-xl); /* 24px */
  max-height: 50vh;
  overflow-y: auto;
}

.source-file-info {
  margin-bottom: var(--spacing-lg); /* 20px */
  padding: var(--spacing-md); /* 16px */
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid var(--linear-accent);
  border-radius: var(--radius-md); /* 8px */
  color: var(--linear-text-primary);
  font-size: var(--text-base); /* 14px */
  line-height: var(--leading-normal);
}

.file-selection-tabs {
  display: flex;
  margin-bottom: var(--spacing-lg); /* 20px */
  border-bottom: 1px solid var(--linear-border);
}

/* Tab buttons now use apple-segmented-control system */

.schema-section {
  margin-bottom: var(--spacing-lg); /* 20px */
}

.schema-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm); /* 8px */
  padding: var(--spacing-sm) 0; /* 8px 0 */
  font-size: var(--text-base); /* 14px */
  font-weight: var(--font-semibold); /* 600 */
  color: var(--linear-text-primary);
  border-bottom: 1px solid var(--linear-border);
  margin-bottom: var(--spacing-sm); /* 8px */
  line-height: var(--leading-normal);
}

.schema-name {
  color: var(--linear-accent);
}

.file-count {
  color: var(--linear-text-secondary);
  font-weight: var(--font-normal); /* 400 */
  font-size: var(--text-sm); /* 12px */
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs); /* 4px */
  margin-left: var(--spacing-md); /* 16px */
}

/* File items now use apple-list-item system with custom overrides */
.file-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-name {
  color: var(--apple-text-primary);
  font-weight: 500;
}

.file-status.valid {
  color: var(--accent-success);
}

.file-status.invalid {
  color: var(--accent-error);
}

.browse-section {
  text-align: center;
}

/* Browse button now uses apple-btn tinted system */

.selected-external-file {
  margin-top: 16px;
  padding: 12px;
  background: var(--linear-border);
  border-radius: 8px;
}

.external-file-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.external-file-info .file-name {
  font-weight: 600;
  color: var(--linear-text-primary);
}

.external-file-info .file-path {
  font-size: 12px;
  color: var(--linear-text-secondary);
  font-family: var(--linear-font-mono);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--linear-text-secondary);
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state-text {
  font-size: 14px;
}

.popup-footer {
  padding: 20px;
  border-top: 1px solid var(--linear-border);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: var(--linear-bg-secondary);
}

/* Legacy button styles replaced with apple-btn system */
</style>