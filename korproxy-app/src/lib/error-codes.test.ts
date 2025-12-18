import { describe, it, expect } from 'vitest'
import {
  ErrorCategory,
  ErrorSeverity,
  getError,
  formatError,
  isKorProxyError,
  ERROR_REGISTRY,
  KorProxyError,
} from './error-codes'

const ERROR_CODE_PATTERN = /^KP-(AUTH|PROV|CONF|NET|RATE|SYS)-\d{3}$/

describe('Error Codes', () => {
  describe('Error code format validation', () => {
    it('should match KP-XXX-NNN pattern', () => {
      for (const code of Object.keys(ERROR_REGISTRY)) {
        expect(code).toMatch(ERROR_CODE_PATTERN)
      }
    })

    it('should reject invalid format codes', () => {
      expect('AUTH-001').not.toMatch(ERROR_CODE_PATTERN)
      expect('KP-AUTH-01').not.toMatch(ERROR_CODE_PATTERN)
      expect('KP-INVALID-001').not.toMatch(ERROR_CODE_PATTERN)
      expect('KP-AUTH-1000').not.toMatch(ERROR_CODE_PATTERN)
    })
  })

  describe('Error categories', () => {
    it('should have AUTH codes in 001-099 range', () => {
      const authCodes = Object.keys(ERROR_REGISTRY).filter((c) => c.includes('-AUTH-'))
      expect(authCodes.length).toBeGreaterThan(0)
      for (const code of authCodes) {
        const num = parseInt(code.split('-')[2])
        expect(num).toBeGreaterThanOrEqual(1)
        expect(num).toBeLessThanOrEqual(99)
      }
    })

    it('should have PROV codes in 100-199 range', () => {
      const provCodes = Object.keys(ERROR_REGISTRY).filter((c) => c.includes('-PROV-'))
      expect(provCodes.length).toBeGreaterThan(0)
      for (const code of provCodes) {
        const num = parseInt(code.split('-')[2])
        expect(num).toBeGreaterThanOrEqual(100)
        expect(num).toBeLessThanOrEqual(199)
      }
    })

    it('should have CONF codes in 200-299 range', () => {
      const confCodes = Object.keys(ERROR_REGISTRY).filter((c) => c.includes('-CONF-'))
      expect(confCodes.length).toBeGreaterThan(0)
      for (const code of confCodes) {
        const num = parseInt(code.split('-')[2])
        expect(num).toBeGreaterThanOrEqual(200)
        expect(num).toBeLessThanOrEqual(299)
      }
    })

    it('should have NET codes in 300-399 range', () => {
      const netCodes = Object.keys(ERROR_REGISTRY).filter((c) => c.includes('-NET-'))
      expect(netCodes.length).toBeGreaterThan(0)
      for (const code of netCodes) {
        const num = parseInt(code.split('-')[2])
        expect(num).toBeGreaterThanOrEqual(300)
        expect(num).toBeLessThanOrEqual(399)
      }
    })

    it('should have RATE codes in 400-499 range', () => {
      const rateCodes = Object.keys(ERROR_REGISTRY).filter((c) => c.includes('-RATE-'))
      expect(rateCodes.length).toBeGreaterThan(0)
      for (const code of rateCodes) {
        const num = parseInt(code.split('-')[2])
        expect(num).toBeGreaterThanOrEqual(400)
        expect(num).toBeLessThanOrEqual(499)
      }
    })

    it('should have SYS codes in 500-599 range', () => {
      const sysCodes = Object.keys(ERROR_REGISTRY).filter((c) => c.includes('-SYS-'))
      expect(sysCodes.length).toBeGreaterThan(0)
      for (const code of sysCodes) {
        const num = parseInt(code.split('-')[2])
        expect(num).toBeGreaterThanOrEqual(500)
        expect(num).toBeLessThanOrEqual(599)
      }
    })

    it('should cover all ErrorCategory values', () => {
      const categories = Object.values(ErrorCategory)
      for (const category of categories) {
        const hasCode = Object.keys(ERROR_REGISTRY).some((c) => c.includes(`-${category}-`))
        expect(hasCode).toBe(true)
      }
    })
  })

  describe('Error code to message mapping', () => {
    it('should return correct error for KP-AUTH-001', () => {
      const error = getError('KP-AUTH-001')
      expect(error).toBeDefined()
      expect(error?.code).toBe('KP-AUTH-001')
      expect(error?.message).toBe('Invalid credentials')
    })

    it('should return correct error for KP-PROV-101', () => {
      const error = getError('KP-PROV-101')
      expect(error).toBeDefined()
      expect(error?.code).toBe('KP-PROV-101')
      expect(error?.message).toBe('Provider unavailable')
    })

    it('should return undefined for unknown error code', () => {
      const error = getError('KP-AUTH-999')
      expect(error).toBeUndefined()
    })

    it('should include description for all errors', () => {
      for (const error of Object.values(ERROR_REGISTRY)) {
        expect(error.description).toBeDefined()
        expect(error.description.length).toBeGreaterThan(0)
      }
    })

    it('should include troubleshooting steps for all errors', () => {
      for (const error of Object.values(ERROR_REGISTRY)) {
        expect(error.troubleshooting).toBeDefined()
        expect(Array.isArray(error.troubleshooting)).toBe(true)
        expect(error.troubleshooting.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Error severity levels', () => {
    it('should include severity level for all errors', () => {
      for (const error of Object.values(ERROR_REGISTRY)) {
        expect(error.severity).toBeDefined()
        expect(Object.values(ErrorSeverity)).toContain(error.severity)
      }
    })

    it('should have critical severity for SYS errors', () => {
      const sysErrors = Object.entries(ERROR_REGISTRY).filter(([code]) => code.includes('-SYS-'))
      const criticalCount = sysErrors.filter(([, e]) => e.severity === ErrorSeverity.Critical).length
      expect(criticalCount).toBeGreaterThan(0)
    })

    it('should have error severity for AUTH token expired', () => {
      const error = getError('KP-AUTH-002')
      expect(error?.severity).toBe(ErrorSeverity.Error)
    })

    it('should have warning severity for RATE limit errors', () => {
      const error = getError('KP-RATE-401')
      expect(error?.severity).toBe(ErrorSeverity.Warning)
    })
  })

  describe('Error serialization to JSON', () => {
    it('should include all fields when serialized', () => {
      const error = getError('KP-AUTH-001')
      const json = JSON.parse(JSON.stringify(error))

      expect(json.code).toBe('KP-AUTH-001')
      expect(json.message).toBeDefined()
      expect(json.description).toBeDefined()
      expect(json.troubleshooting).toBeDefined()
      expect(json.severity).toBeDefined()
      expect(json.httpStatus).toBeDefined()
    })

    it('should be valid JSON for all errors', () => {
      for (const error of Object.values(ERROR_REGISTRY)) {
        const serialized = JSON.stringify(error)
        const parsed = JSON.parse(serialized)
        expect(parsed).toEqual(error)
      }
    })

    it('should format error to user-friendly string', () => {
      const error = getError('KP-AUTH-001')!
      const formatted = formatError(error)

      expect(formatted).toContain('KP-AUTH-001')
      expect(formatted).toContain(error.message)
    })
  })

  describe('HTTP status code mapping', () => {
    it('should map AUTH errors to 401', () => {
      const authErrors = Object.entries(ERROR_REGISTRY).filter(([code]) => code.includes('-AUTH-'))
      for (const [, error] of authErrors) {
        expect(error.httpStatus).toBe(401)
      }
    })

    it('should map PROV errors to 502', () => {
      const provErrors = Object.entries(ERROR_REGISTRY).filter(([code]) => code.includes('-PROV-'))
      for (const [, error] of provErrors) {
        expect(error.httpStatus).toBe(502)
      }
    })

    it('should map CONF errors to 400', () => {
      const confErrors = Object.entries(ERROR_REGISTRY).filter(([code]) => code.includes('-CONF-'))
      for (const [, error] of confErrors) {
        expect(error.httpStatus).toBe(400)
      }
    })

    it('should map NET errors to 503', () => {
      const netErrors = Object.entries(ERROR_REGISTRY).filter(([code]) => code.includes('-NET-'))
      for (const [, error] of netErrors) {
        expect(error.httpStatus).toBe(503)
      }
    })

    it('should map RATE errors to 429', () => {
      const rateErrors = Object.entries(ERROR_REGISTRY).filter(([code]) => code.includes('-RATE-'))
      for (const [, error] of rateErrors) {
        expect(error.httpStatus).toBe(429)
      }
    })

    it('should map SYS errors to 500', () => {
      const sysErrors = Object.entries(ERROR_REGISTRY).filter(([code]) => code.includes('-SYS-'))
      for (const [, error] of sysErrors) {
        expect(error.httpStatus).toBe(500)
      }
    })
  })

  describe('isKorProxyError type guard', () => {
    it('should return true for valid KorProxyError', () => {
      const error = getError('KP-AUTH-001')
      expect(isKorProxyError(error)).toBe(true)
    })

    it('should return false for null', () => {
      expect(isKorProxyError(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isKorProxyError(undefined)).toBe(false)
    })

    it('should return false for plain object without code', () => {
      expect(isKorProxyError({ message: 'test' })).toBe(false)
    })

    it('should return false for object with invalid code format', () => {
      expect(isKorProxyError({ code: 'INVALID', message: 'test' })).toBe(false)
    })

    it('should return true for manually constructed valid error', () => {
      const error: KorProxyError = {
        code: 'KP-AUTH-001',
        message: 'Test',
        description: 'Test description',
        troubleshooting: ['Step 1'],
        severity: ErrorSeverity.Error,
        httpStatus: 401,
      }
      expect(isKorProxyError(error)).toBe(true)
    })
  })

  describe('Specific error codes', () => {
    it('should have KP-AUTH-001 (invalid credentials)', () => {
      const error = getError('KP-AUTH-001')
      expect(error?.message).toBe('Invalid credentials')
    })

    it('should have KP-AUTH-002 (token expired)', () => {
      const error = getError('KP-AUTH-002')
      expect(error?.message).toBe('Token expired')
    })

    it('should have KP-AUTH-003 (OAuth failed)', () => {
      const error = getError('KP-AUTH-003')
      expect(error?.message).toBe('OAuth failed')
    })

    it('should have KP-PROV-101 (provider unavailable)', () => {
      const error = getError('KP-PROV-101')
      expect(error?.message).toBe('Provider unavailable')
    })

    it('should have KP-PROV-102 (invalid response)', () => {
      const error = getError('KP-PROV-102')
      expect(error?.message).toBe('Invalid response')
    })

    it('should have KP-PROV-103 (unsupported model)', () => {
      const error = getError('KP-PROV-103')
      expect(error?.message).toBe('Unsupported model')
    })

    it('should have KP-CONF-201 (invalid config)', () => {
      const error = getError('KP-CONF-201')
      expect(error?.message).toBe('Invalid configuration')
    })

    it('should have KP-CONF-202 (missing required field)', () => {
      const error = getError('KP-CONF-202')
      expect(error?.message).toBe('Missing required field')
    })

    it('should have KP-CONF-203 (schema validation failed)', () => {
      const error = getError('KP-CONF-203')
      expect(error?.message).toBe('Schema validation failed')
    })

    it('should have KP-NET-301 (connection refused)', () => {
      const error = getError('KP-NET-301')
      expect(error?.message).toBe('Connection refused')
    })

    it('should have KP-NET-302 (timeout)', () => {
      const error = getError('KP-NET-302')
      expect(error?.message).toBe('Request timeout')
    })

    it('should have KP-NET-303 (DNS resolution failed)', () => {
      const error = getError('KP-NET-303')
      expect(error?.message).toBe('DNS resolution failed')
    })

    it('should have KP-RATE-401 (rate limited)', () => {
      const error = getError('KP-RATE-401')
      expect(error?.message).toBe('Rate limited')
    })

    it('should have KP-RATE-402 (quota exceeded)', () => {
      const error = getError('KP-RATE-402')
      expect(error?.message).toBe('Quota exceeded')
    })

    it('should have KP-RATE-403 (concurrent limit)', () => {
      const error = getError('KP-RATE-403')
      expect(error?.message).toBe('Concurrent request limit')
    })

    it('should have KP-SYS-501 (internal error)', () => {
      const error = getError('KP-SYS-501')
      expect(error?.message).toBe('Internal error')
    })

    it('should have KP-SYS-502 (out of memory)', () => {
      const error = getError('KP-SYS-502')
      expect(error?.message).toBe('Out of memory')
    })

    it('should have KP-SYS-503 (disk full)', () => {
      const error = getError('KP-SYS-503')
      expect(error?.message).toBe('Disk full')
    })
  })
})
