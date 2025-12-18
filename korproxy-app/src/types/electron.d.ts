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
  HealthStatus,
  ProviderTestResult,
  ToolIntegration,
  LogEntry,
  LogsGetOptions,
  OnboardingState,
  AuthError,
  AuthErrorCode,
  RoutingConfig,
  MetricsResponse,
  MetricsQuery,
  DeviceInfo,
  FeedbackSubmitRequest,
  FeedbackSubmitResponse,
  FeedbackLogEntry,
  SystemInfo,
  FeedbackCategory,
  UTMParams,
  DebugBundle,
  DiagnosticsProviderState,
  DiagnosticsMetrics,
  RecentRequest,
  RecentRequestsFilter,
  MetricsTimeRange,
  MetricsDashboardResponse,
} from '../../electron/common/ipc-types'
import type { Entitlements } from './entitlements'
import { OnboardingStep, AUTH_ERROR_MESSAGES } from '../../electron/common/ipc-types'

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
    sync: (config: RoutingConfig) => Promise<{ success: boolean; error?: string; path?: string }>
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
  health: {
    getStatus: () => Promise<HealthStatus>
    onStateChange: (callback: (status: HealthStatus) => void) => () => void
  }
  provider: {
    test: (providerId: string, modelId?: string) => Promise<ProviderTestResult>
  }
  tools: {
    list: () => Promise<ToolIntegration[]>
    copyConfig: (toolId: string) => Promise<{ success: boolean }>
  }
  logs: {
    get: (options?: LogsGetOptions) => Promise<LogEntry[]>
    export: () => Promise<string>
    clear: () => Promise<{ success: boolean }>
  }
  tray: {
    syncProfiles: (config: RoutingConfig) => Promise<{ success: boolean }>
    getActiveProfile: () => Promise<{ activeProfileId: string | null; loaded: boolean }>
    onProfileChanged: (callback: (profileId: string) => void) => () => void
  }
  entitlements: {
    get: () => Promise<Entitlements | null>
    set: (entitlements: Entitlements) => Promise<{ success: boolean }>
  }
  device: {
    register: () => Promise<DeviceInfo>
    getInfo: () => Promise<DeviceInfo>
  }
  feedback: {
    submit: (data: FeedbackSubmitRequest) => Promise<FeedbackSubmitResponse>
    getRecentLogs: (count: number) => Promise<FeedbackLogEntry[]>
    getSystemInfo: () => Promise<SystemInfo>
  }
  deeplink: {
    getUtm: () => Promise<UTMParams | null>
    clearUtm: () => Promise<void>
  }
  diagnostics: {
    getBundle: (config: Record<string, unknown>, providers: DiagnosticsProviderState[], metrics: DiagnosticsMetrics | null) => Promise<DebugBundle>
    getRecentRequests: (filter?: RecentRequestsFilter) => Promise<RecentRequest[]>
    copyBundleToClipboard: (config: Record<string, unknown>, providers: DiagnosticsProviderState[], metrics: DiagnosticsMetrics | null) => Promise<{ success: boolean; error?: string }>
  }
  metrics: {
    getSummary: (timeRange: MetricsTimeRange) => Promise<MetricsDashboardResponse>
  }
}

export type { ProxyStatus, LogData, Settings, Account, OAuthResult, TokenData, UpdateStatus, Provider, ProxyStats, FactoryCustomModel, FactoryConfig, AmpConfig, IntegrationStatus, HealthStatus, ProviderTestResult, ToolIntegration, LogEntry, LogsGetOptions, OnboardingState, AuthError, AuthErrorCode, RoutingConfig, MetricsResponse, MetricsQuery, DeviceInfo, FeedbackSubmitRequest, FeedbackSubmitResponse, FeedbackLogEntry, SystemInfo, FeedbackCategory, DebugBundle, DiagnosticsProviderState, DiagnosticsMetrics, RecentRequest, RecentRequestsFilter }
export { OnboardingStep, AUTH_ERROR_MESSAGES }

declare global {
  interface Window {
    korproxy: KorProxyAPI
  }
}

export {}
