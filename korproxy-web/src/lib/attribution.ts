export interface UTMParams {
  source?: string
  medium?: string
  campaign?: string
}

const STORAGE_KEY = 'korproxy_attribution'

export function captureUTMParams(): void {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)
  const utm: UTMParams = {}

  const source = params.get('utm_source')
  const medium = params.get('utm_medium')
  const campaign = params.get('utm_campaign')

  if (source) utm.source = source
  if (medium) utm.medium = medium
  if (campaign) utm.campaign = campaign

  if (Object.keys(utm).length > 0) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utm))
  }
}

export function getStoredAttribution(): UTMParams | null {
  if (typeof window === 'undefined') return null

  const stored = sessionStorage.getItem(STORAGE_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored) as UTMParams
  } catch {
    return null
  }
}

export function clearAttribution(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
}

export function buildDeepLinkWithUTM(baseUrl: string = 'korproxy://launch'): string {
  const utm = getStoredAttribution()
  if (!utm) return baseUrl

  const params = new URLSearchParams()
  if (utm.source) params.set('utm_source', utm.source)
  if (utm.medium) params.set('utm_medium', utm.medium)
  if (utm.campaign) params.set('utm_campaign', utm.campaign)

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}
