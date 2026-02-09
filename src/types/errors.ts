/**
 * Domain-specific error types for ManyJson.
 *
 * Usage:
 *   throw new ValidationError('Invalid JSON at line 5', { path: '/name' })
 *   throw new StorageError('IndexedDB write failed', { cause: originalError })
 *   throw new PlatformError('Electron IPC timeout', { api: 'readFile' })
 */

export class AppError extends Error {
  /** Extra structured context for debugging / display */
  readonly context: Record<string, unknown>

  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message)
    this.name = 'AppError'
    this.context = context
  }
}

/** JSON Schema compilation or validation errors */
export class ValidationError extends AppError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, context)
    this.name = 'ValidationError'
  }
}

/** File / localStorage / IndexedDB persistence errors */
export class StorageError extends AppError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, context)
    this.name = 'StorageError'
  }
}

/** Platform abstraction layer errors (Electron IPC, Web API fallback) */
export class PlatformError extends AppError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, context)
    this.name = 'PlatformError'
  }
}

/** Network / share-link related errors */
export class NetworkError extends AppError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, context)
    this.name = 'NetworkError'
  }
}
