import { app } from 'electron'
import { readdir, unlink, readFile, mkdir, appendFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import type { LogLevel, LogEntry, LogsGetOptions, LogVerbosityConfig } from '../common/ipc-types'

const LOG_RETENTION_HOURS = parseInt(process.env.LOG_RETENTION_HOURS || '24', 10)
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

export class LogManager {
  private logDir: string
  private currentLogFile: string | null = null
  private currentDate: string | null = null
  private minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'
  private componentLevels: Record<string, LogLevel> = {}

  constructor() {
    this.logDir = join(app.getPath('userData'), 'logs')
  }

  private getDateString(): string {
    return new Date().toISOString().split('T')[0]
  }

  private getLogFilePath(date: string): string {
    return join(this.logDir, `korproxy-${date}.log`)
  }

  private async ensureLogDir(): Promise<void> {
    if (!existsSync(this.logDir)) {
      await mkdir(this.logDir, { recursive: true })
    }
  }

  private shouldLog(level: LogLevel, source?: string): boolean {
    const effectiveLevel = source && this.componentLevels[source] 
      ? this.componentLevels[source] 
      : this.minLevel
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[effectiveLevel]
  }

  setLogLevel(level: LogLevel, component?: string): void {
    if (component) {
      this.componentLevels[component] = level
    } else {
      this.minLevel = level
    }
  }

  getLogLevel(component?: string): LogLevel {
    if (component && this.componentLevels[component]) {
      return this.componentLevels[component]
    }
    return this.minLevel
  }

  getVerbosityConfig(): LogVerbosityConfig {
    return {
      global: this.minLevel,
      components: { ...this.componentLevels },
    }
  }

  async log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    source?: string,
    correlationId?: string
  ): Promise<void> {
    if (!this.shouldLog(level, source)) return

    await this.ensureLogDir()

    const today = this.getDateString()
    if (today !== this.currentDate) {
      this.currentDate = today
      this.currentLogFile = this.getLogFilePath(today)
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
      ...(source && { source }),
      ...(correlationId && { correlationId }),
    }

    const line = JSON.stringify(entry) + '\n'
    await appendFile(this.currentLogFile!, line, 'utf-8')
  }

  async cleanup(): Promise<void> {
    await this.ensureLogDir()
    
    const files = await readdir(this.logDir)
    const now = Date.now()
    const retentionMs = LOG_RETENTION_HOURS * 60 * 60 * 1000

    for (const file of files) {
      if (!file.startsWith('korproxy-') || !file.endsWith('.log')) continue

      const match = file.match(/korproxy-(\d{4}-\d{2}-\d{2})\.log/)
      if (!match) continue

      const fileDate = new Date(match[1])
      const fileAge = now - fileDate.getTime()

      if (fileAge > retentionMs) {
        try {
          await unlink(join(this.logDir, file))
        } catch {
          // Ignore deletion errors
        }
      }
    }
  }

  async getLogs(options?: LogsGetOptions): Promise<LogEntry[]> {
    await this.ensureLogDir()

    const files = await readdir(this.logDir)
    const logFiles = files
      .filter(f => f.startsWith('korproxy-') && f.endsWith('.log'))
      .sort()
      .reverse()

    const entries: LogEntry[] = []
    const sinceDate = options?.since ? new Date(options.since) : null
    const minLevel = options?.level ? LOG_LEVEL_PRIORITY[options.level] : 0
    const filterCorrelationId = options?.correlationId

    for (const file of logFiles) {
      try {
        const content = await readFile(join(this.logDir, file), 'utf-8')
        const lines = content.split('\n').filter(Boolean)

        for (const line of lines) {
          try {
            const entry: LogEntry = JSON.parse(line)
            
            if (sinceDate && new Date(entry.timestamp) < sinceDate) continue
            if (LOG_LEVEL_PRIORITY[entry.level] < minLevel) continue
            if (filterCorrelationId && entry.correlationId !== filterCorrelationId) continue
            
            entries.push(entry)
          } catch {
            // Skip malformed lines
          }
        }
      } catch {
        // Skip unreadable files
      }
    }

    return entries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  async exportLogs(): Promise<string> {
    const entries = await this.getLogs()
    return entries.map(e => JSON.stringify(e)).join('\n')
  }

  async clear(): Promise<void> {
    await this.ensureLogDir()
    
    const files = await readdir(this.logDir)
    for (const file of files) {
      if (file.startsWith('korproxy-') && file.endsWith('.log')) {
        try {
          await unlink(join(this.logDir, file))
        } catch {
          // Ignore deletion errors
        }
      }
    }

    this.currentDate = null
    this.currentLogFile = null
  }

  debug(message: string, context?: Record<string, unknown>, source?: string, correlationId?: string): Promise<void> {
    return this.log('debug', message, context, source, correlationId)
  }

  info(message: string, context?: Record<string, unknown>, source?: string, correlationId?: string): Promise<void> {
    return this.log('info', message, context, source, correlationId)
  }

  warn(message: string, context?: Record<string, unknown>, source?: string, correlationId?: string): Promise<void> {
    return this.log('warn', message, context, source, correlationId)
  }

  error(message: string, context?: Record<string, unknown>, source?: string, correlationId?: string): Promise<void> {
    return this.log('error', message, context, source, correlationId)
  }
}

export const logManager = new LogManager()
