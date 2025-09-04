<template>
  <div class="popup-overlay" v-show="isVisible" @click.self="close">
    <div class="popup-container">
      <div class="popup-header">
        <h3>Select File to Compare With</h3>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <div class="popup-content">
        <div class="source-file-info">
          <strong>Comparing:</strong> {{ sourceFile?.name }}
        </div>
        
        <div class="file-selection-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'project' }"
            @click="activeTab = 'project'"
          >
            Project Files
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'external' }"
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
            <div class="file-list">
              <div 
                v-for="file in getSchemaFiles(schema)" 
                :key="file.path"
                class="file-item"
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
            <button class="browse-btn" @click="browseForFile">
              📁 Browse for JSON File
            </button>
            <div v-if="externalFile" class="selected-external-file">
              <div class="external-file-info">
                <span class="file-name">{{ externalFile.name }}</span>
                <span class="file-path">{{ externalFile.path }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="popup-footer">
        <button class="btn secondary" @click="close">Cancel</button>
        <button 
          class="btn primary" 
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAppStore, type JsonFile } from '@/stores/app'
import { useUIStore } from '@/stores/ui'

const appStore = useAppStore()
const ui = useUIStore()

const isVisible = ref(false)
const sourceFile = ref<JsonFile | null>(null)
const selectedFile = ref<JsonFile | null>(null)
const externalFile = ref<{ name: string; path: string; content: any } | null>(null)
const activeTab = ref<'project' | 'external'>('project')

const allProjectFiles = computed(() => {
  return appStore.schemas.flatMap(schema => 
    appStore.jsonFiles.filter(file => file.schemaPath === schema.path)
  )
})

const canCompare = computed(() => {
  if (activeTab.value === 'project') {
    return selectedFile.value && selectedFile.value.path !== sourceFile.value?.path
  } else {
    return externalFile.value !== null
  }
})

function getSchemaFiles(schema: any) {
  return appStore.jsonFiles.filter(file => file.schemaPath === schema.path)
}

function selectFile(file: JsonFile) {
  if (file.path === sourceFile.value?.path) return // Can't compare with itself
  selectedFile.value = file
  externalFile.value = null // Clear external selection
}

async function browseForFile() {
  try {
    const result = await window.electronAPI.showOpenDialog({
      title: 'Select JSON file to compare',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0]
      try {
        const content = await window.electronAPI.readFile(filePath)
        const fileName = filePath.split(/[/\\]/).pop() || 'Unknown'
        
        externalFile.value = {
          name: fileName,
          path: filePath,
          content: content
        }
        selectedFile.value = null // Clear project file selection
      } catch (error) {
        ui.showStatus('Failed to read selected file', 'error')
      }
    }
  } catch (error) {
    ui.showStatus('Failed to open file dialog', 'error')
  }
}

function startComparison() {
  if (!sourceFile.value) return
  
  let comparisonFile = null
  if (activeTab.value === 'project' && selectedFile.value) {
    comparisonFile = selectedFile.value
  } else if (activeTab.value === 'external' && externalFile.value) {
    comparisonFile = {
      name: externalFile.value.name,
      path: externalFile.value.path,
      content: externalFile.value.content,
      isValid: true, // We assume external files are valid for comparison
      errors: []
    } as JsonFile
  }
  
  if (comparisonFile) {
    // Emit event to start diff view
    const diffEvent = new CustomEvent('start-diff-view', {
      detail: { 
        sourceFile: sourceFile.value, 
        comparisonFile: comparisonFile 
      }
    })
    document.dispatchEvent(diffEvent)
    close()
  }
}

function showFileSelector(event: CustomEvent) {
  const { sourceFile: file } = event.detail
  sourceFile.value = file
  selectedFile.value = null
  externalFile.value = null
  activeTab.value = 'project'
  isVisible.value = true
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
  z-index: 1000;
}

.popup-container {
  background: var(--linear-surface);
  border: 1px solid var(--linear-border);
  border-radius: 12px;
  width: 600px;
  max-height: 70vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.popup-header {
  padding: 20px;
  border-bottom: 1px solid var(--linear-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--linear-bg-primary);
}

.popup-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--linear-text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--linear-text-secondary);
  padding: 0;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--linear-border);
  color: var(--linear-text-primary);
}

.popup-content {
  padding: 20px;
  max-height: 50vh;
  overflow-y: auto;
}

.source-file-info {
  margin-bottom: 20px;
  padding: 12px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid var(--linear-accent);
  border-radius: 6px;
  color: var(--linear-text-primary);
  font-size: 14px;
}

.file-selection-tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--linear-border);
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--linear-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  color: var(--linear-accent);
  border-bottom-color: var(--linear-accent);
}

.tab-btn:hover:not(.active) {
  color: var(--linear-text-primary);
}

.schema-section {
  margin-bottom: 16px;
}

.schema-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--linear-text-primary);
  border-bottom: 1px solid var(--linear-border);
  margin-bottom: 8px;
}

.schema-name {
  color: var(--linear-accent);
}

.file-count {
  color: var(--linear-text-secondary);
  font-weight: 400;
  font-size: 12px;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 12px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.file-item:hover:not(.disabled) {
  background: var(--linear-border);
}

.file-item.selected {
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid var(--linear-accent);
}

.file-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-name {
  color: var(--linear-text-primary);
}

.file-status.valid {
  color: var(--linear-success);
}

.file-status.invalid {
  color: var(--linear-error);
}

.browse-section {
  text-align: center;
}

.browse-btn {
  background: var(--linear-accent);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.browse-btn:hover {
  background: var(--linear-accent-hover);
}

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
  background: var(--linear-bg-primary);
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--linear-border);
}

.btn.secondary {
  background: var(--linear-surface);
  color: var(--linear-text-primary);
}

.btn.secondary:hover {
  background: var(--linear-border);
}

.btn.primary {
  background: var(--linear-accent);
  color: white;
  border-color: var(--linear-accent);
}

.btn.primary:hover:not(:disabled) {
  background: var(--linear-accent-hover);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>