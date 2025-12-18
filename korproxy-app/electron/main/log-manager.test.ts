import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const testLogDir = join(tmpdir(), 'korproxy-log-test-' + Date.now())

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockImplementation(() => testLogDir),
  },
}))

// Import after mocking
const { LogManager } = await import('./log-manager')

describe('LogManager', () => {
  beforeEach(async () => {
    await mkdir(testLogDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(testLogDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('Correlation ID support', () => {
    it('should include correlation ID in log entries when provided', async () => {
      const manager = new LogManager()
      const correlationId = 'test-correlation-123'
      
      await manager.log('info', 'Test message', { key: 'value' }, 'test-source', correlationId)
      
      const logs = await manager.getLogs()
      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].correlationId).toBe(correlationId)
    })

    it('should work without correlation ID (optional)', async () => {
      const manager = new LogManager()
      
      await manager.log('info', 'Test message without correlation')
      
      const logs = await manager.getLogs()
      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].correlationId).toBeUndefined()
    })

    it('should include correlation ID via convenience methods', async () => {
      const manager = new LogManager()
      const correlationId = 'info-correlation-456'
      
      await manager.info('Info message', { info: true }, 'info-source', correlationId)
      
      const logs = await manager.getLogs()
      expect(logs[0].correlationId).toBe(correlationId)
    })
  })

  describe('Log verbosity', () => {
    it('should respect minLevel setting (global)', async () => {
      const manager = new LogManager()
      manager.setLogLevel('warn') // Set global level to warn
      
      await manager.debug('Debug should be filtered')
      await manager.info('Info should be filtered')
      await manager.warn('Warn should appear')
      await manager.error('Error should appear')
      
      const logs = await manager.getLogs()
      const messages = logs.map(l => l.message)
      
      expect(messages).not.toContain('Debug should be filtered')
      expect(messages).not.toContain('Info should be filtered')
      expect(messages).toContain('Warn should appear')
      expect(messages).toContain('Error should appear')
    })

    it('should allow per-component verbosity overrides', async () => {
      const manager = new LogManager()
      manager.setLogLevel('error') // Global level: error only
      manager.setLogLevel('debug', 'verbose-component') // This component logs everything
      
      await manager.debug('Debug from verbose', undefined, 'verbose-component')
      await manager.debug('Debug from default', undefined, 'default-component')
      await manager.error('Error from default', undefined, 'default-component')
      
      const logs = await manager.getLogs()
      const messages = logs.map(l => l.message)
      
      expect(messages).toContain('Debug from verbose')
      expect(messages).not.toContain('Debug from default')
      expect(messages).toContain('Error from default')
    })

    it('should return current global log level via getLogLevel()', async () => {
      const manager = new LogManager()
      
      expect(manager.getLogLevel()).toBe('info') // Default
      
      manager.setLogLevel('debug')
      expect(manager.getLogLevel()).toBe('debug')
      
      manager.setLogLevel('error')
      expect(manager.getLogLevel()).toBe('error')
    })

    it('should return component-specific log level via getLogLevel(component)', async () => {
      const manager = new LogManager()
      manager.setLogLevel('warn', 'my-component')
      
      expect(manager.getLogLevel('my-component')).toBe('warn')
      expect(manager.getLogLevel('other-component')).toBe('info') // Falls back to global
    })
  })

  describe('setLogLevel and getLogLevel', () => {
    it('should update minimum log level globally', async () => {
      const manager = new LogManager()
      
      manager.setLogLevel('error')
      expect(manager.getLogLevel()).toBe('error')
      
      manager.setLogLevel('debug')
      expect(manager.getLogLevel()).toBe('debug')
    })

    it('should handle all valid log levels', async () => {
      const manager = new LogManager()
      const levels = ['debug', 'info', 'warn', 'error'] as const
      
      for (const level of levels) {
        manager.setLogLevel(level)
        expect(manager.getLogLevel()).toBe(level)
      }
    })
  })
})
