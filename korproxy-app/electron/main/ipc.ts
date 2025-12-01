import { ipcMain, BrowserWindow } from 'electron'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'
import { proxySidecar } from './sidecar'
import { settingsStore, Settings } from './store'

export const IPC_CHANNELS = {
  PROXY_START: 'proxy:start',
  PROXY_STOP: 'proxy:stop',
  PROXY_STATUS: 'proxy:status',
  PROXY_RESTART: 'proxy:restart',
  PROXY_LOG: 'proxy:log',
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  APP_MINIMIZE: 'app:minimize',
  APP_MAXIMIZE: 'app:maximize',
  APP_CLOSE: 'app:close',
  APP_IS_MAXIMIZED: 'app:is-maximized',
  APP_GET_SETTINGS: 'app:get-settings',
  APP_SET_SETTING: 'app:set-setting',
  AUTH_START_OAUTH: 'auth:start-oauth',
  AUTH_LIST_ACCOUNTS: 'auth:list-accounts',
  AUTH_REMOVE_ACCOUNT: 'auth:remove-account',
} as const

export interface ProxyStatus {
  running: boolean
  port: number
}

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  proxySidecar.on('log', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.PROXY_LOG, data)
    }
  })

  proxySidecar.on('started', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.PROXY_LOG, {
        type: 'stdout',
        message: '[KorProxy] Proxy started successfully',
      })
    }
  })

  proxySidecar.on('stopped', (code) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.PROXY_LOG, {
        type: 'stdout',
        message: `[KorProxy] Proxy stopped with code: ${code}`,
      })
    }
  })

  proxySidecar.on('error', (error) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.PROXY_LOG, {
        type: 'stderr',
        message: `[KorProxy] Error: ${error.message}`,
      })
    }
  })

  ipcMain.handle(IPC_CHANNELS.PROXY_START, async (): Promise<void> => {
    await proxySidecar.start()
  })

  ipcMain.handle(IPC_CHANNELS.PROXY_STOP, (): void => {
    proxySidecar.stop()
  })

  ipcMain.handle(IPC_CHANNELS.PROXY_STATUS, (): ProxyStatus => {
    return {
      running: proxySidecar.isRunning(),
      port: proxySidecar.getPort(),
    }
  })

  ipcMain.handle(IPC_CHANNELS.PROXY_RESTART, async (): Promise<void> => {
    await proxySidecar.restart()
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, async (): Promise<string> => {
    const configPath = proxySidecar.getConfigPath()
    try {
      const content = await readFile(configPath, 'utf-8')
      return content
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return ''
      }
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_SET, async (_, content: string): Promise<void> => {
    const configPath = proxySidecar.getConfigPath()
    try {
      await mkdir(dirname(configPath), { recursive: true })
      await writeFile(configPath, content, 'utf-8')
    } catch (error) {
      throw new Error(`Failed to write config: ${(error as Error).message}`)
    }
  })

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
    return settingsStore.getAll()
  })

  ipcMain.handle(IPC_CHANNELS.APP_SET_SETTING, <K extends keyof Settings>(
    _: Electron.IpcMainInvokeEvent,
    key: K,
    value: Settings[K]
  ): void => {
    settingsStore.set(key, value)
  })
}
