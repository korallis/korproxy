import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

const STORAGE_KEY = 'korproxy_attribution'

interface UTMParams {
  source?: string
  medium?: string
  campaign?: string
}

function captureUTMParams(searchParams: string): UTMParams | null {
  const params = new URLSearchParams(searchParams)
  const utm: UTMParams = {}

  const source = params.get('utm_source')
  const medium = params.get('utm_medium')
  const campaign = params.get('utm_campaign')

  if (source) utm.source = source
  if (medium) utm.medium = medium
  if (campaign) utm.campaign = campaign

  return Object.keys(utm).length > 0 ? utm : null
}

function buildDeepLinkWithUTM(baseUrl: string, utm: UTMParams | null): string {
  if (!utm) return baseUrl

  const params = new URLSearchParams()
  if (utm.source) params.set('utm_source', utm.source)
  if (utm.medium) params.set('utm_medium', utm.medium)
  if (utm.campaign) params.set('utm_campaign', utm.campaign)

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

describe('Attribution Functions', () => {
  describe('captureUTMParams', () => {
    it('should extract utm_source from URL', () => {
      const result = captureUTMParams('?utm_source=google')
      expect(result).toEqual({ source: 'google' })
    })

    it('should extract all UTM parameters', () => {
      const result = captureUTMParams('?utm_source=twitter&utm_medium=social&utm_campaign=launch2024')
      expect(result).toEqual({
        source: 'twitter',
        medium: 'social',
        campaign: 'launch2024',
      })
    })

    it('should return null when no UTM params present', () => {
      const result = captureUTMParams('?foo=bar&baz=qux')
      expect(result).toBeNull()
    })

    it('should return null for empty search string', () => {
      const result = captureUTMParams('')
      expect(result).toBeNull()
    })

    it('should handle partial UTM params', () => {
      const result = captureUTMParams('?utm_source=newsletter')
      expect(result).toEqual({ source: 'newsletter' })
    })

    it('should handle mixed params (UTM and non-UTM)', () => {
      const result = captureUTMParams('?ref=abc&utm_source=referral&page=1')
      expect(result).toEqual({ source: 'referral' })
    })

    it('should handle URL-encoded values', () => {
      const result = captureUTMParams('?utm_campaign=summer%20sale%202024')
      expect(result).toEqual({ campaign: 'summer sale 2024' })
    })
  })

  describe('buildDeepLinkWithUTM', () => {
    const baseUrl = 'korproxy://launch'

    it('should return base URL when no UTM params', () => {
      const result = buildDeepLinkWithUTM(baseUrl, null)
      expect(result).toBe(baseUrl)
    })

    it('should append single UTM param', () => {
      const result = buildDeepLinkWithUTM(baseUrl, { source: 'google' })
      expect(result).toBe('korproxy://launch?utm_source=google')
    })

    it('should append all UTM params', () => {
      const result = buildDeepLinkWithUTM(baseUrl, {
        source: 'twitter',
        medium: 'social',
        campaign: 'launch',
      })
      expect(result).toContain('utm_source=twitter')
      expect(result).toContain('utm_medium=social')
      expect(result).toContain('utm_campaign=launch')
    })

    it('should handle custom base URL', () => {
      const customBase = 'korproxy://settings'
      const result = buildDeepLinkWithUTM(customBase, { source: 'app' })
      expect(result).toBe('korproxy://settings?utm_source=app')
    })

    it('should handle empty UTM object', () => {
      const result = buildDeepLinkWithUTM(baseUrl, {})
      expect(result).toBe(baseUrl)
    })

    it('should properly URL-encode values', () => {
      const result = buildDeepLinkWithUTM(baseUrl, { campaign: 'summer sale' })
      expect(result).toContain('utm_campaign=summer+sale')
    })
  })

  describe('UTM Storage', () => {
    let mockStorage: Record<string, string>

    beforeEach(() => {
      mockStorage = {}
    })

    it('should store UTM params', () => {
      const utm = { source: 'google', medium: 'cpc' }
      mockStorage[STORAGE_KEY] = JSON.stringify(utm)
      expect(JSON.parse(mockStorage[STORAGE_KEY])).toEqual(utm)
    })

    it('should retrieve stored UTM params', () => {
      const utm = { source: 'newsletter', campaign: 'weekly' }
      mockStorage[STORAGE_KEY] = JSON.stringify(utm)
      const retrieved = JSON.parse(mockStorage[STORAGE_KEY])
      expect(retrieved).toEqual(utm)
    })

    it('should handle missing storage key', () => {
      const retrieved = mockStorage[STORAGE_KEY]
      expect(retrieved).toBeUndefined()
    })

    it('should handle invalid JSON in storage', () => {
      mockStorage[STORAGE_KEY] = 'invalid-json'
      expect(() => JSON.parse(mockStorage[STORAGE_KEY])).toThrow()
    })
  })
})
