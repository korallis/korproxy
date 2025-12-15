import type {
  ProxyStatus,
  LogData,
  Settings,
  Account,
  OAuthResult,
  TokenData,
  UpdateStatus,
  Provider,
  ProxyStats,
  FactoryCustomModel,
  FactoryConfig,
  AmpConfig,
  IntegrationStatus,
} from '../../electron/common/ipc-types'

export interface ProxyLog {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  provider?: string
  model?: string
  tokens?: number
}

export interface KorProxyAPI {
  proxy: {
    start: () => Promise<{ success: boolean; error?: string }>
    stop: () => Promise<{ success: boolean }>
    status: () => Promise<ProxyStatus>
    getStatus: () => Promise<ProxyStatus>
    restart: () => Promise<{ success: boolean; error?: string }>
    onLog: (callback: (data: LogData) => void) => () => void
    onStatusChange: (callback: (status: ProxyStatus) => void) => () => void
    getStats: () => Promise<ProxyStats | null>
  }
  config: {
    get: () => Promise<{ success: boolean; content?: string; error?: string }>
    set: (content: string) => Promise<{ success: boolean; error?: string }>
  }
  app: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
    platform: NodeJS.Platform
    getSettings: () => Promise<Settings>
    setSetting: <K extends keyof Settings>(
      key: K,
      value: Settings[K]
    ) => Promise<{ success: boolean; error?: string }>
    getVersion: () => Promise<string>
  }
  auth: {
    startOAuth: (provider: Provider) => Promise<OAuthResult>
    listAccounts: () => Promise<Account[]>
    removeAccount: (
      id: string,
      provider?: Provider
    ) => Promise<{ success: boolean; error?: string }>
    getToken: (
      provider: Provider,
      accountId: string
    ) => Promise<{ success: boolean; token?: TokenData; error?: string }>
    refreshToken: (
      provider: Provider,
      accountId: string
    ) => Promise<{ success: boolean; token?: TokenData; error?: string }>
  }
  updater: {
    check: () => Promise<UpdateStatus>
    download: () => Promise<UpdateStatus>
    install: () => Promise<void>
    getStatus: () => Promise<UpdateStatus>
    onStatus: (callback: (status: UpdateStatus) => void) => () => void
  }
  subscription: {
    setStatus: (info: { isValid: boolean; expiresAt?: number }) => Promise<{ success: boolean }>
  }
  integrations: {
    factory: {
      get: () => Promise<{ success: boolean; status?: IntegrationStatus; config?: FactoryConfig; error?: string }>
      set: (models: FactoryCustomModel[]) => Promise<{ success: boolean; error?: string }>
    }
    amp: {
      get: () => Promise<{ success: boolean; status?: IntegrationStatus; config?: AmpConfig; error?: string }>
      set: (port: number) => Promise<{ success: boolean; error?: string }>
    }
  }
}

export type { ProxyStatus, LogData, Settings, Account, OAuthResult, TokenData, UpdateStatus, Provider, ProxyStats, FactoryCustomModel, FactoryConfig, AmpConfig, IntegrationStatus }

declare global {
  interface Window {
    korproxy: KorProxyAPI
  }
}

export {}
