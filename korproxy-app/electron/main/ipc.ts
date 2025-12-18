import { ipcMain, BrowserWindow, app } from 'electron'
import { readFile, writeFile, mkdir, access } from 'fs/promises'
import { dirname, join } from 'path'
import { homedir } from 'os'
import { z } from 'zod'
import http from 'http'
import { proxySidecar } from './sidecar'
import { settingsStore, Settings } from './store'
import { logManager } from './log-manager'
import { HealthMonitor } from './health-monitor'
import { runProviderTest } from './provider-test'
import { getToolIntegrations, copyConfigToClipboard } from './tool-integrations'
import { getDeviceInfo } from './device'
import { submitFeedback, getRecentLogs, getSystemInfo } from './feedback-handler'
import { generateDebugBundle, getRecentRequests, copyBundleToClipboard } from './diagnostics-handler'
import { 
  IPC_CHANNELS, 
  PROFILE_IPC_CHANNELS,
  METRICS_IPC_CHANNELS,
  LogData, 
  ProxyStats, 
  FactoryConfig, 
  FactoryCustomModel, 
  AmpConfig, 
  IntegrationStatus,
  type ProviderTestRequest,
  type LogsGetOptions,
  type RoutingConfig,
  type MetricsTimeRange,
  type MetricsDashboardResponse,
  type MetricsProviderData,
} from '../common/ipc-types'
import {
  ProxyStatusSchema,
  ConfigContentSchema,
  SettingsKeySchema,
  SettingsSchema,
  ProviderTestRequestSchema,
  LogsGetOptionsSchema,
  RoutingConfigSchema,
  DeviceInfoSchema,
  FeedbackSubmitRequestSchema,
  validateIpcPayload,
  IpcValidationError,
} from '../common/ipc-schemas'
import type { FeedbackSubmitRequest, RecentRequestsFilter, DiagnosticsProviderState, DiagnosticsMetrics } from '../common/ipc-types'
import { writeRoutingConfig, getConfigPath } from './config-writer'

export { IPC_CHANNELS }

export interface ProxyStatus {
  running: boolean
  port: number
}

// Subscription state managed by main process
let subscriptionValid = false
let subscriptionExpiry: number | null = null

// Entitlements cache managed by main process
interface CachedEntitlements {
  plan: 'free' | 'pro' | 'team'
  scope: 'personal' | 'team'
  teamId?: string
  status: 'active' | 'trialing' | 'grace' | 'past_due' | 'expired'
  limits: {
    maxProfiles: number
    maxProviderGroups: number
    maxDevices: number
    smartRoutingEnabled: boolean
    analyticsRetentionDays: number
  }
  currentPeriodEnd?: number
  gracePeriodEnd?: number
}

let cachedEntitlements: CachedEntitlements | null = null

// Health monitor instance (created per window)
let healthMonitor: HealthMonitor | null = null

function createErrorResponse(error: unknown): { success: false; error: string } {
  if (error instanceof IpcValidationError) {
    return { success: false, error: `Validation error: ${error.message}` }
  }
  if (error instanceof Error) {
    return { success: false, error: error.message }
  }
  return { success: false, error: 'An unknown error occurred' }
}

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // Initialize health monitor
  const port = settingsStore.get('port') || 1337
  healthMonitor = new HealthMonitor(proxySidecar, port)
  
  // Forward health state changes to renderer
  healthMonitor.on('stateChange', (status) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.PROXY_HEALTH, status)
    }
  })

  // Cleanup log files older than 24 hours on startup
  logManager.cleanup().catch(console.error)

  proxySidecar.on('log', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const logData: LogData = {
        type: data.type,
        message: data.message,
        timestamp: new Date().toISOString(),
      }
      mainWindow.webContents.send(IPC_CHANNELS.PROXY_LOG, logData)
    }
  })

  proxySidecar.on('started', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const logData: LogData = {
        type: 'stdout',
        message: '[KorProxy] Proxy started successfully',
        timestamp: new Date().toISOString(),
      }
      mainWindow.webContents.send(IPC_CHANNELS.PROXY_LOG, logData)
    }
  })

  proxySidecar.on('stopped', (code) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const logData: LogData = {
        type: 'stdout',
        message: `[KorProxy] Proxy stopped with code: ${code}`,
        timestamp: new Date().toISOString(),
      }
      mainWindow.webContents.send(IPC_CHANNELS.PROXY_LOG, logData)
    }
  })

  proxySidecar.on('error', (error) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const logData: LogData = {
        type: 'stderr',
        message: `[KorProxy] Error: ${error.message}`,
        timestamp: new Date().toISOString(),
      }
      mainWindow.webContents.send(IPC_CHANNELS.PROXY_LOG, logData)
    }
  })

  ipcMain.handle(IPC_CHANNELS.PROXY_START, async (): Promise<{ success: boolean; error?: string }> => {
    // Check subscription is valid before starting proxy
    if (!subscriptionValid) {
      return { success: false, error: 'Active subscription required to start proxy' }
    }
    
    // Check subscription hasn't expired
    if (subscriptionExpiry && subscriptionExpiry < Date.now()) {
      subscriptionValid = false
      return { success: false, error: 'Subscription has expired' }
    }
    
    try {
      // Use health monitor to start proxy (it manages lifecycle)
      if (healthMonitor) {
        await healthMonitor.start()
      } else {
        await proxySidecar.start()
      }
      return { success: true }
    } catch (error) {
      return createErrorResponse(error)
    }
  })

  ipcMain.handle(IPC_CHANNELS.PROXY_STOP, (): { success: boolean } => {
    // Use health monitor to stop proxy
    if (healthMonitor) {
      healthMonitor.stop()
    } else {
      proxySidecar.stop()
    }
    return { success: true }
  })

  ipcMain.handle(IPC_CHANNELS.PROXY_STATUS, (): ProxyStatus => {
    const status = {
      running: proxySidecar.isRunning(),
      port: proxySidecar.getPort(),
    }
    return validateIpcPayload(IPC_CHANNELS.PROXY_STATUS, ProxyStatusSchema, status)
  })

  ipcMain.handle(IPC_CHANNELS.PROXY_RESTART, async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await proxySidecar.restart()
      return { success: true }
    } catch (error) {
      return createErrorResponse(error)
    }
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, async (): Promise<{ success: boolean; content?: string; error?: string }> => {
    const configPath = proxySidecar.getConfigPath()
    try {
      const content = await readFile(configPath, 'utf-8')
      return { success: true, content }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { success: true, content: '' }
      }
      return createErrorResponse(error)
    }
  })

  ipcMain.handle(
    IPC_CHANNELS.CONFIG_SET,
    async (_, content: unknown): Promise<{ success: boolean; error?: string }> => {
      try {
        const validContent = validateIpcPayload(IPC_CHANNELS.CONFIG_SET, ConfigContentSchema, content)
        const configPath = proxySidecar.getConfigPath()
        await mkdir(dirname(configPath), { recursive: true })
        await writeFile(configPath, validContent, 'utf-8')
        return { success: true }
      } catch (error) {
        return createErrorResponse(error)
      }
    }
  )

  ipcMain.handle(IPC_CHANNELS.APP_MINIMIZE, (): void => {
    mainWindow.minimize()
  })

  ipcMain.handle(IPC_CHANNELS.APP_MAXIMIZE, (): void => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.handle(IPC_CHANNELS.APP_CLOSE, (): void => {
    mainWindow.close()
  })

  ipcMain.handle(IPC_CHANNELS.APP_IS_MAXIMIZED, (): boolean => {
    return mainWindow.isMaximized()
  })

  ipcMain.handle(IPC_CHANNELS.APP_GET_SETTINGS, (): Settings => {
    const settings = settingsStore.getAll()
    return validateIpcPayload(IPC_CHANNELS.APP_GET_SETTINGS, SettingsSchema, settings)
  })

  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, (): string => {
    return app.getVersion()
  })

  ipcMain.handle(
    IPC_CHANNELS.APP_SET_SETTING,
    (_, key: unknown, value: unknown): { success: boolean; error?: string } => {
      try {
        const validKey = validateIpcPayload(IPC_CHANNELS.APP_SET_SETTING, SettingsKeySchema, key)

        const valueSchemas: Record<string, z.ZodSchema> = {
          port: z.number().min(1).max(65535),
          autoStart: z.boolean(),
          minimizeToTray: z.boolean(),
          theme: z.enum(['dark', 'light', 'system']),
          windowBounds: z.object({
            x: z.number(),
            y: z.number(),
            width: z.number().min(400),
            height: z.number().min(300),
          }),
        }

        const valueSchema = valueSchemas[validKey]
        if (!valueSchema) {
          return { success: false, error: `Unknown setting key: ${validKey}` }
        }

        const validValue = validateIpcPayload(IPC_CHANNELS.APP_SET_SETTING, valueSchema, value) as Settings[keyof Settings]
        settingsStore.set(validKey as keyof Settings, validValue)
        
        if (validKey === 'port' && typeof validValue === 'number') {
          proxySidecar.setPort(validValue)
        }
        
        return { success: true }
      } catch (error) {
        return createErrorResponse(error)
      }
    }
  )

  ipcMain.handle(IPC_CHANNELS.PROXY_STATS, async (): Promise<ProxyStats | null> => {
    if (!proxySidecar.isRunning()) {
      return null
    }

    const port = proxySidecar.getPort()

    // Normalize hour keys to zero-padded strings ("0" -> "00", "1" -> "01", etc.)
    const normalizeHourKeys = (hourMap: Record<string, number> | undefined): Record<string, number> => {
      if (!hourMap) return {}
      const normalized: Record<string, number> = {}
      for (const [key, value] of Object.entries(hourMap)) {
        const normalizedKey = key.padStart(2, '0')
        normalized[normalizedKey] = (normalized[normalizedKey] || 0) + (value || 0)
      }
      return normalized
    }
    
    return new Promise((resolve) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: '/v0/management/usage',
          method: 'GET',
          timeout: 2000,
        },
        (res) => {
          let data = ''
          res.on('data', (chunk) => (data += chunk))
          res.on('end', () => {
            try {
              const json = JSON.parse(data)
              // Handle both { usage: {...} } and direct usage object formats
              const usage = json.usage || json || {}
              resolve({
                totalRequests: usage.total_requests || 0,
                successCount: usage.success_count || 0,
                failureCount: usage.failure_count || json.failed_requests || 0,
                totalTokens: usage.total_tokens || 0,
                requestsByHour: normalizeHourKeys(usage.requests_by_hour),
                requestsByDay: usage.requests_by_day || {},
              })
            } catch {
              resolve(null)
            }
          })
        }
      )

      req.on('error', () => resolve(null))
      req.on('timeout', () => {
        req.destroy()
        resolve(null)
      })
      req.end()
    })
  })

  // Subscription validation - set from renderer when auth state changes
  ipcMain.handle(
    IPC_CHANNELS.SUBSCRIPTION_SET,
    (_, info: { isValid: boolean; expiresAt?: number }): { success: boolean } => {
      subscriptionValid = info.isValid
      subscriptionExpiry = info.expiresAt || null
      return { success: true }
    }
  )

  // Factory Droid CLI integration
  const factoryConfigPath = join(homedir(), '.factory', 'config.json')

  ipcMain.handle(
    IPC_CHANNELS.INTEGRATIONS_FACTORY_GET,
    async (): Promise<{ success: boolean; status?: IntegrationStatus; config?: FactoryConfig; error?: string }> => {
      try {
        await access(factoryConfigPath)
        const content = await readFile(factoryConfigPath, 'utf-8')
        const config: FactoryConfig = JSON.parse(content)
        const korproxyModels = (config.custom_models || [])
          .filter(m => m.base_url.includes('localhost:1337') || m.api_key === 'korproxy')
          .map(m => m.model)
        return {
          success: true,
          status: {
            configured: korproxyModels.length > 0,
            configPath: factoryConfigPath,
            models: korproxyModels,
          },
          config,
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return {
            success: true,
            status: {
              configured: false,
              configPath: factoryConfigPath,
              models: [],
            },
            config: {},
          }
        }
        return createErrorResponse(error) as { success: false; error: string }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.INTEGRATIONS_FACTORY_SET,
    async (_, models: FactoryCustomModel[]): Promise<{ success: boolean; error?: string }> => {
      try {
        let existingConfig: FactoryConfig = {}
        try {
          const content = await readFile(factoryConfigPath, 'utf-8')
          existingConfig = JSON.parse(content)
        } catch {
          // File doesn't exist or is invalid, start fresh
        }

        // Remove existing KorProxy models
        const existingModels = (existingConfig.custom_models || [])
          .filter(m => !m.base_url.includes('localhost:1337') && m.api_key !== 'korproxy')

        // Merge with new models
        existingConfig.custom_models = [...existingModels, ...models]

        // Write config
        await mkdir(dirname(factoryConfigPath), { recursive: true })
        await writeFile(factoryConfigPath, JSON.stringify(existingConfig, null, 2), 'utf-8')
        return { success: true }
      } catch (error) {
        return createErrorResponse(error)
      }
    }
  )

  // Amp CLI integration
  const ampConfigPath = join(homedir(), '.config', 'amp', 'settings.json')

  ipcMain.handle(
    IPC_CHANNELS.INTEGRATIONS_AMP_GET,
    async (): Promise<{ success: boolean; status?: IntegrationStatus; config?: AmpConfig; error?: string }> => {
      try {
        await access(ampConfigPath)
        const content = await readFile(ampConfigPath, 'utf-8')
        const config: AmpConfig = JSON.parse(content)
        const isConfigured = config['amp.url']?.includes('localhost:1337') || false
        return {
          success: true,
          status: {
            configured: isConfigured,
            configPath: ampConfigPath,
          },
          config,
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return {
            success: true,
            status: {
              configured: false,
              configPath: ampConfigPath,
            },
            config: {},
          }
        }
        return createErrorResponse(error) as { success: false; error: string }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.INTEGRATIONS_AMP_SET,
    async (_, port: number): Promise<{ success: boolean; error?: string }> => {
      try {
        let existingConfig: AmpConfig = {}
        try {
          const content = await readFile(ampConfigPath, 'utf-8')
          existingConfig = JSON.parse(content)
        } catch {
          // File doesn't exist or is invalid, start fresh
        }

        // Set the amp.url to point to KorProxy
        existingConfig['amp.url'] = `http://localhost:${port}`

        // Write config
        await mkdir(dirname(ampConfigPath), { recursive: true })
        await writeFile(ampConfigPath, JSON.stringify(existingConfig, null, 2), 'utf-8')
        return { success: true }
      } catch (error) {
        return createErrorResponse(error)
      }
    }
  )

  // Phase A: Provider Testing
  ipcMain.handle(
    IPC_CHANNELS.PROVIDER_TEST_RUN,
    async (_, request: unknown) => {
      try {
        const validated = validateIpcPayload(
          IPC_CHANNELS.PROVIDER_TEST_RUN,
          ProviderTestRequestSchema,
          request
        ) as ProviderTestRequest
        return await runProviderTest(validated.providerId, validated.modelId)
      } catch (error) {
        return {
          providerId: 'unknown',
          success: false,
          errorCode: 'PROVIDER_ERROR' as const,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        }
      }
    }
  )

  // Phase A: Tool Integrations
  ipcMain.handle(IPC_CHANNELS.TOOL_INTEGRATION_LIST, async () => {
    const currentPort = settingsStore.get('port') || 1337
    return await getToolIntegrations(currentPort)
  })

  ipcMain.handle(
    IPC_CHANNELS.TOOL_INTEGRATION_COPY,
    (_, toolId: string): { success: boolean } => {
      const currentPort = settingsStore.get('port') || 1337
      const success = copyConfigToClipboard(toolId, currentPort)
      return { success }
    }
  )

  // Phase A: Log Manager
  ipcMain.handle(IPC_CHANNELS.LOGS_GET, async (_, options?: unknown) => {
    try {
      const validated = options 
        ? validateIpcPayload(IPC_CHANNELS.LOGS_GET, LogsGetOptionsSchema, options) as LogsGetOptions
        : undefined
      return await logManager.getLogs(validated)
    } catch {
      return []
    }
  })

  ipcMain.handle(IPC_CHANNELS.LOGS_EXPORT, async () => {
    return await logManager.exportLogs()
  })

  ipcMain.handle(IPC_CHANNELS.LOGS_CLEAR, async () => {
    await logManager.clear()
    return { success: true }
  })

  // Phase A: Health Monitor - get current status
  ipcMain.handle(IPC_CHANNELS.PROXY_HEALTH, () => {
    return healthMonitor?.getStatus() ?? {
      state: 'stopped',
      lastCheck: null,
      consecutiveFailures: 0,
      restartAttempts: 0,
    }
  })

  // Phase C: Config Sync - write routing config to disk for Go backend
  ipcMain.handle(
    PROFILE_IPC_CHANNELS.CONFIG_SYNC,
    async (_, config: unknown): Promise<{ success: boolean; error?: string; path?: string }> => {
      try {
        const validated = validateIpcPayload(
          PROFILE_IPC_CHANNELS.CONFIG_SYNC,
          RoutingConfigSchema,
          config
        ) as RoutingConfig
        await writeRoutingConfig(validated)
        return { success: true, path: getConfigPath() }
      } catch (error) {
        return createErrorResponse(error) as { success: false; error: string }
      }
    }
  )

  // Entitlements - get cached entitlements
  ipcMain.handle(IPC_CHANNELS.ENTITLEMENTS_GET, (): CachedEntitlements | null => {
    return cachedEntitlements
  })

  // Entitlements - set/update cached entitlements from renderer
  ipcMain.handle(
    IPC_CHANNELS.ENTITLEMENTS_SET,
    (_, entitlements: CachedEntitlements): { success: boolean } => {
      cachedEntitlements = entitlements
      
      // Update subscription validity based on entitlements
      const activeStatuses = ['active', 'trialing', 'grace']
      subscriptionValid = activeStatuses.includes(entitlements.status)
      subscriptionExpiry = entitlements.currentPeriodEnd || null
      
      return { success: true }
    }
  )

  // Device Sync - get device info
  ipcMain.handle(IPC_CHANNELS.DEVICE_GET_INFO, () => {
    const info = getDeviceInfo()
    return validateIpcPayload(IPC_CHANNELS.DEVICE_GET_INFO, DeviceInfoSchema, info)
  })

  // Device Sync - register device (returns device info for renderer to send to Convex)
  ipcMain.handle(IPC_CHANNELS.DEVICE_REGISTER, () => {
    const info = getDeviceInfo()
    return validateIpcPayload(IPC_CHANNELS.DEVICE_REGISTER, DeviceInfoSchema, info)
  })

  // TG5: Feedback System
  ipcMain.handle(IPC_CHANNELS.LOGS_GET_RECENT, async (_, count: number) => {
    const maxCount = Math.min(Math.max(1, count || 50), 50)
    return await getRecentLogs(maxCount)
  })

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_INFO, () => {
    return getSystemInfo()
  })

  ipcMain.handle(
    IPC_CHANNELS.FEEDBACK_SUBMIT,
    async (_, request: unknown) => {
      try {
        const validated = validateIpcPayload(
          IPC_CHANNELS.FEEDBACK_SUBMIT,
          FeedbackSubmitRequestSchema,
          request
        ) as FeedbackSubmitRequest
        return await submitFeedback(validated)
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }
  )

  // TG3: Diagnostics Handlers
  ipcMain.handle(
    IPC_CHANNELS.DIAGNOSTICS_GET_BUNDLE,
    async (_, config: Record<string, unknown>, providers: DiagnosticsProviderState[], metrics: DiagnosticsMetrics | null) => {
      try {
        return await generateDebugBundle(config || {}, providers || [], metrics)
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.DIAGNOSTICS_GET_RECENT_REQUESTS,
    (_, filter?: RecentRequestsFilter) => {
      return getRecentRequests(filter)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.DIAGNOSTICS_COPY_BUNDLE,
    async (_, config: Record<string, unknown>, providers: DiagnosticsProviderState[], metrics: DiagnosticsMetrics | null) => {
      try {
        const bundle = await generateDebugBundle(config || {}, providers || [], metrics)
        const success = copyBundleToClipboard(bundle)
        return { success }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }
  )

  // TG5: Metrics Dashboard
  ipcMain.handle(
    METRICS_IPC_CHANNELS.GET_SUMMARY,
    async (_, timeRange: MetricsTimeRange): Promise<MetricsDashboardResponse> => {
      const port = proxySidecar.getPort()

      if (!proxySidecar.isRunning()) {
        return {
          summary: { totalRequests: 0, totalFailures: 0, avgLatencyMs: 0, successRate: 0 },
          byProvider: [],
          timeRange,
        }
      }

      return new Promise((resolve) => {
        const days = timeRange === '1d' ? 1 : 7
        const from = new Date()
        from.setDate(from.getDate() - days)

        const req = http.request(
          {
            hostname: '127.0.0.1',
            port,
            path: `/v0/management/metrics?from=${from.toISOString()}&to=${new Date().toISOString()}`,
            method: 'GET',
            timeout: 5000,
          },
          (res) => {
            let data = ''
            res.on('data', (chunk) => (data += chunk))
            res.on('end', () => {
              try {
                const json = JSON.parse(data)
                const byProviderMap = (json.by_provider || {}) as Record<string, Record<string, unknown>>
                const byProvider: MetricsProviderData[] = Object.entries(byProviderMap).map(
                  ([provider, stats]) => ({
                    provider,
                    requests: Number(stats.requests) || 0,
                    failures: Number(stats.failures) || 0,
                    errorRate:
                      Number(stats.requests) > 0
                        ? (Number(stats.failures) / Number(stats.requests)) * 100
                        : 0,
                    p50Ms: Number(stats.p50_ms) || 0,
                    p90Ms: Number(stats.p90_ms) || 0,
                    p99Ms: Number(stats.p99_ms) || 0,
                  })
                )

                const summary = json.summary || {}
                const totalRequests = Number(summary.total_requests) || 0
                const totalFailures = Number(summary.total_failures) || 0

                resolve({
                  summary: {
                    totalRequests,
                    totalFailures,
                    avgLatencyMs: Number(summary.avg_latency_ms) || 0,
                    successRate:
                      totalRequests > 0
                        ? ((totalRequests - totalFailures) / totalRequests) * 100
                        : 0,
                  },
                  byProvider,
                  timeRange,
                })
              } catch {
                resolve({
                  summary: { totalRequests: 0, totalFailures: 0, avgLatencyMs: 0, successRate: 0 },
                  byProvider: [],
                  timeRange,
                })
              }
            })
          }
        )

        req.on('error', () => {
          resolve({
            summary: { totalRequests: 0, totalFailures: 0, avgLatencyMs: 0, successRate: 0 },
            byProvider: [],
            timeRange,
          })
        })

        req.on('timeout', () => {
          req.destroy()
          resolve({
            summary: { totalRequests: 0, totalFailures: 0, avgLatencyMs: 0, successRate: 0 },
            byProvider: [],
            timeRange,
          })
        })

        req.end()
      })
    }
  )
}

// Export health monitor controls for use in main process
export function getHealthMonitor(): HealthMonitor | null {
  return healthMonitor
}

export function cleanupHealthMonitor(): void {
  if (healthMonitor) {
    healthMonitor.stop()
    healthMonitor = null
  }
}
