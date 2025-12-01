export interface ProxyConfig {
  port: number
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  logFormat: 'text' | 'json'
}

export interface ProxyStatus {
  running: boolean
  port: number
  pid?: number
}

export interface ProxyLog {
  timestamp: string
  level: string
  message: string
  provider?: string
  model?: string
  tokens?: number
}

export interface Provider {
  id: string
  name: string
  enabled: boolean
  baseUrl?: string
}

export interface Account {
  id: string
  name: string
  provider: string
  apiKey: string
  enabled: boolean
  weight: number
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

export interface KorProxyAPI {
  proxy: {
    start: (config?: Partial<ProxyConfig>) => Promise<{ success: boolean; error?: string }>
    stop: () => Promise<{ success: boolean; error?: string }>
    restart: () => Promise<{ success: boolean; error?: string }>
    getStatus: () => Promise<ProxyStatus>
    onLog: (callback: (log: ProxyLog) => void) => () => void
    onStatusChange: (callback: (status: ProxyStatus) => void) => () => void
  }
  config: {
    get: () => Promise<ProxyConfig>
    set: (config: Partial<ProxyConfig>) => Promise<void>
  }
  providers: {
    list: () => Promise<Provider[]>
    add: (provider: Omit<Provider, 'id'>) => Promise<Provider>
    update: (id: string, provider: Partial<Provider>) => Promise<Provider>
    remove: (id: string) => Promise<void>
  }
  accounts: {
    list: () => Promise<Account[]>
    add: (account: Omit<Account, 'id'>) => Promise<Account>
    update: (id: string, account: Partial<Account>) => Promise<Account>
    remove: (id: string) => Promise<void>
  }
  auth: {
    startOAuth: (provider: string) => Promise<{ success: boolean; error?: string }>
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
  window: {
    minimize: () => void
    maximize: () => void
    close: () => void
  }
}

declare global {
  interface Window {
    korproxy: KorProxyAPI
  }
}

export {}
