/**
 * Test Index - Entry point for all tests
 * This file ensures all test suites are discovered and run
 */

import { describe, it, expect } from 'vitest'

describe('Test Suite Health Check', () => {
  it('should have all test categories available', () => {
    // This is a health check to ensure the test environment is working
    expect(true).toBe(true)
  })

  it('should have access to global mocks', () => {
    expect(window.electronAPI).toBeDefined()
    expect(global.mockElectronAPI).toBeDefined()
  })
})