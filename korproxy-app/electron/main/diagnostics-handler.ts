import { app, clipboard } from 'electron'
import os from 'os'
import { logManager } from './log-manager'
import type {
  DebugBundle,
  DiagnosticsSystemInfo,
  DiagnosticsProviderState,
  DiagnosticsMetrics,
  RecentRequest,
  RecentRequestsFilter,
  LogEntry,
} from '../common/ipc-types'

const SECRET_PATTERNS = [
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

function isSecretKey(key: string): boolean {
  return SECRET_KEY_PATTERNS.some((pattern) => pattern.test(key))
}

function sanitizeConfig(config: Record<string, unknown>): Record<string, unknown> {
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

function sanitizeLogs(logs: LogEntry[]): LogEntry[] {
  return logs.map((entry) => ({
    ...entry,
    message: redactSecretsFromText(entry.message),
    context: entry.context ? sanitizeConfig(entry.context) : undefined,
  }))
}

export function getDiagnosticsSystemInfo(): DiagnosticsSystemInfo {
  return {
    platform: process.platform,
    arch: process.arch,
    osVersion: `${os.type()} ${os.release()}`,
    nodeVersion: process.versions.node,
    electronVersion: process.versions.electron,
  }
}

let recentRequests: RecentRequest[] = []
const MAX_RECENT_REQUESTS = 500

export function recordRequest(request: Omit<RecentRequest, 'id'>): void {
  const newRequest: RecentRequest = {
    id: crypto.randomUUID(),
    ...request,
  }
  recentRequests.unshift(newRequest)
  if (recentRequests.length > MAX_RECENT_REQUESTS) {
    recentRequests = recentRequests.slice(0, MAX_RECENT_REQUESTS)
  }
}

export function getRecentRequests(filter?: RecentRequestsFilter): RecentRequest[] {
  let filtered = [...recentRequests]

  if (filter?.status && filter.status !== 'all') {
    filtered = filtered.filter((r) => r.status === filter.status)
  }

  if (filter?.correlationId) {
    filtered = filtered.filter((r) =>
      r.correlationId.toLowerCase().includes(filter.correlationId!.toLowerCase())
    )
  }

  if (filter?.startTime) {
    const startTime = new Date(filter.startTime).getTime()
    filtered = filtered.filter((r) => new Date(r.timestamp).getTime() >= startTime)
  }

  if (filter?.endTime) {
    const endTime = new Date(filter.endTime).getTime()
    filtered = filtered.filter((r) => new Date(r.timestamp).getTime() <= endTime)
  }

  const limit = filter?.limit ?? 100
  return filtered.slice(0, limit)
}

export async function generateDebugBundle(
  config: Record<string, unknown>,
  providers: DiagnosticsProviderState[],
  metrics: DiagnosticsMetrics | null
): Promise<DebugBundle> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const logs = await logManager.getLogs({ since })

  const sanitizedConfig = sanitizeConfig(config)
  const sanitizedLogs = sanitizeLogs(logs).slice(0, MAX_LOG_ENTRIES)

  return {
    version: app.getVersion(),
    timestamp: new Date().toISOString(),
    systemInfo: getDiagnosticsSystemInfo(),
    config: sanitizedConfig,
    providers,
    logs: sanitizedLogs,
    metrics,
  }
}

export function copyBundleToClipboard(bundle: DebugBundle): boolean {
  try {
    const formatted = JSON.stringify(bundle, null, 2)
    clipboard.writeText(formatted)
    return true
  } catch {
    return false
  }
}
