import { describe, it, expect } from 'vitest'
import { 
  createTabResource,
  serializeTabResource,
  deserializeTabResource,
  areTabResourcesEqual,
  validateUnique,
  TabResourceRegistry
} from '../src/models/tabResource'

describe('TabResource Model', () => {
  it('creates a valid TabResource', () => {
    const r = createTabResource({ key: 'file:/a.json', title: 'A', dirty: true, meta: { foo: 1 } })
    expect(r.key).toBe('file:/a.json')
    expect(r.title).toBe('A')
    expect(r.dirty).toBe(true)
    expect(r.meta).toEqual({ foo: 1 })
  })

  it('enforces non-empty key and title', () => {
    expect(() => createTabResource({ key: '', title: 'x' })).toThrow()
    expect(() => createTabResource({ key: 'k', title: '' })).toThrow()
  })

  it('serialize/deserialize round-trip equivalence', () => {
    const original = createTabResource({ key: 'res:1', title: 'Title', dirty: false, meta: { a: true } })
    const ser = serializeTabResource(original)
    const back = deserializeTabResource(ser)
    expect(areTabResourcesEqual(original, back)).toBe(true)
    expect(back.title).toBe(original.title)
    expect(back.icon).toBe(original.icon)
    expect(back.dirty).toBe(original.dirty)
    expect(back.meta).toEqual(original.meta)
  })

  it('omits empty optional fields on serialize', () => {
    const r = createTabResource({ key: 'k', title: 'T' })
    const ser = serializeTabResource(r)
    expect(ser.dirty).toBeUndefined()
    expect(ser.meta).toBeUndefined()
  })
})

describe('TabResource uniqueness', () => {
  it('validateUnique returns duplicates', () => {
    const a = createTabResource({ key: 'x', title: 'X' })
    const b = createTabResource({ key: 'y', title: 'Y' })
    const c = createTabResource({ key: 'x', title: 'X2' })
    const res = validateUnique([a, b, c])
    expect(res.ok).toBe(false)
    expect(res.duplicates).toEqual(['x'])
  })

  it('registry prevents duplicate add', () => {
    const reg = new TabResourceRegistry()
    const a = createTabResource({ key: 'k', title: 'T1' })
    const first = reg.add(a)
    expect(first.added).toBe(true)
    expect(reg.size).toBe(1)

    const second = reg.add(createTabResource({ key: 'k', title: 'T2' }))
    expect(second.added).toBe(false)
    expect(reg.size).toBe(1)
    expect(second.resource.title).toBe('T1')
  })

  it('registry addOrGet returns existing instance', () => {
    const reg = new TabResourceRegistry()
    const a = createTabResource({ key: 'k', title: 'T1' })
    const b = createTabResource({ key: 'k', title: 'T2' })
    const first = reg.addOrGet(a)
    const second = reg.addOrGet(b)
    expect(first).toBe(second)
    expect(reg.get('k')?.title).toBe('T1')
  })
})