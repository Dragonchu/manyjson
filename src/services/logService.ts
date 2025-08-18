/**
 * Log Service - Centralized logging utility
 * Separated from store and components for better organization
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export class LogService {
  private getTimestamp(): string {
    return new Date().toISOString()
  }

  private log(level: LogLevel, message: string, ...args: any[]) {
    const timestamp = this.getTimestamp()
    const prefix = `[RENDERER-${level.toUpperCase()}] ${timestamp} - ${message}`
    
    switch (level) {
      case 'debug':
        console.log(prefix, ...args)
        break
      case 'info':
        console.log(prefix, ...args)
        break
      case 'warn':
        console.warn(prefix, ...args)
        break
      case 'error':
        console.error(prefix, ...args)
        break
    }
  }

  debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args)
  }

  info(message: string, ...args: any[]) {
    this.log('info', message, ...args)
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args)
  }

  error(message: string, error?: any, ...args: any[]) {
    this.log('error', message, error, ...args)
  }
}

// Export singleton instance
export const logService = new LogService()