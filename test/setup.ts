/**
 * Test setup file - Global configuration for all tests
 */

import { vi } from 'vitest'

// Mock window.electronAPI globally
const mockElectronAPI = {
  writeConfigFile: vi.fn(),
  listConfigFiles: vi.fn(),
  writeJsonFile: vi.fn(),
  writeSchemaJsonFile: vi.fn(),
  readFile: vi.fn(),
  deleteFile: vi.fn(),
  listSchemaJsonFiles: vi.fn(),
  createSchemaJsonDirectory: vi.fn(),
  getConfigDirectory: vi.fn(),
  showOpenDialog: vi.fn(),
  showSaveDialog: vi.fn(),
}

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
  configurable: true,
})

// Global test utilities
global.mockElectronAPI = mockElectronAPI

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}