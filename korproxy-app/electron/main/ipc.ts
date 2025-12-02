import { ipcMain, BrowserWindow, app } from 'electron'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'
import { z } from 'zod'
import http from 'http'
import { proxySidecar } from './sidecar'
import { settingsStore, Settings } from './store'
import { IPC_CHANNELS, LogData, ProxyStats } from '../common/ipc-types'
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

        const validValue = validateIpcPayload(IPC_CHANNELS.APP_SET_SETTING, valueSchema, value)
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
}
