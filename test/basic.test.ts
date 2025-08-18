/**
 * Basic test to verify test environment is working
 */

import { describe, it, expect } from 'vitest'

describe('Basic Test Suite', () => {
  it('should run basic assertions', () => {
    expect(1 + 1).toBe(2)
    expect('hello').toBe('hello')
    expect(true).toBe(true)
  })

  it('should have access to window object', () => {
    expect(window).toBeDefined()
  })

  it('should have mock electronAPI', () => {
    expect(window.electronAPI).toBeDefined()
    expect(typeof window.electronAPI?.writeConfigFile).toBe('function')
  })
})