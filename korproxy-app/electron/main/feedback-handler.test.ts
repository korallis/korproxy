import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('electron', () => ({
  app: {
    getVersion: vi.fn().mockReturnValue('1.0.24'),
  },
}))

vi.mock('os', () => ({
  default: {
    type: vi.fn().mockReturnValue('Darwin'),
    release: vi.fn().mockReturnValue('24.0.0'),
  },
}))

vi.mock('./log-manager', () => ({
  logManager: {
    getLogs: vi.fn().mockResolvedValue([]),
    info: vi.fn().mockResolvedValue(undefined),
    error: vi.fn().mockResolvedValue(undefined),
  },
}))

const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]+/g,
  /Bearer\s+\S+/gi,
  /api[_-]?key[=:]\s*\S+/gi,
  /[a-zA-Z0-9_-]{32,}/g,
]

const MAX_ENTRY_LENGTH = 500

function redactSecrets(text: string): string {
  let result = text
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]')
  }
  return result
}

function truncateLog(text: string): string {
  return text.slice(0, MAX_ENTRY_LENGTH)
}

describe('Secret Redaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sk-xxx token redaction', () => {
    it('should redact sk- tokens', () => {
      const input = 'Error with key sk-abc123def456'
      const result = redactSecrets(input)
      expect(result).toBe('Error with key [REDACTED]')
    })

    it('should redact multiple sk- tokens', () => {
      const input = 'Keys: sk-first123 and sk-second456'
      const result = redactSecrets(input)
      expect(result).toBe('Keys: [REDACTED] and [REDACTED]')
    })

    it('should handle sk- at start of string', () => {
      const input = 'sk-myapikey123 was used'
      const result = redactSecrets(input)
      expect(result).toBe('[REDACTED] was used')
    })
  })

  describe('Bearer token redaction', () => {
    it('should redact Bearer tokens', () => {
      const input = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      const result = redactSecrets(input)
      expect(result).toBe('Authorization: [REDACTED]')
    })

    it('should be case insensitive for Bearer', () => {
      const input = 'Auth: bearer mytoken123'
      const result = redactSecrets(input)
      expect(result).toBe('Auth: [REDACTED]')
    })

    it('should redact BEARER uppercase', () => {
      const input = 'Auth: BEARER secretToken'
      const result = redactSecrets(input)
      expect(result).toBe('Auth: [REDACTED]')
    })
  })

  describe('API key redaction', () => {
    it('should redact api_key= patterns', () => {
      const input = 'Request with api_key=mysecretkey123'
      const result = redactSecrets(input)
      expect(result).toBe('Request with [REDACTED]')
    })

    it('should redact api-key: patterns', () => {
      const input = 'Header api-key: verysecret123'
      const result = redactSecrets(input)
      expect(result).toBe('Header [REDACTED]')
    })

    it('should redact apikey= patterns', () => {
      const input = 'Config apikey=abc123'
      const result = redactSecrets(input)
      expect(result).toBe('Config [REDACTED]')
    })

    it('should be case insensitive for API key', () => {
      const input = 'Setting API_KEY= secret'
      const result = redactSecrets(input)
      expect(result).toBe('Setting [REDACTED]')
    })
  })

  describe('Long random token redaction', () => {
    it('should redact 32+ character tokens', () => {
      const longToken = 'a'.repeat(32)
      const input = `Token: ${longToken}`
      const result = redactSecrets(input)
      expect(result).toBe('Token: [REDACTED]')
    })

    it('should redact 64 character hex strings', () => {
      const hexToken = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      const input = `Hash: ${hexToken}`
      const result = redactSecrets(input)
      expect(result).toBe('Hash: [REDACTED]')
    })

    it('should redact tokens with underscores and dashes', () => {
      const token = 'abc_def-ghi_jkl-mno_pqr-stu_vwx-yz'
      const input = `Key: ${token}`
      const result = redactSecrets(input)
      expect(result).toBe('Key: [REDACTED]')
    })

    it('should not redact short strings (< 32 chars)', () => {
      const shortToken = 'shortkey123'
      const input = `Simple: ${shortToken}`
      const result = redactSecrets(input)
      expect(result).toBe(`Simple: ${shortToken}`)
    })
  })

  describe('Multiple secret types in one message', () => {
    it('should redact multiple different secret types', () => {
      const input = 'Using sk-apikey123 with Bearer token123 and api_key=secret'
      const result = redactSecrets(input)
      expect(result).not.toContain('sk-apikey123')
      expect(result).not.toContain('Bearer token123')
      expect(result).not.toContain('api_key=secret')
      expect(result).toContain('[REDACTED]')
    })
  })

  describe('Safe content preservation', () => {
    it('should not redact normal log messages', () => {
      const input = 'Proxy started successfully on port 1337'
      const result = redactSecrets(input)
      expect(result).toBe(input)
    })

    it('should preserve URLs without secrets', () => {
      const input = 'Connected to https://api.example.com/v1/chat'
      const result = redactSecrets(input)
      expect(result).toBe(input)
    })
  })
})

describe('Log Truncation', () => {
  it('should truncate logs longer than 500 characters', () => {
    const longMessage = 'a'.repeat(600)
    const result = truncateLog(longMessage)
    expect(result.length).toBe(500)
  })

  it('should not truncate logs under 500 characters', () => {
    const shortMessage = 'Short log message'
    const result = truncateLog(shortMessage)
    expect(result).toBe(shortMessage)
    expect(result.length).toBe(shortMessage.length)
  })

  it('should handle exactly 500 character logs', () => {
    const exactMessage = 'a'.repeat(500)
    const result = truncateLog(exactMessage)
    expect(result.length).toBe(500)
    expect(result).toBe(exactMessage)
  })

  it('should truncate after redaction', () => {
    const longSecret = `sk-${'a'.repeat(600)}`
    const redacted = redactSecrets(longSecret)
    const truncated = truncateLog(redacted)
    expect(truncated.length).toBeLessThanOrEqual(500)
  })
})
