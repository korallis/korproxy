import { app } from 'electron'
import os from 'os'
import { logManager } from './log-manager'
import type {
  FeedbackSubmitRequest,
  FeedbackSubmitResponse,
  FeedbackLogEntry,
  FeedbackContext,
  SystemInfo,
} from '../common/ipc-types'

const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]+/g,
  /Bearer\s+\S+/gi,
  /api[_-]?key[=:]\s*\S+/gi,
  /[a-zA-Z0-9_-]{32,}/g,
]

const MAX_LOG_ENTRIES = 50
const MAX_ENTRY_LENGTH = 500
const LOG_RETENTION_MS = 24 * 60 * 60 * 1000

function redactSecrets(text: string): string {
  let result = text
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]')
  }
  return result
}

export function getSystemInfo(): SystemInfo {
  return {
    appVersion: app.getVersion(),
    platform: process.platform,
    os: `${os.type()} ${os.release()}`,
  }
}

export async function getRecentLogs(count: number): Promise<FeedbackLogEntry[]> {
  const maxCount = Math.min(count, MAX_LOG_ENTRIES)
  const since = new Date(Date.now() - LOG_RETENTION_MS).toISOString()
  
  const allLogs = await logManager.getLogs({ since, level: 'warn' })
  
  const recentLogs = allLogs
    .slice(0, maxCount)
    .map((entry) => ({
      level: entry.level,
      message: redactSecrets(entry.message).slice(0, MAX_ENTRY_LENGTH),
      timestamp: new Date(entry.timestamp).getTime(),
    }))
  
  return recentLogs
}

export async function submitFeedback(
  request: FeedbackSubmitRequest
): Promise<FeedbackSubmitResponse> {
  try {
    const systemInfo = getSystemInfo()
    
    const context: FeedbackContext = {
      appVersion: systemInfo.appVersion,
      platform: systemInfo.platform,
      os: systemInfo.os,
    }
    
    let logs: FeedbackLogEntry[] = []
    if (request.includeDiagnostics) {
      logs = await getRecentLogs(MAX_LOG_ENTRIES)
    }
    
    const payload = {
      category: request.category,
      message: redactSecrets(request.message),
      contactEmail: request.contactEmail,
      context,
      logs: request.includeDiagnostics ? logs : undefined,
      submittedAt: new Date().toISOString(),
    }
    
    await logManager.info('Feedback submitted', {
      category: payload.category,
      hasEmail: !!payload.contactEmail,
      includedDiagnostics: request.includeDiagnostics,
      logCount: logs.length,
    }, 'feedback')
    
    console.log('[Feedback] Submitted:', JSON.stringify(payload, null, 2))
    
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logManager.error('Feedback submission failed', { error: errorMessage }, 'feedback')
    return { success: false, error: errorMessage }
  }
}
