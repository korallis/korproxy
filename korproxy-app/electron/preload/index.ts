import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

export interface ProxyStatus {
  running: boolean
  port: number
}

export interface LogData {
  type: 'stdout' | 'stderr'
  message: string
}

export interface Settings {
  port: number
  autoStart: boolean
  minimizeToTray: boolean
  theme: 'dark' | 'light' | 'system'
  windowBounds?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface Account {
  id: string
  name: string
  provider: string
  enabled: boolean
}

export interface OAuthResult {
  success: boolean
  error?: string
}

export interface KorProxyAPI {
  proxy: {
    start: () => Promise<void>
    stop: () => Promise<void>
    status: () => Promise<ProxyStatus>
    restart: () => Promise<void>
    onLog: (callback: (data: LogData) => void) => () => void
  }
  config: {
    get: () => Promise<string>
    set: (content: string) => Promise<void>
  }
  app: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
    platform: NodeJS.Platform
    getSettings: () => Promise<Settings>
    setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>
  }
  auth: {
    startOAuth: (provider: string) => Promise<OAuthResult>
    listAccounts: () => Promise<Account[]>
    removeAccount: (id: string) => Promise<{ success: boolean; error?: string }>
  }
}

const korproxyAPI: KorProxyAPI = {
  proxy: {
    start: () => ipcRenderer.invoke('proxy:start'),
    stop: () => ipcRenderer.invoke('proxy:stop'),
    status: () => ipcRenderer.invoke('proxy:status'),
    restart: () => ipcRenderer.invoke('proxy:restart'),
    onLog: (callback: (data: LogData) => void) => {
      const handler = (_event: IpcRendererEvent, data: LogData): void => {
        callback(data)
      }
      ipcRenderer.on('proxy:log', handler)
      return () => {
        ipcRenderer.removeListener('proxy:log', handler)
      }
    },
  },
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    set: (content: string) => ipcRenderer.invoke('config:set', content),
  },
  app: {
    minimize: () => ipcRenderer.invoke('app:minimize'),
    maximize: () => ipcRenderer.invoke('app:maximize'),
    close: () => ipcRenderer.invoke('app:close'),
    isMaximized: () => ipcRenderer.invoke('app:is-maximized'),
    platform: process.platform,
    getSettings: () => ipcRenderer.invoke('app:get-settings'),
    setSetting: (key, value) => ipcRenderer.invoke('app:set-setting', key, value),
  },
  auth: {
    startOAuth: (provider: string) => ipcRenderer.invoke('auth:start-oauth', provider),
    listAccounts: () => ipcRenderer.invoke('auth:list-accounts'),
    removeAccount: (id: string) => ipcRenderer.invoke('auth:remove-account', id),
  },
}

contextBridge.exposeInMainWorld('korproxy', korproxyAPI)

declare global {
  interface Window {
    korproxy: KorProxyAPI
  }
}
