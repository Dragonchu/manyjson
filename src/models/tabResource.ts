export type TabKey = string

export interface TabResource {
  key: TabKey
  title: string
  icon?: string
  dirty: boolean
  meta: Record<string, any>
}

export interface SerializedTabResource {
  key: TabKey
  title: string
  icon?: string
  dirty?: boolean
  meta?: Record<string, any>
}

function assertValidKey(key: string): void {
  if (typeof key !== 'string' || key.trim().length === 0) {
    throw new Error('TabResource.key must be a non-empty string')
  }
}

export function createTabResource(input: {
  key: TabKey
  title: string
  icon?: string
  dirty?: boolean
  meta?: Record<string, any>
}): TabResource {
  assertValidKey(input.key)
  if (typeof input.title !== 'string' || input.title.trim().length === 0) {
    throw new Error('TabResource.title must be a non-empty string')
  }

  return {
    key: input.key,
    title: input.title,
    icon: input.icon,
    dirty: Boolean(input.dirty),
    meta: input.meta ?? {}
  }
}

export function serializeTabResource(resource: TabResource): SerializedTabResource {
  assertValidKey(resource.key)
  return {
    key: resource.key,
    title: resource.title,
    icon: resource.icon,
    dirty: resource.dirty || undefined,
    meta: (resource.meta && Object.keys(resource.meta).length > 0) ? resource.meta : undefined
  }
}

export function deserializeTabResource(serialized: SerializedTabResource): TabResource {
  assertValidKey(serialized.key)
  if (typeof serialized.title !== 'string' || serialized.title.trim().length === 0) {
    throw new Error('Serialized TabResource.title must be a non-empty string')
  }

  return {
    key: serialized.key,
    title: serialized.title,
    icon: serialized.icon,
    dirty: Boolean(serialized.dirty),
    meta: serialized.meta ?? {}
  }
}

export function areTabResourcesEqual(a: TabResource, b: TabResource): boolean {
  return a.key === b.key
}

export function validateUnique(resources: TabResource[]): { ok: boolean; duplicates: TabKey[] } {
  const seen = new Set<TabKey>()
  const duplicates: TabKey[] = []
  for (const r of resources) {
    assertValidKey(r.key)
    if (seen.has(r.key)) {
      duplicates.push(r.key)
    } else {
      seen.add(r.key)
    }
  }
  return { ok: duplicates.length === 0, duplicates }
}

export class TabResourceRegistry {
  private readonly keyToResource: Map<TabKey, TabResource>

  constructor(initial?: TabResource[]) {
    this.keyToResource = new Map<TabKey, TabResource>()
    if (Array.isArray(initial)) {
      for (const r of initial) {
        this.add(r)
      }
    }
  }

  add(resource: TabResource): { added: boolean; resource: TabResource } {
    assertValidKey(resource.key)
    const existing = this.keyToResource.get(resource.key)
    if (existing) {
      return { added: false, resource: existing }
    }
    this.keyToResource.set(resource.key, resource)
    return { added: true, resource }
  }

  addOrGet(resource: TabResource): TabResource {
    return this.add(resource).resource
  }

  has(key: TabKey): boolean {
    return this.keyToResource.has(key)
  }

  get(key: TabKey): TabResource | undefined {
    return this.keyToResource.get(key)
  }

  remove(key: TabKey): boolean {
    return this.keyToResource.delete(key)
  }

  clear(): void {
    this.keyToResource.clear()
  }

  list(): TabResource[] {
    return Array.from(this.keyToResource.values())
  }

  get size(): number {
    return this.keyToResource.size
  }
}