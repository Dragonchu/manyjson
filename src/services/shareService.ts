import type { SchemaInfo, JsonFile } from '@/stores/app'

export interface ShareFileItem {
  name: string
  content: any
}

export interface SharePayload {
  v: 1
  app: 'manyjson'
  schema: {
    name: string
    content: any
  }
  files: ShareFileItem[]
}

// Lazy import to avoid bundling if unused in some targets
async function getCompressor(): Promise<{
  compressToEncodedURIComponent: (input: string) => string
  decompressFromEncodedURIComponent: (input: string) => string | null
}> {
  const mod: any = await import('lz-string')
  const compress = mod?.compressToEncodedURIComponent || mod?.default?.compressToEncodedURIComponent
  const decompress = mod?.decompressFromEncodedURIComponent || mod?.default?.decompressFromEncodedURIComponent
  if (typeof compress !== 'function' || typeof decompress !== 'function') {
    throw new Error('lz-string methods not available')
  }
  return {
    compressToEncodedURIComponent: compress,
    decompressFromEncodedURIComponent: decompress
  }
}

export async function createSharePayload(schema: SchemaInfo, files: JsonFile[]): Promise<SharePayload> {
  return {
    v: 1,
    app: 'manyjson',
    schema: {
      name: schema.name,
      content: schema.content
    },
    files: files.map(f => ({ name: f.name, content: f.content }))
  }
}

export async function compressPayload(payload: SharePayload): Promise<string> {
  const json = JSON.stringify(payload)
  const { compressToEncodedURIComponent } = await getCompressor()
  return compressToEncodedURIComponent(json)
}

export function buildShareLinkToken(compressed: string): string {
  return `share=${compressed}`
}

export function buildShareLink(compressed: string): string {
  try {
    const useHistory = (import.meta as any).env?.VITE_HISTORY_MODE === 'history'
    if (useHistory) {
      const u = new URL(location.href)
      u.searchParams.set('share', compressed)
      return u.toString()
    }
    // Hash history: keep router at root path and put token in hash query
    const base = `${location.origin}${location.pathname}${location.search || ''}`
    return `${base}#/ ?${buildShareLinkToken(compressed)}`.replace(' /?', '/?')
  } catch {
    return `#/?${buildShareLinkToken(compressed)}`
  }
}

export function extractShareTokenFromUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // 1) Normal query param
    const qp = u.searchParams.get('share')
    if (qp) return qp
    // 2) Hash part variants: '#share=...' or '#/?share=...' or '#/path?share=...'
    const rawHash = u.hash.startsWith('#') ? u.hash.slice(1) : u.hash
    if (!rawHash) return null
    if (rawHash.startsWith('share=')) {
      return rawHash.slice('share='.length)
    }
    const qIndex = rawHash.indexOf('?')
    if (qIndex >= 0) {
      const qs = rawHash.slice(qIndex + 1)
      const hsp = new URLSearchParams(qs)
      const hv = hsp.get('share')
      if (hv) return hv
    }
    return null
  } catch {
    // Fallback: parse as plain hash string
    const idx = url.indexOf('#')
    if (idx >= 0) {
      const hash = url.slice(idx + 1)
      if (hash.startsWith('share=')) return hash.slice('share='.length)
      const qIdx = hash.indexOf('?')
      if (qIdx >= 0) {
        const qs = hash.slice(qIdx + 1)
        const hsp = new URLSearchParams(qs)
        const hv = hsp.get('share')
        if (hv) return hv
      }
    }
    // Also support raw token pasted (no URL)
    if (url.startsWith('share=')) return url.slice('share='.length)
    return null
  }
}

export async function decompressToken(token: string): Promise<SharePayload | null> {
  try {
    const { decompressFromEncodedURIComponent } = await getCompressor()
    const json = decompressFromEncodedURIComponent(token)
    if (!json) return null
    const obj = JSON.parse(json)
    if (obj && obj.app === 'manyjson' && obj.v === 1 && obj.schema && obj.files) {
      return obj as SharePayload
    }
    return null
  } catch {
    return null
  }
}

