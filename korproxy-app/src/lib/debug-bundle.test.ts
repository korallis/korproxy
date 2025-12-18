import { describe, it, expect } from 'vitest'
import {
  sanitizeConfig,
  sanitizeLogs,
  sanitizeValue,
  SECRET_PATTERNS,
  type DebugBundle,
  type LogEntry,
} from './debug-bundle'

describe('Debug Bundle', () => {
  describe('Debug bundle structure', () => {
    it('should include version header', async () => {
      const { generateBundle } = await import('./debug-bundle')
      const bundle = await generateBundle({
        version: '1.2.3',
        config: {},
        providers: [],
        logs: [],
        metrics: null,
      })

      expect(bundle.version).toBe('1.2.3')
    })

    it('should include system info (OS, platform, versions)', async () => {
      const { generateBundle } = await import('./debug-bundle')
      const bundle = await generateBundle({
        version: '1.2.3',
        config: {},
        providers: [],
        logs: [],
        metrics: null,
        systemInfo: {
          platform: 'darwin',
          arch: 'arm64',
          osVersion: 'Darwin 23.0.0',
          nodeVersion: '20.0.0',
          electronVersion: '28.0.0',
        },
      })

      expect(bundle.systemInfo).toBeDefined()
      expect(bundle.systemInfo.platform).toBe('darwin')
      expect(bundle.systemInfo.arch).toBe('arm64')
      expect(bundle.systemInfo.osVersion).toBe('Darwin 23.0.0')
    })

    it('should include timestamp', async () => {
      const { generateBundle } = await import('./debug-bundle')
      const before = Date.now()
      const bundle = await generateBundle({
        version: '1.2.3',
        config: {},
        providers: [],
        logs: [],
        metrics: null,
      })
      const after = Date.now()

      const bundleTime = new Date(bundle.timestamp).getTime()
      expect(bundleTime).toBeGreaterThanOrEqual(before)
      expect(bundleTime).toBeLessThanOrEqual(after)
    })

    it('should include provider states', async () => {
      const { generateBundle } = await import('./debug-bundle')
      const providers = [
        { id: 'claude', name: 'Claude', status: 'connected' as const },
        { id: 'gemini', name: 'Gemini', status: 'disconnected' as const },
      ]
      const bundle = await generateBundle({
        version: '1.0.0',
        config: {},
        providers,
        logs: [],
        metrics: null,
      })

      expect(bundle.providers).toHaveLength(2)
      expect(bundle.providers[0].id).toBe('claude')
      expect(bundle.providers[0].status).toBe('connected')
    })

    it('should include 24h metrics summary', async () => {
      const { generateBundle } = await import('./debug-bundle')
      const metrics = {
        totalRequests: 100,
        successCount: 95,
        failureCount: 5,
        avgLatencyMs: 250,
        last24hRequests: 50,
      }
      const bundle = await generateBundle({
        version: '1.0.0',
        config: {},
        providers: [],
        logs: [],
        metrics,
      })

      expect(bundle.metrics).toBeDefined()
      expect(bundle.metrics?.totalRequests).toBe(100)
      expect(bundle.metrics?.successCount).toBe(95)
      expect(bundle.metrics?.last24hRequests).toBe(50)
    })

    it('should produce valid JSON that is parseable', async () => {
      const { generateBundle, formatBundleForClipboard } = await import('./debug-bundle')
      const bundle = await generateBundle({
        version: '1.0.0',
        config: { setting: 'value' },
        providers: [{ id: 'test', name: 'Test', status: 'connected' }],
        logs: [{ timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'test' }],
        metrics: { totalRequests: 10, successCount: 10, failureCount: 0, avgLatencyMs: 100, last24hRequests: 5 },
      })

      const formatted = formatBundleForClipboard(bundle)
      expect(() => JSON.parse(formatted)).not.toThrow()

      const parsed = JSON.parse(formatted) as DebugBundle
      expect(parsed.version).toBe('1.0.0')
      expect(parsed.config).toBeDefined()
      expect(parsed.providers).toHaveLength(1)
    })
  })

  describe('Config secret masking', () => {
    it('should mask api_key fields with ***REDACTED***', () => {
      const config = {
        api_key: 'sk-1234567890abcdef',
        name: 'test',
      }
      const sanitized = sanitizeConfig(config)
      expect(sanitized.api_key).toBe('***REDACTED***')
      expect(sanitized.name).toBe('test')
    })

    it('should mask token fields with ***REDACTED***', () => {
      const config = {
        access_token: 'ya29.a0AfH6SMB...',
        refresh_token: '1//0e...',
        name: 'test',
      }
      const sanitized = sanitizeConfig(config)
      expect(sanitized.access_token).toBe('***REDACTED***')
      expect(sanitized.refresh_token).toBe('***REDACTED***')
    })

    it('should mask password fields with ***REDACTED***', () => {
      const config = {
        password: 'super-secret-password',
        user: 'admin',
      }
      const sanitized = sanitizeConfig(config)
      expect(sanitized.password).toBe('***REDACTED***')
      expect(sanitized.user).toBe('admin')
    })

    it('should mask secret fields with ***REDACTED***', () => {
      const config = {
        client_secret: 'abc123xyz',
        client_id: 'my-client-id',
      }
      const sanitized = sanitizeConfig(config)
      expect(sanitized.client_secret).toBe('***REDACTED***')
      expect(sanitized.client_id).toBe('my-client-id')
    })

    it('should mask authorization fields with ***REDACTED***', () => {
      const config = {
        authorization: 'Bearer sk-1234',
        type: 'oauth2',
      }
      const sanitized = sanitizeConfig(config)
      expect(sanitized.authorization).toBe('***REDACTED***')
    })

    it('should mask bearer fields with ***REDACTED***', () => {
      const config = {
        bearer: 'sk-1234567890',
        endpoint: 'https://api.example.com',
      }
      const sanitized = sanitizeConfig(config)
      expect(sanitized.bearer).toBe('***REDACTED***')
    })

    it('should handle nested objects', () => {
      const config = {
        providers: {
          claude: {
            api_key: 'sk-claude-123',
            model: 'claude-3',
          },
          openai: {
            api_key: 'sk-openai-456',
            model: 'gpt-4',
          },
        },
      }
      const sanitized = sanitizeConfig(config) as {
        providers: {
          claude: { api_key: string; model: string }
          openai: { api_key: string; model: string }
        }
      }
      expect(sanitized.providers.claude.api_key).toBe('***REDACTED***')
      expect(sanitized.providers.claude.model).toBe('claude-3')
      expect(sanitized.providers.openai.api_key).toBe('***REDACTED***')
    })

    it('should handle arrays with objects containing secrets', () => {
      const config = {
        accounts: [
          { name: 'Account 1', token: 'abc123' },
          { name: 'Account 2', token: 'def456' },
        ],
      }
      const sanitized = sanitizeConfig(config) as {
        accounts: Array<{ name: string; token: string }>
      }
      expect(sanitized.accounts[0].token).toBe('***REDACTED***')
      expect(sanitized.accounts[0].name).toBe('Account 1')
      expect(sanitized.accounts[1].token).toBe('***REDACTED***')
    })
  })

  describe('Log entry sanitization', () => {
    it('should redact API keys from log messages', () => {
      const logs: LogEntry[] = [
        { timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'Using API key: sk-1234567890abcdef' },
      ]
      const sanitized = sanitizeLogs(logs)
      expect(sanitized[0].message).not.toContain('sk-1234567890abcdef')
      expect(sanitized[0].message).toContain('[REDACTED]')
    })

    it('should redact tokens from log messages', () => {
      const logs: LogEntry[] = [
        { timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'Token: sk-abc1234567890defghijklmnop' },
      ]
      const sanitized = sanitizeLogs(logs)
      expect(sanitized[0].message).not.toContain('sk-abc1234567890defghijklmnop')
      expect(sanitized[0].message).toContain('[REDACTED]')
    })

    it('should redact Bearer tokens from log messages', () => {
      const logs: LogEntry[] = [
        { timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'Authorization: Bearer sk-secret-token-123' },
      ]
      const sanitized = sanitizeLogs(logs)
      expect(sanitized[0].message).toContain('[REDACTED]')
      expect(sanitized[0].message).not.toContain('sk-secret-token-123')
    })

    it('should redact api_key= patterns from log messages', () => {
      const logs: LogEntry[] = [
        { timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'Request with api_key=secret123abc' },
      ]
      const sanitized = sanitizeLogs(logs)
      expect(sanitized[0].message).toContain('[REDACTED]')
    })

    it('should preserve log level and timestamp', () => {
      const logs: LogEntry[] = [
        { timestamp: '2024-01-01T12:00:00Z', level: 'error', message: 'Error occurred' },
      ]
      const sanitized = sanitizeLogs(logs)
      expect(sanitized[0].timestamp).toBe('2024-01-01T12:00:00Z')
      expect(sanitized[0].level).toBe('error')
    })

    it('should sanitize context objects in log entries', () => {
      const logs: LogEntry[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          level: 'info',
          message: 'Request made',
          context: {
            api_key: 'secret-key-123',
            url: 'https://api.example.com',
          },
        },
      ]
      const sanitized = sanitizeLogs(logs)
      expect(sanitized[0].context?.api_key).toBe('***REDACTED***')
      expect(sanitized[0].context?.url).toBe('https://api.example.com')
    })
  })

  describe('Log entry limits', () => {
    it('should include last 100 log entries when available', async () => {
      const { generateBundle } = await import('./debug-bundle')
      const logs: LogEntry[] = Array.from({ length: 150 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
        level: 'info' as const,
        message: `Log entry ${i}`,
      }))

      const bundle = await generateBundle({
        version: '1.0.0',
        config: {},
        providers: [],
        logs,
        metrics: null,
      })

      expect(bundle.logs).toHaveLength(100)
    })

    it('should include all logs when fewer than 100', async () => {
      const { generateBundle } = await import('./debug-bundle')
      const logs: LogEntry[] = Array.from({ length: 50 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
        level: 'info' as const,
        message: `Log entry ${i}`,
      }))

      const bundle = await generateBundle({
        version: '1.0.0',
        config: {},
        providers: [],
        logs,
        metrics: null,
      })

      expect(bundle.logs).toHaveLength(50)
    })
  })

  describe('SECRET_PATTERNS', () => {
    it('should match sk- prefixed keys', () => {
      const text = 'sk-1234567890abcdefghijklmnop'
      expect(SECRET_PATTERNS.some(p => p.test(text))).toBe(true)
    })

    it('should match Bearer tokens', () => {
      const text = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      expect(SECRET_PATTERNS.some(p => p.test(text))).toBe(true)
    })

    it('should match api_key patterns', () => {
      const text = 'api_key=secret123'
      expect(SECRET_PATTERNS.some(p => p.test(text))).toBe(true)
    })

    it('should match long alphanumeric strings with underscores/hyphens (potential secrets)', () => {
      const text = 'abcdefghij_1234567890-klmnopqrst'
      expect(SECRET_PATTERNS.some(p => p.test(text))).toBe(true)
    })
  })

  describe('sanitizeValue', () => {
    it('should mask string values for secret keys', () => {
      expect(sanitizeValue('api_key', 'secret123')).toBe('***REDACTED***')
      expect(sanitizeValue('access_token', 'token123')).toBe('***REDACTED***')
      expect(sanitizeValue('password', 'pass123')).toBe('***REDACTED***')
    })

    it('should not mask non-secret string values', () => {
      expect(sanitizeValue('name', 'John')).toBe('John')
      expect(sanitizeValue('url', 'https://example.com')).toBe('https://example.com')
    })

    it('should preserve non-string values for non-secret keys', () => {
      expect(sanitizeValue('count', 42)).toBe(42)
      expect(sanitizeValue('enabled', true)).toBe(true)
    })
  })
})
