export const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]+/g,
  /Bearer\s+\S+/gi,
  /api[_-]?key[=:]\s*\S+/gi,
  /[a-zA-Z0-9_-]{32,}/g,
]

const SECRET_KEY_PATTERNS = [
  /api[_-]?key/i,
  /token/i,
  /password/i,
  /secret/i,
  /authorization/i,
  /bearer/i,
  /credential/i,
]

const REDACTED = '***REDACTED***'
const MAX_LOG_ENTRIES = 100

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  source?: string
  correlationId?: string
}

export interface ProviderState {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'error' | 'unknown'
  lastError?: string
  lastUsed?: string
}

export interface MetricsSummary {
  totalRequests: number
  successCount: number
  failureCount: number
  avgLatencyMs: number
  last24hRequests: number
}

export interface SystemInfo {
  platform: string
  arch: string
  osVersion: string
  nodeVersion?: string
  electronVersion?: string
}

export interface DebugBundle {
  version: string
  timestamp: string
  systemInfo: SystemInfo
  config: Record<string, unknown>
  providers: ProviderState[]
  logs: LogEntry[]
  metrics: MetricsSummary | null
}

export interface GenerateBundleOptions {
  version: string
  config: Record<string, unknown>
  providers: ProviderState[]
  logs: LogEntry[]
  metrics: MetricsSummary | null
  systemInfo?: SystemInfo
}

function isSecretKey(key: string): boolean {
  return SECRET_KEY_PATTERNS.some((pattern) => pattern.test(key))
}

export function sanitizeValue(key: string, value: unknown): unknown {
  if (isSecretKey(key) && typeof value === 'string') {
    return REDACTED
  }
  return value
}

export function sanitizeConfig(config: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(config)) {
    if (value === null || value === undefined) {
      result[key] = value
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          return sanitizeConfig(item as Record<string, unknown>)
        }
        return item
      })
    } else if (typeof value === 'object') {
      result[key] = sanitizeConfig(value as Record<string, unknown>)
    } else if (isSecretKey(key) && typeof value === 'string') {
      result[key] = REDACTED
    } else {
      result[key] = value
    }
  }

  return result
}

function redactSecretsFromText(text: string): string {
  let result = text
  for (const pattern of SECRET_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags)
    result = result.replace(regex, '[REDACTED]')
  }
  return result
}

export function sanitizeLogs(logs: LogEntry[]): LogEntry[] {
  return logs.map((entry) => ({
    ...entry,
    message: redactSecretsFromText(entry.message),
    context: entry.context ? sanitizeConfig(entry.context) : undefined,
  }))
}

export async function generateBundle(options: GenerateBundleOptions): Promise<DebugBundle> {
  const { version, config, providers, logs, metrics, systemInfo } = options

  const sanitizedConfig = sanitizeConfig(config)
  const sanitizedLogs = sanitizeLogs(logs).slice(0, MAX_LOG_ENTRIES)

  const defaultSystemInfo: SystemInfo = systemInfo || {
    platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
    arch: 'unknown',
    osVersion: 'unknown',
  }

  return {
    version,
    timestamp: new Date().toISOString(),
    systemInfo: defaultSystemInfo,
    config: sanitizedConfig,
    providers,
    logs: sanitizedLogs,
    metrics,
  }
}

export function formatBundleForClipboard(bundle: DebugBundle): string {
  return JSON.stringify(bundle, null, 2)
}
