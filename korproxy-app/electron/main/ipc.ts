import { ipcMain, BrowserWindow, app } from 'electron'
import { readFile, writeFile, mkdir, access } from 'fs/promises'
import { dirname, join } from 'path'
import { homedir } from 'os'
import { z } from 'zod'
import http from 'http'
import { proxySidecar } from './sidecar'
import { settingsStore, Settings } from './store'
import { IPC_CHANNELS, LogData, ProxyStats, FactoryConfig, FactoryCustomModel, AmpConfig, IntegrationStatus } from '../common/ipc-types'
import {
  ProxyStatusSchema,
  ConfigContentSchema,
  SettingsKeySchema,
  SettingsSchema,
  validateIpcPayload,
  IpcValidationError,
} from '../common/ipc-schemas'

export { IPC_CHANNELS }

export interface ProxyStatus {
  running: boolean
  port: number
}

// Subscription state managed by main process
let subscriptionValid = false
let subscriptionExpiry: number | null = null

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
      await proxySidecar.start()
      return { success: true }
    } catch (error) {
      return createErrorResponse(error)
    }
  })

  ipcMain.handle(IPC_CHANNELS.PROXY_STOP, (): { success: boolean } => {
    proxySidecar.stop()
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
    
    return new Promise((resolve) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: '/mgmt/usage',
          method: 'GET',
          timeout: 2000,
        },
        (res) => {
          let data = ''
          res.on('data', (chunk) => (data += chunk))
          res.on('end', () => {
            try {
              const json = JSON.parse(data)
              const usage = json.usage || {}
              resolve({
                totalRequests: usage.total_requests || 0,
                successCount: usage.success_count || 0,
                failureCount: usage.failure_count || json.failed_requests || 0,
                totalTokens: usage.total_tokens || 0,
                requestsByHour: usage.requests_by_hour || {},
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
}
