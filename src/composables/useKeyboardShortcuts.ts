import { onMounted, onUnmounted } from 'vue'

export interface ShortcutBinding {
  /** Unique ID for this binding */
  id: string
  /** Human-readable description */
  description: string
  /** Key to match (e.g. 's', 'n', 'F2', 'Escape') */
  key: string
  /** Require Cmd (macOS) or Ctrl (other platforms) */
  cmdOrCtrl?: boolean
  /** Require Shift modifier */
  shift?: boolean
  /** Require Alt/Option modifier */
  alt?: boolean
  /** Handler function — return true to prevent default */
  handler: (e: KeyboardEvent) => void | boolean
  /** If true, only fires when no input/textarea is focused */
  ignoreWhenEditing?: boolean
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

/**
 * Central keyboard shortcut registry.
 *
 * Components register shortcuts via `register()` / `unregister()`.
 * The root listener is installed once and shared across the app.
 */
class ShortcutRegistry {
  private bindings = new Map<string, ShortcutBinding>()
  private listening = false

  private handleKeydown = (e: KeyboardEvent) => {
    for (const binding of this.bindings.values()) {
      if (!this.matches(e, binding)) continue

      if (binding.ignoreWhenEditing !== false) {
        const target = e.target as HTMLElement | null
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            (target as any).isContentEditable ||
            target.closest('.cm-content'))
        ) {
          continue
        }
      }

      const result = binding.handler(e)
      if (result !== false) {
        e.preventDefault()
        e.stopPropagation()
      }
      return
    }
  }

  private matches(e: KeyboardEvent, b: ShortcutBinding): boolean {
    // Key matching — normalise to lowercase for letter keys
    const eventKey = e.key.length === 1 ? e.key.toLowerCase() : e.key
    const bindingKey = b.key.length === 1 ? b.key.toLowerCase() : b.key
    if (eventKey !== bindingKey) return false

    const wantCmd = !!b.cmdOrCtrl
    const hasCmd = isMac ? e.metaKey : e.ctrlKey
    if (wantCmd !== hasCmd) return false

    if (!!b.shift !== e.shiftKey) return false
    if (!!b.alt !== e.altKey) return false

    return true
  }

  register(binding: ShortcutBinding) {
    this.bindings.set(binding.id, binding)
    this.ensureListening()
  }

  unregister(id: string) {
    this.bindings.delete(id)
  }

  getAll(): ShortcutBinding[] {
    return Array.from(this.bindings.values())
  }

  /** Format a shortcut for display (e.g. "⌘S" or "Ctrl+S") */
  formatShortcut(binding: ShortcutBinding): string {
    const parts: string[] = []
    if (binding.cmdOrCtrl) parts.push(isMac ? '⌘' : 'Ctrl')
    if (binding.shift) parts.push(isMac ? '⇧' : 'Shift')
    if (binding.alt) parts.push(isMac ? '⌥' : 'Alt')
    parts.push(binding.key.length === 1 ? binding.key.toUpperCase() : binding.key)
    return isMac ? parts.join('') : parts.join('+')
  }

  private ensureListening() {
    if (this.listening) return
    document.addEventListener('keydown', this.handleKeydown, { capture: true })
    this.listening = true
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKeydown, { capture: true })
    this.bindings.clear()
    this.listening = false
  }
}

/** Singleton registry shared across the application */
export const shortcutRegistry = new ShortcutRegistry()

/**
 * Vue composable for registering keyboard shortcuts.
 *
 * Shortcuts are automatically unregistered when the component is unmounted.
 *
 * @example
 * ```ts
 * useKeyboardShortcuts([
 *   { id: 'save', key: 's', cmdOrCtrl: true, description: 'Save', handler: () => save() },
 *   { id: 'newSchema', key: 'n', cmdOrCtrl: true, description: 'New Schema', handler: () => addSchema() },
 * ])
 * ```
 */
export function useKeyboardShortcuts(bindings: ShortcutBinding[]) {
  const ids = bindings.map(b => b.id)

  onMounted(() => {
    for (const binding of bindings) {
      shortcutRegistry.register(binding)
    }
  })

  onUnmounted(() => {
    for (const id of ids) {
      shortcutRegistry.unregister(id)
    }
  })

  return {
    registry: shortcutRegistry,
  }
}
