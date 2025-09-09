<template>
  <Teleport to="body">
    <div v-if="isVisible" class="popup-overlay" @click.self="close">
      <div class="popup-container">
        <div class="popup-header">
          <h3>Share Schema</h3>
          <button class="apple-btn plain small icon-only" @click="close">×</button>
        </div>

        <div class="popup-content">
          <div class="schema-info">
            <strong>Schema:</strong> {{ schema?.name }}
          </div>

          <div class="file-select-section">
            <div class="section-title">Select associated JSON files to include</div>
            <div class="apple-list file-list">
              <label 
                class="apple-list-item file-item" 
                v-for="file in availableFiles" 
                :key="file.path"
              >
                <input type="checkbox" v-model="selectedFileNames" :value="file.name" />
                <span class="file-name">{{ file.name }}</span>
                <span class="file-status" :class="{ valid: file.isValid, invalid: !file.isValid }">{{ file.isValid ? '✓' : '⚠️' }}</span>
              </label>
            </div>
            <div v-if="availableFiles.length === 0" class="empty-state">
              <div class="empty-state-icon">📄</div>
              <div class="empty-state-text">No associated files</div>
            </div>
          </div>

          <div class="link-section" v-if="shareLink">
            <div class="section-title">Share link</div>
            <div class="share-link-box">
              <input class="apple-input" type="text" :value="shareLink" readonly />
              <button class="apple-btn bordered" @click="copyLink">Copy</button>
            </div>
            <div class="hint">Paste this link in ManyJson to import.</div>
          </div>
        </div>

        <div class="popup-footer">
          <button class="apple-btn bordered" @click="close">Cancel</button>
          <button class="apple-btn filled" :disabled="!schema" @click="generate">Generate Link</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAppStore, type SchemaInfo, type JsonFile } from '@/stores/app'
import { useUIStore } from '@/stores/ui'
import { createSharePayload, compressPayload, buildShareLink } from '@/services/shareService'

const appStore = useAppStore()
const ui = useUIStore()

const isVisible = ref(false)
const schema = ref<SchemaInfo | null>(null)
const selectedFileNames = ref<string[]>([])
const shareLink = ref('')

const availableFiles = computed<JsonFile[]>(() => schema.value?.associatedFiles || [])

function show(event: CustomEvent) {
  schema.value = event.detail.schema
  isVisible.value = true
  selectedFileNames.value = (schema.value?.associatedFiles || []).map(f => f.name)
  shareLink.value = ''
}

function close() {
  isVisible.value = false
  schema.value = null
  selectedFileNames.value = []
  shareLink.value = ''
}

async function generate() {
  if (!schema.value) return
  const files = (schema.value.associatedFiles || []).filter(f => selectedFileNames.value.includes(f.name))
  const payload = await createSharePayload(schema.value, files)
  const token = await compressPayload(payload)
  const link = buildShareLink(token)
  shareLink.value = link
  ui.showStatus('Share link generated', 'success')
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    ui.showStatus('Copied to clipboard', 'success')
  } catch {
    ui.showStatus('Failed to copy', 'error')
  }
}

onMounted(() => {
  document.addEventListener('show-share-schema-popup', show as EventListener)
})

onUnmounted(() => {
  document.removeEventListener('show-share-schema-popup', show as EventListener)
})
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 10000;
}
.popup-container {
  background: var(--linear-bg-primary);
  border: 1px solid var(--linear-border);
  border-radius: var(--radius-lg);
  width: 640px; max-width: 90vw; max-height: 80vh; overflow: hidden;
  box-shadow: var(--apple-shadow-lg);
}
.popup-header { padding: var(--spacing-xl); border-bottom: 1px solid var(--linear-border); display: flex; justify-content: space-between; align-items: center; background: var(--linear-bg-secondary); }
.popup-content { padding: var(--spacing-xl); max-height: 60vh; overflow: auto; }
.popup-footer { padding: var(--spacing-lg); border-top: 1px solid var(--linear-border); display: flex; justify-content: flex-end; gap: 12px; background: var(--linear-bg-secondary); }
.schema-info { margin-bottom: var(--spacing-lg); padding: var(--spacing-md); background: rgba(99,102,241,0.1); border: 1px solid var(--linear-accent); border-radius: var(--radius-md); }
.section-title { font-weight: 600; margin-bottom: 8px; color: var(--linear-text-primary); }
.file-list { display: flex; flex-direction: column; gap: 4px; }
.file-item { display: flex; align-items: center; gap: 8px; }
.file-name { flex: 1; }
.file-status.valid { color: var(--accent-success); }
.file-status.invalid { color: var(--accent-error); }
.share-link-box { display: flex; gap: 8px; align-items: center; }
.share-link-box input { flex: 1; }
.hint { color: var(--linear-text-secondary); font-size: 12px; margin-top: 6px; }
</style>

