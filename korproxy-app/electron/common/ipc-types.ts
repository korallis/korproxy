// IPC types and constants - NO ZOD (safe for preload)

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
  AUTH_GET_TOKEN: 'auth:get-token',
  AUTH_REFRESH_TOKEN: 'auth:refresh-token',
  UPDATER_CHECK: 'updater:check',
  UPDATER_DOWNLOAD: 'updater:download',
  UPDATER_INSTALL: 'updater:install',
  UPDATER_STATUS: 'updater:status',
  APP_GET_VERSION: 'app:get-version',
  PROXY_STATS: 'proxy:stats',
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

export const PROVIDERS = ['gemini', 'claude', 'codex', 'qwen', 'iflow'] as const
export type Provider = (typeof PROVIDERS)[number]

export interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export type Theme = 'dark' | 'light' | 'system'

export interface Settings {
  port: number
  autoStart: boolean
  minimizeToTray: boolean
  theme: Theme
  windowBounds?: WindowBounds
}

export interface Account {
  id: string
  name: string
  email?: string
  provider: Provider
  enabled: boolean
  createdAt: string
  lastUsed?: string
}

export interface ProxyStatus {
  running: boolean
  port: number
}

export interface LogData {
  type: 'stdout' | 'stderr'
  message: string
  timestamp?: string
}

export interface OAuthResult {
  success: boolean
  error?: string
  accountId?: string
}

export interface TokenData {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  tokenType: string
}

export interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  version?: string
  progress?: number
  error?: string
}

export interface ProxyStats {
  totalRequests: number
  successCount: number
  failureCount: number
  totalTokens: number
  requestsByHour: Record<string, number>
  requestsByDay: Record<string, number>
}
