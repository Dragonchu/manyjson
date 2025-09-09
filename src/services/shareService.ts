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
async function getCompressor() {
  const mod = await import('lz-string')
  return mod
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
    const base = `${location.origin}${location.pathname}${location.search || ''}`
    return `${base}#${buildShareLinkToken(compressed)}`
  } catch {
    return `#${buildShareLinkToken(compressed)}`
  }
}

export function extractShareTokenFromUrl(url: string): string | null {
  try {
    const u = new URL(url)
    const hash = u.hash.startsWith('#') ? u.hash.slice(1) : u.hash
    // Accept both hash and query param styles
    if (hash.startsWith('share=')) return hash.slice('share='.length)
    const qp = u.searchParams.get('share')
    return qp || null
  } catch {
    // Fallback: parse as plain hash string
    const idx = url.indexOf('#')
    if (idx >= 0) {
      const hash = url.slice(idx + 1)
      if (hash.startsWith('share=')) return hash.slice('share='.length)
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

