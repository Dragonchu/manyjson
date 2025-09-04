import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export type StatusType = 'success' | 'error' | 'info'
export type ThemeType = 'light' | 'dark' | 'auto'

export const useUIStore = defineStore('ui', () => {
  // UI flags
  const isEditMode = ref(false)
  const isViewingSchema = ref(false)
  const isEditingSchema = ref(false)
  const isDiffMode = ref(false)

  // Layout - sidebar
  const leftSidebarWidth = ref<number>(300)
  const leftSidebarCollapsed = ref<boolean>(false)

  // Theme management
  const theme = ref<ThemeType>('auto')
  const prefersDark = ref(false)

  // Status messaging
  const statusMessage = ref('')
  const statusType = ref<StatusType>('info')

  // Diff mode data
  const diffSourceFile = ref<any>(null)
  const diffComparisonFile = ref<any>(null)

  // Computed theme properties
  const currentTheme = computed(() => {
    if (theme.value === 'auto') {
      return prefersDark.value ? 'dark' : 'light'
    }
    return theme.value
  })

  const isDarkMode = computed(() => currentTheme.value === 'dark')

  function setEditMode(enabled: boolean) {
    isEditMode.value = enabled
    if (enabled) {
      isViewingSchema.value = false
      isEditingSchema.value = false
      isDiffMode.value = false
    }
  }

  function setSchemaViewMode(enabled: boolean) {
    isViewingSchema.value = enabled
    if (enabled) {
      isEditMode.value = false
      isEditingSchema.value = false
      isDiffMode.value = false
    }
  }

  function setSchemaEditMode(enabled: boolean) {
    isEditingSchema.value = enabled
    if (enabled) {
      isEditMode.value = false
      isViewingSchema.value = false
      isDiffMode.value = false
    }
  }

  function setDiffMode(enabled: boolean, sourceFile?: any, comparisonFile?: any) {
    console.log('setDiffMode called:', { enabled, sourceFile: sourceFile?.name, comparisonFile: comparisonFile?.name })
    isDiffMode.value = enabled
    if (enabled) {
      isEditMode.value = false
      isViewingSchema.value = false
      isEditingSchema.value = false
      diffSourceFile.value = sourceFile
      diffComparisonFile.value = comparisonFile
      console.log('Diff mode enabled, state:', { isDiffMode: isDiffMode.value, sourceFile: diffSourceFile.value?.name, comparisonFile: diffComparisonFile.value?.name })
    } else {
      diffSourceFile.value = null
      diffComparisonFile.value = null
      console.log('Diff mode disabled')
    }
  }

  function showStatus(message: string, type: StatusType = 'info') {
    statusMessage.value = message
    statusType.value = type
    setTimeout(() => {
      statusMessage.value = ''
    }, 3000)
  }

  // Theme functions
  function setTheme(newTheme: ThemeType) {
    theme.value = newTheme
    localStorage.setItem('theme-preference', newTheme)
    applyTheme()
  }

  function toggleTheme() {
    if (theme.value === 'auto') {
      setTheme('light')
    } else if (theme.value === 'light') {
      setTheme('dark')
    } else {
      setTheme('auto')
    }
  }

  // Layout persistence keys
  const LS_LEFT_WIDTH_KEY = 'left-sidebar-width'
  const LS_LEFT_COLLAPSED_KEY = 'left-sidebar-collapsed'

  function setLeftSidebarWidth(widthPx: number) {
    // Clamp to reasonable bounds (match CSS tokens: 250-400)
    const clamped = Math.min(400, Math.max(250, Math.round(widthPx)))
    leftSidebarWidth.value = clamped
    try {
      localStorage.setItem(LS_LEFT_WIDTH_KEY, String(clamped))
    } catch {}
  }

  function setLeftSidebarCollapsed(collapsed: boolean) {
    leftSidebarCollapsed.value = collapsed
    try {
      localStorage.setItem(LS_LEFT_COLLAPSED_KEY, collapsed ? '1' : '0')
    } catch {}
  }

  function applyTheme() {
    const root = document.documentElement
    const isDark = currentTheme.value === 'dark'
    
    // Apply theme class to document root
    root.classList.remove('theme-light', 'theme-dark')
    root.classList.add(`theme-${currentTheme.value}`)
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#000000' : '#ffffff')
    }
  }

  function initializeTheme() {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme-preference') as ThemeType
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      theme.value = savedTheme
    }

    // Set up media query listener for auto theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    prefersDark.value = mediaQuery.matches
    
    mediaQuery.addEventListener('change', (e) => {
      prefersDark.value = e.matches
    })

    // Apply initial theme
    applyTheme()
  }

  function initializeLayout() {
    // Load saved sidebar width
    const savedWidth = Number(localStorage.getItem(LS_LEFT_WIDTH_KEY))
    if (!Number.isNaN(savedWidth) && savedWidth > 0) {
      // Clamp just in case
      leftSidebarWidth.value = Math.min(400, Math.max(250, Math.round(savedWidth)))
    }

    // Load collapsed state
    const savedCollapsed = localStorage.getItem(LS_LEFT_COLLAPSED_KEY)
    if (savedCollapsed === '1' || savedCollapsed === '0') {
      leftSidebarCollapsed.value = savedCollapsed === '1'
    }
  }

  // Watch for theme changes
  watch(currentTheme, () => {
    applyTheme()
  })

  // Keyboard shortcut for theme switching (Cmd/Ctrl + Shift + T)
  function initializeKeyboardShortcuts() {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault()
        toggleTheme()
      }
    }
    
    document.addEventListener('keydown', handleKeydown)
    
    return () => {
      document.removeEventListener('keydown', handleKeydown)
    }
  }

  return {
    isEditMode,
    isViewingSchema,
    isEditingSchema,
    isDiffMode,
    leftSidebarWidth,
    leftSidebarCollapsed,
    statusMessage,
    statusType,
    diffSourceFile,
    diffComparisonFile,
    theme,
    currentTheme,
    isDarkMode,
    setEditMode,
    setSchemaViewMode,
    setSchemaEditMode,
    setDiffMode,
    showStatus,
    setTheme,
    toggleTheme,
    setLeftSidebarWidth,
    setLeftSidebarCollapsed,
    initializeTheme,
    initializeLayout,
    initializeKeyboardShortcuts,
  }
})

